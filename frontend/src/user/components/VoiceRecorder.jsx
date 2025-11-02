import React, { useRef, useState } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';


export const VoiceRecorder = ({ onTranscription, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = handleStop;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleStop = async () => {
    setIsLoading(true);
    setError(null);
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    try {
      // Get token from localStorage (same as useChats)
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = user.token;
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URI}/api/chat/speech-to-text`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      ); // TS workaround for fetch + FormData + headers
      const data = await res.json();
      if (data.transcript) {
        onTranscription(data.transcript);
      } else {
        setError(data.error || "Transcription failed.");
      }
    } catch (err) {
      setError("Failed to transcribe audio.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isLoading || disabled}
        className={`p-2 md:p-3 rounded-full transition-all duration-300 ${
          isRecording
            ? "text-white bg-red-600/80 animate-pulse"
            : isLoading
            ? "text-yellow-400 bg-slate-800/60 animate-spin"
            : "text-gray-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60"
        }`}
        title={
          isRecording
            ? "Stop recording"
            : isLoading
            ? "Transcribing..."
            : "Start voice input"
        }
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
        ) : isRecording ? (
          <Square className="w-5 h-5 md:w-6 md:h-6" />
        ) : (
          <Mic className="w-5 h-5 md:w-6 md:h-6" />
        )}
      </button>
      {error && <div className="text-xs text-red-400 mt-2">{error}</div>}
      {isRecording && (
        <div className="text-xs text-red-400 mt-1">Recording...</div>
      )}
      {isLoading && (
        <div className="text-xs text-yellow-400 mt-1">Transcribing...</div>
      )}
    </div>
  );
};