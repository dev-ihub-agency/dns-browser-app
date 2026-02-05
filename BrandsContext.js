import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from './services/api';

const BrandsContext = createContext();

export function BrandsProvider({ children }) {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [gameProviders, setGameProviders] = useState([]);
  const [dnsServers, setDnsServers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // 加载所有数据
  const loadData = useCallback(async (force = false) => {
    // 如果最近 5 分钟内已加载过，不重复加载（除非强制）
    if (!force && lastFetch && Date.now() - lastFetch < 5 * 60 * 1000) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [brandsData, categoriesData, providersData, dnsData] = await Promise.all([
        api.getBrands({ status: 'active' }),
        api.getBrandCategories(),
        api.getGameProviders(),
        api.getDnsServers(),
      ]);

      setBrands(brandsData || []);
      setCategories(categoriesData || []);
      setGameProviders(providersData || []);
      setDnsServers(dnsData || []);
      setLastFetch(Date.now());
    } catch (err) {
      console.error('Error loading brands data:', err);
      setError(err.message);
      // 使用默认数据作为 fallback
      useFallbackData();
    } finally {
      setIsLoading(false);
    }
  }, [lastFetch]);

  // 使用 fallback 数据（当 API 不可用时）
  const useFallbackData = () => {
    setBrands(FALLBACK_BRANDS);
    setCategories(FALLBACK_CATEGORIES);
    setGameProviders(FALLBACK_PROVIDERS);
    setDnsServers(FALLBACK_DNS);
  };

  // 初始加载
  useEffect(() => {
    loadData();
  }, []);

  // 按分类获取品牌
  const getBrandsByCategory = useCallback((categorySlug) => {
    const category = categories.find(c => c.slug === categorySlug);
    if (!category) return [];
    return brands.filter(b => b.categoryId === category.id);
  }, [brands, categories]);

  // 获取 WARP 模式的品牌（Hot Brands 分类）
  const getWarpBrands = useCallback(() => {
    const hotCategory = categories.find(c => c.slug === 'hot-brands');
    if (hotCategory) {
      return brands.filter(b => b.categoryId === hotCategory.id);
    }
    // 如果没有分类，返回所有 featured 品牌
    return brands.filter(b => b.isFeatured);
  }, [brands, categories]);

  // 获取 KIOSK 品牌
  const getKioskBrands = useCallback(() => {
    return brands.filter(b => b.launchType === 'app');
  }, [brands]);

  // 获取 featured 品牌
  const getFeaturedBrands = useCallback(() => {
    return brands.filter(b => b.isFeatured);
  }, [brands]);

  // 追踪品牌点击
  const trackBrandClick = async (brandId) => {
    try {
      await api.trackBrandClick(brandId);
      // 更新本地点击数
      setBrands(prev => prev.map(b => 
        b.id === brandId ? { ...b, clicks: b.clicks + 1 } : b
      ));
    } catch (err) {
      console.error('Error tracking click:', err);
    }
  };

  return (
    <BrandsContext.Provider value={{
      brands,
      categories,
      gameProviders,
      dnsServers,
      isLoading,
      error,
      loadData,
      getBrandsByCategory,
      getWarpBrands,
      getKioskBrands,
      getFeaturedBrands,
      trackBrandClick,
    }}>
      {children}
    </BrandsContext.Provider>
  );
}

export function useBrands() {
  const context = useContext(BrandsContext);
  if (!context) {
    throw new Error('useBrands must be used within a BrandsProvider');
  }
  return context;
}

// ============================================
// Fallback 数据（API 不可用时使用）
// ============================================

