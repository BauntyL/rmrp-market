import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const generateUniqueId = (): string => {
    const num1 = Math.floor(Math.random() * 900) + 100;
    const num2 = Math.floor(Math.random() * 900) + 100;
    return `${num1}-${num2}`;
  };

  const login = async (firstName: string, lastName: string, password: string): Promise<boolean> => {
    const foundUser = mockUsers.find(
      u => u.firstName === firstName && u.lastName === lastName && u.password === password
    );
    
    if (foundUser && !foundUser.isBlocked) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const register = async (firstName: string, lastName: string, password: string): Promise<boolean> => {
    const existingUser = mockUsers.find(
      u => u.firstName === firstName && u.lastName === lastName
    );
    
    if (existingUser) {
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      uniqueId: generateUniqueId(),
      firstName,
      lastName,
      password,
      role: 'user',
      createdAt: new Date(),
      isBlocked: false,
      rating: 0,
      reviewCount: 0
    };

    mockUsers.push(newUser);
    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
