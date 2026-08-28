import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';

export function useAuth(useSupabase: boolean = true) {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const getFallbackProfile = (s: Session | null): UserProfile | null => {
    if (!s?.user) return null;
    const email = s.user.email || 'user@passmark.sys';
    const role = (s.user.user_metadata?.role as 'admin' | 'user') ||
      (email.includes('operator') || email.includes('admin') ? 'admin' : 'user');
    return {
      id: s.user.id,
      email,
      role
    };
  };

  useEffect(() => {
    let isMounted = true;
    const safetyTimeout = setTimeout(() => {
      if (isMounted && isAuthLoading) {
        console.warn('Auth check timed out, forcing load');
        setIsAuthLoading(false);
      }
    }, 4000);

    if (!isSupabaseConfigured) {
      if (isMounted) {
        setIsAuthLoading(false);
      }
      clearTimeout(safetyTimeout);
      return;
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (error) {
        console.error('Session error:', error);
      }
      setSession(session);
      if (session?.user) {
        setUserProfile(prev => prev || getFallbackProfile(session));
      }
      setIsAuthLoading(false);
      clearTimeout(safetyTimeout);
    }).catch((error: any) => {
      if (!isMounted) return;
      console.error('Failed to fetch session:', error);
      setIsAuthLoading(false);
      clearTimeout(safetyTimeout);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      if (event === 'SIGNED_OUT' || !newSession) {
        setSession(null);
        setUserProfile(null);
      } else if (newSession?.user) {
        setUserProfile(prev => prev || getFallbackProfile(newSession));
      }
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut().catch(err => console.warn('Supabase signOut error:', err));
      }
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setSession(null);
      setUserProfile(null);
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) {
        console.warn('Could not clear local storage tokens:', e);
      }
      toast.success('Signed out successfully');
    }
  }, []);

  return {
    session,
    userProfile,
    setUserProfile,
    isAuthLoading,
    setIsAuthLoading,
    handleLogout,
    isSupabaseConfigured
  };
}

