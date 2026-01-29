// Tonas E-commerce Theme Configuration
import { Platform } from 'react-native';

export const colors = {
  // Primary colors
  primary: '#E67E22',
  primaryDark: '#D35400',
  primaryLight: '#F39C12',
  
  // Secondary colors
  secondary: '#1E3A5F',
  secondaryDark: '#152A44',
  secondaryLight: '#2C5282',
  
  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  
  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textLight: '#999999',
  textWhite: '#FFFFFF',
  
  // Borders
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  
  // Status colors
  success: '#27AE60',
  error: '#E74C3C',
  warning: '#F1C40F',
  info: '#3498DB',
  
  // Specific UI elements
  tabBarActive: '#E67E22',
  tabBarInactive: '#999999',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: Platform.select({
    web: {
      boxShadow: '0px 1px 3px rgba(0,0,0,0.08)',
    },
    default: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
  }),
  md: Platform.select({
    web: {
      boxShadow: '0px 2px 6px rgba(0,0,0,0.12)',
    },
    default: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  }),
  lg: Platform.select({
    web: {
      boxShadow: '0px 6px 16px rgba(0,0,0,0.16)',
    },
    default: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  }),
};

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
};
