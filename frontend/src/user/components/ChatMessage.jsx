import React from "react";
import { useState, useRef } from "react";
import axios from "axios";
import { FileIcon, FileText, ImageIcon, Volume2, VolumeX } from "lucide-react"; // Speaker icons

export const ChatMessage = ({
  message,
  isUser,
  timestamp,
  attachments,
  setIsSpeaking,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith("image/")) return <ImageIcon className="w-5 h-5" />;
    if (mimetype === "application/pdf") return <FileText className="w-5 h-5" />;
    return <FileIcon className="w-5 h-5" />;
  };
  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"} mb-6`}>
      <div
        className={`max-w-md px-4 py-3 rounded-2xl backdrop-blur-sm border relative ${
          isUser
            ? isPlaying
              ? "bg-slate-900/90 text-white border-slate-700/50"
              : "bg-slate-800/80 text-white border-slate-700/50"
            : isPlaying
            ? "bg-slate-900/90 text-white border-slate-700/50"
            : "bg-slate-800/80 text-white border-slate-700/50"
        }`}
      >
        {attachments?.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 space-y-2">
            {attachments?.map((file, index) => (
              <div
                key={index}
                className="flex items-center w-max max-w-full space-x-2 bg-slate-800 p-2 rounded"
              >
                {getFileIcon(file.mimetype || file.type)}
                <span className="text-sm">{file.filename || file.name}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-sm leading-relaxed break-words text-white">
          {message}
        </p>
        {timestamp && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <button
              onClick={async () => {
                if (isPlaying) {
                  audioRef.current?.pause();
                  setIsPlaying(false);
                  setIsSpeaking(false);
                  return;
                }

                setIsLoading(true);
                try {
                  const response = await axios.post(
                    `https://api.elevenlabs.io/v1/text-to-speech/${
                      import.meta.env.VITE_ELEVEN_VOICE_ID
                    }`,
                    { text: message },
                    {
                      headers: {
                        "xi-api-key": `${
                          import.meta.env.VITE_ELEVEN_LAB_API_KEY
                        }`,
                        "Content-Type": "application/json",
                        Accept: "audio/mpeg",
                      },
                      responseType: "arraybuffer",
                    }
                  );
                  const audioBlob = new Blob([response.data], {
                    type: "audio/mpeg",
                  });
                  const audioUrl = URL.createObjectURL(audioBlob);
                  const audio = new Audio(audioUrl);
                  audioRef.current = audio;
                  setIsPlaying(true);
                  setIsSpeaking(true);
                  setIsLoading(false);
                  audio.play();

                  audio.onended = () => {
                    setIsPlaying(false);
                    setIsSpeaking(false);
                  };
                  audio.onerror = () => {
                    setIsPlaying(false);
                    setIsSpeaking(false);
                  };
                } catch (error) {
                  console.error("Speech error:", error);
                  setIsLoading(false);
                }
              }}
              className="text-gray-400 hover:text-white transition min-w-[20px] flex items-center justify-center"
            >
              {isLoading ? (
                <span className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                </span>
              ) : isPlaying ? (
                <VolumeX size={16} />
              ) : (
                <Volume2 size={16} />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
