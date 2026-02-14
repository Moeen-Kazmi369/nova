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
  User,
  Briefcase,
  Globe,
  Clock,
  Target,
  Shield,
  Activity,
  Zap,
  Users,
} from "lucide-react";
import { TextInput } from "../components/TextInput";
import {
  useGetAllAIModelsForAdmin,
  useCreateAIModel,
  useUpdateAIModel,
  useAdminPlaygroundTextChat,
} from "../hooks/backendAPIService";

// imports (add these at the top)
import { Info, ChevronDown } from "lucide-react";
import { CircularWaveform } from "../../user/components/CircularWaveform";
import { ChatMessage } from "../../user/components/ChatMessage";

// Reusable helper
function InfoNote({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="ml-2 inline-flex items-center text-slate-300 hover:text-white"
        aria-expanded={open}
        aria-label={`More info about ${title}`}
      >
        <Info className="w-4 h-4" />
        <ChevronDown
          className={`w-3 h-3 ml-1 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute z-10 mt-2 w-64 md:w-80 max-w-[80vw] rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm shadow-xl"
          role="region"
          aria-label={title}
        >
          {children}
        </div>
      )}
    </div>
  );
}

const initialConfig = {
  name: "",
  description: "",
  agentType: "dimensional",
  ownerName: "",
  ownerTitle: "",
  jurisdiction: "",
  time: "",
  mission: "",
  covenant: "",
  polygon: "",
  xrpl: "",
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
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [modelFiles, setModelFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();

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
    if (models && id && id !== "new") {
      const model = models.find((m) => m._id === id);
      if (model) {
        setConfig({
          name: model.name,
          description: model.description,
          agentType: model.agentType || "dimensional",
          ownerName: model.ownerName || "",
          ownerTitle: model.ownerTitle || "",
          jurisdiction: model.jurisdiction || "",
          time: model.time || "",
          mission: model.mission || "",
          covenant: model.covenant || "",
          polygon: model.polygon || "",
          xrpl: model.xrpl || "",
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
      modelData.append("agentType", config.agentType);
      modelData.append("ownerName", config.ownerName);
      modelData.append("ownerTitle", config.ownerTitle);
      modelData.append("jurisdiction", config.jurisdiction);
      modelData.append("time", config.time);
      modelData.append("mission", config.mission);
      modelData.append("covenant", config.covenant);
      modelData.append("polygon", config.polygon);
      modelData.append("xrpl", config.xrpl);
      modelData.append("apiConfig", JSON.stringify(config.apiConfig));
      console.log(modelFiles);
      modelFiles.forEach((file) => {
        if (file?.textContent) return;
        modelData.append("files", file);
      });
      if (id && id !== "new") {
        await updateAIModel.mutateAsync({ id, modelData });
        toast.success("Model updated successfully");
      } else {
        await createAIModel.mutateAsync(modelData);
        toast.success("Model created successfully");
        // After create, perhaps redirect to edit page with new id, but assuming handled outside
      }
      navigate("/admin?navOption=models");
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

  // Responsive states
  const [activeTab, setActiveTab] = useState("config"); // 'config' or 'preview'
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#020617] text-white overflow-hidden">
      {/* Mobile Header & Tabs */}
      {isMobile && (
        <div className="flex-shrink-0 flex flex-col bg-slate-900 border-b border-slate-800 z-50">
          <div className="flex items-center p-4">
            <button
              onClick={() => navigate("/admin?navOption=models")}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors mr-3"
            >
              <ArrowLeft className="text-white w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold truncate flex-1">
              {id === "new" ? "Create Model" : config.name || "Configure Model"}
            </h2>
          </div>

          <div className="flex w-full px-4 pb-0">
            <button
              onClick={() => setActiveTab("config")}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "config"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
            >
              Configuration
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "preview"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
            >
              Test Agent
            </button>
          </div>
        </div>
      )}

      {/* Desktop Header for Config (hidden on mobile) */}
      <div className={`
        ${isMobile ? (activeTab === "config" ? "flex" : "hidden") : "flex w-1/3"} 
        flex-col bg-slate-900 border-r border-slate-800 h-full overflow-hidden
      `}>
        {/* Desktop Title */}
        <div className="hidden md:flex p-6 flex-col gap-2 flex-shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate("/admin?navOption=models")}
              className="hover:bg-slate-800 p-1 rounded-full transition-colors"
            >
              <ArrowLeft className="text-white w-5 h-5" />
            </button>
            {id === "new" ? (
              <h2 className="text-xl font-bold">Create Agent</h2>
            ) : (
                <h2 className="text-xl font-bold truncate">Configure {config.name}</h2>
            )}
          </div>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          <label className="block">
            <span className="block mb-1 font-medium text-slate-300">Agent Name</span>
            <input
              type="text"
              name="name"
              value={config.name}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="e.g. ACE Engineer"
            />
          </label>
          <label className="block">
            <span className="block mb-1 font-medium text-slate-300">
              Description
              <InfoNote title="Description / Greeting">
                <div className="space-y-2">
                  <p>
                    <strong>What it is:</strong> A short summary users see with
                    the model. You can also treat it as the model’s{" "}
                    <em>initial greeting</em>.
                  </p>
                  <p>
                    <strong>Tip:</strong> Keep it 1–2 sentences. Example: “Hi!
                    I’m the ParkBlockX assistant—ask me about AI pricing, IoT
                    detection, and the NOVA Fund.”
                  </p>
                </div>
              </InfoNote>
            </span>
            <textarea
              name="description"
              value={config.description}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              rows={3}
              placeholder="Describe in 1 or 2 sentences what this AI agent does..."
            />
          </label>

          <label className="block">
            <span className="block mb-1 font-medium text-slate-300">
              Instructions
              <InfoNote title="Instructions / System Prompt">
                <div className="space-y-2">
                  <p>
                    <strong>What it does:</strong> Defines the model’s{" "}
                    <em>personality, goals, and boundaries</em>. It’s sent as
                    the system prompt at the start of every chat.
                  </p>
                </div>
              </InfoNote>
            </span>
            <textarea
              name="apiConfig.systemPrompt"
              value={config.apiConfig.systemPrompt}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-mono text-sm"
              rows={8}
              placeholder="You are NOVA 1000™..."
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block mb-1 font-medium text-slate-300">
                Temperature
              </span>
              <input
                type="number"
                name="apiConfig.temperature"
                min={0}
                max={1}
                step={0.01}
                value={config.apiConfig.temperature}
                onChange={handleChange}
                className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              />
            </label>

            <label className="block">
              <span className="block mb-1 font-medium text-slate-300">
                Max Tokens
              </span>
              <input
                type="number"
                name="apiConfig.maxTokens"
                min={1}
                max={4096}
                value={config.apiConfig.maxTokens}
                onChange={handleChange}
                className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              />
            </label>
          </div>

          <label className="block">
            <span className="block mb-1 font-medium text-slate-300">Model</span>
            <select
              name="apiConfig.chatModel"
              value={config.apiConfig.chatModel}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
            >
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            </select>
          </label>

          <label className="block">
            <span className="block mb-1 font-medium text-slate-300">API Key</span>
            <input
              type="password"
              name="apiConfig.apiKey"
              value={config.apiConfig.apiKey}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="Enter OpenAI API Key"
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-2 mb-1 font-medium text-slate-300">
              <Users className="w-4 h-4 text-cyan-400" />
              Agent Type
            </span>
            <select
              name="agentType"
              value={config.agentType}
              onChange={handleChange}
              className="w-full p-3 rounded-2xl bg-[#041121] border border-cyan-700/40 text-cyan-100 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-300/70"
            >
              <option value="dimensional">Dimensional Agent</option>
              <option value="enterprise">Enterprise Agent</option>
              <option value="civilian">Civilian Agent</option>
              <option value="twin">Dimensional Twin Agent</option>
              <option value="medical">Medical Agent</option>
              <option value="defense">Defense Agent</option>
              <option value="space">Space Agent</option>
              <option value="fintech">FinTech Agent</option>
            </select>
          </label>

          <label className="block">
            <span className="flex items-center gap-2 mb-1 font-medium text-slate-300">
              <User className="w-4 h-4 text-cyan-400" />
              Owner NAME
            </span>
            <input
              type="text"
              name="ownerName"
              value={config.ownerName}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="e.g. Human or Company Name"
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-2 mb-1 font-medium text-slate-300">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              Owner title
            </span>
            <input
              type="text"
              name="ownerTitle"
              value={config.ownerTitle}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="e.g. Human Name, Operations Lead, Founder, or Team Manager"
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-2 mb-1 font-medium text-slate-300">
              <Globe className="w-4 h-4 text-cyan-400" />
              Jurisdiction (Country / Region)
            </span>
            <input
              type="text"
              name="jurisdiction"
              value={config.jurisdiction}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="e.g. USA, EU, Singapore, UAE…"
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-2 mb-1 font-medium text-slate-300">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              Company logo
            </span>
            <input
              type="file"
              disabled
              className="w-full border border-slate-700 bg-slate-800/50 text-slate-500 rounded-xl px-4 py-2.5 cursor-not-allowed"
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-2 mb-1 font-medium text-slate-300">
              <Clock className="w-4 h-4 text-cyan-400" />
              TIME
            </span>
            <input
              type="text"
              name="time"
              value={config.time}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="TIME"
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-2 mb-1 font-medium text-slate-300">
              <Target className="w-4 h-4 text-cyan-400" />
              MISSION
            </span>
            <textarea
              name="mission"
              value={config.mission}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              rows={2}
              placeholder="Describe what this agents purpose and mission is…"
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-2 mb-1 font-medium text-slate-300">
              <Shield className="w-4 h-4 text-cyan-400" />
              COVENANT
            </span>
            <input
              type="text"
              name="covenant"
              value={config.covenant}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="COVENANT"
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-2 mb-1 font-medium text-slate-300">
              <Activity className="w-4 h-4 text-cyan-400" />
              Polygon
            </span>
            <input
              type="text"
              name="polygon"
              value={config.polygon}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="Polygon"
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-2 mb-1 font-medium text-slate-300">
              <Zap className="w-4 h-4 text-cyan-400" />
              XRPL
            </span>
            <input
              type="text"
              name="xrpl"
              value={config.xrpl}
              onChange={handleChange}
              className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="XRPL"
            />
          </label>

          <label className="block">
            <span className="block mb-1 font-medium text-slate-300">Knowledge Base</span>
            <div className="border border-slate-700 border-dashed rounded-xl p-4 bg-slate-800/50 text-center">
              <input
                type="file"
                accept=".pdf,.txt,.csv,.json"
                multiple
                onChange={handleModelFileSelect}
                className="hidden"
                id="knowledge-upload"
              />
              <label htmlFor="knowledge-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <div className="bg-slate-700 p-2 rounded-full">
                  <Plus className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-sm text-slate-400">Click to upload files</span>
              </label>
            </div>

            {modelFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {modelFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-slate-800 p-2.5 rounded-lg border border-slate-700"
                  >
                    {getFileIcon(file.mimetype || file.type)}
                    <span className="text-sm truncate flex-1 text-slate-300">
                      {file.filename || file.name}
                    </span>
                    <button
                      onClick={() => removeModelFile(index)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </label>
        </div>

        {/* Save button (fixed) */}
        <div className="p-4 md:p-6 flex-shrink-0 border-t border-slate-800 bg-slate-900 z-10">
          <button
            className="w-full px-6 py-3 flex justify-center items-center bg-blue-600 text-white rounded-xl hover:bg-blue-500 text-sm md:text-base font-semibold transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                "Save Configuration"
            )}
          </button>
        </div>
      </div>

      {/* Right: Playground Section */}
      <div className={`
        ${isMobile ? (activeTab === "preview" ? "flex" : "hidden") : "flex w-2/3"} 
        flex-col bg-[#020617] h-full relative
      `}>
        {/* Background decoration */}
        <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />

        {/* Header */}
        <div className="px-4 py-6 flex flex-col items-center justify-center flex-shrink-0 relative z-10">
          <div className="mb-4">
            <CircularWaveform
              isActive={false || isSpeaking || isProcessing}
              isUserInput={false && !isSpeaking}
              audioLevel={
                false ? audioLevel : isSpeaking ? Math.random() * 0.8 + 0.2 : 0
              }
              size={isMobile ? 100 : 140}
              className="mx-auto"
            />
          </div>
          <div className="text-center">
            <h1 className="text-xl md:text-3xl font-light tracking-wider text-white">
              NOVA 1000
              <span className="text-xs align-top ml-1 text-blue-500 font-bold">
                ™
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest">Preview Mode</p>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-slate-800 relative z-10"
        >
          <div className="flex flex-col space-y-4 max-w-3xl mx-auto pb-4">
            {messages.length === 0 && (
              <div className="text-center text-slate-600 mt-10 text-sm">
                Test your agent configuration here.
              </div>
            )}
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
              <div className="flex justify-start mb-6">
                <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl">
                  <div className="flex space-x-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="text-red-400 text-sm bg-red-950/30 border border-red-500/20 rounded-xl p-3 text-center">
                {errorMessage}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Section */}
        <div className="flex-shrink-0 flex px-4 pb-6 pt-2 relative z-10">
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-3">
            {/* File Pills */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                        className="flex items-center space-x-2 bg-slate-800 rounded-lg p-2 border border-slate-700"
                      >
                        {getFileIcon(file.type)}
                        <span className="text-xs text-slate-300 truncate max-w-[100px]">
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeSelectedFile(index)}
                          className="text-slate-500 hover:text-red-400"
                          disabled={isSending}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <label
                className="p-3 rounded-xl cursor-pointer text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
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
              <TextInput
                onSubmit={
                  selectedFiles.length > 0
                    ? () => handleSendFilePrompt(inputValue)
                    : () => handleSendMessage(inputValue)
                }
                placeholder="Test your agent..."
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