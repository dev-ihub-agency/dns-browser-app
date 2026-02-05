import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

const THEME_KEY = '@dns_browser_theme';

// Light theme colors
export const lightTheme = {
  // Background colors
  background: '#F8F8F8',
  cardBackground: '#FFF',
  headerBackground: '#FFC837',

  // Text colors
  text: '#000',
  textSecondary: '#666',
  textTertiary: '#999',

  // UI colors
  primary: '#FFC837',
  border: '#E5E5E5',
  separator: '#F0F0F0',
  icon: '#666',
  iconActive: '#FFC837',

  // Input colors
  inputBackground: '#F5F5F5',
  inputBorder: '#E5E5E5',
  placeholder: '#999',

  // Status bar
  statusBarStyle: 'dark-content',

  // Shadow
  shadowColor: '#000',
};

// Dark theme colors
export const darkTheme = {
  // Background colors
  background: '#1C1C1E',
  cardBackground: '#2C2C2E',
  headerBackground: '#1C1C1E',

  // Text colors
  text: '#FFF',
  textSecondary: '#ABABAB',
  textTertiary: '#6E6E73',

  // UI colors
  primary: '#FFC837',
  border: '#38383A',
  separator: '#38383A',
  icon: '#ABABAB',
  iconActive: '#FFC837',

  // Input colors
  inputBackground: '#38383A',
  inputBorder: '#48484A',
  placeholder: '#6E6E73',

  // Status bar
  statusBarStyle: 'light-content',

  // Shadow
  shadowColor: '#000',
};

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  // Load theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          // If no saved preference, use system setting
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    loadTheme();
  }, []);

  // Save theme preference when it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    };

    saveTheme();
  }, [isDarkMode]);

  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
