import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Server, Listing, User, Chat, Message, Review, Notification, AppContextType } from '../types';
import { useAuth } from './AuthContext';

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock data
const mockServers: Server[] = [
  { id: 'arbat', name: 'arbat', displayName: 'Арбат' },
  { id: 'patriki', name: 'patriki', displayName: 'Патрики' },
  { id: 'rublevka', name: 'rublevka', displayName: 'Рублевка' },
  { id: 'tverskoy', name: 'tverskoy', displayName: 'Тверской' }
];

const mockListings: Listing[] = [
  {
    id: '1',
    title: 'BMW M5 F90',
    description: 'Продаю BMW M5 F90 в отличном состоянии. Максимальная комплектация, тюнинг.',
    price: 2500000,
    currency: '₽',
    category: 'Автомобили',
    serverId: 'arbat',
    userId: '1',
    images: ['https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg'],
    status: 'active',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '2',
    title: 'Mercedes-Benz G63 AMG',
    description: 'G-класс в топовой комплектации. Чёрный матовый цвет.',
    price: 4200000,
    currency: '₽',
    category: 'Автомобили',
    serverId: 'patriki',
    userId: '1',
    images: ['https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg'],
    status: 'active',
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19')
  }
];

const mockUsers: User[] = [
  {
    id: '1',
    uniqueId: '481-295',
    firstName: 'Иван',
    lastName: 'Петров',
    password: 'password123',
    role: 'user',
    createdAt: new Date('2024-01-15'),
    isBlocked: false,
    rating: 4.5,
    reviewCount: 12
  },
  {
    id: '2',
    uniqueId: '753-642',
    firstName: 'Админ',
    lastName: 'Системы',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
    isBlocked: false,
    rating: 5.0,
    reviewCount: 0
  }
];

const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    type: 'listing_approved',
    title: 'Объявление одобрено',
    message: 'Ваше объявление "BMW M5 F90" прошло модерацию и опубликовано',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    relatedId: '1'
  },
  {
    id: '2',
    userId: '1',
    type: 'new_message',
    title: 'Новое сообщение',
    message: 'Пользователь Админ Системы написал вам сообщение',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    relatedId: 'chat-1'
  }
];

// Create some demo chats and messages
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
  const [listings, setListings] = useState<Listing[]>(mockListings);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [reviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const createListing = (listingData: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    const newListing: Listing = {
      ...listingData,
      id: Date.now().toString(),
      userId: user.id,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setListings(prev => [newListing, ...prev]);

    // Add notification for listing creation
    const notification: Notification = {
      id: Date.now().toString(),
      userId: user.id,
      type: 'listing_approved',
      title: 'Объявление отправлено на модерацию',
      message: `Ваше объявление "${listingData.title}" отправлено на проверку`,
      isRead: false,
      createdAt: new Date(),
      relatedId: newListing.id
    };
    setNotifications(prev => [notification, ...prev]);
  };

  const updateListing = (id: string, updates: Partial<Listing>) => {
    setListings(prev => prev.map(listing => 
      listing.id === id 
        ? { ...listing, ...updates, updatedAt: new Date() }
        : listing
    ));
  };

  const deleteListing = (id: string) => {
    setListings(prev => prev.filter(listing => listing.id !== id));
  };

  const createChat = (participants: string[], listingId?: string): Chat => {
    // Check if chat already exists
    const existingChat = chats.find(chat => 
      chat.participants.length === participants.length &&
      participants.every(p => chat.participants.includes(p))
    );

    if (existingChat) {
      return existingChat;
    }

    const newChat: Chat = {
      id: Date.now().toString(),
      participants,
      listingId,
      unreadCount: 0
    };

    setChats(prev => [newChat, ...prev]);
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

    // Update chat with last message
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { 
            ...chat, 
            lastMessage: newMessage,
            unreadCount: chat.participants.includes(user.id) ? chat.unreadCount : chat.unreadCount + 1
          }
        : chat
    ));

    // Create notification for other participants
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      chat.participants.forEach(participantId => {
        if (participantId !== user.id) {
          const notification: Notification = {
            id: `${Date.now()}-${participantId}`,
            userId: participantId,
            type: 'new_message',
            title: 'Новое сообщение',
            message: `${user.firstName} ${user.lastName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            isRead: false,
            createdAt: new Date(),
            relatedId: chatId
          };
          setNotifications(prev => [notification, ...prev]);
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

    // Create notification for reviewed user
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

    // Create notification for listing owner
    const notification: Notification = {
      id: Date.now().toString(),
      userId: listing.userId,
      type: action === 'approve' ? 'listing_approved' : 'listing_rejected',
      title: action === 'approve' ? 'Объявление одобрено' : 'Объявление отклонено',
      message: action === 'approve' 
        ? `Ваше объявление "${listing.title}" прошло модерацию и опубликовано`
        : `Ваше объявление "${listing.title}" отклонено. Причина: ${reason}`,
      isRead: false,
      createdAt: new Date(),
      relatedId: id
    };
    setNotifications(prev => [notification, ...prev]);
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
      servers: mockServers,
      listings,
      users: mockUsers,
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
