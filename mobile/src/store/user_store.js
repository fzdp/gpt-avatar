import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { zustandStorage } from '@/lib/mmkv';

export const useUserStore = create(
  persist(
    immer((set, get) => ({
      email: '',
      setEmail: (email) => {
        set({ email });
      },
      token: '',
      setToken: (token) => {
        set({ token });
      },
      setUser: ({ email, token }) => {
        set({ email, token });
      },
      logout: () => {
        set({ email: '', token: '' });
      },
    })),
    {
      name: 'user',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
