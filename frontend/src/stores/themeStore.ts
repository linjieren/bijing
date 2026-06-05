import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (v: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: true,
      toggleTheme: () => set((s) => ({ isDark: !s.isDark })),
      setDark: (v) => set({ isDark: v }),
    }),
    { name: 'bijing-theme' }
  )
);
