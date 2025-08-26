import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { supabase } from '../lib/supabaseClient';
import bcrypt from 'bcryptjs';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('rmrp_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        setUser(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('rmrp_user', JSON.stringify(user));
    else localStorage.removeItem('rmrp_user');
  }, [user]);

  const generateUniqueId = (): string => {
    const num1 = Math.floor(Math.random() * 900) + 100;
    const num2 = Math.floor(Math.random() * 900) + 100;
    return `${num1}-${num2}`;
  };

  const login = async (firstName: string, lastName: string, password: string): Promise<boolean> => {
    try {
      if (!supabase) throw new Error('Supabase not configured');

      const fn = firstName.trim();
      const ln = lastName.trim();

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('first_name', fn)
        .eq('last_name', ln)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return false;

      const passwordMatches = await bcrypt.compare(password, data.password_hash);
      if (!passwordMatches || data.is_blocked) return false;

      const loggedInUser: User = {
        id: data.id,
        uniqueId: data.unique_id,
        firstName: data.first_name,
        lastName: data.last_name,
        password: '',
        role: data.role,
        createdAt: new Date(data.created_at),
        isBlocked: data.is_blocked,
        rating: data.rating ?? 0,
        reviewCount: data.review_count ?? 0
      };

      setUser(loggedInUser);
      return true;
    } catch (e) {
      return false;
    }
  };

  const register = async (firstName: string, lastName: string, password: string): Promise<boolean> => {
    if (!supabase) throw new Error('Supabase not configured');

    const fn = firstName.trim();
    const ln = lastName.trim();

    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('first_name', fn)
      .eq('last_name', ln)
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) return false;

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const toInsert = {
      unique_id: generateUniqueId(),
      first_name: fn,
      last_name: ln,
      password_hash: passwordHash,
      role: 'user',
      is_blocked: false,
      created_at: now,
      rating: 0,
      review_count: 0
    };

    const { data, error } = await supabase
      .from('users')
      .insert(toInsert)
      .select('*')
      .single();

    if (error) throw error;

    const newUser: User = {
      id: data.id,
      uniqueId: data.unique_id,
      firstName: data.first_name,
      lastName: data.last_name,
      password: '',
      role: data.role,
      createdAt: new Date(data.created_at),
      isBlocked: data.is_blocked,
      rating: data.rating ?? 0,
      reviewCount: data.review_count ?? 0
    };

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
