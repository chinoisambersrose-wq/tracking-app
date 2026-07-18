import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { api, setAccessToken } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'AGENT';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: string;
  organizationId: string | null;
  whatsappPhone?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAccessToken(data.accessToken);
      setUser(data.user);
      connectSocket({ token: data.accessToken });
      return data.user as AuthUser;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => undefined);
    setAccessToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
