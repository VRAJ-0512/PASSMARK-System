import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';

export function useAuth(useSupabase: boolean) {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (isAuthLoading) {
        console.warn('Auth check timed out, forcing load');
        setIsAuthLoading(false);
      }
    }, 5000);

    if (!useSupabase) {
      setIsAuthLoading(false);
      clearTimeout(safetyTimeout);
      return;
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        toast.error(`Failed to verify session: ${error.message || 'Please log in again.'}`);
      }
      setSession(session);
      setIsAuthLoading(false);
      clearTimeout(safetyTimeout);
    }).catch((error: any) => {
      console.error('Failed to fetch session:', error);
      toast.error(`Network error while checking session: ${error.message || 'Unknown error'}`);
      setIsAuthLoading(false);
      clearTimeout(safetyTimeout);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [useSupabase]);

  const handleLogout = async () => {
    if (useSupabase) {
      try {
        await supabase.auth.signOut();
      } catch (err: any) {
        console.error('Logout error:', err);
      }
    }
    setSession(null);
    setUserProfile(null);
  };

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
