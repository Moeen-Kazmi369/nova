import { LogOut, Plus, MessageSquare, Trash2, Edit2, Check, X, Loader2, Bot } from "lucide-react";
import React, { useState } from "react";
import Icon from "../../assets/Icon.png";

const ChatSidebar = ({
  models,
  conversations,
  selectedChatId,
  selectedModelId,
  onSelectChat,
  onSelectModel,
  onCreateChat,
  onDeleteChat,
  onRenameChat,
  isCreatingNewChat,
  isDeletingChatId,
}) => {
  const [editTitle, setEditTitle] = useState("");
  const [editingId, setEditingId] = useState(null);

  return (
    <div className="w-full md:w-[300px] bg-[#0f172a] border-r border-slate-800 flex flex-col p-4 flex-1 min-h-0 md:flex-none md:h-full">
      {/* Header */}
      <div className="flex flex-row items-center gap-3 mb-6 px-1">
        <img src={Icon} alt="logo" className="w-8 h-8 object-contain" />
        <h2 className="text-xl font-semibold text-white tracking-tight">
          NOVA 1000
          <span className="text-[10px] align-top ml-0.5 text-cyan-500 font-bold uppercase">tm</span>
        </h2>
      </div>

      {/* New Chat Button */}
      <button
        className="w-full mb-6 bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
        onClick={onCreateChat}
        disabled={isCreatingNewChat}
      >
        {isCreatingNewChat ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        New Chat
      </button>

      {/* Main Scrollable Content */}
      <div className="flex-1 flex flex-col min-h-0 space-y-6 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">

        {/* Agents Section */}
        <div className="flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Bot className="w-3 h-3" /> ACE™ Agents
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
              {models.length}
            </span>
          </div>
          <div className="space-y-1">
            {models.length === 0 ? (
              <div className="text-slate-500 text-xs px-2 py-4 text-center border border-dashed border-slate-800 rounded-lg">
                No models available
              </div>
            ) : (
              models.map((model) => (
                <button
                  key={model._id}
                  onClick={() => onSelectModel(model._id)}
                  className={`w-full group flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${model._id === selectedModelId
                    ? "bg-blue-600/10 text-blue-400 border border-blue-600/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent"
                    }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${model._id === selectedModelId ? "bg-blue-600 text-white" : "bg-slate-800 group-hover:bg-slate-700"
                    }`}>
                    <Bot className="w-4 h-4" />
                  </div>
                  <span className="truncate text-sm font-medium pr-2 flex-1" title={model.name}>
                    {model.name}
                  </span>
                  {model._id === selectedModelId && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chats Section */}
        <div className="flex flex-col flex-1 min-h-[200px]">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-3 h-3" /> Chat History
            </h3>
          </div>
          <div className="space-y-1 pb-4">
            {conversations.length === 0 ? (
              <div className="text-slate-500 text-xs px-2 py-8 text-center bg-slate-900/30 rounded-xl border border-slate-800/50">
                Your chat history will appear here
              </div>
            ) : (
              conversations.map((chat) => (
                <div
                  key={chat._id}
                  className={`group relative flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer border ${
                    chat._id === selectedChatId
                    ? "bg-slate-800/80 text-white border-slate-700 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-transparent hover:border-slate-800/50"
                  }`}
                  onClick={() => onSelectChat(chat._id)}
                >
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${chat._id === selectedChatId ? "text-blue-400" : "text-slate-500"}`} />

                  {editingId === chat._id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        onRenameChat(chat._id, editTitle.trim() || chat.conversationName);
                        setEditingId(null);
                      }}
                      className="flex-1 flex items-center min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        className="bg-slate-900 text-white text-xs rounded border border-blue-500 px-2 py-1 flex-1 min-w-0 outline-none focus:ring-1 ring-blue-500"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        onBlur={() => {
                          if (editTitle === chat.conversationName) setEditingId(null);
                        }}
                      />
                      <div className="flex items-center ml-1">
                        <button type="submit" className="p-1 text-green-400 hover:text-green-300">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="p-1 text-red-400 hover:text-red-300">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                        <span className="truncate flex-1 text-sm font-medium" title={chat.conversationName}>
                        {chat.conversationName}
                      </span>

                        {/* Action Buttons: Visible on mobile, hover on desktop */}
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                            className="p-1 text-slate-500 hover:text-slate-200 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(chat._id);
                              setEditTitle(chat.conversationName);
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat._id);
                          }}
                          disabled={isDeletingChatId === chat._id}
                        >
                            {isDeletingChatId === chat._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-slate-800">
        <button
          className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/10 transition-all text-sm font-medium group"
          onClick={() => {
            localStorage.removeItem("user");
            localStorage.removeItem("autoCreateChat");
            window.location.href = "/login";
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-red-500 group-hover:text-white flex items-center justify-center transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          Logout
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;
