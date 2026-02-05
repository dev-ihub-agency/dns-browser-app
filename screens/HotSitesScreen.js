import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { useBrands } from '../BrandsContext';

// 品牌 logo 映射（本地图片）
const BRAND_LOGOS = {
  '100JUDI': require('../assets/brand-logos/100JUDI.png'),
  'CUCISLOT365': require('../assets/brand-logos/CUCISLOT365.png'),
  'EASYCUCI': require('../assets/brand-logos/EASYCUCI.png'),
  'FREECREDIT66': require('../assets/brand-logos/FREECREDIT66.png'),
  'FREECUCI365': require('../assets/brand-logos/FREECUCI365.png'),
  'GRAB333': require('../assets/brand-logos/GRAB333.png'),
  'MCD76': require('../assets/brand-logos/MCD76.png'),
  'PANDA95': require('../assets/brand-logos/PANDA95.png'),
  'REZEKI44': require('../assets/brand-logos/REZEKI44.png'),
  'SEMANGAT33': require('../assets/brand-logos/SEMANGAT33.png'),
  'SHELL99': require('../assets/brand-logos/SHELL99.png'),
  'TEALIVE88': require('../assets/brand-logos/TEALIVE88.png'),
  'TNG66': require('../assets/brand-logos/TNG66.png'),
};

export default function HotSitesScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { brands, categories, isLoading, error, trackBrandClick } = useBrands();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Hot');

  // 构建分类标签
  const categoryTabs = useMemo(() => {
    const defaultTabs = [
      { id: 'hot', label: 'Hot', icon: '🔥' },
      { id: 'new', label: 'New', icon: '✨' },
      { id: 'bonus', label: 'Bonus', icon: '🎁' },
      { id: 'vip', label: 'VIP', icon: '👑' },
    ];

    if (categories.length > 0) {
      // 使用 API 返回的分类
      return [
        { id: 'all', label: 'All', icon: '🔥' },
        ...categories.map(c => ({
          id: c.id,
          label: c.name,
          icon: null,
        })),
      ];
    }

    return defaultTabs;
  }, [categories]);

  // 过滤品牌
  const filteredSites = useMemo(() => {
    let filtered = brands;

    // 按分类过滤
    if (selectedCategory !== 'All' && selectedCategory !== 'Hot') {
      const category = categories.find(c => c.name === selectedCategory);
      if (category) {
        filtered = filtered.filter(b => b.categoryId === category.id);
      }
    }

    // 按搜索词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(site =>
        site.name.toLowerCase().includes(query) ||
        (site.subtitle && site.subtitle.toLowerCase().includes(query))
      );
    }

    // 添加本地图片和颜色
    return filtered.map(brand => ({
      ...brand,
      image: BRAND_LOGOS[brand.name] || null,
      color: getRandomColor(brand.name),
    }));
  }, [brands, categories, selectedCategory, searchQuery]);

  // 处理站点点击
  const handleSitePress = async (site) => {
    // 追踪点击
    if (site.id) {
      trackBrandClick(site.id);
    }

    // 打开 URL
    if (site.url) {
      if (site.launchType === 'app' && site.appScheme) {
        try {
          const canOpen = await Linking.canOpenURL(site.appScheme);
          if (canOpen) {
            await Linking.openURL(site.appScheme);
            return;
          }
        } catch (error) {
          console.log('Cannot open app scheme:', error);
        }
      }
      navigation.navigate('Browser', { url: site.url });
    }
  };

  // 根据名字生成固定颜色
  function getRandomColor(name) {
    const colors = ['#0066CC', '#CC0000', '#228B22', '#000000', '#0066FF', '#00B14F', '#FFC72C', '#FF1493', '#FFA500', '#9400D3'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.headerBackground }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Hot Sites</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="search" size={20} color={theme.icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search all sites"
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView 
        style={[styles.scrollView, { backgroundColor: theme.background }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Partnership Badge */}
        <View style={styles.partnershipContainer}>
          <View style={[styles.partnershipBadge, { backgroundColor: theme.cardBackground }]}>
            <Text style={styles.partnershipDot}>●</Text>
            <Text style={[styles.partnershipText, { color: theme.text }]}>ISOFTNOW PARTNERSHIP</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.icon} />
          </View>
        </View>

        {/* Category Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categoryTabs.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                selectedCategory === category.label && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(category.label)}
            >
              <Text style={[
                styles.categoryLabel,
                { color: selectedCategory === category.label ? '#000' : theme.textSecondary },
              ]}>
                {category.icon && `${category.icon} `}
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFC837" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.errorText, { color: theme.textSecondary }]}>Failed to load sites</Text>
          </View>
        )}

        {/* Sites List */}
        {!isLoading && !error && (
          <View style={styles.sitesList}>
            {filteredSites.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No sites found</Text>
              </View>
            ) : (
              filteredSites.map((site) => (
                <TouchableOpacity 
                  key={site.id} 
                  style={[styles.siteItem, { backgroundColor: theme.cardBackground }]}
                  onPress={() => handleSitePress(site)}
                >
                  {site.image ? (
                    <Image source={site.image} style={styles.siteLogo} resizeMode="contain" />
                  ) : (
                    <View style={[styles.siteIcon, { backgroundColor: site.color }]}>
                      <Text style={styles.siteIconText}>{site.name[0]}</Text>
                    </View>
                  )}
                  <View style={styles.siteInfo}>
                    <Text style={[styles.siteName, { color: theme.text }]}>{site.name}</Text>
                    <Text style={[styles.siteDescription, { color: theme.textSecondary }]}>
                      {site.subtitle || site.description || 'Premium gaming platform'}
                    </Text>
                  </View>
                  {site.clicks > 0 && (
                    <View style={styles.clicksBadge}>
                      <Ionicons name="flame" size={12} color="#FF6B35" />
                      <Text style={styles.clicksText}>{site.clicks}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={theme.icon} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  partnershipContainer: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 8,
  },
  partnershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
  },
  partnershipDot: {
    color: '#FFA500',
    fontSize: 12,
    marginRight: 8,
  },
  partnershipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryScrollContent: {
    paddingHorizontal: 15,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  categoryTabActive: {
    backgroundColor: '#FFC837',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  sitesList: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  siteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  siteLogo: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
  },
  siteIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  siteIconText: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: 'bold',
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  siteDescription: {
    fontSize: 12,
  },
  clicksBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 8,
  },
  clicksText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 2,
  },
});
