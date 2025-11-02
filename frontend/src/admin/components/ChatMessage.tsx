import React from "react";
import { useState, useRef } from "react";
import axios from "axios";
import { Volume2, VolumeX } from "lucide-react"; // Speaker icons

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isUser,
  timestamp,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div
      className={`flex ${
        isUser ? "justify-start" : "justify-end"
      } mb-4 md:mb-6`}
    >
      <div
        className={`max-w-[85%] md:max-w-md px-3 py-2 md:px-4 md:py-3 rounded-2xl backdrop-blur-sm border relative ${
          isUser
            ? isPlaying
              ? "bg-slate-900/90 text-white border-slate-700/50"
              : "bg-slate-800/80 text-white border-slate-700/50"
            : isPlaying
            ? "bg-slate-900/90 text-white border-slate-700/50"
            : "bg-slate-800/80 text-white border-slate-700/50"
        }`}
      >
        <p className="text-xs md:text-sm leading-relaxed break-words text-white">
          {message}
        </p>
        {timestamp && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[10px] md:text-xs text-gray-400">
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
                  return;
                }

                setIsLoading(true);
                try {
                  const response = await axios.post(
                    `https://api.elevenlabs.io/v1/text-to-speech/${
                      import.meta.env.VITE_ELEVEN_VOICE_ID as string
                    }`,
                    { text: message },
                    {
                      headers: {
                        "xi-api-key": `${
                          import.meta.env.VITE_ELEVEN_LAB_API_KEY as string
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
                  setIsLoading(false);
                  audio.play();

                  audio.onended = () => {
                    setIsPlaying(false);
                  };
                  audio.onerror = () => {
                    setIsPlaying(false);
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
                  <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                  <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                  <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                </span>
              ) : isPlaying ? (
                <VolumeX size={14} className="md:w-4 md:h-4" />
              ) : (
                <Volume2 size={14} className="md:w-4 md:h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};