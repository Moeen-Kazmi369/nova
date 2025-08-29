import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  Plus,
  FileText,
  ImageIcon,
  FileIcon,
  X,
  ArrowLeft,
} from "lucide-react";
import { ChatMessage } from "../components/ChatMessage";
import { TextInput } from "../components/TextInput";
import { CircularWaveform } from "../components/CircularWaveform";
import {
  useGetAllAIModelsForAdmin,
  useCreateAIModel,
  useUpdateAIModel,
  useAdminPlaygroundTextChat,
} from "../hooks/backendAPIService";

const initialConfig = {
  name: "",
  description: "",
  apiConfig: {
    systemPrompt: "",
    temperature: 0.7,
    maxTokens: 1000,
    chatModel: "gpt-4o-mini",
    apiKey: "",
  },
};

const AIModelConfig = () => {
  const { id } = useParams();
  const [config, setConfig] = useState(initialConfig);
  const [messages, setMessages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaving,setIsSaving]=useState(false)
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [modelFiles, setModelFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const navigate=useNavigate()

  const { data: models, isLoading: isModelsLoading } =
    useGetAllAIModelsForAdmin();
  const createAIModel = useCreateAIModel();
  const updateAIModel = useUpdateAIModel();
  const adminPlaygroundTextChat = useAdminPlaygroundTextChat();
useEffect(() => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages, isProcessing]);
  useEffect(() => {
    if (models && id && id !=="new") {
      const model = models.find((m) => m._id === id);
      if (model) {
        setConfig({
          name: model.name,
          description: model.description,
          apiConfig: model.apiConfig || initialConfig.apiConfig,
        });
        // Assuming model.files is array of {filename, mimetype}
        setModelFiles(model.files || []);
      }
    }
  }, [models, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("apiConfig.")) {
      const key = name.split(".")[1];
      setConfig((prev) => ({
        ...prev,
        apiConfig: {
          ...prev.apiConfig,
          [key]:
            key === "temperature" || key === "maxTokens"
              ? Number(value)
              : value,
        },
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleModelFileSelect = (e) => {
    if (e.target.files) {
      setModelFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeModelFile = (index) => {
    setModelFiles((prev) => prev.filter((_, i) => i !== index));
  };
console.log(messages);
  const handleSave = async () => {
    setIsSaving(true);    
    try {
      const modelData = new FormData();
      modelData.append("name", config.name);
      modelData.append("description", config.description);
      modelData.append("apiConfig", JSON.stringify(config.apiConfig));
      console.log(modelFiles);
      modelFiles.forEach((file) => {
        if (file?.textContent) return;
        modelData.append("files", file);
      });
      if (id && id !== "new" ) {
        await updateAIModel.mutateAsync({ id, modelData });
        toast.success("Model updated successfully");
      } else {
        await createAIModel.mutateAsync(modelData);
        toast.success("Model created successfully");
        // After create, perhaps redirect to edit page with new id, but assuming handled outside
      }
      navigate("/admin");
    } catch (err) {
      toast.error(err.message || "Failed to save Model");
    } finally {
      setIsSaving(false);
    }
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith("image/")) return <ImageIcon className="w-5 h-5" />;
    if (mimetype === "application/pdf") return <FileText className="w-5 h-5" />;
    return <FileIcon className="w-5 h-5" />;
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || !id) return;
    const newMessages = [
      ...messages,
      { text, isUser: true, timestamp: new Date() },
    ];
    setMessages(newMessages);
    setInputValue("");
    setIsProcessing(true);

    try {
      const promptData = new FormData();
      promptData.append("prompt", text);
      promptData.append("modelId", id);
      selectedFiles.forEach((file) => {
        promptData.append("files", file);
      });

      const { reply } = await adminPlaygroundTextChat.mutateAsync({
        promptData,
      });
      setMessages([
        ...newMessages,
        { text: reply, isUser: false, timestamp: new Date() },
      ]);
      setSelectedFiles([]);
    } catch (err) {
      setErrorMessage("Failed to get response from AI");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendFilePrompt = async (prompt) => {
    if (selectedFiles.length === 0 || !prompt.trim() || !id) return;
    setIsSending(true);
    setErrorMessage(null);
    try {
      const promptData = new FormData();
      promptData.append("prompt", prompt);
      promptData.append("modelId", id);
      selectedFiles.forEach((file) => {
        promptData.append("files", file);
      });

      const { reply } = await adminPlaygroundTextChat.mutateAsync({
        promptData,
      });
      setMessages([
        ...messages,
        { text: prompt, isUser: true, timestamp: new Date() },
        { text: reply, isUser: false, timestamp: new Date() },
      ]);
      setSelectedFiles([]);
      setInputValue("");
    } catch (err) {
      setErrorMessage(
        "Failed to upload files. Please check your connection and try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#020617] text-white">
      {/* Left: Config Section */}
      <div className="w-1/3 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Title (fixed) */}
        <div className="p-6 flex flex-col gap-2 flex-shrink-0 border-b border-slate-800">
          <ArrowLeft onClick={()=>navigate("/admin")} className="text-white mt-1 cursor-pointer"/>
          {id === "new" ? (
          <h2 className="text-2xl font-bold">Create Nova 1000 AI Model</h2>
          ):(
              <h2 className="text-2xl font-bold">Configure {config.name}</h2> 
          )
}
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <label className="block">
            <span className="block mb-1 font-medium">Model Name</span>
            <input
              type="text"
              name="name"
              value={config.name}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded px-3 py-2"
              placeholder="e.g. NovaGPT"
            />
          </label>
          <label className="block">
            <span className="block mb-1 font-medium">Description</span>
            <textarea
              name="description"
              value={config.description}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded px-3 py-2"
              rows={3}
              placeholder="Describe your AI model..."
            />
          </label>
          <label className="block">
            <span className="block mb-1 font-medium">System Prompt</span>
            <textarea
              name="apiConfig.systemPrompt"
              value={config.apiConfig.systemPrompt}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded px-3 py-2"
              rows={3}
              placeholder="You are a helpful assistant..."
            />
          </label>
          <label className="block">
            <span className="block mb-1 font-medium">Temperature</span>
            <input
              type="number"
              name="apiConfig.temperature"
              min={0}
              max={1}
              step={0.01}
              value={config.apiConfig.temperature}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="block mb-1 font-medium">Max Tokens</span>
            <input
              type="number"
              name="apiConfig.maxTokens"
              min={1}
              max={4096}
              value={config.apiConfig.maxTokens}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="block mb-1 font-medium">Chat Model</span>
            <select
              name="apiConfig.chatModel"
              value={config.apiConfig.chatModel}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded px-3 py-2"
            >
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
              {/* Add more OpenAI models as needed */}
            </select>
          </label>
          <label className="block">
            <span className="block mb-1 font-medium">API Key</span>
            <input
              type="password"
              name="apiConfig.apiKey"
              value={config.apiConfig.apiKey}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded px-3 py-2"
              placeholder="Enter OpenAI API Key"
            />
          </label>
          <label className="block">
            <span className="block mb-1 font-medium">
              Upload Files (Optional, max 3)
            </span>
            <input
              type="file"
              accept=".pdf,.txt,.csv,.json"
              multiple
              onChange={handleModelFileSelect}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded px-3 py-2"
            />
            {modelFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                {modelFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-slate-800 p-2 rounded"
                  >
                    {getFileIcon(file.mimetype || file.type)}
                    <span className="text-sm">
                      {file.filename || file.name}
                    </span>
                    <button
                      onClick={() => removeModelFile(index)}
                      className="text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </label>
        </div>

        {/* Save button (fixed at bottom) */}
        <div className="p-6 flex-shrink-0 border-t border-slate-800">
          <button
            className="w-full px-4 py-2 flex justify-center items-center bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSave}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Save Config"
            )}
          </button>
        </div>
      </div>

      {/* Right: Playground Section */}
      <div className="w-2/3 flex flex-col bg-[#020617] h-screen">
        {/* Header (fixed at top) */}
        <div className="px-4 py-4 flex flex-col items-center justify-center">
          <div className="mb-3 sm:mb-4">
            <CircularWaveform
              isActive={false || isSpeaking || isProcessing}
              isUserInput={false && !isSpeaking}
              audioLevel={
                false
                  ? audioLevel
                  : isSpeaking
                  ? Math.random() * 0.8 + 0.2
                  : 0
              }
              size={true ? 165 : 130}
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

        {/* Messages (scrollable area) */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-2 scrollbar-hide"
        >
          <div className="flex flex-col space-y-4">
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
              <div className="text-red-400 text-sm bg-slate-800/70 rounded-lg p-2 text-center">
                {errorMessage}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Section */}
        <div className="flex-shrink-0 flex px-2 pb-4 sm:pb-4">
          <div className="flex items-center mb-2 space-x-3">
            <label
              className="p-2 rounded-xl cursor-pointer text-gray-400 hover:text-white transition-all duration-200"
              title="Upload files"
            >
              <input
                type="file"
                accept="*"
                multiple
                style={{ display: "none" }}
                onChange={handleFileSelect}
                disabled={isProcessing}
              />
              <Plus className="w-5 h-5" />
            </label>
          </div>
          <div className="mb-2 flex flex-col flex-1 space-y-2">
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-slate-800/70 rounded-xl p-2"
                  >
                    {getFileIcon(file.type)}
                    <span className="text-sm text-gray-300">{file.name}</span>
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
              <TextInput
                onSubmit={
                  selectedFiles.length > 0
                    ? () => handleSendFilePrompt(inputValue)
                    : () => handleSendMessage(inputValue)
                }
                placeholder="Message NOVA 1000™"
                disabled={isProcessing || isSending}
                value={inputValue}
                setValue={setInputValue}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIModelConfig;
