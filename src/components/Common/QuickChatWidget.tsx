import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { ChatWindow } from './ChatWindow';

export const QuickChatWidget: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { chats, users } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [openChats, setOpenChats] = useState<string[]>([]);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Get recent chats (last 5)
  const recentChats = chats
    .filter(chat => chat.lastMessage)
    .sort((a, b) => {
      if (!a.lastMessage || !b.lastMessage) return 0;
      return b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime();
    })
    .slice(0, 5);

  const getOtherParticipant = (chat: any) => {
    const otherParticipantId = chat.participants.find((p: string) => p !== user?.id);
    return users.find(u => u.id === otherParticipantId);
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60) return `${diffInMinutes} мин`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч`;
    return `${Math.floor(diffInMinutes / 1440)} дн`;
  };

  const handleChatSelect = (chatId: string) => {
    if (!openChats.includes(chatId)) {
      setOpenChats(prev => [...prev, chatId]);
    }
    setIsOpen(false);
  };

  const handleCloseChatWindow = (chatId: string) => {
    setOpenChats(prev => prev.filter(id => id !== chatId));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  const unreadCount = chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);

  return (
    <>
      {/* Quick Chat Button */}
      <div ref={widgetRef} className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* Dropdown */}
          {isOpen && (
            <div className="absolute bottom-16 right-0 w-80 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-slate-200 dark:border-neutral-700 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-neutral-700">
                <h3 className="font-medium text-slate-900 dark:text-white">Диалоги</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              {/* Chat List */}
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {recentChats.length > 0 ? (
                  <div className="p-2">
                    {recentChats.map((chat) => {
                      const otherParticipant = getOtherParticipant(chat);
                      return (
                        <div
                          key={chat.id}
                          onClick={() => handleChatSelect(chat.id)}
                          className="p-3 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <User size={16} className="text-white" />
                              </div>
                              {chat.unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                  {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-slate-900 dark:text-white text-sm truncate">
                                  {otherParticipant?.firstName} {otherParticipant?.lastName}
                                </h4>
                                {chat.lastMessage && (
                                  <span className="text-xs text-slate-500 dark:text-neutral-500 flex-shrink-0">
                                    {formatLastMessageTime(chat.lastMessage.timestamp)}
                                  </span>
                                )}
                              </div>
                              
                              {chat.lastMessage && (
                                <p className={`text-xs truncate ${
                                  chat.unreadCount > 0 
                                    ? 'text-slate-900 dark:text-white font-medium' 
                                    : 'text-slate-600 dark:text-neutral-400'
                                }`}>
                                  {chat.lastMessage.senderId === user?.id ? 'Вы: ' : ''}
                                  {chat.lastMessage.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <MessageCircle size={32} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-neutral-400">
                      Нет диалогов
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center relative"
          >
            <MessageCircle size={24} />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Open Chat Windows */}
      {openChats.map((chatId, index) => {
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return null;

        return (
          <div
            key={chatId}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: `${100 + (index * 420)}px`,
              zIndex: 40
            }}
          >
            <ChatWindow
              chat={chat}
              onClose={() => handleCloseChatWindow(chatId)}
            />
          </div>
        );
      })}
    </>
  );
};
