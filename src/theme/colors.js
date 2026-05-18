export const colors = {
  primary: '#7C3AED',
  light: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    textPrimary: '#111111',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
  },
  dark: {
    background: '#111111',
    surface: '#1E1E1E',
    textPrimary: '#F5F5F5',
    textSecondary: '#9CA3AF',
    border: '#2D2D2D',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

export function getThemeColors(colorScheme) {
  return colorScheme === 'dark' ? colors.dark : colors.light;
}
