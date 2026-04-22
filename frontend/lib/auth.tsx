'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { authApi } from './api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'staff' | 'accountant' | 'viewer';
  tenantId: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, tenantSlug: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isAccountant: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = Cookies.get('zamerp_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string, tenantSlug: string) => {
    const res = await authApi.login({ email, password, tenantSlug });
    Cookies.set('zamerp_token', res.access_token, { expires: 1 });
    Cookies.set('zamerp_user', JSON.stringify(res.user), { expires: 1 });
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    Cookies.remove('zamerp_token');
    Cookies.remove('zamerp_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAdmin: user?.role === 'admin',
      isAccountant: user?.role === 'admin' || user?.role === 'accountant',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
