import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  TOKEN_STORAGE_KEY,
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
} from '../api/api';

const USER_STORAGE_KEY = 'blogspace_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify user session on mount
  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!savedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
          setToken(savedToken);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
        }
      } catch (err) {
        // If token is invalid or expired, clear session
        if (err?.response?.status === 401 && isMounted) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verifySession();

    // Listen for unauthorized 401 event from Axios interceptor
    const handleUnauthorized = () => {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      setToken(null);
      setUser(null);
      queryClient.clear();
    };

    window.addEventListener('blogspace:auth:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('blogspace:auth:unauthorized', handleUnauthorized);
    };
  }, [queryClient]);

  const login = useCallback(async ({ email, password }) => {
    const data = await loginUser({ email, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    queryClient.invalidateQueries();
    return data;
  }, [queryClient]);

  const register = useCallback(async ({ username, email, password }) => {
    const data = await registerUser({ username, email, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    queryClient.invalidateQueries();
    return data;
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await logoutUser();
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      setToken(null);
      setUser(null);
      queryClient.clear();
    }
  }, [token, queryClient]);

  const updateLocalUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
    updateLocalUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
