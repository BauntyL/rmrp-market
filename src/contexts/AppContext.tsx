import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Server, Listing, User, Chat, Message, Review, Notification, AppContextType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext<AppContextType | undefined>(undefined);

// Create some demo chats and messages (kept only as fallback; DB will be source of truth)
const mockChats: Chat[] = [
  {
    id: 'chat-1',
    participants: ['1', '2'],
    listingId: '1',
    unreadCount: 1,
    lastMessage: {
      id: 'msg-2',
      chatId: 'chat-1',
      senderId: '1',
      content: 'Здравствуйте! Конечно, давайте обсудим детали.',
      timestamp: new Date(Date.now() - 1000 * 60 * 25)
    }
  }
];

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    chatId: 'chat-1',
    senderId: '2',
    content: 'Привет! Интересует ваш BMW M5. Можно встретиться?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30)
  },
  {
    id: 'msg-2',
    chatId: 'chat-1',
    senderId: '1',
    content: 'Здравствуйте! Конечно, давайте обсудим детали.',
    timestamp: new Date(Date.now() - 1000 * 60 * 25)
  }
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Список id заблокированных текущим пользователем
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  // Загрузка заблокированных пользователей из Supabase
  useEffect(() => {
    const loadBlocked = async () => {
      if (!user || !supabase) return;
      const { data } = await supabase.from('user_blocks').select('blocked_id').eq('blocker_id', user.id);
      if (data) {
        setBlockedUserIds(data.map((row: any) => row.blocked_id));
      }
    };
    loadBlocked();
  }, [user]);
  // Блокировка пользователя текущим пользователем (локально и в Supabase)
  const blockUserByMe = async (userId: string) => {
    if (!user) return;
    // Можно хранить список заблокированных id в localStorage или в отдельной таблице supabase (user_blocks)
    // Здесь пример с Supabase (user_blocks: blocker_id, blocked_id)
    if (supabase) {
      await supabase.from('user_blocks').insert({ blocker_id: user.id, blocked_id: userId });
    }
  };
  // Отметить сообщение как прочитанное
  const markMessageRead = async (messageId: string) => {
    if (!user) return;
    setMessages(prev => prev.map(m =>
      m.id === messageId
        ? { ...m, readBy: m.readBy ? Array.from(new Set([...m.readBy, user.id])) : [user.id] }
        : m
    ));
    if (supabase) {
      // Обновляем поле read_by (массив id) в БД
      await supabase.from('messages').update({ read_by: [user.id] }).eq('id', messageId);
    }
  };
  // Редактирование сообщения
  const editMessage = async (messageId: string, newContent: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: newContent, isEdited: true } : m));
    if (supabase) {
      await supabase.from('messages').update({ content: newContent, is_edited: true }).eq('id', messageId);
    }
  };

  // Удаление сообщения (soft-delete)
  const deleteMessage = async (messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: '', isDeleted: true } : m));
    if (supabase) {
      await supabase.from('messages').update({ content: '', is_deleted: true }).eq('id', messageId);
    }
  };
  // Индикатор "печатает..."
  const [typingUsers, setTypingUsers] = useState<{ [chatId: string]: string[] }>({});

  // Подписка на события "печатает..." через Supabase Realtime
  useEffect(() => {
    if (!user || !supabase) return;
    const channel = supabase.channel('typing-indicator');
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      const { chatId, userId } = payload.payload;
      setTypingUsers(prev => {
        const current = prev[chatId] || [];
        if (!current.includes(userId)) {
          return { ...prev, [chatId]: [...current, userId] };
        }
        return prev;
      });
      setTimeout(() => {
        setTypingUsers(prev => {
          const current = prev[chatId] || [];
          return { ...prev, [chatId]: current.filter(id => id !== userId) };
        });
      }, 3000);
    });
    channel.subscribe();
    return () => { channel.unsubscribe(); };
  }, [user]);

  // Метод для отправки события "печатает..."
  const setTyping = (chatId: string) => {
    if (!user || !supabase) return;
    supabase.channel('typing-indicator').send({
      type: 'broadcast',
      event: 'typing',
      payload: { chatId, userId: user.id }
    });
  };

  // Метод для ручного сброса индикатора (опционально)
  const clearTyping = (chatId: string, userId: string) => {
    setTypingUsers(prev => {
      const current = prev[chatId] || [];
      return { ...prev, [chatId]: current.filter(id => id !== userId) };
    });
  };
  const { user } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [reviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Добавляем состояние загрузки

  // Load servers from DB (only once)
  useEffect(() => {
    if (isInitialized) return;
    const loadServers = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('servers')
        .select('*')
        .order('display_name', { ascending: true });
      if (data) {
        const mapped: Server[] = data.map((s: any) => ({ id: s.id, name: s.name, displayName: s.display_name }));
        setServers(mapped);
      }
    };
    loadServers();
  }, [isInitialized]);

  // Load chats from DB (only once)
  useEffect(() => {
    if (isInitialized) return;
    const loadChats = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('chats')
        .select('*')
        .order('id', { ascending: false });
      if (data) {
        const mapped: Chat[] = data.map((c: any) => ({
          id: c.id,
          participants: c.participants || [],
          listingId: c.listing_id || undefined,
          unreadCount: c.unread_count || 0
        }));
        setChats(mapped);
      }
    };
    loadChats();
  }, [isInitialized]);

  // Load users from DB (only once) 
  useEffect(() => {
    if (isInitialized) return;
    const loadUsers = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        const mapped: User[] = data.map((u: any) => ({
          id: u.id,
          uniqueId: u.unique_id,
          firstName: u.first_name,
          lastName: u.last_name,
          password: '', // Не загружаем пароль из соображений безопасности
          role: u.role || 'user',
          createdAt: new Date(u.created_at),
          isBlocked: u.is_blocked || false,
          blockExpires: u.block_expires ? new Date(u.block_expires) : undefined,
          rating: u.rating || 0,
          reviewCount: u.review_count || 0
        }));
        setUsers(mapped);
        console.log('Users loaded from database:', mapped.length);
      }
    };
    loadUsers();
  }, [isInitialized]);

  // Load messages from DB (only once)
  useEffect(() => {
    if (isInitialized) return;
    const loadMessages = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('messages')
        .select('*')
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }
      
      console.log('Raw notification data from database:', data);
      
      if (data) {
        const mapped: Notification[] = data
          .filter((n: any) => n.title !== '[DELETED]' && n.message !== '[DELETED]') // Фильтруем удалённые уведомления
          .map((n: any) => ({
            id: n.id,
            userId: n.user_id,
            type: n.type,
            title: n.title,
            message: n.message,
            isRead: n.is_read,
            createdAt: new Date(n.created_at),
            relatedId: n.related_id || undefined
          }));
        
        console.log('Mapped notifications (after filtering deleted):', mapped);
        setNotifications(mapped);
        console.log('Notifications loaded from database (visible):', mapped.length);
      } else {
        console.log('No notification data received from database');
        setNotifications([]);
      }
    };
    
    loadNotifications();
    
    // Настраиваем подписку на изменения в таблице notifications
    const notificationsSubscription = supabase
      ?.channel('notifications-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Received notification change:', payload);
          // При любых изменениях перезагружаем уведомления
          loadNotifications();
        })
      .subscribe();
      
    // Отписываемся при размонтировании компонента
    return () => {
      console.log('Unsubscribing from notifications changes');
      notificationsSubscription?.unsubscribe();
    };
  }, [isInitialized, user]);

  // Mark as initialized after first load
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const createListing = (listingData: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    // Check if listing already exists to prevent duplicates
    const existingListing = listings.find(l => 
      l.title === listingData.title && 
      l.userId === user.id && 
      l.status === 'pending'
    );
    if (existingListing) return;

    const optimistic: Listing = {
      ...listingData,
      id: Date.now().toString(),
      userId: user.id,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setListings(prev => [optimistic, ...prev]);

    if (supabase) {
      void supabase
        .from('listings')
        .insert({
          title: listingData.title,
          description: listingData.description,
          price: listingData.price,
          currency: listingData.currency,
          category: listingData.category,
          server_id: listingData.serverId,
          user_id: user.id,
          images: listingData.images,
          status: 'pending'
        })
        .select('*')
        .single()
        .then(({ data }: { data: any }) => {
          if (!data) return;
          const saved: Listing = {
            id: data.id,
            title: data.title,
            description: data.description,
            price: Number(data.price),
            currency: data.currency,
            category: data.category,
            serverId: data.server_id,
            userId: data.user_id,
            images: Array.isArray(data.images) ? data.images : [],
            status: data.status,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            rejectionReason: data.rejection_reason || undefined
          };
          setListings(prev => [saved, ...prev.filter(l => l.id !== optimistic.id)]);

          // Persist notification
          void supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type: 'listing_approved',
              title: 'Объявление отправлено на модерацию',
              message: `Ваше объявление "${listingData.title}" отправлено на проверку`,
              is_read: false,
              related_id: saved.id
            })
            .select('*')
            .single()
            .then(({ data: notifData }: { data: any }) => {
              if (!notifData) return;
              const n: Notification = {
                id: notifData.id,
                userId: notifData.user_id,
                type: notifData.type,
                title: notifData.title,
                message: notifData.message,
                isRead: notifData.is_read,
                createdAt: new Date(notifData.created_at),
                relatedId: notifData.related_id || undefined
              };
              setNotifications(prev => [n, ...prev]);
            });
        });
    }
  };

  const updateListing = (id: string, updates: Partial<Listing>) => {
    setListings(prev => prev.map(listing => 
      listing.id === id 
        ? { ...listing, ...updates, updatedAt: new Date() }
        : listing
    ));

    if (supabase) {
      const toUpdate: any = {};
      if (updates.title !== undefined) toUpdate.title = updates.title;
      if (updates.description !== undefined) toUpdate.description = updates.description;
      if (updates.price !== undefined) toUpdate.price = updates.price as number;
      if (updates.currency !== undefined) toUpdate.currency = updates.currency;
      if (updates.category !== undefined) toUpdate.category = updates.category;
      if (updates.serverId !== undefined) toUpdate.server_id = updates.serverId;
      if (updates.images !== undefined) toUpdate.images = updates.images;
      if (updates.status !== undefined) toUpdate.status = updates.status;
      void supabase
        .from('listings')
        .update({ ...toUpdate, updated_at: new Date().toISOString() })
        .eq('id', id);
    }
  };

  const deleteListing = (id: string) => {
    setListings(prev => prev.filter(listing => listing.id !== id));
    if (supabase) {
      void supabase.from('listings').delete().eq('id', id);
    }
  };

  const createChat = (participants: string[], listingId?: string): Chat => {
    const newChat: Chat = {
      id: Date.now().toString(),
      participants,
      listingId,
      unreadCount: 0
    };
    setChats(prev => [newChat, ...prev]);

    if (supabase) {
      void supabase
        .from('chats')
        .insert({ participants, listing_id: listingId || null, unread_count: 0 })
        .select('*')
        .single()
        .then();
    }

    return newChat;
  };

  const sendMessage = async (chatId: string, content: string, attachment?: File | null) => {
    if (!user) return;

    let attachmentUrl: string | undefined = undefined;
    if (attachment && supabase) {
      const fileExt = attachment.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('chat-attachments').upload(fileName, attachment);
      if (uploadError) {
        alert('Ошибка загрузки файла: ' + uploadError.message);
        return;
      }
      attachmentUrl = supabase.storage.from('chat-attachments').getPublicUrl(fileName).data.publicUrl;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      chatId,
      senderId: user.id,
      content,
      timestamp: new Date(),
      ...(attachmentUrl ? { attachmentUrl } : {})
    };

    setMessages(prev => [...prev, newMessage]);
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { 
            ...chat, 
            lastMessage: newMessage,
            unreadCount: chat.participants.includes(user.id) ? chat.unreadCount : chat.unreadCount + 1
          }
        : chat
    ));

    if (supabase) {
      void supabase
        .from('messages')
        .insert({ chat_id: chatId, sender_id: user.id, content, attachment_url: attachmentUrl })
        .select('*')
        .single()
        .then(({ data }: { data: any }) => {
          // Получаем участников чата из свежего состояния
          let chatParticipants: string[] = [];
          const chat = chats.find(c => c.id === chatId);
          if (chat && Array.isArray(chat.participants)) {
            chatParticipants = chat.participants;
          } else if (data && data.participants) {
            chatParticipants = data.participants;
          }
          // Только другие участники, кроме отправителя
          const recipients = chatParticipants.filter(p => p !== user.id);
          if (recipients.length > 0) {
            const inserts = recipients.map(r => ({
              user_id: r,
              type: 'new_message',
              title: 'Новое сообщение',
              message: `${user.firstName} ${user.lastName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
              is_read: false,
              related_id: chatId
            }));
            void supabase
              .from('notifications')
              .insert(inserts)
              .select('*')
              .then(({ data: notifRows }: { data: any[] | null }) => {
                if (notifRows && notifRows.length) {
                  const mapped = notifRows.map((n: any) => ({
                    id: n.id,
                    userId: n.user_id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    isRead: n.is_read,
                    createdAt: new Date(n.created_at),
                    relatedId: n.related_id || undefined
                  }));
                  setNotifications(prev => [...mapped, ...prev]);
                }
              });
          }
        });
    }
  };

  const createReview = (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...reviewData,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    const notification: Notification = {
      id: Date.now().toString(),
      userId: reviewData.toUserId,
      type: 'new_review',
      title: 'Новый отзыв',
      message: `Вы получили новый отзыв с оценкой ${reviewData.rating}/5`,
      isRead: false,
      createdAt: new Date(),
      relatedId: newReview.id
    };
    setNotifications(prev => [notification, ...prev]);
  };

  const markNotificationRead = async (id: string) => {
    if (!supabase) return;
    
    try {
      // Обновляем статус в базе данных
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
        
      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }
      
      // Обновляем состояние в React
      setNotifications(prev => prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      ));
      
      console.log(`Notification ${id} marked as read`);
    } catch (error) {
      console.error('Error in markNotificationRead:', error);
    }
  };

  const moderateListing = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    const listing = listings.find(l => l.id === id);
    if (!listing || !supabase) return;

    try {
      // Обновляем статус в базе данных
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: action === 'approve' ? 'active' : 'rejected',
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) {
        console.error('Error updating listing status:', error);
        return;
      }
      
      console.log(`Listing ${id} status updated to ${action === 'approve' ? 'active' : 'rejected'}`);
      
      // Обновляем состояние в React
      setListings(prev => prev.map(listing => 
        listing.id === id 
          ? { 
              ...listing, 
              status: action === 'approve' ? 'active' : 'rejected',
              rejectionReason: reason,
              updatedAt: new Date()
            }
          : listing
      ));
      
      // Перезагружаем объявления из базы данных для синхронизации
      await loadListingsFromDB();
      
      // Создаем уведомление о модерации
      const createModerationNotification = () => {
        if (!supabase) return;
        const notif = {
          user_id: listing.userId,
          type: action === 'approve' ? 'listing_approved' : 'listing_rejected',
          title: action === 'approve' ? 'Объявление одобрено' : 'Объявление отклонено',
          message: action === 'approve' 
            ? `Ваше объявление "${listing.title}" прошло модерацию и опубликовано`
            : `Ваше объявление "${listing.title}" отклонено. Причина: ${reason || ''}`,
          is_read: false,
          related_id: id
        };
        void supabase
          .from('notifications')
          .insert(notif)
          .select('*')
          .single()
          .then(({ data }: { data: any }) => {
            if (!data) return;
            const n: Notification = {
              id: data.id,
              userId: data.user_id,
              type: data.type,
              title: data.title,
              message: data.message,
              isRead: data.is_read,
              createdAt: new Date(data.created_at),
              relatedId: data.related_id || undefined
            };
            setNotifications(prev => [n, ...prev]);
          });
      };

      createModerationNotification();
    } catch (error) {
      console.error('Error in moderateListing:', error);
    }
  };
  
  // Функция для загрузки объявлений из базы данных
  const loadListingsFromDB = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error loading listings:', error);
        return;
      }
      
      if (data) {
        const mapped: Listing[] = data.map((l: any) => ({
          id: l.id,
          title: l.title,
          description: l.description,
          price: Number(l.price),
          currency: l.currency,
          category: l.category,
          serverId: l.server_id,
          userId: l.user_id,
          images: Array.isArray(l.images) ? l.images : [],
          status: l.status,
          createdAt: new Date(l.created_at),
          updatedAt: new Date(l.updated_at),
          rejectionReason: l.rejection_reason || undefined
        }));
        setListings(mapped);
        console.log('Listings reloaded from database');
      }
    } catch (error) {
      console.error('Error in loadListingsFromDB:', error);
    }
  };

  const blockUser = (userId: string, duration: number) => {
    // Mock implementation
    console.log('Blocking user:', { userId, duration });
  };

  const updateUserRole = (userId: string, role: User['role']) => {
    // Mock implementation
    console.log('Updating user role:', { userId, role });
  };

  // Функция для массового отмечания уведомлений как прочитанных
  const markAllNotificationsRead = async () => {
    if (!supabase || !user) return;
    
    try {
      // Получаем все непрочитанные уведомления пользователя
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      if (error) {
        console.error('Error getting unread notifications:', error);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No unread notifications to mark');
        return;
      }
      
      // Обновляем все непрочитанные уведомления
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      if (updateError) {
        console.error('Error marking all notifications as read:', updateError);
        return;
      }
      
      // Обновляем состояние в React
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      
      console.log(`Marked ${data.length} notifications as read`);
    } catch (error) {
      console.error('Error in markAllNotificationsRead:', error);
    }
  };
  
  // Функция для очистки всех уведомлений пользователя
  const clearNotifications = async () => {
    console.log('clearNotifications called');
    
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return;
    }
    
    if (!user) {
      console.error('User is not authenticated');
      return;
    }
    
    console.log('Attempting to clear notifications for user:', user.id);
    console.log('Current notifications count:', notifications.length);
    
    try {
      // Сначала попробуем физическое удаление (DELETE)
      console.log('Attempting physical DELETE from database...');
      
      const { error, count } = await supabase
        .from('notifications')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
        .neq('title', '[DELETED]'); // Исключаем уже помеченные как удалённые
        
      console.log('DELETE query result:', { error, count });
        
      if (error) {
        console.error('Physical DELETE failed:', error);
        // Fallback к мягкому удалению
        await fallbackToSoftDelete();
        return;
      }
      
      if (count && count > 0) {
        console.log(`✅ Successfully DELETED ${count} notifications from database`);
      } else {
        console.warn('DELETE returned 0 rows. Trying soft delete as fallback...');
        await fallbackToSoftDelete();
      }
      
      // Очищаем уведомления в состоянии React
      setNotifications([]);
      console.log('All notifications cleared from state and database');
      
    } catch (error) {
      console.error('Exception in clearNotifications:', error);
      // Fallback к мягкому удалению
      await fallbackToSoftDelete();
    }
  };
  
  // Функция мягкого удаления (fallback)
  const fallbackToSoftDelete = async () => {
    console.log('🔄 Falling back to soft delete (marking as [DELETED])');
    
    try {
      const { error: updateError, count: updateCount } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          title: '[DELETED]',
          message: '[DELETED]'
        })
        .eq('user_id', user!.id)
        .neq('title', '[DELETED]'); // Не обновляем уже удалённые
        
      if (updateError) {
        console.error('❌ Soft delete also failed:', updateError);
        return;
      }
      
      if (updateCount && updateCount > 0) {
        console.log(`✅ Successfully marked ${updateCount} notifications as [DELETED]`);
      }
      
      // Очищаем уведомления в состоянии React
      setNotifications([]);
      
    } catch (error) {
      console.error('Exception in fallbackToSoftDelete:', error);
    }
  };

  // Функция для получения пользователя по ID
  const getUserById = (id: string): User | undefined => {
    return users.find(user => user.id === id);
  };

  return (
    <AppContext.Provider value={{
      servers,
      listings,
      users,
      chats,
      messages,
      reviews,
      notifications,
      selectedServer,
      setSelectedServer,
      getUserById,
      createListing,
      updateListing,
      deleteListing,
      createChat,
      sendMessage,
      createReview,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      moderateListing,
      blockUser,
      updateUserRole,
      typingUsers,
      setTyping,
      clearTyping
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
