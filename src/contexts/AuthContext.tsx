import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, AuthContextType } from '../types';
import { supabase } from '../lib/supabaseClient';
import bcrypt from 'bcryptjs';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('rmrp_user');
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });

  const validateSession = useCallback(async () => {
    if (!supabase) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session || null;
      
      if (session) {
        const authUser = session.user;
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();
          
        if (profile && !profile.is_blocked) {
          const mapped: User = {
            id: profile.id,
            uniqueId: profile.unique_id,
            firstName: profile.first_name,
            lastName: profile.last_name,
            password: '',
            role: profile.role,
            createdAt: new Date(profile.created_at),
            isBlocked: profile.is_blocked,
            rating: profile.rating ?? 0,
            reviewCount: profile.review_count ?? 0
          };
          setUser(mapped);
          localStorage.setItem('rmrp_user', JSON.stringify(mapped));
        } else {
          // User blocked or profile not found
          setUser(null);
          localStorage.removeItem('rmrp_user');
          if (supabase) void supabase.auth.signOut();
        }
      } else {
        // No active session
        setUser(null);
        localStorage.removeItem('rmrp_user');
      }
    } catch (error) {
      console.error('Session validation error:', error);
      setUser(null);
      localStorage.removeItem('rmrp_user');
    }
  }, []);

  // Validate session on mount and every 30 seconds
  useEffect(() => {
    validateSession();
    
    const interval = setInterval(validateSession, 30000);
    return () => clearInterval(interval);
  }, [validateSession]);

  // Keep session in sync across tabs and with Supabase Auth
  useEffect(() => {
    if (!supabase) return;

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event: string, session: { user: { id: string } } | null) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile && !profile.is_blocked) {
          const mapped: User = {
            id: profile.id,
            uniqueId: profile.unique_id,
            firstName: profile.first_name,
            lastName: profile.last_name,
            password: '',
            role: profile.role,
            createdAt: new Date(profile.created_at),
            isBlocked: profile.is_blocked,
            rating: profile.rating ?? 0,
            reviewCount: profile.review_count ?? 0
          };
          setUser(mapped);
          localStorage.setItem('rmrp_user', JSON.stringify(mapped));
        } else {
          setUser(null);
          localStorage.removeItem('rmrp_user');
        }
      } else {
        setUser(null);
        localStorage.removeItem('rmrp_user');
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const generateUniqueId = (): string => {
    const num1 = Math.floor(Math.random() * 900) + 100;
    const num2 = Math.floor(Math.random() * 900) + 100;
    return `${num1}-${num2}`;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      if (!supabase) throw new Error('Supabase not configured');

      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.user) return false;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profile || profile.is_blocked) return false;

      const mapped: User = {
        id: profile.id,
        uniqueId: profile.unique_id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        password: '',
        role: profile.role,
        createdAt: new Date(profile.created_at),
        isBlocked: profile.is_blocked,
        rating: profile.rating ?? 0,
        reviewCount: profile.review_count ?? 0
      };
      setUser(mapped);
      localStorage.setItem('rmrp_user', JSON.stringify(mapped));
      return true;
    } catch {
      return false;
    }
  };

  const register = async (email: string, firstName: string, lastName: string, password: string): Promise<boolean> => {
    if (!supabase) throw new Error('Supabase not configured');

    const fn = firstName.trim();
    const ln = lastName.trim();

    const { data: signUpRes, error: signUpErr } = await supabase.auth.signUp({
      email: email.trim(),
      password
    });
    if (signUpErr || !signUpRes.user) return false;

    // Keep password_hash to satisfy NOT NULL; though Supabase Auth stores the password securely
    const passwordHash = await bcrypt.hash(password, 10);

    const now = new Date().toISOString();
    const toInsert = {
      id: signUpRes.user.id, // keep ids aligned with auth.users
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

    const { data: profile, error } = await supabase
      .from('users')
      .insert(toInsert)
      .select('*')
      .single();

    if (error || !profile) return false;

    const newUser: User = {
      id: profile.id,
      uniqueId: profile.unique_id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      password: '',
      role: profile.role,
      createdAt: new Date(profile.created_at),
      isBlocked: profile.is_blocked,
      rating: profile.rating ?? 0,
      reviewCount: profile.review_count ?? 0
    };

    setUser(newUser);
    localStorage.setItem('rmrp_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem('rmrp_user'); } catch {}
    if (supabase) void supabase.auth.signOut();
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
