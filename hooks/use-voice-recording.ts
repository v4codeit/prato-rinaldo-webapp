'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import type { VoiceMessageMetadata } from '@/types/topics';

type RecordingState = 'idle' | 'requesting' | 'recording' | 'processing';

interface UseVoiceRecordingOptions {
  /** Max recording duration in seconds (default: 60) */
  maxDuration?: number;
  /** Called when permission is denied */
  onPermissionDenied?: () => void;
  /** Called when recording starts */
  onRecordingStart?: () => void;
  /** Called when recording stops */
  onRecordingStop?: () => void;
}

interface UseVoiceRecordingReturn {
  /** Current recording state */
  state: RecordingState;
  /** Recording duration in seconds */
  duration: number;
  /** Audio level 0-1 for visualization */
  audioLevel: number;
  /** Error message if any */
  error: string | null;

  /** Start recording */
  startRecording: () => Promise<void>;
  /** Stop recording and return blob + metadata */
  stopRecording: () => Promise<{ blob: Blob; metadata: Omit<VoiceMessageMetadata, 'waveform'> } | null>;
  /** Cancel recording without returning data */
  cancelRecording: () => void;
}

/**
 * Hook for voice recording using MediaRecorder API
 * Extracts logic from voice-recorder.tsx for reusability
 */
export function useVoiceRecording(
  options: UseVoiceRecordingOptions = {}
): UseVoiceRecordingReturn {
  const { maxDuration = 60, onPermissionDenied, onRecordingStart, onRecordingStop } = options;

  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const mimeTypeRef = useRef<string>('audio/webm');

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore errors during cleanup
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Update audio level for visualization
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average level
    const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
    setAudioLevel(average / 255); // Normalize to 0-1

    // Continue animation loop if recording
    if (state === 'recording') {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [state]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setState('requesting');
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Setup audio analyser for visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
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

      mimeTypeRef.current = mimeType;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      startTimeRef.current = Date.now();
      setState('recording');
      onRecordingStart?.();

      // Start duration timer
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setDuration(elapsed);

        // Auto-stop at max duration
        if (elapsed >= maxDuration) {
          // Will be handled by caller
        }
      }, 100);

      // Start audio level updates
      updateAudioLevel();
    } catch (err) {
      console.error('Error starting recording:', err);

      // Check if permission denied
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Permesso microfono negato');
        onPermissionDenied?.();
      } else {
        setError('Impossibile accedere al microfono');
      }

      setState('idle');
      cleanup();
    }
  }, [maxDuration, onPermissionDenied, onRecordingStart, updateAudioLevel, cleanup]);

  // Stop recording and return blob + metadata
  const stopRecording = useCallback(async (): Promise<{
    blob: Blob;
    metadata: Omit<VoiceMessageMetadata, 'waveform'>;
  } | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        cleanup();
        setState('idle');
        setDuration(0);
        setAudioLevel(0);
        resolve(null);
        return;
      }

      setState('processing');
      const finalDuration = (Date.now() - startTimeRef.current) / 1000;

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });

        const result = {
          blob: audioBlob,
          metadata: {
            duration: finalDuration,
            size: audioBlob.size,
            mimeType: audioBlob.type || mimeTypeRef.current,
          },
        };

        cleanup();
        setState('idle');
        setDuration(0);
        setAudioLevel(0);
        onRecordingStop?.();
        resolve(result);
      };

      mediaRecorderRef.current.stop();
    });
  }, [cleanup, onRecordingStop]);

  // Cancel recording without returning data
  const cancelRecording = useCallback(() => {
    cleanup();
    setState('idle');
    setDuration(0);
    setAudioLevel(0);
    audioChunksRef.current = [];
  }, [cleanup]);

  return {
    state,
    duration,
    audioLevel,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
