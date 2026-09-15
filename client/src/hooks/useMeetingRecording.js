import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook providing browser-native meeting recording stored strictly
 * onto the logged-in user's personal device with their explicit permission.
 */
export function useMeetingRecording(streamOrOptions, maybeRoomId) {
  // Support both useMeetingRecording(stream, roomId) and useMeetingRecording({ stream, roomId })
  const targetStream = streamOrOptions && typeof streamOrOptions === 'object' && 'stream' in streamOrOptions
    ? streamOrOptions.stream
    : streamOrOptions;

  const activeRoomId = streamOrOptions && typeof streamOrOptions === 'object' && 'roomId' in streamOrOptions
    ? streamOrOptions.roomId
    : maybeRoomId;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(() => {
    return localStorage.getItem('chakri_recording_permission_granted') === 'true';
  });
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [savedLocallyStatus, setSavedLocallyStatus] = useState('');

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(targetStream);

  useEffect(() => {
    streamRef.current = targetStream;
  }, [targetStream]);

  // Timer for active recording
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      setShowNotice(true);
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

  // Actual recording execution once permission is granted
  const executeRecording = useCallback((streamToUse) => {
    setError(null);
    recordedChunksRef.current = [];
    const mediaStream = streamToUse || streamRef.current;

    if (!mediaStream || mediaStream.getTracks().length === 0) {
      setError('No active camera or audio media stream found to record.');
      return false;
    }

    try {
      // Find supported mime type for highest quality
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4'
      ];
      const selectedMimeType = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const options = {
        ...(selectedMimeType ? { mimeType: selectedMimeType } : {}),
        videoBitsPerSecond: 3500000 // High quality bitrate for 1440p clarity
      };

      const recorder = new MediaRecorder(mediaStream, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: selectedMimeType || 'video/webm'
        });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `chakris-meet-hd1440p-${activeRoomId || 'session'}-${timestamp}.webm`;

        // 1. Try modern File System Access API to write directly to user's selected personal device folder
        let savedDirectlyToFileSystem = false;
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await window.showSaveFilePicker({
              suggestedName: fileName,
              types: [
                {
                  description: 'WebM Video Recording',
                  accept: { 'video/webm': ['.webm'] }
                }
              ]
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            savedDirectlyToFileSystem = true;
            setSavedLocallyStatus(`Recording successfully saved directly to your selected personal device folder!`);
          } catch (pickerErr) {
            // User cancelled picker or permission error - fall back to browser download
          }
        }

        // 2. Fallback: Save directly via browser download to user's personal device downloads folder
        if (!savedDirectlyToFileSystem) {
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
          }, 150);
          setSavedLocallyStatus(`Recording stored directly to your personal device Downloads folder (${fileName}).`);
        }
      };

      recorder.onerror = (err) => {
        console.error('MediaRecorder error:', err);
        setError('Recording encountered an error.');
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
  }, [activeRoomId]);

  // Request explicit user permission before starting
  const startRecording = useCallback((customStream) => {
    if (!hasPermission) {
      setShowPermissionModal(true);
      return;
    }
    executeRecording(customStream || streamRef.current);
  }, [hasPermission, executeRecording]);

  const grantPermissionAndStart = useCallback(() => {
    setHasPermission(true);
    localStorage.setItem('chakri_recording_permission_granted', 'true');
    setShowPermissionModal(false);
    executeRecording(streamRef.current);
  }, [executeRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setShowNotice(false);
    }
  }, []);

  const formatRecordingTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    formattedTime: formatRecordingTime(recordingSeconds),
    recordingTime: formatRecordingTime(recordingSeconds),
    recordingSeconds,
    recordedBlobUrl,
    error,
    hasPermission,
    showPermissionModal,
    setShowPermissionModal,
    grantPermissionAndStart,
    showNotice,
    setShowNotice,
    savedLocallyStatus,
    startRecording,
    stopRecording,
    isSupported: typeof window !== 'undefined' && Boolean(window.MediaRecorder)
  };
}