const FALLBACK_BRANDS = [
  { id: '1', name: '100JUDI', slug: '100judi', subtitle: 'Premium online gaming platform', url: 'https://100judi.com', clicks: 0, isFeatured: true, status: 'active', launchType: 'web', categoryId: '1' },
  { id: '2', name: 'CUCISLOT365', slug: 'cucislot365', subtitle: 'Daily slots and jackpots', url: 'https://cucislot365.com', clicks: 0, isFeatured: true, status: 'active', launchType: 'web', categoryId: '4' },
  { id: '3', name: 'EASYCUCI', slug: 'easycuci', subtitle: 'Easy deposit and withdraw', url: 'https://easycuci.com', clicks: 0, isFeatured: false, status: 'active', launchType: 'web', categoryId: '5' },
  { id: '4', name: 'FREECREDIT66', slug: 'freecredit66', subtitle: 'Free credit promotions', url: 'https://freecredit66.com', clicks: 0, isFeatured: true, status: 'active', launchType: 'web', categoryId: '7' },
  { id: '5', name: 'FREECUCI365', slug: 'freecuci365', subtitle: '365 days of rewards', url: 'https://freecuci365.com', clicks: 0, isFeatured: false, status: 'active', launchType: 'web', categoryId: '1' },
  { id: '6', name: 'GRAB333', slug: 'grab333', subtitle: 'Lucky 333 gaming', url: 'https://grab333.com', clicks: 0, isFeatured: false, status: 'active', launchType: 'web', categoryId: '1' },
  { id: '7', name: 'MCD76', slug: 'mcd76', subtitle: 'Top rated casino games', url: 'https://mcd76.com', clicks: 0, isFeatured: false, status: 'active', launchType: 'web', categoryId: '5' },
  { id: '8', name: 'PANDA95', slug: 'panda95', subtitle: 'Lucky panda slots', url: 'https://panda95.com', clicks: 0, isFeatured: true, status: 'active', launchType: 'web', categoryId: '4' },
  { id: '9', name: 'REZEKI44', slug: 'rezeki44', subtitle: 'Fortune awaits you', url: 'https://rezeki44.com', clicks: 0, isFeatured: false, status: 'active', launchType: 'web', categoryId: '3' },
  { id: '10', name: 'SEMANGAT33', slug: 'semangat33', subtitle: 'Play with passion', url: 'https://semangat33.com', clicks: 0, isFeatured: false, status: 'active', launchType: 'web', categoryId: '6' },
  { id: '11', name: 'SHELL99', slug: 'shell99', subtitle: 'Premium gaming experience', url: 'https://shell99.com', clicks: 0, isFeatured: false, status: 'active', launchType: 'web', categoryId: '1' },
  { id: '12', name: 'TEALIVE88', slug: 'tealive88', subtitle: 'Refreshing wins', url: 'https://tealive88.com', clicks: 0, isFeatured: false, status: 'active', launchType: 'web', categoryId: '4' },
  { id: '13', name: 'TNG66', slug: 'tng66', subtitle: 'Touch and go gaming', url: 'https://tng66.com', clicks: 0, isFeatured: false, status: 'active', launchType: 'web', categoryId: '1' },
  { id: '14', name: 'MEGA888', slug: 'mega888', subtitle: 'KIOSK Gaming Platform', url: 'https://mega888.com', clicks: 0, isFeatured: true, status: 'active', launchType: 'app', categoryId: '2', androidPackageName: 'com.mega888.app', appScheme: 'mega888://' },
  { id: '15', name: '918KISS', slug: '918kiss', subtitle: 'KIOSK Gaming Platform', url: 'https://918kiss.com', clicks: 0, isFeatured: true, status: 'active', launchType: 'app', categoryId: '2', androidPackageName: 'com.kiss918.app', appScheme: '918kiss://' },
];

const FALLBACK_CATEGORIES = [
  { id: '1', name: 'Hot Brands', slug: 'hot-brands', order: 1 },
  { id: '2', name: 'KIOSK 7E', slug: 'kiosk-7e', order: 2 },
  { id: '3', name: '4D Lotto', slug: '4d-lotto', order: 3 },
  { id: '4', name: 'Slots', slug: 'slots', order: 4 },
  { id: '5', name: 'Casino', slug: 'casino', order: 5 },
  { id: '6', name: 'Sports', slug: 'sports', order: 6 },
  { id: '7', name: 'Promo', slug: 'promo', order: 7 },
];

const FALLBACK_PROVIDERS = [
  { id: '1', name: '918KISS', slug: '918kiss', gamesCount: 150, order: 1 },
  { id: '2', name: 'MEGA888', slug: 'mega888', gamesCount: 200, order: 2 },
  { id: '3', name: 'PUSSY888', slug: 'pussy888', gamesCount: 120, order: 3 },
  { id: '4', name: 'XE88', slug: 'xe88', gamesCount: 80, order: 4 },
  { id: '5', name: 'JOKER123', slug: 'joker123', gamesCount: 180, order: 5 },
  { id: '6', name: 'LIVE22', slug: 'live22', gamesCount: 90, order: 6 },
  { id: '7', name: 'PLAYTECH', slug: 'playtech', gamesCount: 250, order: 7 },
  { id: '8', name: 'PRAGMATIC', slug: 'pragmatic', gamesCount: 300, order: 8 },
  { id: '9', name: 'SPADEGAMING', slug: 'spadegaming', gamesCount: 100, order: 9 },
  { id: '10', name: 'JILI', slug: 'jili', gamesCount: 85, order: 10 },
  { id: '11', name: 'CQ9', slug: 'cq9', gamesCount: 70, order: 11 },
  { id: '12', name: 'PG SOFT', slug: 'pg-soft', gamesCount: 95, order: 12 },
];

const FALLBACK_DNS = [
  { id: '1', name: 'Cloudflare', primary: '1.1.1.1', secondary: '1.0.0.1', isDefault: true, status: 'active' },
  { id: '2', name: 'Google', primary: '8.8.8.8', secondary: '8.8.4.4', isDefault: false, status: 'active' },
];
