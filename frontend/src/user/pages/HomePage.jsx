import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "../components/ChatMessage";
import { TextInput } from "../components/TextInput";
import { CircularWaveform } from "../components/CircularWaveform";
import { MenuOverlay } from "../components/MenuOverlay";
import {
  Plus,
  Menu,
  FileText,
  ImageIcon,
  FileIcon,
  X,
  Send,
  Loader2,
} from "lucide-react";
import ChatSidebar from "../components/ChatSidebar";
import { LoadingScreen } from "../components/LoadingScreen";
import { toast } from "sonner";
import {
  useGetAllAIModels,
  useGetUserConversations,
  useGetConversationMessages,
  useDeleteConversation,
  useUserTextPrompt,
} from "../hooks/backendAPIService";
import micIcone from "../../assets/micIcone.png";
import { useNavigate } from "react-router-dom";
function HomePage() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const [isLoading,setIsLoading]=useState(true)
  const [isDeletingChatId, setIsDeletingChatId] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Placeholder states for voice features (unchanged)
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isIOS, setIsIOS] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("granted");
  const [chatMessages, setChatMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate=useNavigate()

  // Fetch data using hooks
  const {
    data: models,
    isLoading: isModelsLoading,
    error: modelsError,
  } = useGetAllAIModels();
  const {
    data: conversations,
    isLoading: isConversationsLoading,
    error: conversationsError,
  } = useGetUserConversations();
  const {
    data: messages,
    isLoading: isMessagesLoading,
    error: messagesError,
  } = useGetConversationMessages(selectedChatId);
  const deleteConversation = useDeleteConversation();
  const userTextPrompt = useUserTextPrompt();
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false)
    },2000)
  },[])
  useEffect(() => {
    if (messages) {
      setChatMessages(messages);
    }
  }, [messages]);
  // Update isDesktop on window resize
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isProcessing]);

  // Set default model on load
  useEffect(() => {
    if (models && models.length > 0 && !selectedModel) {
      setSelectedModel(models[0]);
    }
  }, [models]);

