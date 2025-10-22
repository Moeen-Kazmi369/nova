import React, { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Menu, Mic, MicOff } from "lucide-react";
import { CircularWaveform } from "../components/CircularWaveform";
import { MenuOverlay } from "../components/MenuOverlay";

const VoiceModePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [micOn, setMicOn] = useState(true);
  // Get aiModelId and conversationId from URL query parameters
  const aiModelId = searchParams.get("aiModelId");
  const aiModelIdFirstMessage = searchParams.get("aiModelIdFirstMessage");
  const conversationId = searchParams.get("conversationId");
  const aiModelName = searchParams.get("aiModelName");

  const conversation = useConversation({
    micMuted: !micOn,
    onConnect: () => console.log("Connected"),
    onDisconnect: async () => {
      console.log("Disconnected");
    },
    onError: (err) => console.error("Conversation error:", err),
    onMessage: (message) => {
      console.log("Received message:", message);
    },
    onAudio: (audio) => {
      // console.log("Received audio chunk:", audio);
    },
  });
  const [isListening, setIsListening] = useState(false);

  const connectionStatus = conversation.status;
  const isSpeaking = conversation.isSpeaking;

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const userId = JSON.parse(localStorage.getItem("user") || "{}")?.userId;
      const chatType = conversationId && conversationId !== "null";
      console.log(
        {
          conversationId:
            conversationId && conversationId !== "null"
              ? conversationId
              : undefined,
          aiModelId: aiModelId && aiModelId !== "null" ? aiModelId : undefined,
          chatType: chatType ? "old" : "new",
          userId: userId && userId !== "null" ? userId : undefined,
        }
      )
      await conversation.startSession({
        agentId: import.meta.env.VITE_ELEVEN_LAB_AGENT_ID,
        connectionType: "websocket",
        overrides: {
          agent: {
            firstMessage:
              aiModelIdFirstMessage ||
              "Hi there! Welcome to NOVA 1000. How can I help you today?",
          },
        },
        customLlmExtraBody: {
          conversationId:
            conversationId && conversationId !== "null"
              ? conversationId
              : undefined,
          aiModelId: aiModelId && aiModelId !== "null" ? aiModelId : undefined,
          chatType: chatType ? "old" : "new",
          userId: userId && userId !== "null" ? userId : undefined,
        },
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
  const handleMicToggle = () => {
    setMicOn((prev) => {
      const newState = !prev;
      return newState;
    });
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
          <div className="mb-4 mt-[-20px]">
            <CircularWaveform
              isActive={isListening || isSpeaking || false}
              isUserInput={isListening || micOn}
              audioLevel={Math.random() * 0.8 + 0.2}
              size={isDesktop ? 250 : 150}
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
            {isListening && micOn && (
              <p className="text-emerald-400 animate-pulse">Listening...</p>
            )}
          </div>

          {isDesktop && (
            <div className="text-center text-gray-500 text-xs">
              <p>Real-time voice with {aiModelName}</p>
            </div>
          )}
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={handleMicToggle}
              className={`p-2 rounded-full transition-colors flex items-center justify-center
      ${
        micOn
          ? "bg-gray-800 text-gray-400 hover:text-white"
          : "border border-red-500 text-red-500 bg-transparent"
      }`}
              aria-label={micOn ? "Turn mic off" : "Turn mic on"}
            >
              {micOn ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => navigate("/")}
              className="p-2 text-gray-400 bg-gray-800 rounded-full hover:text-white transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
          <p>
            Power by 1000× Dimensional Cognition Cube™ — Secured by Dimensional
            Integrity Engine™ + Immortal Logic
          </p>
        </div>
      </div>

      <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default VoiceModePage;
