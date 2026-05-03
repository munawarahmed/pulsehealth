/**
 * PulseHealth design tokens.
 * OLED-true black + neon accents. Keep this file the single source of truth —
 * components must never hardcode hex values.
 */
export const Colors = {
  // Surfaces
  bg: '#000000',          // OLED true black
  surface: '#0A0A0A',     // Cards / elevated containers
  surfaceAlt: '#141414',  // Inputs, secondary surfaces
  border: '#1F1F1F',

  // Accents
  primary: '#39FF14',     // Neon green — CTAs, streak flame, success
  data: '#7DF9FF',        // Electric blue — charts, metric values
  warn: '#FFB347',
  danger: '#FF4D6D',

  // Text
  text: '#FFFFFF',
  textMuted: '#9A9A9A',
  textDim: '#5A5A5A',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const Typography = {
  // Use system font initially; swap to Inter/Roboto via expo-font in Sprint 5.
  display: { fontSize: 40, fontWeight: '700' as const, letterSpacing: -1 },
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.3 },
  micro: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
};
