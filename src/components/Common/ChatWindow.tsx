import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Paperclip, MoreVertical } from 'lucide-react';
import { Chat, Message, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

interface ChatWindowProps {
  chat: Chat;
  onClose: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  chat, 
  onClose, 
  isMinimized = false, 
  onToggleMinimize 
}) => {
  const { user } = useAuth();
  const { messages, sendMessage, users } = useApp();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMessages = messages.filter(m => m.chatId === chat.id).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const otherParticipant = users.find(u => 
    chat.participants.find(p => p !== user?.id) === u.id
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    sendMessage(chat.id, newMessage.trim());
    setNewMessage('');
  };

  const formatMessageTime = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-neutral-800 rounded-t-2xl shadow-lg border border-slate-200 dark:border-neutral-700">
        <div 
          className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-neutral-700 cursor-pointer"
          onClick={onToggleMinimize}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {otherParticipant?.firstName[0] || 'U'}
              </span>
            </div>
            <div>
              <div className="font-medium text-slate-900 dark:text-white text-sm">
                {otherParticipant?.firstName} {otherParticipant?.lastName}
              </div>
              {chat.unreadCount > 0 && (
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {chat.unreadCount} новых сообщений
                </div>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-slate-200 dark:border-neutral-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-neutral-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">
              {otherParticipant?.firstName[0] || 'U'}
            </span>
          </div>
          <div>
            <div className="font-medium text-slate-900 dark:text-white">
              {otherParticipant?.firstName} {otherParticipant?.lastName}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              В сети
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMinimize}
            className="p-2 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg"
          >
            <MoreVertical size={16} className="text-slate-500" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length > 0 ? (
          chatMessages.map((message) => {
            const isOwn = message.senderId === user?.id;
            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  isOwn 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 dark:bg-neutral-700 text-slate-900 dark:text-white'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <div className={`text-xs mt-1 ${
                    isOwn ? 'text-blue-100' : 'text-slate-500 dark:text-neutral-400'
                  }`}>
                    {formatMessageTime(message.timestamp)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-slate-500 dark:text-neutral-400 py-8">
            <p className="text-sm">Начните диалог</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-neutral-700">
        <div className="flex gap-2">
          <button
            type="button"
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-neutral-300"
          >
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Написать сообщение..."
            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-neutral-700 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};
