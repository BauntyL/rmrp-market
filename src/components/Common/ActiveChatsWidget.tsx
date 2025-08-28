import React, { useState } from 'react';
import { MessageCircle, User, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { ChatWindow } from './ChatWindow';

export const ActiveChatsWidget: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { chats, users } = useApp();
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  // Get user's chats with recent activity
  const userChats = chats
    .filter(chat => chat.participants.includes(user.id))
    .sort((a, b) => {
      const aLastMessage = a.lastMessage?.timestamp || new Date(0);
      const bLastMessage = b.lastMessage?.timestamp || new Date(0);
      return new Date(bLastMessage).getTime() - new Date(aLastMessage).getTime();
    })
    .slice(0, 5); // Show only top 5 most recent

  const getOtherParticipant = (chat: any) => {
    const otherParticipantId = chat.participants.find((p: string) => p !== user.id);
    return users.find(u => u.id === otherParticipantId);
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'сейчас';
    if (diffInMinutes < 60) return `${diffInMinutes}м`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}ч`;
    return `${Math.floor(diffInMinutes / 1440)}д`;
  };

  if (userChats.length === 0) {
    return null;
  }

  return (
    <>
      {/* Widget */}
      <div className="fixed right-4 bottom-4 z-40">
          <div className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-slate-200 dark:border-neutral-700 transition-all duration-300 ${
            isExpanded ? 'w-80' : 'w-16'
          }`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              {isExpanded ? (
                <>
                  <div className="flex items-center gap-2">
                    <MessageCircle size={20} className="text-blue-600" />
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      Активные чаты
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg"
                  >
                    <X size={16} className="text-slate-500" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center transition-colors relative"
                >
                  <MessageCircle size={16} className="text-white" />
                  {userChats.some(chat => chat.unreadCount > 0) && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Chat List */}
          {isExpanded && (
            <div className="max-h-96 overflow-y-auto">
              {userChats.map((chat) => {
                const otherParticipant = getOtherParticipant(chat);
                
                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-neutral-700 cursor-pointer border-b border-slate-100 dark:border-neutral-700 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
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
                        
                        {chat.lastMessage ? (
                          <p className={`text-xs truncate ${
                            chat.unreadCount > 0 
                              ? 'text-slate-900 dark:text-white font-medium' 
                              : 'text-slate-600 dark:text-neutral-400'
                          }`}>
                            {chat.lastMessage.senderId === user.id ? 'Вы: ' : ''}
                            {chat.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 dark:text-neutral-500">
                            Диалог создан
                          </p>
                        )}
                      </div>
                      
                      <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
              
              {/* View All Link */}
              <div className="p-3 border-t border-slate-200 dark:border-neutral-700">
                <button 
                  onClick={() => window.location.hash = 'profile?tab=messages'}
                  className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Посмотреть все диалоги
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      {selectedChat && (
        <ChatWindow
          chat={selectedChat}
          onClose={() => setSelectedChat(null)}
        />
      )}
    </>
  );
};
