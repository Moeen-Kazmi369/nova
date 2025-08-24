import { ChatMessage } from "../components/ChatMessage";
import { TextInput } from "../components/TextInput";
import { CircularWaveform } from "../components/CircularWaveform";
import { MenuOverlay } from "../components/MenuOverlay";
import { Plus, Menu } from "lucide-react";
import ChatSidebar from "../components/ChatSidebar";
import { Send, Loader2 } from 'lucide-react';
import micIcone from "../../assets/Icon.png";

function HomePage() {
  const isDesktop = true;
  const isSidebarOpen = false;
  const chats = [
    { id: "1", title: "Chat 1" },
    { id: "2", title: "Chat 2" },
  ];
  const selectedChatId = "1";
  const messages = [
    { _id: "1", text: "Hello, how can I help you?", isUser: false, timestamp: "2025-08-21T09:00:00Z" },
    { _id: "2", text: "I have a question about React.", isUser: true, timestamp: "2025-08-21T09:01:00Z" },
  ];
  const isListening = false;
  const isSpeaking = false;
  const isProcessing = false;
  const audioLevel = 0;
  const errorMessage = "";
  const selectedFile = null;
  const filePreviewUrl = null;
  const isUploading = false;
  const inputValue = "";
  const isSending = false;
  const isMenuOpen = false;
  const isUserSpeaking = false;
  const isIOS = false;
  const permissionStatus = "granted";

  return (
    <>
      <div
        className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden"
        style={{ height: "100vh" }}
      >
        {/* Mobile Hamburger Menu */}
        {!isDesktop && (
          <div className="fixed top-0 left-0 z-40 p-3">
            <button
              className="p-2 rounded-full bg-slate-900/80 text-gray-200 shadow-lg hover:bg-slate-800/90 transition"
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
            />
            {/* Sidebar Slide-in */}
            <div className="relative z-10 w-4/5 max-w-xs min-h-full bg-slate-900 border-r border-slate-800 shadow-xl animate-slideInLeft flex flex-col mobile-safe-top">
              <div className="flex items-center justify-between pl-4 pr-4 border-b border-slate-800">
                <h2 className="text-xl text-white">
                  NOVA 1000
                  <span className="text-xs align-top m-1 text-gray-400">™</span>
                  Chats
                </h2>
                <button
                  className="p-2 rounded-full text-gray-400 hover:text-white transition"
                  aria-label="Close chat history"
                >
                  <span className="text-5xl">×</span>
                </button>
              </div>
              <ChatSidebar
                chats={chats}
                selectedChatId={selectedChatId}
                onSelectChat={() => {}}
                onCreateChat={() => {}}
                onDeleteChat={() => {}}
                onRenameChat={() => {}}
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
              onSelectChat={() => {}}
              onCreateChat={() => {}}
              onDeleteChat={() => {}}
              onRenameChat={() => {}}
            />
          )}
          <div className="flex-1 w-full max-w-4xl mx-auto px-4 min-h-0">
            <div className="h-full flex flex-col">
              <div
                className="flex-1 px-4 py-4 overflow-y-auto scrollbar-hide min-h-0"
              >
                <div className="flex flex-col mb-4 items-center justify-center mobile-safe-top">
                  <div className="mb-3 sm:mb-4">
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
                    key={message._id}
                    message={message.text}
                    isUser={message.isUser}
                    timestamp={new Date(message.timestamp)}
                    setIsSpeaking={() => {}}
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
                <div className="h-4" />
              </div>
              <div className="flex-shrink-0 px-2 pb-4 sm:pb-4">
                <div className="mb-2 flex flex-col space-y-2">
                  {/* File preview UI */}
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
                              className="absolute top-[-10px] right-[-25px] md:top-1.5 md:right-[-10px] text-white rounded-full w-4 h-4 flex items-center justify-center md:text-xs"
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
                          disabled={isUploading}
                        />
                      </div>
                      <button
                        className={`ml-2 bg-transparent text-gray-400 hover:text-white transition-all duration-200 rounded px-3 py-1 text-xs ${
                          isUploading || !inputValue.trim()
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={isUploading || !inputValue.trim() || isSending}
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
                        onSubmit={() => {}}
                        placeholder="Message NOVA 1000™"
                        disabled={isProcessing || isUploading || isSending}
                        value={inputValue}
                        setValue={() => {}}
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
                        disabled={isProcessing || isUploading}
                      />
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </label>
                    <button
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                  </div>
                  <div
                    className="flex-shrink-0 text-center pb-2"
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
                      className="rounded-full transition-all duration-300 text-gray-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60"
                      title="Start voice input"
                    >
                      <span className="sr-only">Start voice input</span>
                      <img
                        src={micIcone}
                        className="w-8 h-8"
                        alt="Microphone"
                      />
                    </button>
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
      {/* <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} /> */}
      {/* <VoiceOverlay
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
      /> */}
    </>
  );
}

export default HomePage;
