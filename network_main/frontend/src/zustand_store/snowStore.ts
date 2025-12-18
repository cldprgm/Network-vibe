import { create } from 'zustand';

interface SnowStore {
    isSnowing: boolean;
    toggleSnow: () => void;
}

export const useSnowStore = create<SnowStore>((set) => ({
    isSnowing: false,
    toggleSnow: () => set((state) => ({ isSnowing: !state.isSnowing })),
}));