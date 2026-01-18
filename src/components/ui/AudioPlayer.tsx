"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface AudioPlayerProps {
  audioData?: string; // Base64 encoded PCM16 audio data
  chunkCount?: number;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioData, chunkCount, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Convert base64 PCM16 to AudioBuffer
  const decodeAudioData = useCallback(async (base64Data: string): Promise<AudioBuffer | null> => {
    try {
      // Validate input
      if (!base64Data || base64Data.trim().length === 0) {
        setError('Empty audio data');
        return null;
      }

      // Remove data URL prefix if present (e.g., "data:audio/pcm;base64,")
      let cleanBase64 = base64Data;
      if (base64Data.includes(',')) {
        cleanBase64 = base64Data.split(',').pop() || base64Data;
      }

      // Remove any whitespace or newlines that might be in the base64 string
      cleanBase64 = cleanBase64.replace(/\s/g, '');

      // Remove surrounding quotes if present
      cleanBase64 = cleanBase64.replace(/^"+|"+$/g, '');

      // Validate base64 characters
      if (!/^[A-Za-z0-9+/=_-]*$/.test(cleanBase64)) {
        setError('Invalid base64 characters');
        return null;
      }

      // Length mod 4 == 1 is invalid and cannot be fixed with padding
      if (cleanBase64.length % 4 === 1) {
        setError('Invalid base64 length');
        return null;
      }

      // Handle URL-safe base64 (convert - to + and _ to /)
      cleanBase64 = cleanBase64.replace(/-/g, '+').replace(/_/g, '/');

      // Add padding if missing (base64 strings should be divisible by 4)
      const paddingNeeded = (4 - (cleanBase64.length % 4)) % 4;
      cleanBase64 += '='.repeat(paddingNeeded);

      // Decode base64 to binary
      let binaryString: string;
      try {
        binaryString = atob(cleanBase64);
      } catch (e) {
        console.error('Base64 decode error:', e);
        setError('Invalid base64 encoding');
        return null;
      }

      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // PCM16 parameters (OpenAI Realtime API uses 24kHz mono PCM16)
      const sampleRate = 24000;
      const numChannels = 1;
      const bytesPerSample = 2;

      // Validate byte array length
      if (bytes.length === 0) {
        setError('No audio data decoded');
        return null;
      }

      // Ensure we have complete samples (bytes must be even for 16-bit audio)
      const validByteLength = Math.floor(bytes.length / bytesPerSample) * bytesPerSample;
      if (validByteLength === 0) {
        setError('Insufficient audio data');
        return null;
      }

      // Create audio buffer with validated sample count
      const numSamples = validByteLength / bytesPerSample;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate });
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
      }

      const audioBuffer = audioContextRef.current.createBuffer(
        numChannels,
        numSamples,
        sampleRate
      );

      // Convert PCM16 to float32
      const channelData = audioBuffer.getChannelData(0);
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, validByteLength);

      for (let i = 0; i < numSamples; i++) {
        const offset = i * bytesPerSample;
        // Verify offset is within bounds before reading
        if (offset + bytesPerSample <= validByteLength) {
          // PCM16 is little-endian signed 16-bit
          const sample = dataView.getInt16(offset, true);
          // Normalize to -1.0 to 1.0
          channelData[i] = sample / 32768;
        }
      }

      return audioBuffer;
    } catch (err) {
      console.error('Error decoding audio:', err);
      setError('Failed to decode audio data');
      return null;
    }
  }, []);

  // Initialize audio when data changes
  useEffect(() => {
    if (!audioData) return;

    const initAudio = async () => {
      const buffer = await decodeAudioData(audioData);
      if (buffer) {
        audioBufferRef.current = buffer;
        setDuration(buffer.duration);
        setError(null);
      }
    };

    initAudio();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      }
    };
  }, [audioData, decodeAudioData]);

  // Update progress during playback
  const updateProgress = useCallback(() => {
    if (!audioContextRef.current || !isPlaying) return;

    const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
    const newProgress = Math.min(elapsed / duration, 1);
    setProgress(newProgress);

    if (newProgress < 1) {
      animationRef.current = requestAnimationFrame(updateProgress);
    } else {
      setIsPlaying(false);
      setProgress(0);
    }
  }, [duration, isPlaying]);

  // Start progress animation when playing
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, updateProgress]);

  const handlePlay = async () => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    // Resume context if suspended
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    // Stop any existing playback
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }

    // Create new source
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(gainNodeRef.current!);

    source.onended = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    sourceNodeRef.current = source;
    startTimeRef.current = audioContextRef.current.currentTime;
    source.start(0);
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleRestart = () => {
    handlePause();
    setProgress(0);
    handlePlay();
  };

  const toggleMute = () => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 1 : 0;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!audioData) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl bg-muted/50 text-muted-foreground ${className}`}>
        <Volume2 className="size-5" />
        <span className="text-xs">No audio data available</span>
        {chunkCount !== undefined && chunkCount > 0 && (
          <span className="text-[10px] text-muted-foreground/80">({chunkCount} chunks)</span>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 ${className}`}>
        <VolumeX className="size-5" />
        <span className="text-xs">{error}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl bg-muted/50 border border-border ${className}`}>
      {/* Play/Pause Button */}
      <button
        onClick={isPlaying ? handlePause : handlePlay}
        className="size-10 shrink-0 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-500/30 transition-colors"
      >
        {isPlaying ? (
          <Pause className="size-5" />
        ) : (
          <Play className="size-5 ml-0.5" />
        )}
      </button>

      {/* Progress Bar */}
      <div className="flex-1 space-y-1">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>{formatTime(progress * duration)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleRestart}
          className="size-8 rounded-full hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title="Restart"
        >
          <RotateCcw className="size-4" />
        </button>
        <button
          onClick={toggleMute}
          className="size-8 rounded-full hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </div>

      {/* Chunk Count */}
      {chunkCount !== undefined && chunkCount > 0 && (
        <div className="text-[10px] text-muted-foreground/80">
          {chunkCount} chunks
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
