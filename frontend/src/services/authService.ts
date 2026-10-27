import { mockCurrentUserAdmin, mockCurrentUserStudent } from '../data/mockData';
import { UserProfile, UserRole } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

export interface AuthResponse {
  user: UserProfile;
  token?: string;
  isMock: boolean;
}

/**
 * Authentication Service
 * Currently runs with interactive local mock state.
 * Structured cleanly to swap with real Supabase Auth calls when configured.
 */
export const authService = {
  async loginStudent(email: string, password: string): Promise<AuthResponse> {
    // If Supabase is configured and not in mock demo mode:
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);
      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name || 'Campus Student',
          role: 'student',
          rollNumber: data.user.user_metadata?.roll_number,
          department: data.user.user_metadata?.department,
        },
        token: data.session?.access_token,
        isMock: false,
      };
    }

    // Mock validation
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!email || !password) {
      throw new Error('Please provide both email and password.');
    }

    return {
      user: {
        ...mockCurrentUserStudent,
        email: email.trim().toLowerCase(),
      },
      token: 'demo-mock-student-token-2026',
      isMock: true,
    };
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
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            name: params.name,
            role: 'student',
            roll_number: params.rollNumber,
            department: params.department,
          },
        },
      });
      if (error) throw new Error(error.message);
      return {
        user: {
          id: data.user?.id || 'new-user',
          email: params.email,
          name: params.name,
          role: 'student',
          rollNumber: params.rollNumber,
          department: params.department,
        },
        token: data.session?.access_token,
        isMock: false,
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      user: {
        id: `usr-student-${Date.now()}`,
        name: params.name,
        email: params.email,
        role: 'student',
        rollNumber: params.rollNumber,
        department: params.department,
        hostelBlock: params.hostelBlock || 'Hostel Block A',
        roomNumber: params.roomNumber || 'Room 101',
      },
      token: 'demo-mock-student-token-new',
      isMock: true,
    };
  },

  async loginAdmin(email: string, password: string): Promise<AuthResponse> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);
      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name || 'Administrator',
          role: 'admin',
        },
        token: data.session?.access_token,
        isMock: false,
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!email || !password) {
      throw new Error('Please enter admin credentials.');
    }

    return {
      user: {
        ...mockCurrentUserAdmin,
        email: email.trim().toLowerCase(),
      },
      token: 'demo-mock-admin-token-2026',
      isMock: true,
    };
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },
};
