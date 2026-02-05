// Global font family constants
export const fontFamily = {
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

// Default font
export const defaultFontFamily = 'Poppins_400Regular';

// Common text styles
export const textStyles = {
  // Headers
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
  },
  h2: {
    fontFamily: fontFamily.semiBold,
    fontSize: 24,
  },
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: 20,
  },
  h4: {
    fontFamily: fontFamily.medium,
    fontSize: 18,
  },
  
  // Body text
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
  },
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
  },
  
  // Special
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
  },
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
  },
  caption: {
    fontFamily: fontFamily.light,
    fontSize: 11,
  },
};
