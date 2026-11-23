import { UserProfile, UserRole } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface AuthResponse {
  user: UserProfile;
  token?: string;
  isMock: boolean;
}

interface BackendUser {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: UserRole;
  roll_number?: string;
  department?: string;
  hostel_block?: string;
  room_number?: string;
}

async function fetchBackendUser(token: string): Promise<UserProfile> {
  if (!API_URL) {
    throw new Error('Backend API URL is not configured.');
  }

  const response = await fetch(`${API_URL.replace(/\/$/, '')}/auth/me`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || 'Unable to verify user with backend.');
  }

  const backendUser = data as BackendUser;

  if (!['student', 'admin'].includes(backendUser.role)) {
    throw new Error('Invalid user role.');
  }

  return {
    id: backendUser.id,
    email: backendUser.email,
    name: backendUser.name,
    role: backendUser.role,
    rollNumber: backendUser.roll_number,
    department: backendUser.department,
    hostelBlock: backendUser.hostel_block,
    roomNumber: backendUser.room_number,
  };
}

async function getAuthenticatedUser(): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw new Error(error.message);

  const token = data.session?.access_token;

  if (!token) {
    throw new Error('No active session. Please log in again.');
  }

  const user = await fetchBackendUser(token);

  return {
    user,
    token,
    isMock: false,
  };
}

export const authService = {
  async loginStudent(email: string, password: string): Promise<AuthResponse> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    const result = await getAuthenticatedUser();

    if (result.user.role !== 'student') {
      await supabase.auth.signOut();
      throw new Error('This account is not registered as a student.');
    }

    return result;
  },

  async registerStudent(params: {
    name: string;
    email: string;
    password: string;
    rollNumber: string;
    department: string;
    hostelBlock?: string;
    roomNumber?: string;
  }): Promise<AuthResponse> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          name: params.name,
          role: 'student',
          roll_number: params.rollNumber,
          department: params.department,
          hostel_block: params.hostelBlock,
          room_number: params.roomNumber,
        },
      },
    });

    if (error) throw new Error(error.message);

    if (!data.session) {
      throw new Error(
        'Registration successful. Please verify your email, then log in.'
      );
    }

    return getAuthenticatedUser();
  },

  async loginAdmin(email: string, password: string): Promise<AuthResponse> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    const result = await getAuthenticatedUser();

    if (result.user.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('This account does not have administrator access.');
    }

    return result;
  },

  async restoreSession(): Promise<AuthResponse | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase.auth.getSession();

    if (error) throw new Error(error.message);

    if (!data.session) return null;

    return getAuthenticatedUser();
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    }
  },
};
