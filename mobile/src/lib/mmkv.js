import { MMKV } from 'react-native-mmkv';

export const mmkv = new MMKV({
  id: 'mmkv-voxify',
});

export const zustandStorage = {
  setItem: (key, value) => {
    return mmkv.set(key, value);
  },
  getItem: (key) => {
    const value = mmkv.getString(key);
    return value ?? null;
  },
  removeItem: (key) => {
    return mmkv.delete(key);
  },
};
