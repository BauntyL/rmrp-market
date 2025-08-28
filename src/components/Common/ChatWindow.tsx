import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MoreVertical, Edit2, Trash2, UserX, UserCheck } from 'lucide-react';
import { Chat } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { formatDate } from '../../lib/dateUtils';

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
  const { messages, sendMessage, users, loadChatMessages, editMessage, deleteMessage, blockUserByMe, unblockUserByMe, blockedUserIds, myBlockedUserIds, getUserOnlineStatus } = useApp();
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMessages = messages.filter(m => m.chatId === chat.id).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const otherParticipant = users.find(u => 
    chat.participants.find(p => p !== user?.id) === u.id
  );
  
  // Check if current user is blocked by the other participant (for sending messages)
  const isCurrentUserBlocked = otherParticipant ? blockedUserIds.includes(otherParticipant.id) : false;
  // Check if other user is blocked by current user (for menu display)
  const isOtherUserBlockedByMe = otherParticipant ? myBlockedUserIds.includes(otherParticipant.id) : false;
  
  // Get real online status of other participant
  const otherParticipantStatus = otherParticipant ? getUserOnlineStatus(otherParticipant.id) : null;

  // Load messages when chat opens
  useEffect(() => {
    loadChatMessages(chat.id);
  }, [chat.id, loadChatMessages]);

  useEffect(() => {
    // Only auto-scroll for new messages from current user, or if explicitly requested
    const lastMessage = chatMessages[chatMessages.length - 1];
    const isOwnMessage = lastMessage?.senderId === user?.id;
    
    // Only scroll if it's user's own message
    if (isOwnMessage && chatMessages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [chatMessages, user?.id]);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`;
    return `${Math.floor(diffInMinutes / 1440)} дн назад`;
  };

  // (удалена синхронная версия, оставлена асинхронная ниже)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !user) return;
    setIsSending(true);
    try {
      await sendMessage(chat.id, newMessage.trim(), attachment);
      setNewMessage('');
      setAttachment(null);
    } catch (err) {
      alert('Ошибка при отправке сообщения. Попробуйте ещё раз.');
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (date: Date | string | undefined) => {
    return formatDate(date, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBlockUser = async () => {
    if (otherParticipant) {
      await blockUserByMe(otherParticipant.id);
      setShowUserMenu(false);
    }
  };

  const handleUnblockUser = async () => {
    if (otherParticipant) {
      await unblockUserByMe(otherParticipant.id);
      setShowUserMenu(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-20 w-80 bg-white dark:bg-neutral-800 rounded-t-2xl shadow-lg border border-slate-200 dark:border-neutral-700 z-50">
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
    <div className="fixed bottom-4 right-20 w-96 h-[500px] bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-slate-200 dark:border-neutral-700 flex flex-col z-50">
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
            <div className={`text-xs ${otherParticipantStatus?.isOnline ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-neutral-500'}`}>
              {otherParticipantStatus?.isOnline ? 'В сети' : 
               otherParticipantStatus?.lastSeen ? `Был в сети ${formatRelativeTime(otherParticipantStatus.lastSeen)}` : 'Статус недоступен'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg"
          >
            <MoreVertical size={16} className="text-slate-500" />
          </button>
          
          {/* User menu dropdown */}
          {showUserMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 z-50 min-w-[150px]">
              {isOtherUserBlockedByMe ? (
                <button
                  onClick={handleUnblockUser}
                  className="w-full px-3 py-2 text-left text-sm text-green-600 dark:text-green-400 hover:bg-slate-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                >
                  <UserCheck size={14} />
                  Разблокировать
                </button>
              ) : (
                <button
                  onClick={handleBlockUser}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                >
                  <UserX size={14} />
                  Заблокировать
                </button>
              )}
            </div>
          )}
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {chatMessages.length > 0 ? (
          chatMessages.map((message) => {
            const isOwn = message.senderId === user?.id;
            const isEditing = editingMessageId === message.id;
            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[80%] px-4 py-2 rounded-2xl ${
                  isOwn 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 dark:bg-neutral-700 text-slate-900 dark:text-white'
                }`}>
                  {message.isDeleted ? (
                    <p className="text-sm italic opacity-60">Сообщение удалено</p>
                  ) : isEditing ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await editMessage(message.id, editValue);
                        setEditingMessageId(null);
                      }}
                      className="flex gap-2"
                    >
                      <input
                        className="flex-1 px-2 py-1 rounded text-black text-sm"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <button type="submit" className="text-xs px-2 py-1 bg-green-600 text-white rounded">✓</button>
                      <button type="button" className="text-xs px-2 py-1 bg-gray-600 text-white rounded" onClick={() => setEditingMessageId(null)}>✕</button>
                    </form>
                  ) : (
                    <>
                      <p className={`text-sm break-words whitespace-pre-wrap ${
                        message.isSystem ? 'bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500 text-blue-800 dark:text-blue-200' : ''
                      }`}>
                        {message.content}
                        {message.isEdited && <span className="ml-2 text-xs italic opacity-60">(изменено)</span>}
                      </p>
                      {isOwn && !message.isDeleted && !message.isSystem && (
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                          <button
                            className="p-1 hover:bg-black/10 rounded"
                            onClick={() => {
                              setEditingMessageId(message.id);
                              setEditValue(message.content);
                            }}
                            title="Редактировать"
                          >
                            <Edit2 size={10} />
                          </button>
                          <button
                            className="p-1 hover:bg-black/10 rounded text-red-300"
                            onClick={() => deleteMessage(message.id)}
                            title="Удалить"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
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
      {isCurrentUserBlocked ? (
        <div className="p-4 border-t border-slate-200 dark:border-neutral-700 bg-red-50 dark:bg-red-900/20">
          <div className="text-center text-red-600 dark:text-red-400 text-sm">
            <UserX size={16} className="inline mr-2" />
            Вы заблокированы этим пользователем. Отправка сообщений недоступна.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-neutral-700">
          <div className="flex gap-2">
            <input
              type="file"
              id={`chat-attachment-${chat.id}`}
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  setAttachment(e.target.files[0]);
                }
              }}
            />
            <button
              type="button"
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-neutral-300"
              onClick={() => document.getElementById(`chat-attachment-${chat.id}`)?.click()}
            >
              📎
            </button>
            {attachment && (
              <span className="text-xs text-slate-500 ml-2">{attachment.name}</span>
            )}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Написать сообщение..."
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-neutral-700 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-blue-500"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
