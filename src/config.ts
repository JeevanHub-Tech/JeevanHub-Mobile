// src/config.ts
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const PORT = 5000;

/**
 * Automatically detects the laptop's IP address from Expo's dev server host.
 * This works seamlessly when:
 * 1. Laptop is connected to Phone Hotspot
 * 2. Laptop and Phone are on the same Wi-Fi
 * 3. Fallback IP is used if running in standalone native build
 */
const devServerHost = Constants.expoConfig?.hostUri?.split(':')[0];
const FALLBACK_IP = '10.223.203.153';

const activeHost = devServerHost || FALLBACK_IP;

export const BACKEND_URL = Platform.select({
  native: `http://${activeHost}:${PORT}`,
  default: `http://localhost:${PORT}`,
});

export const API_TIMEOUT = 15000; // 15 seconds