useEffect(() => {
  if (!conversations || conversations.length === 0) {
    setSelectedChatId(null);
    setChatMessages([]);
    return;
  }

  // if selectedChatId is missing or deleted, reset
  const exists = conversations.some((c) => c._id === selectedChatId);
  if (!selectedChatId || !exists) {
    setSelectedChatId(conversations[0]?._id || null);
    setChatMessages([]); // clear old messages
  }
}, [conversations, selectedChatId]);


  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
    if (!isDesktop) setIsSidebarOpen(false);
  };

  const handleSelectModel = (modelId) => {
    if (!models) return;
    const model = models.find((m) => m._id === modelId);
    setSelectedModel(model);
    setSelectedChatId(null); // Clear chat selection when switching models
    if (!isDesktop) setIsSidebarOpen(false);
  };

  const handleCreateChat = async () => {
    if (!selectedModel) {
      toast.error("Please select a model first");
      return;
    }
    setIsCreatingNewChat(true);
    try {
      const promptData = new FormData();
      promptData.append(
        "prompt",
        "AI You need to introduce yourself according to system prompt in 3 lines with greeting message"
      );
      promptData.append("aiModelId", selectedModel?._id);
      promptData.append("chatType", "new");
      const { conversationId } = await userTextPrompt.mutateAsync(promptData, {
        onSettled: () => {
          setIsCreatingNewChat(false);
        },
      });
      setSelectedChatId(conversationId);
      if (!isDesktop) setIsSidebarOpen(false);
      toast.success("New chat created");
    } catch (err) {
      toast.error(err.message || "Failed to create new chat");
    }
  };

  const handleDeleteChat = (chatId) => {
    setIsDeletingChatId(chatId);
    deleteConversation.mutate(chatId, {
      onSuccess: () => {
        toast.success("Chat deleted successfully");
        if (selectedChatId === chatId) {
          setSelectedChatId(
            conversations?.length > 1 ? conversations[0]._id : null
          );
        }
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete chat");
      },
      onSettled: () => {
    setIsDeletingChatId(false);
      }
    });
  };

  const handleRenameChat = async (chatId, newTitle) => {
    try {
      await axios.put(
        `${
          import.meta.env.VITE_BACKEND_API_URI
        }/api/user/conversations/${chatId}`,
        { title: newTitle },
        {
          headers: {
            Authorization: `Bearer ${
              JSON.parse(localStorage.getItem("user"))?.token
            }`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Chat renamed successfully");
    } catch (err) {
      toast.error(err.message || "Failed to rename chat");
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (newFiles.length <= 3) {
        setSelectedFiles(newFiles);
      } else {
        toast.error("Maximum 3 files allowed");
      }
      e.target.value = null; // Reset input
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith("image/") || mimetype?.includes("image"))
      return <ImageIcon className="w-5 h-5" />;
    if (mimetype === "application/pdf") return <FileText className="w-5 h-5" />;
    return <FileIcon className="w-5 h-5" />;
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || !selectedModel) {
      if (!selectedModel) toast.error("Please select a model");
      return;
    }
    setIsProcessing(true);
    const userMessage = {
      _id: ` temp-${Date.now()}`,
      attachments: selectedFiles || [],
      sender: "user",
      text,
      isUser: true,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    try {
      const promptData = new FormData();
      promptData.append("prompt", text);
      promptData.append("aiModelId", selectedModel?._id);
      if (selectedChatId) promptData.append("conversationId", selectedChatId);
      selectedFiles.forEach((file) => {
        promptData.append("files", file);
      });
      const { reply, conversationId } = await userTextPrompt.mutateAsync(
        promptData,
        {
          onSettled: () => {
            setIsProcessing(false);
          },
          onError: () => {
            setIsProcessing(false);
          },
        }
      );
      const aiMessage = {
        _id: `temp-${Date.now() + 1}`,
        attachments: [],
        sender: "ai",
        text: reply,
        timestamp: new Date().toISOString(),
      };
      const finalChatId = conversationId || selectedChatId;
      setSelectedChatId(finalChatId);
      setSelectedFiles([]);
    } catch (err) {
      setErrorMessage(err.message || "Failed to get response from AI");
      setChatMessages((prev) =>
        prev.filter((msg) => msg._id !== userMessage._id)
      );
    }
  };
  if(isLoading) return <LoadingScreen />;
  return (
    <>
      <div
        className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden"
        style={{ height: "100vh" }}
      >
        {/* Mobile Hamburger Menu */}
        {!isDesktop && (
          <div className="fixed top-0 left-0 z-40 p-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
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
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="relative z-10 w-4/5 max-w-xs min-h-full bg-slate-900 border-r border-slate-800 shadow-xl animate-slideInLeft flex flex-col mobile-safe-top">
              <div className="flex items-center justify-between pl-4 pr-4 border-b border-slate-800">
                <h2 className="text-xl text-white">
                  NOVA 1000
                  <span className="text-xs align-top m-1 text-gray-400">
                    ™
                  </span>{" "}
                  Chats
                </h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-full text-gray-400 hover:text-white transition"
                  aria-label="Close chat history"
                >
                  <span className="text-5xl">×</span>
                </button>
              </div>
              <ChatSidebar
                models={models || []}
                conversations={conversations || []}
                selectedChatId={selectedChatId}
                selectedModelId={selectedModel?._id}
                onSelectChat={handleSelectChat}
                onSelectModel={handleSelectModel}
                onCreateChat={handleCreateChat}
                onDeleteChat={handleDeleteChat}
                onRenameChat={handleRenameChat}
                isCreatingNewChat={isCreatingNewChat}
                isDeletingChatId={isDeletingChatId}
              />
            </div>
          </div>
        )}
        {/* Main Content */}
        <div className="flex flex-1 h-full">
          {isDesktop && (
            <ChatSidebar
              models={models || []}
              conversations={conversations || []}
              selectedChatId={selectedChatId}
              selectedModelId={selectedModel?._id}
              onSelectChat={handleSelectChat}
              onSelectModel={handleSelectModel}
              onCreateChat={handleCreateChat}
              onDeleteChat={handleDeleteChat}
              onRenameChat={handleRenameChat}
              isCreatingNewChat={isCreatingNewChat}
              isDeletingChatId={isDeletingChatId}
            />
          )}
          <div className="flex-1 w-full max-w-4xl mx-auto px-4 min-h-0">
            <div className="h-full flex flex-col ">
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
              <div className="flex-1 px-4 py-4 overflow-y-auto scrollbar-hide min-h-0">
                <div className="flex-1 px-4 py-4 overflow-y-auto scrollbar-hide">
                  {isMessagesLoading && !isProcessing ? (
                    <p className="text-gray-400 text-center">
                      Loading messages...
                    </p>
                  ) : messagesError ? (
                    <p className="text-red-400 text-center">
                      Error loading messages: {messagesError.message}
                    </p>
                  ) : !chatMessages || chatMessages.length === 0 ? (
                    <p className="text-gray-400 text-center">No messages yet</p>
                  ) : (
                    chatMessages.map((message) => (
                      <ChatMessage
                        key={message._id}
                        message={message.text}
                        attachments={message.attachments}
                        isUser={message.sender === "user"}
                        timestamp={new Date(message.timestamp)}
                        setIsSpeaking={() => {}}
                      />
                    ))
                  )}
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
                  <div ref={messagesEndRef} />
                  <div className="h-4" />
                </div>
              </div>
              <div className="flex-shrink-0 px-2 pb-2">
                <div className="mb-2 flex flex-col space-y-2">
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 bg-slate-800/70 rounded-xl p-2"
                        >
                          {getFileIcon(file.type)}
                          <span className="text-sm text-gray-300">
                            {file.name}
                          </span>
                          <button
                            onClick={() => removeSelectedFile(index)}
                            className="text-red-500"
                            disabled={isSending}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <label
                      className="p-2 rounded-xl cursor-pointer text-gray-400 hover:text-white transition-all duration-200"
                      title="Upload files"
                    >
                      <input
                        type="file"
                        accept=".pdf,.txt,.csv,.json,image/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={handleFileSelect}
                        disabled={isProcessing || isSending}
                      />
                      <Plus className="w-5 h-5" />
                    </label>
                    <TextInput
                      onSubmit={() => handleSendMessage(inputValue)}
                      placeholder="Message NOVA 1000™"
                      disabled={isProcessing || isSending || !selectedModel}
                      value={inputValue}
                      setValue={setInputValue}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2 sm:mb-0">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setIsMenuOpen(true)}
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
                      className=""
                      onClick={() =>
                        navigate(
                          `/voice?aiModelId=${selectedModel?._id}&aiModelIdFirstMessage=${selectedModel?.description}&conversationId=${selectedChatId}`
                        )
                      }
                      title="Start voice input"
                    >
                      <span className="sr-only">Start voice input</span>
                      <img
                        src={micIcone}
                        className="w-12 h-12"
                        alt="Microphone"
                      />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 px-2 md:px-0 text-center py-2 text-gray-500 text-sm">
                <p>Powered By: DIMENSIONAL INTEGRITY ENGINE & IMMORTAL LOGIC</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MenuOverlay
        voiceModeURL={`/voice?aiModelId=${selectedModel?._id}&aiModelIdFirstMessage=${selectedModel?.description}&conversationId=${selectedChatId}`}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}

export default HomePage;
