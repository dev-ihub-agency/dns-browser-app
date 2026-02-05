import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

// Font family mapping
export const fonts = {
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

// Custom Text component with Poppins font
export function Text({ style, weight = 'regular', children, ...props }) {
  const fontFamily = fonts[weight] || fonts.regular;
  
  return (
    <RNText style={[{ fontFamily }, style]} {...props}>
      {children}
    </RNText>
  );
}

export default Text;
