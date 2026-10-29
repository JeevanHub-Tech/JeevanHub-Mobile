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
const getDevHost = (): string => {
  // 1. Check Expo Go debuggerHost
  const debuggerHost = (Constants as any).expoGoConfig?.debuggerHost;
  if (debuggerHost) return debuggerHost.split(':')[0];

  // 2. Check expoConfig hostUri
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return hostUri.split(':')[0];

  // 3. Check linkingUri (e.g. exp://10.145.82.37:8081)
  const linkingUri = Constants.linkingUri;
  if (linkingUri && linkingUri.includes('://')) {
    const raw = linkingUri.split('://')[1];
    if (raw) return raw.split(':')[0];
  }

  // 4. Hardcoded fallback IP
  return '10.145.82.37';
};

export const ACTIVE_HOST = getDevHost();

export const BACKEND_URL = Platform.select({
  native: `http://${ACTIVE_HOST}:${PORT}`,
  default: `http://localhost:${PORT}`,
});

export const API_TIMEOUT = 15000; // 15 seconds
