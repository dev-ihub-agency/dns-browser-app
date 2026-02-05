import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ModeContext = createContext();
const MODE_KEY = '@dns_browser_mode';

export function ModeProvider({ children }) {
  const [mode, setModeState] = useState('Normal'); // 'Normal' or 'Warp'
  const [isLoaded, setIsLoaded] = useState(false);

  // Load mode from AsyncStorage on mount
  useEffect(() => {
    const loadMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(MODE_KEY);
        if (savedMode === 'Normal' || savedMode === 'Warp') {
          setModeState(savedMode);
        }
      } catch (error) {
        console.error('Error loading mode:', error);
      }
      setIsLoaded(true);
    };
    loadMode();
  }, []);

  // Save mode when it changes
  const setMode = async (newMode) => {
    try {
      await AsyncStorage.setItem(MODE_KEY, newMode);
      setModeState(newMode);
    } catch (error) {
      console.error('Error saving mode:', error);
      setModeState(newMode);
    }
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, isLoaded }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within ModeProvider');
  }
  return context;
}
