import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { zustandStorage } from '@/lib/mmkv';

export const useSettingsStore = create(
  persist(
    immer((set, get) => ({
      apiTimeout: 5,
      setApiTimeout: (seconds) => {
        set({ apiTimeout: seconds });
      },
      serverUrl: 'http://192.168.1.4:3000',
      setServerUrl: (url) => {
        set({ serverUrl: url });
      },
      showDebug: false,
      setShowDebug: (v) => {
        set({ showDebug: v });
      },
    })),
    {
      name: 'settings',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
