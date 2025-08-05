import React, { useCallback, useEffect, useRef, useState } from "react";
import { useConversation, MessageEvent } from "@elevenlabs/react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, Volume2 } from "lucide-react";
import { CircularWaveform } from "../components/CircularWaveform";
import { MenuOverlay } from "../components/MenuOverlay";
import { useChats } from "../hooks/useChats";

const VoiceModePage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [transcripts, setTranscripts] = useState<MessageEvent[]>([]);
  const transcriptsRef = useRef<MessageEvent[]>([]);

  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: async () => {
      console.log("Disconnected");
      await handleSaveSession(); // 👈 Await async save
    },
    onMessage: (msg) => setTranscripts((prev) => [...prev, msg]),
    onError: (err) => console.error("Conversation error:", err),
  });
  const [isListening, setIsListening] = useState(false);
  const connectionStatus = conversation.status;
  const isSpeaking = conversation.isSpeaking;
  const isProcessing = conversation.isProcessing;

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: import.meta.env.VITE_ELEVEN_LAB_AGENT_ID,
        connectionType: "webrtc",
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [conversation]);

  useEffect(() => {
    startConversation();
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [startConversation]);
  useEffect(() => {
    transcriptsRef.current = transcripts;
  }, [transcripts]);
  const getToken = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.token;
  };
  const handleSaveSession = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.user?._id;
    const latestTranscripts = transcriptsRef.current;
    console.log(userId);
    if (!userId || latestTranscripts.length <= 0) {
      return console.warn("No user or transcripts to save");
    }

    try {
      const token = getToken();
      if (!token) return;
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URI}/api/chat/voice-chat/save`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            transcripts: latestTranscripts,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save");

      console.log("Saved chat:", data.chat);
      window.location.reload();
      // alert("Voice session saved successfully!");
    } catch (error) {
      console.error("Save session error:", error);
      // alert("Failed to save voice session");
    }
  };

  return (
    <>
      <div
        className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden"
        style={{ height: `${viewportHeight}px` }}
      >
        <div className="flex-shrink-0 flex items-center justify-between p-3 mobile-safe-top">
          <button
            onClick={() => navigate("/")}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-light tracking-wider text-white">
              Voice Mode
            </h2>
          </div>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 py-6 flex flex-col items-center justify-center px-4">
          <div className="mb-4">
            <CircularWaveform
              isActive={isListening || isSpeaking || isProcessing}
              isUserInput={isListening}
              audioLevel={Math.random() * 0.8 + 0.2}
              size={isDesktop ? 180 : 150}
              className="mx-auto"
            />
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-wider text-white mb-4">
            NOVA 1000
            <span className="text-sm sm:text-base align-top ml-1 text-gray-400">
              ™
            </span>
          </h1>

          <div className="text-center mb-6 min-h-[50px] flex flex-col items-center justify-center">
            {connectionStatus === "connecting" && (
              <p className="text-yellow-400 animate-pulse">
                Initializing connection...
              </p>
            )}
            {isSpeaking && (
              <p className="text-cyan-400 animate-pulse">
                NOVA 1000™ is speaking...
              </p>
            )}
            {isListening && (
              <p className="text-emerald-400 animate-pulse">Listening...</p>
            )}
            {isProcessing && (
              <p className="text-blue-400 animate-pulse">Processing...</p>
            )}
            {!isSpeaking &&
              !isListening &&
              !isProcessing &&
              connectionStatus === "connected" && (
                <p className="text-gray-400">Ready to talk</p>
              )}
          </div>

          {isDesktop && (
            <div className="text-center text-gray-500 text-xs">
              <p>Real-time voice conversation with ElevenLabs & Whisper</p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 text-center py-2 text-gray-500 text-xs mobile-safe-bottom">
          <p>Powered by ElevenLabs & OpenAI Whisper</p>
        </div>
      </div>

      <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default VoiceModePage;
