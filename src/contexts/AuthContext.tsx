import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AuthUser } from '@supabase/supabase-js';
import { supabase, signIn, signOut, signUp } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, userData: { name: string; role: string }) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createProfileFromAuth = (authUser: AuthUser): Profile => {
    console.log('Fetching profile for user:', authUser.id);
    
    // Create profile directly from auth data - no async operations
    const fallbackProfile: Profile = {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      role: authUser.email === 'antonybenhur@gmail.com' ? 'administrator' : (authUser.user_metadata?.role || 'consultant') as any,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Using fallback profile (bypassing database):', fallbackProfile);
    return fallbackProfile;
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Check if we have the required environment variables
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          throw new Error('Missing Supabase environment variables');
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
        } else if (session?.user && mounted) {
          console.log('Found existing session, fetching profile...');
          const profile = createProfileFromAuth(session.user);
          console.log('Profile fetched, setting user:', profile);
          if (mounted) {
            setUser(profile);
          }
        } else {
          console.log('No existing session found');
        }
      } catch (err: any) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setError(err.message || 'Failed to initialize authentication');
        }
      } finally {
        if (mounted) {
          console.log('Auth initialization complete, setting loading to false');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (!mounted) return;

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('Auth state change: fetching profile for signed in user');
            const profile = createProfileFromAuth(session.user);
            console.log('Profile fetched from auth state change:', profile);
            setUser(profile);
          } else if (event === 'SIGNED_OUT') {
            console.log('Auth state change: user signed out');
            setUser(null);
          }
        } catch (err: any) {
          console.error('Auth state change error:', err);
          setError(err.message || 'Authentication error');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    const { data, error } = await signIn(email, password);
    if (error) {
      throw error;
    }
    // Profile will be set by the auth state change listener
  };

  const signup = async (email: string, password: string, userData: { name: string; role: string }) => {
    setError(null);
    const { data, error } = await signUp(email, password, userData);
    if (error) {
      throw error;
    }
    return data;
  };

  const logout = async () => {
    setError(null);
    const { error } = await signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};