import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '../types';

interface AuthState {
    user: User | null;
    token: string | null;
    role: UserRole | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string, role: UserRole) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            role: null,
            isAuthenticated: false,
            setAuth: (user, token, role) => set({ user, token, role, isAuthenticated: true }),
            logout: () => set({ user: null, token: null, role: null, isAuthenticated: false }),
            updateUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
