import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const PasswordContext = createContext();

const PASSWORDS_METADATA_KEY = '@dns_browser_passwords_metadata';
const PASSWORD_SETTINGS_KEY = '@dns_browser_password_settings';

export function PasswordProvider({ children }) {
  const [passwordsMetadata, setPasswordsMetadata] = useState([]);
  const [passwordSettings, setPasswordSettings] = useState({
    savePasswords: false,
    autofillPasswords: false,
    showPasswords: false,
    autofillForms: true,
  });

  const metadataTimeoutRef = useRef(null);
  const settingsTimeoutRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedMetadata = await AsyncStorage.getItem(PASSWORDS_METADATA_KEY);
        const savedSettings = await AsyncStorage.getItem(PASSWORD_SETTINGS_KEY);

        if (savedMetadata) {
          setPasswordsMetadata(JSON.parse(savedMetadata));
        }
        if (savedSettings) {
          setPasswordSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading password data:', error);
      }
    };
    loadData();
  }, []);

  // Debounced save for metadata (1 second)
  useEffect(() => {
    if (metadataTimeoutRef.current) {
      clearTimeout(metadataTimeoutRef.current);
    }

    metadataTimeoutRef.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(PASSWORDS_METADATA_KEY, JSON.stringify(passwordsMetadata));
      } catch (error) {
        console.error('Error saving passwords metadata:', error);
      }
    }, 1000);

    return () => {
      if (metadataTimeoutRef.current) {
        clearTimeout(metadataTimeoutRef.current);
      }
    };
  }, [passwordsMetadata]);

  // Debounced save for settings (500ms)
  useEffect(() => {
    if (settingsTimeoutRef.current) {
      clearTimeout(settingsTimeoutRef.current);
    }

    settingsTimeoutRef.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(PASSWORD_SETTINGS_KEY, JSON.stringify(passwordSettings));
      } catch (error) {
        console.error('Error saving password settings:', error);
      }
    }, 500);

    return () => {
      if (settingsTimeoutRef.current) {
        clearTimeout(settingsTimeoutRef.current);
      }
    };
  }, [passwordSettings]);

  // Add or update password
  const addPassword = async (credentials) => {
    try {
      const { domain, email, username, password, url } = credentials;

      // Check if password already exists for this domain
      const existingIndex = passwordsMetadata.findIndex(p => p.domain === domain);

      const metadata = {
        id: existingIndex >= 0 ? passwordsMetadata[existingIndex].id : Date.now().toString(),
        domain,
        email: email || '',
        username: username || '',
        url,
        timestamp: Date.now(),
      };

      // Save encrypted password to SecureStore
      await SecureStore.setItemAsync(`password_${metadata.id}`, password);

      // Update or add metadata
      if (existingIndex >= 0) {
        const updated = [...passwordsMetadata];
        updated[existingIndex] = metadata;
        setPasswordsMetadata(updated);
      } else {
        setPasswordsMetadata(prev => [...prev, metadata]);
      }

      return true;
    } catch (error) {
      console.error('Error adding password:', error);
      return false;
    }
  };

  // Get password for domain
  const getPasswordForDomain = async (domain) => {
    try {
      const metadata = passwordsMetadata.find(p => p.domain === domain);
      if (!metadata) return null;

      // Retrieve encrypted password from SecureStore
      const password = await SecureStore.getItemAsync(`password_${metadata.id}`);

      return {
        ...metadata,
        password,
      };
    } catch (error) {
      console.error('Error getting password for domain:', error);
      return null;
    }
  };

  // Remove password
  const removePassword = async (id) => {
    try {
      // Delete encrypted password from SecureStore
      await SecureStore.deleteItemAsync(`password_${id}`);

      // Remove metadata
      setPasswordsMetadata(prev => prev.filter(p => p.id !== id));

      return true;
    } catch (error) {
      console.error('Error removing password:', error);
      return false;
    }
  };

  // Clear all passwords
  const clearAllPasswords = async () => {
    try {
      // Delete all encrypted passwords from SecureStore
      for (const metadata of passwordsMetadata) {
        await SecureStore.deleteItemAsync(`password_${metadata.id}`);
      }

      // Clear metadata
      setPasswordsMetadata([]);

      return true;
    } catch (error) {
      console.error('Error clearing all passwords:', error);
      return false;
    }
  };

  // Update password settings
  const updatePasswordSettings = (settings) => {
    setPasswordSettings(prev => ({ ...prev, ...settings }));
  };

  // Get password count
  const getPasswordCount = () => {
    return passwordsMetadata.length;
  };

  return (
    <PasswordContext.Provider
      value={{
        passwordsMetadata,
        passwordSettings,
        addPassword,
        getPasswordForDomain,
        removePassword,
        clearAllPasswords,
        updatePasswordSettings,
        getPasswordCount,
      }}
    >
      {children}
    </PasswordContext.Provider>
  );
}

export function usePassword() {
  const context = useContext(PasswordContext);
  if (!context) {
    throw new Error('usePassword must be used within a PasswordProvider');
  }
  return context;
}
