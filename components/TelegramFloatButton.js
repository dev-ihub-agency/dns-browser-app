import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../services/api';

const TelegramFloatButton = ({ currentScreen }) => {
  const [config, setConfig] = useState(null);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (config) {
      // Check if button should be visible on current screen
      const shouldShow = config.enabled && 
        (config.showOnScreens.length === 0 || config.showOnScreens.includes(currentScreen));
      console.log(`[TelegramFloat] Screen: ${currentScreen}, Enabled: ${config.enabled}, ShowOnScreens: ${JSON.stringify(config.showOnScreens)}, Visible: ${shouldShow}`);
      setVisible(shouldShow);
    }
  }, [config, currentScreen]);

  const loadConfig = async () => {
    try {
      console.log('[TelegramFloat] Loading config...');
      const settings = await api.getSettings();
      console.log('[TelegramFloat] Settings received:', JSON.stringify(settings?.telegramFloat));
      if (settings && settings.telegramFloat) {
        setConfig(settings.telegramFloat);
        console.log('[TelegramFloat] Config set:', settings.telegramFloat.enabled);
      } else {
        console.log('[TelegramFloat] No telegramFloat in settings, using default');
        // Use default config if not in settings
        setConfig({
          enabled: true,
          telegramId: 'WarpDNS_Support',
          buttonColor: '#0088cc',
          position: 'right',
          bottomOffset: 100,
          showOnScreens: [],
          welcomeMessage: '',
        });
      }
    } catch (error) {
      console.log('[TelegramFloat] Failed to load config:', error);
      // Use default config if API fails
      setConfig({
        enabled: true,
        telegramId: 'WarpDNS_Support',
        buttonColor: '#0088cc',
        position: 'right',
        bottomOffset: 100,
        showOnScreens: [],
        welcomeMessage: '',
      });
    }
  };

  const handlePress = async () => {
    if (!config || !config.telegramId) return;

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Build Telegram URL
    let telegramUrl;
    const username = config.telegramId.replace('@', '');
    
    if (config.welcomeMessage) {
      // With pre-filled message
      const encodedMessage = encodeURIComponent(config.welcomeMessage);
      telegramUrl = `tg://resolve?domain=${username}&text=${encodedMessage}`;
    } else {
      // Just open chat
      telegramUrl = `tg://resolve?domain=${username}`;
    }

    // Fallback to web URL
    const webUrl = `https://t.me/${username}`;

    try {
      const canOpen = await Linking.canOpenURL(telegramUrl);
      if (canOpen) {
        await Linking.openURL(telegramUrl);
      } else {
        // Try web URL as fallback
        const canOpenWeb = await Linking.canOpenURL(webUrl);
        if (canOpenWeb) {
          await Linking.openURL(webUrl);
        } else {
          Alert.alert(
            'Telegram Not Found',
            'Please install Telegram to contact support.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error opening Telegram:', error);
      // Try web URL as last resort
      try {
        await Linking.openURL(webUrl);
      } catch (e) {
        Alert.alert('Error', 'Could not open Telegram');
      }
    }
  };

  if (!visible || !config) {
    return null;
  }

  const positionStyle = config.position === 'left' 
    ? { left: 16 } 
    : { right: 16 };

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        { bottom: config.bottomOffset },
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.button, { backgroundColor: config.buttonColor }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Ionicons name="paper-plane" size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999,
    elevation: 10,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});

export default TelegramFloatButton;
