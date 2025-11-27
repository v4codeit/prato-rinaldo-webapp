'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VoiceMessageMetadata } from '@/types/topics';
import { formatVoiceDuration } from '@/types/topics';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  metadata: VoiceMessageMetadata;
  isCurrentUser?: boolean;
  className?: string;
}

/**
 * Voice message player component with waveform visualization
 * Displays pre-computed waveform and allows playback control
 */
export function VoiceMessagePlayer({
  audioUrl,
  metadata,
  isCurrentUser = false,
  className,
}: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressAnimationRef = useRef<number | null>(null);
  // Ref for synchronous state tracking (avoids stale closure in animation loop)
  const isPlayingRef = useRef(false);

  // Default waveform if not provided
  const waveform = metadata.waveform?.length > 0
    ? metadata.waveform
    : Array.from({ length: 64 }, () => Math.floor(Math.random() * 80) + 20);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (progressAnimationRef.current) {
        cancelAnimationFrame(progressAnimationRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update progress during playback
  // Uses ref instead of state to avoid stale closure in animation loop
  const updateProgress = useCallback(() => {
    if (audioRef.current && isPlayingRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      progressAnimationRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  // Toggle playback
  const togglePlayback = useCallback(async () => {
    try {
      setError(null);

      if (!audioRef.current) {
        setIsLoading(true);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.oncanplay = () => {
          setIsLoading(false);
        };

        audio.onended = () => {
          // Stop animation loop first
          isPlayingRef.current = false;
          setIsPlaying(false);
          setCurrentTime(0);
          if (progressAnimationRef.current) {
            cancelAnimationFrame(progressAnimationRef.current);
          }
        };

        audio.onerror = () => {
          isPlayingRef.current = false;
          setIsLoading(false);
          setError('Errore nel caricamento audio');
          setIsPlaying(false);
        };

        // Set ref BEFORE play to ensure animation loop works
        isPlayingRef.current = true;
        setIsPlaying(true);
        await audio.play();
        updateProgress();
      } else {
        if (isPlaying) {
          // Stop animation loop first
          isPlayingRef.current = false;
          audioRef.current.pause();
          setIsPlaying(false);
          if (progressAnimationRef.current) {
            cancelAnimationFrame(progressAnimationRef.current);
          }
        } else {
          // Set ref BEFORE play to ensure animation loop works
          isPlayingRef.current = true;
          setIsPlaying(true);
          await audioRef.current.play();
          updateProgress();
        }
      }
    } catch (err) {
      console.error('Playback error:', err);
      isPlayingRef.current = false;
      setError('Errore nella riproduzione');
      setIsPlaying(false);
    }
  }, [audioUrl, isPlaying, updateProgress]);

  // Seek to position when clicking on waveform
  const handleWaveformClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * metadata.duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [metadata.duration]);

  // Calculate progress percentage
  const progress = metadata.duration > 0 ? (currentTime / metadata.duration) * 100 : 0;

  // Display time
  const displayTime = isPlaying || currentTime > 0
    ? formatVoiceDuration(currentTime)
    : formatVoiceDuration(metadata.duration);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-2xl min-w-[200px] max-w-[300px]",
        isCurrentUser
          ? "bg-primary text-primary-foreground"
          : "bg-muted",
        className
      )}
    >
      {/* Play/Pause button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full shrink-0",
          isCurrentUser
            ? "hover:bg-primary-foreground/20 text-primary-foreground"
            : "hover:bg-background"
        )}
        onClick={togglePlayback}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-5 w-5 fill-current" />
        ) : (
          <Play className="h-5 w-5 fill-current ml-0.5" />
        )}
      </Button>

      {/* Waveform visualization */}
      <div
        className="flex-1 flex items-center gap-[2px] h-8 cursor-pointer"
        onClick={handleWaveformClick}
      >
        {waveform.map((value, i) => {
          const barProgress = (i / waveform.length) * 100;
          const isPlayed = barProgress <= progress;

          return (
            <div
              key={i}
              className={cn(
                "w-[3px] rounded-full transition-colors",
                isCurrentUser
                  ? isPlayed
                    ? "bg-primary-foreground"
                    : "bg-primary-foreground/40"
                  : isPlayed
                  ? "bg-primary"
                  : "bg-muted-foreground/30"
              )}
              style={{
                height: `${Math.max(4, (value / 127) * 24)}px`,
              }}
            />
          );
        })}
      </div>

      {/* Duration */}
      <span
        className={cn(
          "text-xs font-mono min-w-[36px] text-right",
          isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground"
        )}
      >
        {displayTime}
      </span>

      {/* Error display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-2xl">
          <span className="text-xs text-destructive">{error}</span>
        </div>
      )}
    </div>
  );
}
