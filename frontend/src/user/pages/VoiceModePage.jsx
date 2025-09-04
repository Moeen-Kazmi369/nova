import React, { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Menu } from "lucide-react";
import { CircularWaveform } from "../components/CircularWaveform";
import { MenuOverlay } from "../components/MenuOverlay";

const VoiceModePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [transcripts, setTranscripts] = useState([]);
  const transcriptsRef = useRef([]);

  // Get aiModelId and conversationId from URL query parameters
  const aiModelId = searchParams.get("aiModelId");
  const conversationId = searchParams.get("conversationId");

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

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: import.meta.env.VITE_ELEVEN_LAB_AGENT_ID,
        connectionType: "webrtc",
        // Pass AI model ID and conversation ID as custom parameters
        ...(aiModelId && { model: aiModelId }),
        ...(conversationId && { conversationId: conversationId }),
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [conversation, aiModelId, conversationId]);

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

  useEffect(() => {
    let timeout;

    if (connectionStatus === "connected" && !isSpeaking) {
      timeout = setTimeout(() => {
        setIsListening(true);
      }, 2000); // 3 seconds
    } else {
      setIsListening(false);
      clearTimeout(timeout);
    }

    return () => clearTimeout(timeout);
  }, [connectionStatus, isSpeaking]);

  const getToken = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.token;
  };

  const handleSaveSession = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.user?._id;
    const latestTranscripts = transcriptsRef.current;
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
    } catch (error) {
      console.error("Save session error:", error);
    }
  };

  return (
    <>
      <div
        className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden"
        style={{ height: `${viewportHeight}px` }}
      >
        <div className="flex-shrink-0 flex items-center justify-between p-3 mobile-safe-top">
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
              isActive={isListening || isSpeaking || false}
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
          </div>

          {isDesktop && (
            <div className="text-center text-gray-500 text-xs">
              <p>Real-time voice conversation with ElevenLabs & Whisper</p>
            </div>
          )}
          <div className="text-center mt-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 text-gray-400 bg-gray-800 rounded-full hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
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