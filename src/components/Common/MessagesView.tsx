import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, MoreVertical, MessageCircle, Edit2, Trash2, X } from 'lucide-react';
import { Chat } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { ChatList } from './ChatList';

interface MessagesViewProps {
  onNavigate: (page: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { chats, messages, sendMessage, users, typingUsers, setTyping, editMessage, deleteMessage, markMessageRead, blockUserByMe, unblockUserByMe, blockedUserIds, myBlockedUserIds, loadChatMessages, deleteChat } = useApp();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    return chat.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const chatMessages = selectedChat 
    ? messages.filter(m => m.chatId === selectedChat.id).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    : [];

  const otherParticipant = selectedChat 
    ? users.find(u => selectedChat.participants.find(p => p !== user?.id) === u.id)
    : null;

  // Проверка блокировки: текущий пользователь заблокирован собеседником (не может писать)
  const isCurrentUserBlocked = otherParticipant ? blockedUserIds.includes(otherParticipant.id) : false;
  // Проверка блокировки: текущий пользователь заблокировал собеседника (для кнопок управления)
  const isOtherUserBlockedByMe = otherParticipant ? myBlockedUserIds.includes(otherParticipant.id) : false;

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      loadChatMessages(selectedChat.id);
    }
  }, [selectedChat, loadChatMessages]);

  useEffect(() => {
    // Отметить все сообщения собеседника как прочитанные
    if (user) {
      chatMessages.forEach((msg) => {
        if (msg.senderId !== user.id && (!msg.readBy || !msg.readBy.includes(user.id))) {
          markMessageRead(msg.id);
        }
      });
    }
  }, [chatMessages, user, markMessageRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !selectedChat || !user) return;
    setIsSending(true);
    try {
      await sendMessage(selectedChat.id, newMessage.trim(), attachment);
      setNewMessage('');
      setAttachment(null);
    } catch (err) {
      alert('Ошибка при отправке сообщения. Попробуйте ещё раз.');
    } finally {
      setIsSending(false);
    }
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
        <div className="flex-1 overflow-y-auto scrollbar-thin">
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
                    {otherParticipant?.firstName ? otherParticipant.firstName[0] : ''}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {otherParticipant?.firstName} {otherParticipant?.lastName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-neutral-500">
                    Статус недоступен
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {otherParticipant && (
                  isOtherUserBlockedByMe ? (
                    <button
                      className="px-3 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200"
                      onClick={async () => {
                        await unblockUserByMe(otherParticipant.id);
                      }}
                    >
                      Разблокировать
                    </button>
                  ) : (
                    <button
                      className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                      onClick={async () => {
                        await blockUserByMe(otherParticipant.id);
                      }}
                    >
                      Заблокировать
                    </button>
                  )
                )}
                <button
                  className="p-1 hover:bg-red-100 rounded text-red-600"
                  onClick={async () => {
                    if (confirm('Удалить диалог? Это действие нельзя отменить.')) {
                      await deleteChat(selectedChat.id);
                      setSelectedChat(null);
                    }
                  }}
                  title="Удалить диалог"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {chatMessages.length > 0 ? (
                chatMessages.map((message, index) => {
                  const isOwn = message.senderId === user?.id;
                  const showDate = index === 0 || 
                    formatMessageDate(message.timestamp) !== formatMessageDate(chatMessages[index - 1].timestamp);
                  const isEditing = editingMessageId === message.id;
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
                        <div className={`relative max-w-[70%] px-4 py-3 rounded-2xl ${
                          isOwn 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-100 dark:bg-neutral-700 text-slate-900 dark:text-white'
                        }`}>
                          {message.attachmentUrl && (
                            <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mb-1 text-blue-200 underline">
                              📎 Вложение
                            </a>
                          )}
                          {message.isDeleted ? (
                            <p className="italic text-slate-400 dark:text-neutral-400">Сообщение удалено</p>
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
                                className="flex-1 px-2 py-1 rounded text-black"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                autoFocus
                              />
                              <button type="submit" className="text-xs text-blue-600">Сохранить</button>
                              <button type="button" className="text-xs text-slate-400" onClick={() => setEditingMessageId(null)}>Отмена</button>
                            </form>
                          ) : (
                            <>
                              <p className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${
                                message.isSystem ? 'bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500 text-blue-800 dark:text-blue-200' : ''
                              }`}>
                                {message.content}
                                {message.isEdited && <span className="ml-2 text-xs italic">(изменено)</span>}
                              </p>
                              {isOwn && !message.isDeleted && !message.isSystem && (
                                <div className="absolute top-1 right-2 flex gap-1 opacity-70 hover:opacity-100">
                                  <button
                                    className="p-1 hover:bg-black/10 rounded"
                                    onClick={() => {
                                      setEditingMessageId(message.id);
                                      setEditValue(message.content);
                                    }}
                                    title="Редактировать"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    className="p-1 hover:bg-black/10 rounded text-red-300"
                                    onClick={() => deleteMessage(message.id)}
                                    title="Удалить"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                          <div className={`text-xs mt-2 ${
                            isOwn ? 'text-blue-100' : 'text-slate-500 dark:text-neutral-400'
                          }`}>
                            {String(formatMessageTime(message.timestamp))}
                            {/* Статус прочтения только для своих последних сообщений */}
                            {isOwn && index === chatMessages.length - 1 && (
                              <span className="ml-2">
                                {message.readBy && message.readBy.length > 1
                                  ? 'Прочитано'
                                  : 'Доставлено'}
                              </span>
                            )}
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
            {isCurrentUserBlocked ? (
              <div className="p-4 text-center text-red-500 bg-red-50 border-t border-red-200">
                Вы заблокированы этим пользователем. Отправка сообщений невозможна.
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-neutral-700">
                <div className="flex gap-3">
                  <input
                    type="file"
                    id="messages-attachment"
                    style={{ display: 'none' }}
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setAttachment(e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="p-3 text-slate-500 hover:text-slate-700 dark:hover:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
                    onClick={() => document.getElementById('messages-attachment')?.click()}
                  >
                    📎
                  </button>
                  {attachment?.name && (
                    <span className="text-xs text-slate-500 ml-2">{attachment.name}</span>
                  )}
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      if (selectedChat) setTyping(selectedChat.id);
                    }}
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
            )}
            {/* Индикатор "печатает..." */}
            {selectedChat && typingUsers[selectedChat.id] && typingUsers[selectedChat.id].length > 0 && (
              <div className="px-6 py-2 text-xs text-slate-500 dark:text-neutral-400 animate-pulse">
                {otherParticipant?.firstName} печатает...
              </div>
            )}
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
}
