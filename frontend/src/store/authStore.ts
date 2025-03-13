import { create } from 'zustand';
import { User } from '../types';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '../api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  
  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiLogin({ username, password });
      
      if (response.token && response.user) {
        set({ 
          user: response.user, 
          isAuthenticated: true, 
          loading: false 
        });
        return true;
      } else {
        set({ 
          error: 'Invalid response from server', 
          loading: false 
        });
        return false;
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Login failed', 
        loading: false 
      });
      return false;
    }
  },
  
  logout: async () => {
    set({ loading: true });
    
    try {
      await apiLogout();
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false 
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the user state even if the API call fails
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false 
      });
    }
  },
  
  checkAuth: async () => {
    // Skip if already authenticated
    if (get().isAuthenticated) return true;
    
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    set({ loading: true });
    
    try {
      const user = await getCurrentUser();
      // Store user in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ 
        user, 
        isAuthenticated: true, 
        loading: false 
      });
      return true;
    } catch {
      // Clear token if invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false 
      });
      return false;
    }
  }
}));