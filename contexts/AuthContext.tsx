import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, profilesTable } from '../lib/db';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'administrator' | 'account_manager' | 'recruiter' | 'finance' | 'consultant';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, userData: { name: string; role: string }) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'staffaug_session_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedUserId = localStorage.getItem(SESSION_KEY);
        if (savedUserId) {
          const profile = await profilesTable.selectById(savedUserId);
          if (profile) {
            setUser(profile as Profile);
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (err: any) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    const { user: profile, error: err } = await auth.signIn(email, password);
    if (err) throw err;
    if (profile) {
      localStorage.setItem(SESSION_KEY, profile.id);
      setUser(profile as Profile);
    }
  };

  const signup = async (email: string, password: string, userData: { name: string; role: string }) => {
    setError(null);
    const { user: profile, error: err } = await auth.signUp(email, password, userData);
    if (err) throw err;
    return { user: profile, session: profile ? { user: profile } : null };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
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
