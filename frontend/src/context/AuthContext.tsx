import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { mockCurrentUserAdmin, mockCurrentUserStudent } from '../data/mockData';
import { authService } from '../services/authService';

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
  switchRoleQuickDemo: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with default student logged in for easy review, or null
  const [user, setUser] = useState<UserProfile | null>(mockCurrentUserStudent);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMockMode, setIsMockMode] = useState<boolean>(true);

  const loginStudent = async (email: string, password = 'demoPassword123') => {
    setIsLoading(true);
    try {
      const res = await authService.loginStudent(email, password);
      setUser(res.user);
      setIsMockMode(res.isMock);
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
    setIsLoading(true);
    try {
      const res = await authService.registerStudent({
        ...params,
        password: params.password || 'demoPassword123',
      });
      setUser(res.user);
      setIsMockMode(res.isMock);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAdmin = async (email: string, password = 'demoAdminPassword123') => {
    setIsLoading(true);
    try {
      const res = await authService.loginAdmin(email, password);
      setUser(res.user);
      setIsMockMode(res.isMock);
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

  const switchRoleQuickDemo = (newRole: UserRole) => {
    if (newRole === 'admin') {
      setUser(mockCurrentUserAdmin);
    } else {
      setUser(mockCurrentUserStudent);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        isMockMode,
        loginStudent,
        registerStudent,
        loginAdmin,
        logout,
        switchRoleQuickDemo,
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
