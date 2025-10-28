import React from "react";
import { useState, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { FileIcon, FileText, ImageIcon, Volume2, VolumeX } from "lucide-react"; // Speaker icons

export const ChatMessage = ({
  message,
  isUser,
  timestamp,
  attachments,
  setIsSpeaking,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
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
        {/* <p className="text-sm leading-relaxed break-words text-white">
          {message}
        </p> */}
        {/* Markdown renderer */}
        <div className="text-sm leading-relaxed break-words text-white prose prose-invert prose-pre:rounded-xl prose-pre:bg-slate-900/70 max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            // You can customize HTML tags if you want tighter control:
            components={{
              a: (props) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                />
              ),
              code: ({ inline, className, children, ...props }) => {
                // Keep inline code small and blocks in <pre><code>
                if (inline) {
                  return (
                    <code
                      className={`px-1 py-0.5 rounded bg-slate-900/60 ${
                        className || ""
                      }`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <pre className="p-3 rounded-xl overflow-x-auto">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
              table: (props) => (
                <div className="overflow-x-auto">
                  <table
                    className="min-w-full border-separate border-spacing-0"
                    {...props}
                  />
                </div>
              ),
              th: (props) => (
                <th
                  className="border-b border-slate-700 px-3 py-2 text-left"
                  {...props}
                />
              ),
              td: (props) => (
                <td
                  className="border-b border-slate-800 px-3 py-2"
                  {...props}
                />
              ),
              h1: (props) => (
                <h1 className="text-xl font-bold mt-2 mb-1" {...props} />
              ),
              h2: (props) => (
                <h2 className="text-lg font-semibold mt-2 mb-1" {...props} />
              ),
              ul: (props) => (
                <ul className="list-disc pl-5 space-y-1" {...props} />
              ),
              ol: (props) => (
                <ol className="list-decimal pl-5 space-y-1" {...props} />
              ),
              blockquote: (props) => (
                <blockquote
                  className="border-l-4 border-slate-600 pl-3 italic opacity-90"
                  {...props}
                />
              ),
            }}
          >
            {message || ""}
          </ReactMarkdown>
        </div>
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
                  if (audioRef.current) {
                    audioRef.current.pause();
                  }
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

                  // Fix: Ensure audioRef is properly assigned
                  audioRef.current = audio;

                  setIsPlaying(true);
                  setIsSpeaking(true);
                  setIsLoading(false);
                  audio.play();

                  audio.onended = () => {
                    setIsPlaying(false);
                    setIsSpeaking(false);
                    // Clean up the audio reference
                    if (audioRef.current === audio) {
                      audioRef.current = null;
                    }
                  };

                  audio.onerror = () => {
                    setIsPlaying(false);
                    setIsSpeaking(false);
                    // Clean up the audio reference on error
                    if (audioRef.current === audio) {
                      audioRef.current = null;
                    }
                  };
                } catch (error) {
                  console.error("Speech error:", error);
                  setIsLoading(false);
                  setIsPlaying(false);
                  setIsSpeaking(false);
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
