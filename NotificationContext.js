import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from './services/api';

// 配置通知显示方式
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(null);
  const [tokenSaved, setTokenSaved] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // 注册推送通知
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // 保存到本地存储
        AsyncStorage.setItem('expoPushToken', token);
        console.log('Expo Push Token:', token);
        
        // 尝试为已登录用户保存 token
        tryAutoSaveToken(token);
      }
    });

    // 监听收到通知（app 在前台时）
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      console.log('Notification received:', notification);
    });

    // 监听用户点击通知
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification clicked:', data);
      
      // 处理 deep link
      if (data?.deepLink) {
        handleDeepLink(data.deepLink);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // 尝试自动为已登录用户保存 token
  const tryAutoSaveToken = async (token) => {
    try {
      // 检查是否有保存的用户
      const userJson = await AsyncStorage.getItem('@dns_browser_user');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user?.id) {
          await saveTokenToServer(user.id, token);
        }
      }
    } catch (error) {
      console.log('Auto save token failed (user may not be logged in):', error.message);
    }
  };

  // 保存 token 到服务器
  const saveTokenToServer = useCallback(async (userId, token = null) => {
    const pushToken = token || expoPushToken;
    if (!pushToken || !userId) {
      console.log('Cannot save token: missing token or userId');
      return { success: false };
    }

    try {
      const result = await api.savePushToken(pushToken, userId, Platform.OS);
      console.log('Push token saved to server for user:', userId);
      setTokenSaved(true);
      return { success: true, result };
    } catch (error) {
      console.error('Failed to save push token to server:', error);
      return { success: false, error: error.message };
    }
  }, [expoPushToken]);

  // 处理 deep link 导航
  const handleDeepLink = (deepLink) => {
    // 这里之后可以接入 navigation
    // 例如: navigation.navigate('CheckIn') 
    console.log('Handle deep link:', deepLink);
  };

  // 发送 token 到后端（旧方法，保持兼容）
  const sendTokenToServer = async (userId) => {
    return saveTokenToServer(userId);
  };

  return (
    <NotificationContext.Provider value={{
      expoPushToken,
      notification,
      tokenSaved,
      sendTokenToServer,
      saveTokenToServer,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

// 注册推送通知并获取 token
async function registerForPushNotificationsAsync() {
  let token;

  // 检查是否是真实设备（模拟器不支持推送）
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Android 需要设置通知 channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFC837',
    });
  }

  // 检查/请求权限
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // 获取 Expo Push Token
  try {
    // Get projectId from Constants (Expo SDK 49+) or use EAS project ID
    const Constants = require('expo-constants').default;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                      Constants.easConfig?.projectId;
    
    if (projectId) {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      token = tokenData.data;
    } else {
      // Fallback: try without projectId (may work in development)
      const tokenData = await Notifications.getExpoPushTokenAsync();
      token = tokenData.data;
    }
  } catch (error) {
    console.error('Failed to get push token:', error);
    // Non-fatal error - notifications just won't work
  }

  return token;
}

// 测试用：本地发送通知
export async function sendLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // 立即发送
  });
}
