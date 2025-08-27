import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Server, User, Chat, Message, Review, Notification, Listing, AppContextType } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialChats: Chat[] = [];
const initialMessages: Message[] = [];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Initialize state
  const [servers, setServers] = useState<Server[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [chatId: string]: string[] }>({});

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      
      try {
        const [serversResult, usersResult, listingsResult] = await Promise.all([
          supabase!
            .from('servers')
            .select('*')
            .order('display_name', { ascending: true }),
          supabase!
            .from('users')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase!
            .from('listings')
            .select('*')
            .order('created_at', { ascending: false })
        ]);
        
        if (serversResult.data) {
          setServers(serversResult.data.map((s: any) => ({ 
            id: s.id, 
            name: s.name, 
            displayName: s.display_name 
          })));
        }
        
        if (usersResult.data) {
          setUsers(usersResult.data.map((u: any) => ({
            id: u.id,
            uniqueId: u.unique_id,
            firstName: u.first_name,
            lastName: u.last_name,
            password: '',
            role: u.role || 'user',
            createdAt: new Date(u.created_at),
            isBlocked: u.is_blocked || false,
            rating: u.rating || 0,
            reviewCount: u.review_count || 0
          })));
        }

        if (listingsResult.data) {
          setListings(listingsResult.data.map((l: any) => ({
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
            rejectionReason: l.rejection_reason
          })));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  // Load user-specific data
  useEffect(() => {
    if (!user || !supabase) return;

    // Subscribe to chat changes
    const chatSubscription = supabase
      .channel('chat-changes')
      .on('postgres_changes', { 
        event: 'INSERT',
        schema: 'public',
        table: 'chats'
      }, (payload: any) => {
        // Ensure the chat actually includes the current user before adding
        const participants = payload.new.participants || [];
        if (!Array.isArray(participants) || !participants.includes(user.id)) return;

        const newChat = {
          id: payload.new.id,
          participants,
          listingId: payload.new.listing_id,
          unreadCount: payload.new.unread_count || 0
        };
        setChats(prev => [...prev, newChat]);
      })
      .subscribe();

    // Subscribe to message changes
    const messageSubscription = supabase
      .channel('message-changes')
      .on('postgres_changes', {
        event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'messages'
      }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = {
            id: payload.new.id,
            chatId: payload.new.chat_id,
            senderId: payload.new.sender_id,
            content: payload.new.content,
            timestamp: new Date(payload.new.created_at),
            readBy: payload.new.read_by || []
          };
          setMessages(prev => [...prev, newMessage]);
          
          // Update unread count for the chat
          if (payload.new.sender_id !== user.id) {
            setChats(prev => prev.map(chat => 
              chat.id === payload.new.chat_id 
                ? { ...chat, unreadCount: (chat.unreadCount || 0) + 1 }
                : chat
            ));
          }
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(msg =>
            msg.id === payload.new.id
              ? {
                  ...msg,
                  content: payload.new.content,
                  isEdited: payload.new.is_edited,
                  readBy: payload.new.read_by || []
                }
              : msg
          ));
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.map(msg =>
            msg.id === payload.old.id
              ? { ...msg, content: '', isDeleted: true }
              : msg
          ));
        }
      })
      .subscribe();

    const loadUserData = async () => {
      try {
        const [notificationsResult, chatsResult] = await Promise.all([
          supabase!
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          // Do not rely on server-side array contains filter (may cause REST 400).
          // Fetch chats and filter locally for robustness across Supabase/PostgREST versions.
          supabase!
            .from('chats')
            .select('*')
        ]);
        
        if (notificationsResult.data) {
          // Filter out soft-deleted notifications (those with [DELETED] prefix)
          const activeNotifications = notificationsResult.data.filter((n: any) => 
            !n.title?.startsWith('[DELETED]') && !n.message?.startsWith('[DELETED]')
          );
          
          setNotifications(activeNotifications.map((n: any) => ({
            id: n.id,
            userId: n.user_id,
            type: n.type,
            title: n.title,
            message: n.message,
            isRead: n.is_read,
            createdAt: new Date(n.created_at),
            relatedId: n.related_id
          })));
        }
        
        if (chatsResult.data) {
          // Keep only chats where current user is a participant
          setChats(chatsResult.data
            .filter((c: any) => Array.isArray(c.participants) && c.participants.includes(user.id))
            .map((c: any) => ({
              id: c.id,
              participants: c.participants || [],
              listingId: c.listing_id,
              unreadCount: c.unread_count || 0
            })));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    void loadUserData();

    // Cleanup subscriptions on unmount
    return () => {
      chatSubscription.unsubscribe();
      messageSubscription.unsubscribe();
    };
  }, [user]);

  // App functions
  const getUserById = (id: string) => users.find(u => u.id === id);

  const blockUser = async (userId: string, duration: number) => {
    if (!supabase) return;
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const blockExpires = new Date();
    blockExpires.setDate(blockExpires.getDate() + duration);

    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, isBlocked: true, blockExpires } : u
    ));

    void supabase
      .from('users')
      .update({ is_blocked: true, block_expires: blockExpires.toISOString() })
      .eq('id', userId);
  };

  const updateUserRole = async (userId: string, role: User['role']) => {
    if (!supabase) return;
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, role } : u
    ));

    void supabase
      .from('users')
      .update({ role })
      .eq('id', userId);
  };

  const moderateListing = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    if (!supabase) return;
    const listing = listings.find(l => l.id === id);
    if (!listing) return;

    const status = action === 'approve' ? 'active' : 'rejected';

    setListings(prev => prev.map(l =>
      l.id === id ? { ...l, status, rejectionReason: reason } : l
    ));

    void supabase
      .from('listings')
      .update({ status, rejection_reason: reason })
      .eq('id', id);
  };

  const setTyping = (chatId: string) => {
    if (!user || !supabase) return;
    void supabase.channel('typing-indicator').send({
      type: 'broadcast',
      event: 'typing',
      payload: { chatId, userId: user.id }
    });
  };

  const clearTyping = (chatId: string, userId: string) => {
    setTypingUsers(prev => {
      const current = prev[chatId] || [];
      return { ...prev, [chatId]: current.filter(id => id !== userId) };
    });
  };
  
  const createChat = (participants: string[], listingId?: string) => {
    const newChat: Chat = {
      id: Date.now().toString(),
      participants,
      listingId,
      unreadCount: 0
    };
    setChats(prev => [...prev, newChat]);
    
    if (supabase) {
      void supabase
        .from('chats')
        .insert({
          participants,
          listing_id: listingId,
          unread_count: 0
        });
    }
    
    return newChat;
  };
  
  const loadChatMessages = async (chatId: string) => {
    if (!supabase) return;
    
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('timestamp', { ascending: true });
        
      if (data) {
        setMessages(prev => [
          ...prev,
          ...data.map((m: any) => ({
            id: m.id,
            chatId: m.chat_id,
            senderId: m.sender_id,
            content: m.content,
            timestamp: new Date(m.created_at),
            isEdited: m.is_edited,
            isDeleted: m.is_deleted,
            readBy: m.read_by || []
          }))
        ]);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const sendMessage = async (chatId: string, content: string) => {
    if (!user || !supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        const newMessage: Message = {
          id: data.id,
          chatId: data.chat_id,
          senderId: data.sender_id,
          content: data.content,
          timestamp: new Date(data.created_at),
          readBy: []
        };
        
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const editMessage = async (messageId: string, newContent: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, content: newContent, isEdited: true } : m
    ));
    
    if (supabase) {
      void supabase
        .from('messages')
        .update({ content: newContent, is_edited: true })
        .eq('id', messageId);
    }
  };
  
  const deleteMessage = async (messageId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, content: '', isDeleted: true } : m
    ));
    
    if (supabase) {
      void supabase
        .from('messages')
        .update({ content: '', is_deleted: true })
        .eq('id', messageId);
    }
  };
  
  const markMessageRead = async (messageId: string) => {
    if (!user) return;
    
    setMessages(prev => prev.map(m =>
      m.id === messageId
        ? { ...m, readBy: m.readBy ? [...m.readBy, user.id] : [user.id] }
        : m
    ));
    
    if (supabase) {
      void supabase
        .from('messages')
        .update({ read_by: [user.id] })
        .eq('id', messageId);
    }
  };
  
  const createReview = (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...reviewData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    setReviews(prev => [...prev, newReview]);
    
    if (supabase) {
      void supabase
        .from('reviews')
        .insert({
          to_user_id: reviewData.toUserId,
          from_user_id: reviewData.fromUserId,
          rating: reviewData.rating,
          comment: reviewData.comment
        });
    }
    
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
    
    setNotifications(prev => [...prev, notification]);
  };
  
  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
    
    if (supabase) {
      void supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    }
  };
  
  const createListing = (listing: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    const newListing: Listing = {
      ...listing,
      id: Date.now().toString(),
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setListings(prev => [...prev, newListing]);
    
    if (supabase) {
      void supabase
        .from('listings')
        .insert({
          title: listing.title,
          description: listing.description,
          price: listing.price,
          currency: listing.currency,
          category: listing.category,
          server_id: listing.serverId,
          user_id: user.id,
          images: listing.images,
          status: 'pending'
        });
    }
  };
  
  const updateListing = (id: string, updates: Partial<Listing>) => {
    setListings(prev => prev.map(l => 
      l.id === id ? { ...l, ...updates, updatedAt: new Date() } : l
    ));
    
    if (supabase) {
      void supabase
        .from('listings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
    }
  };
  
  const deleteListing = (id: string) => {
    setListings(prev => prev.filter(l => l.id !== id));
    
    if (supabase) {
      void supabase
        .from('listings')
        .delete()
        .eq('id', id);
    }
  };

  const clearNotifications = async () => {
    if (!user || !supabase) return;
    
    try {
      // First, try physical deletion from database
      const { data, error, count } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .select('*');

      if (error) {
        console.error('❌ Database deletion failed:', error);
        console.log('🔄 Using soft delete fallback (marking as [DELETED])');
        
        // Fallback: soft delete by updating notifications with [DELETED] prefix
        const userNotifications = notifications.filter(n => n.userId === user.id);
        const softDeletePromises = userNotifications.map(notification => 
          supabase
            .from('notifications')
            .update({ 
              title: `[DELETED] ${notification.title}`,
              message: `[DELETED] ${notification.message}`,
              is_read: true 
            })
            .eq('id', notification.id)
        );
        
        await Promise.all(softDeletePromises);
        console.log(`🟡 Soft deleted ${userNotifications.length} notifications`);
      } else {
        console.log(`✅ Successfully DELETED ${data?.length || count || 0} notifications from database`);
      }

      // Always clear from local state regardless of deletion method
      setNotifications(prev => prev.filter(n => n.userId !== user.id));
      
    } catch (err) {
      console.error('❌ Critical error clearing notifications:', err);
      // Even on error, clear local state to improve UX
      setNotifications(prev => prev.filter(n => n.userId !== user.id));
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user || !supabase) return;
    
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <AppContext.Provider
      value={{
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
        editMessage,
        deleteMessage,
        markMessageRead,
        createReview,
        markNotificationRead,
        typingUsers,
        blockUser,
        updateUserRole,
        moderateListing,
        setTyping,
        clearTyping,
        clearNotifications,
        markAllNotificationsRead,
        loadChatMessages
      }}
    >
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
