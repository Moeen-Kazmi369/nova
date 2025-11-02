import { LogOut, FileText, ImageIcon, FileIcon, Loader2 } from "lucide-react";
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
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  return (
    <div className="w-[300px] bg-slate-900 border-r border-slate-800 min-h-screen flex flex-col p-4 overflow-y-auto">
      <div className="flex md:flex-row flex-col gap-2 items-center mb-4">
        <img src={Icon} alt="logo" className="w-8 " />
        <h2 className="hidden sm:block text-xl text-white">
          NOVA 1000
          <span className="text-xs align-top m-1 text-gray-400">™</span>
        </h2>
      </div>
      <div className="flex-1 space-y-4">
        {/* Models Section */}
        <div className="max-h-40 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            AI Models
          </h3>
          {models.length === 0 ? (
            <div className="text-gray-400 text-sm">No models available</div>
          ) : (
            models.map((model) => (
              <div
                key={model._id}
                className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-all ${
                  model._id === selectedModelId
                    ? "bg-slate-800 text-cyan-400"
                    : "bg-slate-800/60 text-white hover:bg-slate-800"
                }`}
                onClick={() => onSelectModel(model._id)}
              >
                <span className="truncate flex-1" title={model.name}>
                  {model.name}
                </span>
              </div>
            ))
          )}
        </div>
        {/* Conversations Section */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-sm flex items-center justify-between font-semibold text-gray-300 mb-2">
            Chats
            <button
              className="bg-[#3489E9] hover:bg-[#2c80df] text-white w-28 px-3 py-1 rounded text-xs flex items-center justify-center"
              onClick={onCreateChat}
              disabled={isCreatingNewChat} // prevent double clicks
            >
              {isCreatingNewChat && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
              )}
              + New chat
            </button>
          </h3>
          <div className=" space-y-3 mt-3">
            {conversations.length === 0 ? (
              <div className="text-gray-400 text-sm">No chats yet</div>
            ) : (
              conversations.map((chat) => (
                <div
                  key={chat._id}
                  className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-all ${
                    chat._id === selectedChatId
                      ? "bg-slate-800 text-cyan-400"
                      : "bg-slate-800/60 text-white hover:bg-slate-800"
                  }`}
                  onClick={() => onSelectChat(chat._id)}
                >
                  {editingId === chat._id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        onRenameChat(chat._id, editTitle.trim() || chat.title);
                        setEditingId(null);
                      }}
                      className="flex-1 flex items-center"
                    >
                      <input
                        className="bg-slate-700 text-white rounded px-2 py-1 text-xs flex-1 mr-2"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        onBlur={() => setEditingId(null)}
                      />
                      <button
                        type="submit"
                        className="text-cyan-400 text-xs px-2"
                      >
                        Save
                      </button>
                    </form>
                  ) : (
                    <>
                      <span
                        className="truncate flex-1"
                        title={chat.conversationName}
                      >
                        {chat.conversationName}
                      </span>
                      <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="text-xs text-red-400 hover:text-red-300 px-1 flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat._id);
                          }}
                          disabled={isDeletingChatId === chat._id}
                        >
                          {isDeletingChatId === chat._id && (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin text-red-400" />
                          )}
                          Delete
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
      <button
        className="mt-4 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
        onClick={() => {
          localStorage.removeItem("user");
          localStorage.removeItem("autoCreateChat");
          window.location.href = "/login";
        }}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </button>
    </div>
  );
};

export default ChatSidebar;