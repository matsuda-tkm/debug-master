import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import {
  AuthRole,
  buildBasicAuthHeader,
  clearStoredAuth,
  getStoredAuthHeader,
  getStoredRole,
  setStoredAuth,
} from '../services/authStorage';

interface AuthContextValue {
  isAuthenticated: boolean;
  isAdmin: boolean;
  role: AuthRole | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  getAuthHeader: () => string | null;
}

interface AuthMeResponse {
  role?: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AuthRole | null>(() => getStoredRole());
  const [authHeader, setAuthHeader] = useState<string | null>(() => getStoredAuthHeader());

  const logout = useCallback(() => {
    clearStoredAuth();
    setRole(null);
    setAuthHeader(null);
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      const basicAuthHeader = buildBasicAuthHeader(username, password);

      try {
        const response = await fetch(API_ENDPOINTS.AUTH_ME, {
          method: 'GET',
          headers: {
            Authorization: basicAuthHeader,
          },
        });

        if (!response.ok) {
          logout();
          return false;
        }

        const data = (await response.json()) as AuthMeResponse;
        if (data.role !== 'user' && data.role !== 'admin') {
          logout();
          return false;
        }

        setStoredAuth(basicAuthHeader, data.role);
        setAuthHeader(basicAuthHeader);
        setRole(data.role);
        return true;
      } catch (error) {
        console.error('Login failed:', error);
        logout();
        return false;
      }
    },
    [logout]
  );

  const getAuthHeader = useCallback((): string | null => authHeader, [authHeader]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(authHeader && role),
      isAdmin: role === 'admin',
      role,
      login,
      logout,
      getAuthHeader,
    }),
    [authHeader, role, login, logout, getAuthHeader]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
