import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ApiError } from '../api';
import { User } from './types';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/authApi';

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      const currentUser = await authApi.me();
      setUser(currentUser);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        setError(null);
        return;
      }

      const message = err instanceof Error ? err.message : 'Auth refresh failed';
      setError(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);

    try {
      const currentUser = await authApi.login(email, password);
      setUser(currentUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setError(null);
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }

  return context;
}
