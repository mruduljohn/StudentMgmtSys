import { create } from 'zustand';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// In a real application, this would be fetched from a backend
const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Mentor One',
    email: 'mentor1@example.com',
    role: 'mentor',
    class: 'BATCH01',
  },
  {
    id: '3',
    name: 'Mentor Two',
    email: 'mentor2@example.com',
    role: 'mentor',
    class: 'BATCH02',
  },
];

// For demo purposes, all passwords are 'password'
const PASSWORD = 'password';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const user = MOCK_USERS.find((u) => u.email === email);
    
    if (user && password === PASSWORD) {
      set({ user, isAuthenticated: true });
      return true;
    }
    
    return false;
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));