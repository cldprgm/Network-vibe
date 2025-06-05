import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/services/types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasHydrated: boolean;
    showAuthModal: boolean;
    login: (user: User) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
    setHasHydrated: (state: boolean) => void;
    setShowAuthModal: (show: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            hasHydrated: false,
            showAuthModal: false,
            login: (user) => set({ user, isAuthenticated: true, isLoading: false }),
            logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
            setLoading: (loading) => set({ isLoading: loading }),
            setHasHydrated: (state) => set({ hasHydrated: state }),
            setShowAuthModal: (show) => set({ showAuthModal: show }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);