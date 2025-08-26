import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Search, MoreVertical, MessageCircle } from 'lucide-react';
import { Chat, Message, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { ChatList } from './ChatList';

interface MessagesViewProps {
  onNavigate: (page: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { chats, messages, sendMessage, users } = useApp();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const otherParticipantId = chat.participants.find(p => p !== user?.id);
    const otherParticipant = users.find(u => u.id === otherParticipantId);
    
    return otherParticipant?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherParticipant?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           chat.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const chatMessages = selectedChat 
    ? messages.filter(m => m.chatId === selectedChat.id).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    : [];

  const otherParticipant = selectedChat 
    ? users.find(u => selectedChat.participants.find(p => p !== user?.id) === u.id)
    : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user) return;

    sendMessage(selectedChat.id, newMessage.trim());
    setNewMessage('');
  };

  const formatMessageTime = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatMessageDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long'
      }).format(date);
    }
  };

  return (
    <div className="h-[600px] bg-white dark:bg-neutral-800 rounded-2xl shadow-sm overflow-hidden flex">
      {/* Chat List */}
      <div className="w-1/3 border-r border-slate-200 dark:border-neutral-700 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-neutral-700">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск диалогов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full bg-slate-100 dark:bg-neutral-700 border-0 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          <ChatList
            chats={filteredChats}
            onChatSelect={setSelectedChat}
            selectedChatId={selectedChat?.id}
          />
        </div>
      </div>

      {/* Chat View */}
      <div className="flex-1 flex flex-col">
        {selectedChat && otherParticipant ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">
                    {otherParticipant.firstName[0]}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {otherParticipant.firstName} {otherParticipant.lastName}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    В сети
                  </div>
                </div>
              </div>
              
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg">
                <MoreVertical size={16} className="text-slate-500" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length > 0 ? (
                chatMessages.map((message, index) => {
                  const isOwn = message.senderId === user?.id;
                  const showDate = index === 0 || 
                    formatMessageDate(message.timestamp) !== formatMessageDate(chatMessages[index - 1].timestamp);
                  
                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span className="px-3 py-1 bg-slate-100 dark:bg-neutral-700 text-slate-600 dark:text-neutral-400 text-xs rounded-full">
                            {formatMessageDate(message.timestamp)}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                          isOwn 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-100 dark:bg-neutral-700 text-slate-900 dark:text-white'
                        }`}>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <div className={`text-xs mt-2 ${
                            isOwn ? 'text-blue-100' : 'text-slate-500 dark:text-neutral-400'
                          }`}>
                            {formatMessageTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <MessageCircle size={32} className="text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-neutral-500 text-sm">
                    Начните диалог
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-neutral-700">
              <div className="flex gap-3">
                <button
                  type="button"
                  className="p-3 text-slate-500 hover:text-slate-700 dark:hover:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
                >
                  <Paperclip size={18} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Написать сообщение..."
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-neutral-700 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={48} className="text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Выберите диалог
              </h3>
              <p className="text-slate-600 dark:text-neutral-400">
                Выберите диалог из списка слева для начала общения
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
