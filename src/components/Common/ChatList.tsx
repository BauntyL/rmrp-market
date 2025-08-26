import React from 'react';
import { MessageCircle, User } from 'lucide-react';
import { Chat, User as UserType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

interface ChatListProps {
  chats: Chat[];
  onChatSelect: (chat: Chat) => void;
  selectedChatId?: string;
}

export const ChatList: React.FC<ChatListProps> = ({ chats, onChatSelect, selectedChatId }) => {
  const { user } = useAuth();
  const { users } = useApp();

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60) return `${diffInMinutes} мин`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч`;
    return `${Math.floor(diffInMinutes / 1440)} дн`;
  };

  const getOtherParticipant = (chat: Chat): UserType | undefined => {
    const otherParticipantId = chat.participants.find(p => p !== user?.id);
    return users.find(u => u.id === otherParticipantId);
  };

  if (chats.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle size={48} className="text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          Нет диалогов
        </h3>
        <p className="text-slate-600 dark:text-neutral-400">
          Начните общение с продавцами через объявления
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chats.map((chat) => {
        const otherParticipant = getOtherParticipant(chat);
        const isSelected = selectedChatId === chat.id;
        
        return (
          <div
            key={chat.id}
            onClick={() => onChatSelect(chat)}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              isSelected 
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                : 'hover:bg-slate-50 dark:hover:bg-neutral-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                {chat.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-slate-900 dark:text-white truncate">
                    {otherParticipant?.firstName} {otherParticipant?.lastName}
                  </h4>
                  {chat.lastMessage && (
                    <span className="text-xs text-slate-500 dark:text-neutral-500 flex-shrink-0">
                      {formatLastMessageTime(chat.lastMessage.timestamp)}
                    </span>
                  )}
                </div>
                
                {chat.lastMessage ? (
                  <p className={`text-sm truncate ${
                    chat.unreadCount > 0 
                      ? 'text-slate-900 dark:text-white font-medium' 
                      : 'text-slate-600 dark:text-neutral-400'
                  }`}>
                    {chat.lastMessage.senderId === user?.id ? 'Вы: ' : ''}
                    {chat.lastMessage.content}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-neutral-500">
                    Диалог создан
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};