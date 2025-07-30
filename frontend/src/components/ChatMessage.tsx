import React from 'react';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isUser, timestamp }) => {
  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'} mb-6`}>
      <div className={`max-w-md px-4 py-3 rounded-2xl backdrop-blur-sm border ${
        isUser 
          ? 'bg-slate-800/80 text-white border-slate-700/50' 
          : 'bg-slate-800/80 text-white border-slate-700/50'
      }`}>
        <p className="text-sm leading-relaxed break-words text-white">{message}</p>
        {timestamp && (
          <p className="text-xs mt-2 text-gray-400">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
};