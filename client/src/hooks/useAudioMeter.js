import { useState, useEffect, useRef } from 'react';

/**
 * High-performance hook to measure live audio volume level from a MediaStream using Web Audio API
 * Optimized with throttled sampling to avoid React re-render lag during video calls.
 */
export function useAudioMeter(stream, enabled = true) {
  const [volume, setVolume] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const lastVolumeRef = useRef(0);
  const speakingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!stream || !enabled) {
      setVolume(0);
      setIsSpeaking(false);
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0 || !audioTracks[0].enabled) {
      setVolume(0);
      setIsSpeaking(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = (timestamp) => {
        if (!analyserRef.current) return;

        // Throttle updates to max 12 updates per second (~80ms) to eliminate UI lag
        if (timestamp - lastUpdateTimeRef.current >= 80) {
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((average / 128) * 100));

          // Only update state if change is perceptible (delta >= 4)
          if (Math.abs(normalized - lastVolumeRef.current) >= 4) {
            lastVolumeRef.current = normalized;
            setVolume(normalized);
          }

          // Smooth speaking status with 350ms hold
          if (normalized > 14) {
            setIsSpeaking(true);
            if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
          } else {
            if (!speakingTimeoutRef.current) {
              speakingTimeoutRef.current = setTimeout(() => {
                setIsSpeaking(false);
                speakingTimeoutRef.current = null;
              }, 350);
            }
          }

          lastUpdateTimeRef.current = timestamp;
        }

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      animationFrameRef.current = requestAnimationFrame(updateVolume);
    } catch (err) {
      console.warn('AudioMeter initialization notice:', err);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch (e) {}
      }
      if (analyserRef.current) {
        try { analyserRef.current.disconnect(); } catch (e) {}
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch (e) {}
      }
    };
  }, [stream, enabled]);

  return { volume, isSpeaking };
}
