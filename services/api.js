// API 服务 - 连接 dns-backoffice-api
import AsyncStorage from '@react-native-async-storage/async-storage';

// API 配置
// 生产环境使用正式域名，开发环境使用服务器地址
const API_BASE_URL = 'https://api.safebrowser888.com';

// 用于存储用户信息的 key
const USER_STORAGE_KEY = '@dns_browser_user';
const TOKEN_STORAGE_KEY = '@dns_browser_token';

// ============================================
// API Helper
// ============================================

async function fetchApi(endpoint, options = {}) {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
  const user = userJson ? JSON.parse(userJson) : null;
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(user?.id ? { 'x-user-id': user.id } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// ============================================
// Health Check
// ============================================

export async function checkApiHealth() {
  return fetchApi('/api/health');
}

// ============================================
// Brands API
// ============================================

export async function getBrands(params = {}) {
  const query = new URLSearchParams();
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.status) query.set('status', params.status);
  if (params.featured) query.set('featured', 'true');
  
  const queryString = query.toString();
  return fetchApi(`/api/brands${queryString ? `?${queryString}` : ''}`);
}

export async function getBrandCategories() {
  return fetchApi('/api/brand-categories');
}

// ============================================
// DNS Servers API
// ============================================

export async function getDnsServers() {
  return fetchApi('/api/dns-servers');
}

// ============================================
// User API
// ============================================

export async function registerUser(data) {
  const response = await fetchApi('/api/users/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  // 保存用户信息
  if (response.user) {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
  }
  if (response.token) {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.token);
  }
  
  return response;
}

export async function loginUser(data) {
  const response = await fetchApi('/api/users/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  // 保存用户信息
  if (response.user) {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
  }
  if (response.token) {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.token);
  }
  
  return response;
}

export async function logoutUser() {
  await AsyncStorage.removeItem(USER_STORAGE_KEY);
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function getCurrentUser() {
  const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
  return userJson ? JSON.parse(userJson) : null;
}

export async function getUserProfile() {
  return fetchApi('/api/users/profile');
}

export async function updateUserProfile(data) {
  const response = await fetchApi('/api/users/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  
  // 更新本地存储
  if (response) {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response));
  }
  
  return response;
}

// ============================================
// Check-in API
// ============================================

export async function checkIn() {
  return fetchApi('/api/users/check-in', {
    method: 'POST',
  });
}

export async function getCheckInStatus() {
  return fetchApi('/api/users/check-in/status');
}

// ============================================
// Points API
// ============================================

export async function getPointsHistory(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  
  const queryString = query.toString();
  return fetchApi(`/api/users/points/history${queryString ? `?${queryString}` : ''}`);
}

// ============================================
// Redemption API
// ============================================

export async function getRedemptionItems() {
  return fetchApi('/api/redemption-items');
}

export async function redeemItem(itemId) {
  return fetchApi('/api/redemptions', {
    method: 'POST',
    body: JSON.stringify({ itemId }),
  });
}

export async function getMyRedemptions() {
  return fetchApi('/api/users/redemptions');
}

// ============================================
// Brand Click Tracking
// ============================================

export async function trackBrandClick(brandId) {
  return fetchApi(`/api/brands/${brandId}/click`, {
    method: 'POST',
  });
}

// ============================================
// Push Notifications
// ============================================

export async function savePushToken(token, userId = null, platform = 'android') {
  // 如果没有传入 userId，尝试从本地存储获取
  let finalUserId = userId;
  if (!finalUserId) {
    const user = await getCurrentUser();
    finalUserId = user?.id || 'anonymous';
  }
  
  return fetchApi('/api/push-tokens', {
    method: 'POST',
    body: JSON.stringify({ userId: finalUserId, token, platform }),
  });
}

// ============================================
// Game Providers API
// ============================================

export async function getGameProviders() {
  return fetchApi('/api/game-providers');
}

// ============================================
// App Config API (Settings, FAQ, News)
// ============================================

export async function getAppConfig() {
  return fetchApi('/api/app-config');
}

export async function getSettings() {
  return fetchApi('/api/settings');
}

export async function getFaqs(category = null) {
  const params = category ? `?category=${category}` : '';
  return fetchApi(`/api/faq${params}`);
}

export async function getNews(limit = 10) {
  return fetchApi(`/api/news?limit=${limit}`);
}

// ============================================
// App Version Check
// ============================================

export async function checkAppVersion(currentVersion) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/app/check-version?version=${currentVersion}`);
    return response.json();
  } catch (error) {
    console.error('Error checking app version:', error);
    return null;
  }
}

// ============================================
// Export API URL for debugging
// ============================================

export const getApiBaseUrl = () => API_BASE_URL;
