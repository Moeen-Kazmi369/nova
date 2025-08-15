import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Loader2, Send, Plus, Menu } from "lucide-react";
import micIcone from "./assets/Icon.png";
import { ChatMessage } from "./components/ChatMessage";
import { TextInput } from "./components/TextInput";
import { CircularWaveform } from "./components/CircularWaveform";
const initialConfig = {
  modelName: "NOVA 1000",
  temperature: 0.7,
  maxTokens: 512,
  systemPrompt: "",
};

const ModelConfigs = () => {
  const [config, setConfig] = useState(initialConfig);

  // Playground state
  const [messages, setMessages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);

  const [isDesktop] = useState(true); // adjust detection logic if needed
  const [isIOS] = useState(false); // adjust detection logic if needed
  const [permissionStatus] = useState("granted");
  const [isUserSpeaking] = useState(false);
  const [audioLevel] = useState(0);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: name === "temperature" || name === "maxTokens" ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_API_URI}/api/model-configs/save`,
        config,
        { withCredentials: true }
      );
      toast.success(data.message);
      setConfig(data.config);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save ModelConfig");
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_API_URI}/api/chat/${chatId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(data.messages);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const handleSendFilePrompt = async (prompt) => {
    if (!selectedFile || !selectedChatId || !prompt.trim()) return;
    setIsSending(true);
    setErrorMessage(null);
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("prompt", prompt);
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_API_URI}/api/chat/${selectedChatId}/upload-message`,
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
      setIsSending(false);
      await fetchMessages(selectedChatId);
    } catch (err) {
      setErrorMessage("Failed to upload file. Please check your connection and try again.");
      setIsSending(false);
    }
  };

  const handleFileSelect = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
  };

  const handleTextSubmit = async (text) => {
    if (!text.trim() || !selectedChatId) return;
    setIsProcessing(true);
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      await axios.post(
        `${import.meta.env.VITE_BACKEND_API_URI}/api/chat/${selectedChatId}/message`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInputValue("");
      await fetchMessages(selectedChatId);
    } catch (err) {
      setErrorMessage("Failed to send message");
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-white">
      {/* Left: Config Section */}
      <div className="w-1/3 bg-slate-900 p-8 border-r border-slate-800 flex flex-col gap-6">
        <h2 className="text-2xl font-bold mb-4">Configure Nova 1000</h2>
        <label>
          <span className="block mb-1 font-medium">Model Name</span>
          <input
            type="text"
            name="modelName"
            value={config.modelName}
            readOnly={true}
            className="w-full border border-slate-700 bg-slate-800 text-white rounded px-3 py-2"
            placeholder="e.g. NovaGPT"
          />
        </label>
        <label>
          <span className="block mb-1 font-medium">Temperature</span>
          <input
            type="number"
            name="temperature"
            min={0}
            max={1}
            step={0.01}
            value={config.temperature}
            onChange={handleChange}
            className="w-full border border-slate-700 bg-slate-800 text-white rounded px-3 py-2"
          />
        </label>
        <label>
          <span className="block mb-1 font-medium">Max Tokens</span>
          <input
            type="number"
            name="maxTokens"
            min={1}
            max={4096}
            value={config.maxTokens}
            onChange={handleChange}
            className="w-full border border-slate-700 bg-slate-800 text-white rounded px-3 py-2"
          />
        </label>
        <label>
          <span className="block mb-1 font-medium">System Prompt</span>
          <textarea
            name="systemPrompt"
            value={config.systemPrompt}
            onChange={handleChange}
            className="w-full border border-slate-700 bg-slate-800 text-white rounded px-3 py-2"
            rows={3}
            placeholder="You are Nova 1000, a helpful assistant..."
          />
        </label>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleSave}
        >
          Save Settings
        </button>
      </div>

      {/* Right: Playground Section */}
      <div className="w-2/3 flex flex-col bg-[#020617]">
        <div
          ref={chatContainerRef}
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
              key={message._id || message.timestamp.toString()}
              message={message.text}
              isUser={message.isUser}
              timestamp={new Date(message.timestamp)}
              setIsSpeaking={setIsSpeaking}
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

        {/* Input Section */}
        <div className="flex-shrink-0 px-2 pb-4 sm:pb-4">
          <div className="mb-2 flex flex-col space-y-2">
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
                onClick={() => console.log("Menu opened")}
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
                          isSpeaking ? "bg-blue-500 h-2" : "bg-emerald-500"
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
                onClick={() => console.log("Voice mode")}
                className={`rounded-full transition-all duration-300 text-gray-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60`}
                title="Start voice input"
              >
                <span className="sr-only">Start voice input</span>
                <img src={micIcone} className="w-8 h-8" alt="Microphone" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelConfigs;
