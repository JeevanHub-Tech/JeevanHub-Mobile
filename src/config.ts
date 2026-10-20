// src/config.ts
import { Platform } from 'react-native';

/**
 * BACKEND_URL configuration:
 * - Physical mobile phone via Expo Go: Uses your local machine's LAN IP.
 * - Android Emulator: Uses 10.0.2.2.
 * - iOS Simulator / Web: Uses localhost.
 *
 * NOTE: If your Wi-Fi changes, update DEV_LAN_IP below with your computer's IP
 * (displayed in `expo start` output).
 */
const DEV_LAN_IP = '10.223.203.153';
const PORT = 5000;

export const BACKEND_URL = Platform.select({
  native: `http://${DEV_LAN_IP}:${PORT}`,
  default: `http://localhost:${PORT}`,
});

export const API_TIMEOUT = 15000; // 15 seconds
