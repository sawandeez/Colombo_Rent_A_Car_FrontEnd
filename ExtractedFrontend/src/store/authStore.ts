import { create } from 'zustand';

interface AuthStore {
  token: string | null;
  userId: string | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (token: string, userId: string, role: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: localStorage.getItem('token'),
  userId: localStorage.getItem('userId'),
  role: localStorage.getItem('role'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: (token: string, userId: string, role: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('role', role);
    set({ token, userId, role, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    set({ token: null, userId: null, role: null, isAuthenticated: false });
  },
}));
