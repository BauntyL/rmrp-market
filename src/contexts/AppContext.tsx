import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Server, Listing, User, Chat, Message, Review, Notification, AppContextType } from '../types';
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
  const { user } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [reviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load servers from DB
  useEffect(() => {
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
  }, []);

  // Load listings from DB
  useEffect(() => {
    const loadListings = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });
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
      }
    };
    loadListings();
  }, []);

  // Load chats from DB
  useEffect(() => {
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
  }, []);

  // Load messages from DB
  useEffect(() => {
    const loadMessages = async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('timestamp', { ascending: true });
      if (data) {
        const mapped: Message[] = data.map((m: any) => ({
          id: m.id,
          chatId: m.chat_id,
          senderId: m.sender_id,
          content: m.content,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(mapped);

        // Populate lastMessage in chats
        setChats(prev => prev.map(chat => {
          const last = mapped
            .filter(m => m.chatId === chat.id)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            .slice(-1)[0];
          return { ...chat, lastMessage: last };
        }));
      }
    };
    loadMessages();
  }, []);

  // Load notifications for current user
  useEffect(() => {
    const loadNotifications = async () => {
      if (!supabase) return;
      if (!user) {
        setNotifications([]);
        return;
      }
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) {
        const mapped: Notification[] = data.map((n: any) => ({
          id: n.id,
          userId: n.user_id,
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.is_read,
          createdAt: new Date(n.created_at),
          relatedId: n.related_id || undefined
        }));
        setNotifications(mapped);
      }
    };
    loadNotifications();
  }, [user]);

  const createListing = (listingData: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

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

  const sendMessage = (chatId: string, content: string) => {
    if (!user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      chatId,
      senderId: user.id,
      content,
      timestamp: new Date()
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
        .insert({ chat_id: chatId, sender_id: user.id, content })
        .select('*')
        .single()
        .then(({ data }: { data: any }) => {
          // Create notifications for other participants
          const chat = chats.find(c => c.id === chatId);
          const recipients = chat ? chat.participants.filter(p => p !== user.id) : [];
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

  const markNotificationRead = (id: string) => {
    if (supabase) {
      void supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, isRead: true } : notif
    ));
  };

  const moderateListing = (id: string, action: 'approve' | 'reject', reason?: string) => {
    const listing = listings.find(l => l.id === id);
    if (!listing) return;

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
  };

  const blockUser = (userId: string, duration: number) => {
    // Mock implementation
    console.log('Blocking user:', { userId, duration });
  };

  const updateUserRole = (userId: string, role: User['role']) => {
    // Mock implementation
    console.log('Updating user role:', { userId, role });
  };

  return (
    <AppContext.Provider value={{
      servers,
      listings,
      users: [],
      chats,
      messages,
      reviews,
      notifications,
      selectedServer,
      setSelectedServer,
      createListing,
      updateListing,
      deleteListing,
      createChat,
      sendMessage,
      createReview,
      markNotificationRead,
      moderateListing,
      blockUser,
      updateUserRole
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
