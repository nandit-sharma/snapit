export const colors = {
  // Brand & Navies
  primary: '#1E3A8A', // Deep Academic Navy Blue
  primaryDark: '#0F172A', // Slate 900
  primaryLight: '#2563EB', // Vibrant Blue
  primarySoft: '#EFF6FF', // Light Blue Tint
  accent: '#0284C7', // Sky Blue

  // Neutrals
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  borderDark: '#CBD5E1',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Status Colors
  statusSubmitted: '#D97706',
  statusSubmittedBg: '#FEF3C7',
  statusInProgress: '#2563EB',
  statusInProgressBg: '#DBEAFE',
  statusResolved: '#059669',
  statusResolvedBg: '#D1FAE5',
  statusRejected: '#DC2626',
  statusRejectedBg: '#FEE2E2',

  // Severity Colors
  severityLow: '#059669',
  severityLowBg: '#ECFDF5',
  severityMedium: '#D97706',
  severityMediumBg: '#FFFBEB',
  severityHigh: '#EA580C',
  severityHighBg: '#FFF7ED',
  severityCritical: '#DC2626',
  severityCriticalBg: '#FEF2F2',

  // Indicators & Badges
  aiBadge: '#7C3AED',
  aiBadgeBg: '#F3E8FF',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  success: '#10B981',
  error: '#EF4444',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const typography = {
  fontFamily: undefined, // Uses native system font (Roboto on Android, San Francisco on iOS)
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    title: 28,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const shadows = {
  none: {
    elevation: 0,
    shadowColor: 'transparent',
  },
  sm: {
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  md: {
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  lg: {
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
};
