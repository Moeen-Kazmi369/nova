import React, { useState, useEffect } from "react";
import { Save, Settings, Info, Brain, Mic, Shield, BookOpen, XCircle } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const NovaAceProfileEditor = ({ onClose }) => {
  const [profile, setProfile] = useState({
    instructions: "",
    voice_preferences: {
      provider: "OpenAI Voice",
      speaking_style: "Professional",
      domain_focus: "General"
    },
    knowledge_collection_bindings: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("instructions");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        const token = userData?.token;
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URI}/api/tasks/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const token = userData?.token;
      await axios.put(`${import.meta.env.VITE_BACKEND_API_URI}/api/tasks/profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("NOVA ACE Profile updated!");
      if (onClose) onClose();
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-start bg-slate-900/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">NOVA ACE Configuration</h2>
            </div>
            <p className="text-slate-400 max-w-md text-sm leading-relaxed">
              Define how your Task Architect thinks, speaks, and utilizes your company's knowledge base.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white">
            <XCircle className="w-7 h-7" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar Tabs */}
          <div className="w-64 border-r border-slate-800 p-4 space-y-2 bg-slate-950/20">
            <TabButton 
              active={activeTab === "instructions"} 
              onClick={() => setActiveTab("instructions")}
              icon={<Settings className="w-4 h-4" />}
              label="AI Instructions"
            />
            <TabButton 
              active={activeTab === "knowledge"} 
              onClick={() => setActiveTab("knowledge")}
              icon={<BookOpen className="w-4 h-4" />}
              label="Knowledge Base"
            />
            <TabButton 
              active={activeTab === "voice"} 
              onClick={() => setActiveTab("voice")}
              icon={<Mic className="w-4 h-4" />}
              label="Voice & Style"
            />
            <TabButton 
              active={activeTab === "safety"} 
              onClick={() => setActiveTab("safety")}
              icon={<Shield className="w-4 h-4" />}
              label="Safety & Policy"
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-900/30">
            {activeTab === "instructions" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    System Instructions
                    <Info className="w-3.5 h-3.5 text-slate-500" title="Act as a guide for the AI's personality" />
                  </label>
                  <textarea
                    className="w-full h-64 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all resize-none text-sm leading-relaxed"
                    placeholder="Example: Act as a high-clarity enterprise task composition assistant. Always prioritize security and data privacy..."
                    value={profile.instructions}
                    onChange={(e) => setProfile({ ...profile, instructions: e.target.value })}
                  />
                </div>
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                  <p className="text-xs text-blue-400/80 leading-relaxed">
                    <strong>Tip:</strong> Be specific about your company's tone and preferred output formats. These instructions directly shape how NOVA ACE drafts your tasks.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "knowledge" && (
              <div className="space-y-6">
                <div className="p-12 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-full">
                    <BookOpen className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">No Knowledge Collections Linked</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-xs">Link your company PDFs and documents to ground the AI's intelligence.</p>
                  </div>
                  <button className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-all">
                    Link Collection
                  </button>
                </div>
              </div>
            )}

            {activeTab === "voice" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <SelectField 
                    label="Speaking Style"
                    value={profile.voice_preferences.speaking_style}
                    options={["Professional", "Friendly", "Concise", "Detailed"]}
                    onChange={(val) => setProfile({
                      ...profile,
                      voice_preferences: { ...profile.voice_preferences, speaking_style: val }
                    })}
                  />
                  <SelectField 
                    label="Domain Focus"
                    value={profile.voice_preferences.domain_focus}
                    options={["General", "Engineering", "Legal", "Marketing", "Strategic"]}
                    onChange={(val) => setProfile({
                      ...profile,
                      voice_preferences: { ...profile.voice_preferences, domain_focus: val }
                    })}
                  />
                </div>
              </div>
            )}

            {activeTab === "safety" && (
              <div className="space-y-6">
                <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                  <h3 className="text-amber-400 font-medium mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Security Baseline
                  </h3>
                  <p className="text-sm text-amber-400/70 leading-relaxed">
                    NOVA ACE strictly enforces data privacy. All drafts are processed through your company's private LLM context and never shared with external trainers.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-slate-400 hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    }`}
  >
    {icon}
    {label}
  </button>
);

const SelectField = ({ label, value, options, onChange }) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/50"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export default NovaAceProfileEditor;
