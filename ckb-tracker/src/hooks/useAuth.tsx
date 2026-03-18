'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import type { User, Role } from '@/types';

interface AuthContextType {
  user: User | null;
  roles: Role[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  teacherLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isTeacher = roles.some(r => r.name === 'Teacher');
  const isAdmin = roles.some(r => r.name === 'Admin');
  const isAuthenticated = Boolean(user);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_uuid');
    setUser(null);
    setRoles([]);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('auth_token');
    const userUuid = localStorage.getItem('user_uuid');
    
    if (!token || !userUuid) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authApi.verifySession();
      setUser(userData.user);
      setRoles(userData.roles || []);
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    localStorage.setItem('auth_token', response.access_token);
    localStorage.setItem('user_uuid', response.user.user_uuid);
    setUser(response.user);
    setRoles(response.roles || []);
  };

  const teacherLogin = async (email: string, password: string) => {
    const response = await authApi.teacherLogin(email, password);
    localStorage.setItem('auth_token', response.access_token);
    localStorage.setItem('user_uuid', response.user.user_uuid);
    setUser(response.user);
    setRoles(response.roles || []);
  };

  useEffect(() => {
    refreshUser();
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
        login,
        teacherLogin,
        logout,
        refreshUser,
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
