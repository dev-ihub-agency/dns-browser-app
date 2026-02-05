import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from './services/api';

const AuthContext = createContext();

const USER_STORAGE_KEY = '@dns_browser_user';

// 用于从 NotificationContext 接收 saveTokenToServer 函数
let saveTokenToServerRef = null;

export function setSaveTokenToServer(fn) {
  saveTokenToServerRef = fn;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 加载保存的用户信息
  useEffect(() => {
    loadUser();
  }, []);

  // 用户登录后保存 push token
  const savePushTokenForUser = useCallback(async (userId) => {
    if (saveTokenToServerRef && userId) {
      try {
        await saveTokenToServerRef(userId);
      } catch (error) {
        console.log('Failed to save push token after login:', error);
      }
    }
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await api.getCurrentUser();
      if (savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 注册
  const register = async (username, email, referralCode = null) => {
    try {
      const response = await api.registerUser({ username, email, referralCode });
      if (response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        // 注册成功后保存 push token
        savePushTokenForUser(response.user.id);
        return { success: true, user: response.user };
      }
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 登录
  const login = async (emailOrUsername) => {
    try {
      const isEmail = emailOrUsername.includes('@');
      const response = await api.loginUser(
        isEmail ? { email: emailOrUsername } : { username: emailOrUsername }
      );
      if (response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        // 登录成功后保存 push token
        savePushTokenForUser(response.user.id);
        return { success: true, user: response.user };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 登出
  const logout = async () => {
    try {
      await api.logoutUser();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // 刷新用户信息
  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const updatedUser = await api.getUserProfile();
      if (updatedUser) {
        setUser(updatedUser);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  // 签到
  const checkIn = async () => {
    try {
      const result = await api.checkIn();
      if (result.success) {
        // 更新本地用户积分
        setUser(prev => ({
          ...prev,
          points: result.totalPoints,
          consecutiveDays: result.consecutiveDays,
          totalCheckIns: result.totalCheckIns,
          lastCheckIn: new Date().toISOString(),
        }));
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 获取签到状态
  const getCheckInStatus = async () => {
    try {
      return await api.getCheckInStatus();
    } catch (error) {
      return { checkedInToday: false, consecutiveDays: 0, error: error.message };
    }
  };

  // 兑换商品
  const redeemItem = async (itemId) => {
    try {
      const result = await api.redeemItem(itemId);
      if (result.success) {
        // 刷新用户积分
        await refreshUser();
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // 更新用户资料
  const updateProfile = async (data) => {
    try {
      const updatedUser = await api.updateUserProfile(data);
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated,
      register,
      login,
      logout,
      refreshUser,
      checkIn,
      getCheckInStatus,
      redeemItem,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
