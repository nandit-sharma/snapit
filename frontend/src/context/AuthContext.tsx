
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

import { UserProfile, UserRole } from '../types';
import { authService } from '../services/authService';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isMockMode: boolean;
  loginStudent: (email: string, password?: string) => Promise<void>;
  registerStudent: (params: {
    name: string;
    email: string;
    password?: string;
    rollNumber: string;
    department: string;
    hostelBlock?: string;
    roomNumber?: string;
  }) => Promise<void>;
  loginAdmin: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMockMode] = useState(false);

  useEffect(() => {
    let mounted = true;

    const restore = async () => {
      try {
        const result = await authService.restoreSession();

        if (mounted) {
          setUser(result?.user ?? null);
        }
      } catch (error) {
        console.error('Session restoration failed:', error);

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    restore();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginStudent = async (
    email: string,
    password?: string
  ) => {
    if (!password) {
      throw new Error('Please enter your password.');
    }

    setIsLoading(true);

    try {
      const result = await authService.loginStudent(email, password);
      setUser(result.user);

    } finally {
      setIsLoading(false);
    }
  };

  const registerStudent = async (params: {
    name: string;
    email: string;
    password?: string;
    rollNumber: string;
    department: string;
    hostelBlock?: string;
    roomNumber?: string;
  }) => {
    if (!params.password) {
      throw new Error('Please provide a password.');
    }

    setIsLoading(true);

    try {
      const result = await authService.registerStudent({
        ...params,
        password: params.password,
      });

      setUser(result.user);

      // TEMPORARY DEBUG: Print newly registered student access token.
    } finally {
      setIsLoading(false);
    }
  };

  const loginAdmin = async (
    email: string,
    password?: string
  ) => {
    if (!password) {
      throw new Error('Please enter your password.');
    }

    setIsLoading(true);

    try {
      const result = await authService.loginAdmin(email, password);
      setUser(result.user);

      // TEMPORARY DEBUG: Print admin access token.
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isLoading,
        isMockMode,
        loginStudent,
        registerStudent,
        loginAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
