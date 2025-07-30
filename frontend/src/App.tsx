import React, { useState, useEffect, useRef } from "react";
import { VoiceControls } from "./components/VoiceControls";
import { ChatMessage } from "./components/ChatMessage";
import { LoadingScreen } from "./components/LoadingScreen";
import { TextInput } from "./components/TextInput";
import { CircularWaveform } from "./components/CircularWaveform";
import { MenuOverlay } from "./components/MenuOverlay";
import { useAudioLevel } from "./hooks/useAudioLevel";
import { resumeAudioContext } from "./hooks/resumeAudioContext";
import { forceIOSSpeechPriming } from "./hooks/iosSpeechPriming";
import { Volume2, Plus, Menu } from "lucide-react";
import ChatSidebar from "./components/ChatSidebar";
import { useChats } from "./hooks/useChats";
import { VoiceOverlay } from "./components/VoiceOverlay";
import micIcone from "./assets/Icon.png";
import axios from "axios";
import { Send, Loader2 } from 'lucide-react';


function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    chats,
    selectedChatId,
    setSelectedChatId,
    messages,
    isProcessing,
    createChat,
    deleteChat,
    renameChat,
    processMessage,
    fetchMessages,
  } = useChats();
  const { isSpeaking, stopSpeaking, speakWithAnalysis, audioLevel, isUserSpeaking } =
    useAudioLevel(isListening);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastProcessedMessageRef = useRef<string>("");

  const [isIOS, setIsIOS] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"unknown" | "granted" | "denied">(
    "unknown"
  );

  // Add state to track input mode
  const [inputMode, setInputMode] = useState<"voice" | "text">("text");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // <-- new state for mobile sidebar
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      setIsDesktop(window.innerWidth >= 768);
    };
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };
    window.addEventListener("resize", handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleVisualViewportChange);
    }
    return () => {
      window.removeEventListener("resize", handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleVisualViewportChange);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDesktop) return;
      if (e.key === "Escape" && isSpeaking) {
        stopSpeaking();
      }
      if (e.key === " " && e.ctrlKey) {
        e.preventDefault();
        setIsListening((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDesktop, isSpeaking, isListening, stopSpeaking]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current && chatContainerRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isProcessing]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const primeAudio = () => {
      resumeAudioContext();
      forceIOSSpeechPriming();
      window.removeEventListener("click", primeAudio);
    };
    window.addEventListener("click", primeAudio);
    return () => window.removeEventListener("click", primeAudio);
  }, []);

  useEffect(() => {
    // Auto-create chat after login/signup if needed
    if (localStorage.getItem("autoCreateChat") === "true") {
      if (chats.length === 0) {
        createChat();
      }
      localStorage.removeItem("autoCreateChat");
    }
    // eslint-disable-next-line..
  }, [chats.length]);

  const handleVoiceInput = (text: string) => {
    setInputValue(text);
    setInputMode("voice");
    if (!selectedChatId && chats.length === 0) {
      // Auto-create chat if none exists
      createChat().then(() => {
        // Wait for chat to be created and selected, then send message
        setTimeout(() => {
          processMessage(text);
          setShowVoiceOverlay(false); // <-- moved here
        }, 200);
      });
    } else {
      processMessage(text);
      setShowVoiceOverlay(false); // <-- moved here
    }
    setInputValue("");
  };

  const handleSpeechStart = () => {};
  const handleSpeechEnd = () => {
    setShowVoiceOverlay(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      processMessage(inputValue);
      setInputValue("");
    }
  };

  const handleTextSubmit = async (text: string) => {
    if (text.trim()) {
      setInputMode("text");
      setIsSending(true);
      setErrorMessage(null);
      try {
        if (!selectedChatId && chats.length === 0) {
          await createChat();
          setTimeout(() => {
            processMessage(text);
            setIsSending(false);
          }, 200);
        } else {
          await processMessage(text);
          setIsSending(false);
        }
      } catch (err) {
        setErrorMessage("Failed to send message. Please try again.");
        setIsSending(false);
      }
    }
  };
  // const speakLastMessage = async () => {
  //   await resumeAudioContext();
  //   if (isSpeaking) {
  //     stopSpeaking();
  //     return;
  //   }
  //   const lastAiMessage = messages.filter((m) => !m.isUser).pop();
  //   if (lastAiMessage) {
  //     speakWithAnalysis(lastAiMessage.text);
  //   }
  // };

  // AI voice reply only if last input was voice
  useEffect(() => {
    if (inputMode !== "voice") return;
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      !lastMessage.isUser &&
      lastMessage._id !== lastProcessedMessageRef.current &&
      !isSpeaking &&
      messages.length >= 2
    ) {
      lastProcessedMessageRef.current = lastMessage._id || lastMessage.timestamp.toString();
      setTimeout(() => {
        resumeAudioContext().then(() => speakWithAnalysis(lastMessage.text));
      }, 800);
    }
  }, [messages, isSpeaking, speakWithAnalysis, inputMode]);

  // New handler for file selection (show preview, wait for prompt)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true);
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl(null);
    }
    e.target.value = "";
    setIsUploading(false);
  };

  // New handler for sending file+prompt
  const handleSendFilePrompt = async (prompt: string) => {
    if (!selectedFile || !selectedChatId || !prompt.trim()) return;
    setIsSending(true);
    setErrorMessage(null);
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("prompt", prompt);
      const { data } = await axios.post(
        `${
          import.meta.env.VITE_BACKEND_API_URI
        }/api/chat/${selectedChatId}/upload-message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setInputValue("");
      setIsSending(true);
      await fetchMessages(selectedChatId);
    } catch (err) {
      setErrorMessage(
        "Failed to upload file. Please check your connection and try again."
      );
    } 
  };

  if (isLoading) return <LoadingScreen progress={loadingProgress} />;

  return (
    <>
      <div
        className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden"
        style={{ height: `${viewportHeight}px` }}
      >
        {/* Mobile Hamburger Menu */}
        {!isDesktop && (
          <div className="fixed top-0 left-0 z-40 p-3">
            <button
              className="p-2 rounded-full bg-slate-900/80 text-gray-200 shadow-lg hover:bg-slate-800/90 transition"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open chat history"
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
        )}
        {/* Sidebar Overlay for Mobile */}
        {!isDesktop && isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Sidebar Slide-in */}
            <div className="relative z-10 w-4/5 max-w-xs min-h-full bg-slate-900 border-r border-slate-800 shadow-xl animate-slideInLeft flex flex-col mobile-safe-top">
              <div className="flex  items-center justify-between pl-4 pr-4 border-b border-slate-800">
                {/* <h2 className="text-lg font-semibold text-white">Chats</h2> */}
                <h2 className="text-xl text-white">
                  NOVA 1000
                  <span className="text-xs align-top m-1 text-gray-400">™</span>
                  Chats
                </h2>

                <button
                  className="p-2 rounded-full text-gray-400 hover:text-white transition"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Close chat history"
                >
                  <span className="text-5xl">×</span>
                </button>
              </div>
              <ChatSidebar
                chats={chats}
                selectedChatId={selectedChatId}
                onSelectChat={(id) => {
                  setSelectedChatId(id);
                  setIsSidebarOpen(false);
                }}
                onCreateChat={createChat}
                onDeleteChat={deleteChat}
                onRenameChat={renameChat}
              />
            </div>
          </div>
        )}
        {/* Main Content */}

        <div className="flex flex-1 h-full">
          {isDesktop && (
            <ChatSidebar
              chats={chats}
              selectedChatId={selectedChatId}
              onSelectChat={setSelectedChatId}
              onCreateChat={createChat}
              onDeleteChat={deleteChat}
              onRenameChat={renameChat}
            />
          )}
          <div className="flex-1 w-full max-w-4xl mx-auto px-4 min-h-0">
            <div className="h-full flex flex-col">
              <div
                ref={chatContainerRef}
                className="flex-1 px-4 py-4 overflow-y-auto scrollbar-hide min-h-0"
              >
                <div className="flex flex-col items-center justify-center mobile-safe-top">
                  <div className="mb-3 sm:mb-4 ">
                    <CircularWaveform
                      isActive={isListening || isSpeaking || isProcessing}
                      isUserInput={isListening && !isSpeaking}
                      audioLevel={
                        isListening
                          ? audioLevel
                          : isSpeaking
                          ? Math.random() * 0.8 + 0.2
                          : 0
                      }
                      size={isDesktop ? 165 : 130}
                      className="mx-auto"
                    />
                  </div>
                  <div className="text-center">
                    <h1 className="text-2xl pl-3 sm:text-3xl md:text-4xl font-light tracking-wider text-white ml-2 sm:ml-0">
                      NOVA 1000
                      <span className="text-xs sm:text-sm align-top ml-1 text-gray-400">
                        ™
                      </span>
                    </h1>
                  </div>
                </div>
                {messages.map((message) => (
                  <ChatMessage
                    key={message._id || message.timestamp.toString()}
                    message={message.text}
                    isUser={message.isUser}
                    timestamp={new Date(message.timestamp)}
                  />
                ))}
                {isProcessing && (
                  <div className="flex justify-end mb-6">
                    <div className="bg-slate-800/80 px-4 py-3 rounded-2xl max-w-xs">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                {errorMessage && (
                  <div className="mb-2 text-red-400 text-sm bg-slate-800/70 rounded-lg p-2 text-center">
                    {errorMessage}
                  </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>
              <div className="flex-shrink-0 px-2 pb-4 sm:pb-4">
                <div className="mb-2 flex flex-col space-y-2">
                  {/* File preview UI (like ChatGPT) */}
                  {selectedFile && (
                    <div className="flex items-center space-x-3 bg-slate-800/70 rounded-xl p-2 mb-2">
                      <div className="relative w-20 h-20">
                        {filePreviewUrl ? (
                          <>
                            <img
                              src={filePreviewUrl}
                              alt="preview"
                              className="mt-4 object-contain rounded"
                            />
                            <button
                              className="absolute top-[-10px] right-[-25px] md:top-1.5 md:right-[-10px]  text-white rounded-full w-4 h-4 flex items-center justify-center md:text-xs"
                              onClick={() => {
                                setSelectedFile(null);
                                setFilePreviewUrl(null);
                                setInputValue("");
                              }}
                              disabled={isUploading}
                              title="Remove"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <div className="w-16 h-16 flex items-center justify-center bg-slate-700 rounded">
                            <span className="text-xs text-gray-300">
                              {selectedFile.name}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none scrollbar-hide"
                          placeholder="Message NOVA 1000™"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          disabled={isUploading}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendFilePrompt(inputValue);
                            }
                          }}
                        />
                      </div>

                      <button
                        className={`ml-2 bg-transparent text-gray-400 hover:text-white transition-all duration-200 rounded px-3 py-1 text-xs ${
                          isUploading || !inputValue.trim()
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() => handleSendFilePrompt(inputValue)}
                        disabled={
                          isUploading || !inputValue.trim() || isSending
                        }
                      >
                        {isSending ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <Send className="w-6 h-6" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Standard text input and file upload button */}
                  {!selectedFile && (
                    <div className="flex items-center space-x-2">
                      <TextInput
                        onSubmit={handleTextSubmit}
                        placeholder="Message NOVA 1000™"
                        disabled={isProcessing || isUploading || isSending}
                        value={inputValue}
                        setValue={setInputValue}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mb-2 sm:mb-0">
                  <div className="flex items-center space-x-3">
                    <label
                      className="p-2 rounded-xl cursor-pointer text-gray-400 hover:text-white transition-all duration-200"
                      title="Upload file"
                    >
                      <input
                        type="file"
                        accept="*"
                        style={{ display: "none" }}
                        onChange={handleFileSelect}
                        disabled={isProcessing || isUploading}
                      />
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </label>
                    <button
                      onClick={() => setIsMenuOpen(true)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                  </div>

                  <div
                    className="flex-shrink-0   text-center pb-2"
                    style={{ minHeight: "20px" }}
                  >
                    {(isSpeaking || isUserSpeaking) && (
                      <div className="flex flex-col items-center justify-center py-0">
                        {isSpeaking ? (
                          <p className="text-xs animate-pulse text-blue-400">
                            NOVA 1000™ is speaking...
                          </p>
                        ) : (
                          <p className="text-xs animate-pulse text-emerald-400">
                            Voice detected...
                          </p>
                        )}
                        <div className="flex justify-center mt-1 space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 rounded-full animate-pulse ${
                                isSpeaking
                                  ? "bg-blue-500 h-2"
                                  : "bg-emerald-500"
                              }`}
                              style={{
                                animationDelay: `${i * 0.1}s`,
                                height:
                                  isListening && !isSpeaking
                                    ? `${4 + audioLevel * 8}px`
                                    : "8px",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 relative pl-2">
                    {!isDesktop && isIOS && permissionStatus === "denied" && (
                      <div className="absolute bottom-full right-0 mb-2 text-center text-red-400 text-xs bg-slate-800/90 px-3 py-2 rounded-lg whitespace-nowrap">
                        🎤 Microphone blocked.{" "}
                        <a
                          href="/mic-access"
                          className="underline text-blue-300 hover:text-blue-400"
                        >
                          Tap here to enable
                        </a>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowVoiceOverlay(true)}
                      className={`p-3 rounded-full transition-all duration-300 text-gray-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60`}
                      title="Start voice input"
                    >
                      <span className="sr-only">Start voice input</span>
                      <img
                        src={micIcone}
                        className="w-5 h-5"
                        alt="Microphone"
                      />
                    </button>
                    {/* <button
                      type="button"
                      onClick={speakLastMessage}
                      className={`p-3 rounded-full transition-all duration-300 ${
                        isSpeaking
                          ? "text-blue-400 bg-blue-500/20"
                          : "text-gray-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60"
                      }`}
                      title={
                        isSpeaking ? "Stop speaking" : "Speak last response"
                      }
                    >
                      <Volume2
                        className={`w-5 h-5 ${
                          isSpeaking ? "animate-pulse" : ""
                        }`}
                      />
                    </button> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 md:ml-[18%] px-2 md:px-0 text-center py-2 text-gray-500 text-sm">
          <p>Powered By: DIMENSIONAL INTEGRITY ENGINE & IMMORTAL LOGIC</p>
        </div>
      </div>
      <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <VoiceOverlay
        open={showVoiceOverlay}
        onClose={() => setShowVoiceOverlay(false)}
        onVoiceInput={handleVoiceInput}
        isListening={isListening}
        setIsListening={setIsListening}
        audioLevel={audioLevel}
        isSpeaking={isSpeaking}
        onSpeechStart={handleSpeechStart}
        onSpeechEnd={handleSpeechEnd}
        permissionStatusCallback={setPermissionStatus}
      />
    </>
  );
}

export default App;
