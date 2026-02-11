'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    // Supabase 클라이언트가 없으면 로딩만 false로 설정
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes + sync cookies for server-side
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // 쿠키 동기화: 서버 사이드 createClient()가 이 쿠키를 읽음
        if (session) {
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        } else {
          document.cookie = 'sb-access-token=; path=/; max-age=0';
          document.cookie = 'sb-refresh-token=; path=/; max-age=0';
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const supabase = createBrowserClient();
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ error?: string }> => {
    const supabase = createBrowserClient();
    if (!supabase) return { error: '서비스 연결에 실패했습니다.' };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signUp = async (email: string, password: string): Promise<{ error?: string }> => {
    const supabase = createBrowserClient();
    if (!supabase) return { error: '서비스 연결에 실패했습니다.' };

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    const supabase = createBrowserClient();
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    // 쿠키 삭제
    document.cookie = 'sb-access-token=; path=/; max-age=0';
    document.cookie = 'sb-refresh-token=; path=/; max-age=0';

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signInWithEmail, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}








