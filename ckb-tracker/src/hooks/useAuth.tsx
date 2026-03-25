'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Role } from '@/types';

interface AuthContextType {
  user: User | null;
  roles: Role[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  isTablet: boolean;
  login: (email: string, password: string, isTeacherLogin?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshSession: () => Promise<void>;
  csrfToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const isTeacher = roles.some(r => r.name === 'Teacher');
  const isAdmin = roles.some(r => r.name === 'Admin');
  const isTablet = roles.some(r => r.name === 'Tablet');
  const isAuthenticated = Boolean(user);

  const logout = async () => {
    try {
      await fetch('http://localhost:8000/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setRoles([]);
      setCsrfToken(null);
      localStorage.removeItem('csrf_token');
      router.push('/');
    }
  };

  const logoutAll = async () => {
    try {
      await fetch('http://localhost:8000/auth/logout-all', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      setUser(null);
      setRoles([]);
      setCsrfToken(null);
      localStorage.removeItem('csrf_token');
      router.push('/');
    }
  };

  const refreshSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setRoles(data.roles || []);
        setCsrfToken(data.csrf_token || null);
        if (data.csrf_token) {
          localStorage.setItem('csrf_token', data.csrf_token);
        }
      } else {
        const refreshResponse = await fetch('http://localhost:8000/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setUser(refreshData.user);
          setRoles(refreshData.roles || []);
          setCsrfToken(refreshData.csrf_token || null);
          if (refreshData.csrf_token) {
            localStorage.setItem('csrf_token', refreshData.csrf_token);
          }
        } else {
          setUser(null);
          setRoles([]);
          setCsrfToken(null);
          localStorage.removeItem('csrf_token');
        }
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      setUser(null);
      setRoles([]);
      setCsrfToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, isTeacherLogin = false) => {
    const endpoint = isTeacherLogin ? '/auth/teacher-login' : '/auth/login';

    const response = await fetch(`http://localhost:8000${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    setRoles(data.roles || []);
    setCsrfToken(data.csrf_token || null);
    if (data.csrf_token) {
      localStorage.setItem('csrf_token', data.csrf_token);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        isLoading,
        isAuthenticated,
        isTeacher,
        isAdmin,
        isTablet,
        login,
        logout,
        logoutAll,
        refreshSession,
        csrfToken,
      }}
    >
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
