// src/utils/storage.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (e) {
      console.warn('storage.setItem error:', e);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        return localStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (e) {
      console.warn('storage.getItem error:', e);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (e) {
      console.warn('storage.removeItem error:', e);
    }
  },
};
