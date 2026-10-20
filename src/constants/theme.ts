// src/constants/theme.ts
// Canonical JeevanHub Ayurvedic Design Tokens
export const Colors = {
  // Brand: Olive
  olive: '#556b2f',
  oliveAction: '#4a5c28',
  oliveDeep: '#3f4f22',
  oliveHover: '#3a4a1f',
  oliveLight: '#6b8536',

  // Accents
  turmericGold: '#c8a24a',
  barkBrown: '#8b4513',

  // Backgrounds & Neutrals
  cream: '#f8f4eb',
  creamTint: '#eef3e4',
  sagePale: '#eef2e3',
  sagePale2: '#dbe4c6',
  surface: '#ffffff',

  // Ink / Text
  ink: '#2f3524',
  inkStrong: '#26301a',
  inkMuted: '#5f6a55',
  inkLight: '#8a9482',

  // Lines & Borders
  border: 'rgba(85, 107, 47, 0.14)',
  borderStrong: 'rgba(85, 107, 47, 0.3)',

  // Status
  error: '#a33d32',
  errorBg: '#fbeae8',
  success: '#2e7d32',
  successBg: '#edf7ee',
  warning: '#b26a00',
  warningBg: '#fff8e6',
} as const;

export const Typography = {
  fontFamilyDisplay: 'serif',
  fontFamilyBody: 'System',
};

export const Shadows = {
  card: {
    shadowColor: '#2f3524',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  button: {
    shadowColor: '#3a4a1f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
};
