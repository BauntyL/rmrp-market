// User types
export interface User {
  id: string;
  uniqueId: string; // Format: XXX-XXX
  firstName: string;
  lastName: string;
  password: string;
  role: 'user' | 'moderator' | 'admin';
  createdAt: Date;
  isBlocked: boolean;
  blockExpires?: Date;
  rating: number;
  reviewCount: number;
}

// Server types
export interface Server {
  id: string;
  name: string;
  displayName: string;
}

// Listing types
export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  serverId: string;
  userId: string;
  images: string[];
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'sold';
  createdAt: Date;
  updatedAt: Date;
  rejectionReason?: string;
}

// Message types
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  attachmentUrl?: string; // ссылка на файл/картинку, если есть вложение
  isEdited?: boolean;
  isDeleted?: boolean;
  isSystem?: boolean; // системное сообщение с информацией об объявлении
  readBy?: string[]; // id пользователей, которые прочитали
}

export interface Chat {
  id: string;
  participants: string[];
  listingId?: string;
  lastMessage?: Message;
  unreadCount: number;
}

// Review types
export interface Review {
  id: string;
  fromUserId: string;
  toUserId: string;
  listingId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'listing_approved' | 'listing_rejected' | 'new_message' | 'new_review';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  relatedId?: string;
}

// Context types
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (firstName: string, lastName: string, password: string) => Promise<boolean>;
  register: (firstName: string, lastName: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface AppContextType {
  servers: Server[];
  listings: Listing[];
  users: User[];
  chats: Chat[];
  messages: Message[];
  reviews: Review[];
  notifications: Notification[];
  selectedServer: string | null;
  setSelectedServer: (serverId: string | null) => void;
  getUserById: (id: string) => User | undefined;
  createListing: (listing: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  createChat: (participants: string[], listingId?: string) => Promise<Chat | null>;
  sendMessage: (chatId: string, content: string, attachment?: File | null) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markMessageRead: (messageId: string) => Promise<void>;
  createReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  moderateListing: (id: string, action: 'approve' | 'reject', reason?: string) => void;
  blockUser: (userId: string, duration: number) => void;
  updateUserRole: (userId: string, role: User['role']) => void;
  typingUsers: { [chatId: string]: string[] };
  setTyping: (chatId: string) => void;
  clearTyping: (chatId: string, userId: string) => void;
  loadChatMessages: (chatId: string) => Promise<void>;
  blockedUserIds: string[];
  myBlockedUserIds: string[];
  blockUserByMe: (userId: string) => Promise<void>;
  unblockUserByMe: (userId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
}
