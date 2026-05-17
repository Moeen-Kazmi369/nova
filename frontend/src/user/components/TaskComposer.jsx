import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Edit3, Save, Play } from "lucide-react";
import axios from "axios";

const TaskComposer = ({ draftId, onClose, onApproved }) => {
  const [draft, setDraft] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        const token = userData?.token;
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_API_URI}/api/tasks/drafts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const currentDraft = res.data.find(d => d._id === draftId);
        if (currentDraft) {
          setDraft(currentDraft);
          setEditedContent(currentDraft.content);
        }
      } catch (err) {
        console.error("Failed to fetch draft:", err);
      } finally {
        setLoading(false);
      }
    };
    if (draftId) fetchDraft();
  }, [draftId]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      // For now, we update the draft locally and mark as approved
      // In a full implementation, we'd have a PATCH endpoint for the draft content
      setDraft({ ...draft, content: editedContent });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save draft updates:", err);
    }
  };

  const handleApprove = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const token = userData?.token;
      await axios.post(`${import.meta.env.VITE_BACKEND_API_URI}/api/tasks/drafts/${draftId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onApproved();
      onClose();
    } catch (err) {
      console.error("Failed to approve draft:", err);
    }
  };

  if (loading) return null;
  if (!draft) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-400" />
              Task Composer
            </h2>
            <p className="text-sm text-gray-400 mt-1">Review and approve your task for execution</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</label>
              {isEditing ? (
                <input
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editedContent.title}
                  onChange={(e) => setEditedContent({ ...editedContent, title: e.target.value })}
                />
              ) : (
                <p className="text-lg text-white font-medium">{draft.content.title}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deliverable Type</label>
              {isEditing ? (
                <input
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  value={editedContent.deliverable_type}
                  onChange={(e) => setEditedContent({ ...editedContent, deliverable_type: e.target.value })}
                />
              ) : (
                <p className="text-white">{draft.content.deliverable_type} ({draft.content.output_format})</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Objective</label>
            {isEditing ? (
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white h-24 outline-none focus:ring-2 focus:ring-blue-500"
                value={editedContent.objective}
                onChange={(e) => setEditedContent({ ...editedContent, objective: e.target.value })}
              />
            ) : (
              <p className="text-gray-300 leading-relaxed">{draft.content.objective}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audience</label>
              {isEditing ? (
                <input
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={editedContent.audience}
                  onChange={(e) => setEditedContent({ ...editedContent, audience: e.target.value })}
                />
              ) : (
                <p className="text-gray-300">{draft.content.audience}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</label>
              {isEditing ? (
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={editedContent.priority || "normal"}
                  onChange={(e) => setEditedContent({ ...editedContent, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              ) : (
                <p className="text-gray-300 capitalize">{draft.content.priority || "normal"}</p>
              )}
            </div>
          </div>

          {draft.content.key_topics && draft.content.key_topics.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Key Topics</label>
              <ul className="list-disc pl-5 text-gray-300 space-y-1">
                {draft.content.key_topics.map((topic, i) => (
                  <li key={i}>{topic}</li>
                ))}
              </ul>
            </div>
          )}

          {draft.content.constraints && draft.content.constraints.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Constraints</label>
              <ul className="list-disc pl-5 text-gray-300 space-y-1">
                {draft.content.constraints.map((constraint, i) => (
                  <li key={i}>{constraint}</li>
                ))}
              </ul>
            </div>
          )}

          {draft.content.proposed_roles && draft.content.proposed_roles.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Proposed Roles</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {draft.content.proposed_roles.map((role, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-medium">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex gap-3 bg-slate-900/50">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Edit3 className="w-5 h-5" />
              Edit Draft
            </button>
          )}
          <button
            onClick={handleApprove}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
          >
            <Play className="w-5 h-5" />
            Approve & Execute
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskComposer;
