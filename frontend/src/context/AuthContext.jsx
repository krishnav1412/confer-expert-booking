import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import { setStoredToken, getStoredToken } from '../api/client';
import { disconnectSocket } from '../sockets/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(getStoredToken() ? 'loading' : 'unauthenticated');
  const queryClient = useQueryClient();
  const clearingSessionRef = useRef(false);

  // On mount, hydrate user if a token is present
  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const token = getStoredToken();
      if (!token) {
        setStatus('unauthenticated');
        return;
      }
      try {
        const fresh = await authApi.fetchMe();
        if (!cancelled) {
          setUser(fresh);
          setStatus('authenticated');
        }
      } catch {
        if (!cancelled) {
          setStoredToken(null);
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for 401 from any API call and clear session locally
  useEffect(() => {
    const onUnauthorized = () => {
      if (clearingSessionRef.current) return;
      clearingSessionRef.current = true;
      setUser(null);
      setStatus('unauthenticated');
      queryClient.clear();
      disconnectSocket();
      window.setTimeout(() => {
        clearingSessionRef.current = false;
      }, 500);
    };
    window.addEventListener('confer:unauthorized', onUnauthorized);
    return () => window.removeEventListener('confer:unauthorized', onUnauthorized);
  }, [queryClient]);

  const login = useCallback(
    async (credentials) => {
      const result = await authApi.login(credentials);
      setStoredToken(result.token);
      setUser(result.user);
      setStatus('authenticated');
      queryClient.clear();
      return result.user;
    },
    [queryClient]
  );

  const signup = useCallback(
    async (payload) => {
      const result = await authApi.signup(payload);
      setStoredToken(result.token);
      setUser(result.user);
      setStatus('authenticated');
      queryClient.clear();
      return result.user;
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setStoredToken(null);
    setUser(null);
    setStatus('unauthenticated');
    queryClient.clear();
    disconnectSocket();
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await authApi.fetchMe();
      setUser(fresh);
      return fresh;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated' && !!user,
      isLoading: status === 'loading',
      isExpert: !!user && user.role === 'expert' && user.isExpertApproved,
      isAdmin: !!user && user.role === 'admin',
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, status, login, signup, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
