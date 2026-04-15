'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

import { getUserById } from '@/lib/db';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/** Map a Supabase session to the app-level User type */
function sessionToUser(session: Session): User {
  const meta = session.user.user_metadata ?? {};
  return {
    id: session.user.id,
    name: meta.full_name ?? meta.name ?? session.user.email?.split('@')[0] ?? 'Пользователь',
    email: session.user.email ?? '',
    avatarUrl: meta.avatar_url ?? meta.picture ?? '',
    bio: '',
    role: 'user',
    stats: { publications: 0, reviews: 0, avgRating: 0, followers: 0, awards: 0 },
    joinedAt: session.user.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  };
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount & listen for auth changes
  useEffect(() => {
    async function loadProfile(session: Session | null) {
      if (!session) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Try to fetch custom profile with correct role
      const profile = await getUserById(session.user.id);
      
      if (profile) {
        setUser(profile);
      } else {
        // Fallback to basic session info if profile doesn't exist yet
        setUser(sessionToUser(session));
      }
      setIsLoading(false);
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session);
    });

    // Listen for login / logout / token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        loadProfile(session);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return !error;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    return !error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
