import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Server, Listing, User, Chat, Message, Review, Notification, AppContextType } from '../types';
import { useAuth } from './AuthContext';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  // Initialize basic state
  const [servers] = useState<Server[]>([]);
  const [listings] = useState<Listing[]>([]);
  const [users] = useState<User[]>([]);
  const [chats] = useState<Chat[]>([]);
  const [messages] = useState<Message[]>([]);
  const [reviews] = useState<Review[]>([]);
  const [notifications] = useState<Notification[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [typingUsers] = useState<{ [chatId: string]: string[] }>({});

  // Basic initialization to fix the temporal dead zone issue
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const contextValue: AppContextType = {
    servers,
    listings,
    users,
    chats,
    messages,
    reviews,
    notifications,
    selectedServer,
    setSelectedServer,
    getUserById: () => undefined,
    createChat: () => ({ id: '', participants: [], unreadCount: 0 }),
    sendMessage: async () => {},
    markMessageRead: async () => {},
    typingUsers,
    isLoading: !mounted
  };

  if (!mounted) {
    return null;
  }

  return (
    <AppContext.Provider value={contextValue} key={user?.id ?? 'no-user'}>
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
