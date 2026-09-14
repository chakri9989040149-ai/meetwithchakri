import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook providing legal, transparent browser-native meeting recording
 * via MediaRecorder API with audio/video stream capture and instant file download.
 */
export function useMeetingRecording(streamToRecord, roomId) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Timer for active recording
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  const startRecording = useCallback((customStream) => {
    setError(null);
    recordedChunksRef.current = [];
    const targetStream = customStream || streamToRecord;

    if (!targetStream || targetStream.getTracks().length === 0) {
      setError('No active media stream found to record.');
      return false;
    }

    try {
      // Find supported mime type
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4'
      ];
      const selectedMimeType = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const options = selectedMimeType ? { mimeType: selectedMimeType } : {};
      const recorder = new MediaRecorder(targetStream, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: selectedMimeType || 'video/webm'
        });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);

        // Automatically trigger download
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `chakris-meet-recording-${roomId || 'session'}-${timestamp}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
        }, 100);
      };

      recorder.onerror = (err) => {
        console.error('MediaRecorder error:', err);
        setError('Recording encountered an unexpected error.');
        setIsRecording(false);
      };

      recorder.start(1000); // 1-second chunks
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording: ' + err.message);
      return false;
    }
  }, [streamToRecord, roomId]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const formatRecordingTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    recordingTime: formatRecordingTime(recordingSeconds),
    recordingSeconds,
    recordedBlobUrl,
    error,
    startRecording,
    stopRecording
  };
}
