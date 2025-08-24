import React, { useState } from 'react';


const ChatSidebar= ({
  chats,
  selectedChatId,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
  onRenameChat,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  return (
    <div className="w-[300px] bg-slate-900 border-r border-slate-800 min-h-screen flex flex-col p-4 overflow-y-auto">
      <div className="flex md:flex-row flex-col items-center justify-between mb-4">

        <h2 className=" hidden sm:block text-xl text-white">
            NOVA 1000<span className="text-xs align-top m-1 text-gray-400">™</span>
            Chats
          </h2>
        <button
          className="bg-[#3489E9] hover:bg-[#2c80df] text-white w-full md:w-auto  px-3 py-1 mt-2 rounded text-xs"
          onClick={onCreateChat}
        >
          + New chat
        </button>
      </div>
      <div className="flex-1 space-y-2">
        {chats.length === 0 && (
          <div className="text-gray-400 text-sm">No chats yet.</div>
        )}
        {chats.map((chat) => (
          <div
            key={chat._id}
            className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-all ${
              chat._id === selectedChatId ? 'bg-slate-800 text-cyan-400' : 'bg-slate-800/60 text-white hover:bg-slate-800'
            }`}
            onClick={() => onSelectChat(chat._id)}
          >
            {editingId === chat._id ? (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  onRenameChat(chat._id, editTitle.trim() || chat.title);
                  setEditingId(null);
                }}
                className="flex-1 flex items-center"
              >
                <input
                  className="bg-slate-700 text-white rounded px-2 py-1 text-xs flex-1 mr-2"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  autoFocus
                  onBlur={() => setEditingId(null)}
                />
                <button type="submit" className="text-cyan-400 text-xs px-2">Save</button>
              </form>
            ) : (
              <>
                <span className="truncate flex-1" title={chat.title}>{chat.title}</span>
                <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="text-xs text-cyan-400 hover:text-cyan-300 px-1"
                    onClick={e => {
                      e.stopPropagation();
                      setEditingId(chat._id);
                      setEditTitle(chat.title);
                    }}
                  >
                    Rename
                  </button>
                  <button
                    className="text-xs text-red-400 hover:text-red-300 px-1"
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteChat(chat._id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar; 