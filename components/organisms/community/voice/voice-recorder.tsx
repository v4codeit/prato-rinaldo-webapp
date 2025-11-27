'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VoiceMessageMetadata } from '@/types/topics';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, metadata: Omit<VoiceMessageMetadata, 'waveform'>) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds, default 60
  disabled?: boolean;
}

// Recording states
type RecordingState = 'idle' | 'recording' | 'stopped';

/**
 * Voice message recorder component with waveform visualization
 * Uses MediaRecorder API for audio capture
 */
export function VoiceRecorder({
  onRecordingComplete,
  onCancel,
  maxDuration = 60,
  disabled = false,
}: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Update audio level for visualization
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average level
    const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
    setAudioLevel(average / 255); // Normalize to 0-1

    if (recordingState === 'recording') {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [recordingState]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      // Setup audio analyser for visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      // Determine best supported format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const finalDuration = (Date.now() - startTimeRef.current) / 1000;

        onRecordingComplete(audioBlob, {
          duration: finalDuration,
          size: audioBlob.size,
          mimeType: audioBlob.type || mimeType,
        });
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      startTimeRef.current = Date.now();
      setRecordingState('recording');

      // Start duration timer
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setDuration(elapsed);

        // Auto-stop at max duration
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);

      // Start audio level updates
      updateAudioLevel();

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Impossibile accedere al microfono. Verifica i permessi.');
      setRecordingState('idle');
    }
  }, [maxDuration, onRecordingComplete, updateAudioLevel]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setRecordingState('stopped');
    setAudioLevel(0);
  }, []);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    audioChunksRef.current = [];
    setRecordingState('idle');
    setDuration(0);
    setAudioLevel(0);
    onCancel();
  }, [onCancel]);

  // Format duration as mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
        <span>{error}</span>
        <Button variant="ghost" size="sm" onClick={() => setError(null)}>
          Riprova
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      {recordingState === 'idle' ? (
        // Start recording button
        <Button
          variant="default"
          size="icon"
          className="h-10 w-10 rounded-full bg-red-500 hover:bg-red-600"
          onClick={startRecording}
          disabled={disabled}
        >
          <Mic className="h-5 w-5" />
        </Button>
      ) : (
        // Recording controls
        <>
          {/* Cancel button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-destructive hover:text-destructive"
            onClick={cancelRecording}
          >
            <Trash2 className="h-5 w-5" />
          </Button>

          {/* Audio level visualization */}
          <div className="flex-1 flex items-center gap-1 h-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-75",
                  recordingState === 'recording' ? "bg-red-500" : "bg-muted-foreground/30"
                )}
                style={{
                  height: recordingState === 'recording'
                    ? `${Math.max(4, audioLevel * 32 * (0.5 + Math.random() * 0.5))}px`
                    : '4px',
                }}
              />
            ))}
          </div>

          {/* Duration */}
          <div className="text-sm font-mono text-muted-foreground min-w-[48px] text-center">
            {formatDuration(duration)}
          </div>

          {/* Stop/Send button */}
          <Button
            variant="default"
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full",
              recordingState === 'recording'
                ? "bg-red-500 hover:bg-red-600"
                : "bg-primary hover:bg-primary/90"
            )}
            onClick={stopRecording}
          >
            {recordingState === 'recording' ? (
              <Square className="h-4 w-4 fill-current" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </>
      )}

      {recordingState === 'idle' && (
        <span className="text-sm text-muted-foreground">
          Premi per registrare (max {maxDuration}s)
        </span>
      )}
    </div>
  );
}
