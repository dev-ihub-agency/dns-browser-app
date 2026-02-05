import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { useBrands } from '../BrandsContext';

// 默认 Live 类目数据（当 API 没有返回数据时使用）
const FALLBACK_LIVE_CATEGORIES = [
  {
    id: '1',
    title: 'Football Live Stream',
    subtitle: 'Watch live football matches',
    faviconUrl: 'https://livefootballvip-assets.s3.ap-southeast-1.amazonaws.com/branding/favicon/favicon-1767700184290-fca99c13.ico',
    url: 'https://duballth.com',
  },
  {
    id: '2',
    title: 'Live Scores',
    subtitle: 'Real-time match scores',
    faviconUrl: 'https://livefootballvip-assets.s3.ap-southeast-1.amazonaws.com/branding/favicon/favicon-1767698737305-bfc58693.ico',
    url: 'https://livefootballvip.com',
  },
  {
    id: '3',
    title: '4D Results Live',
    subtitle: 'Live 4D lottery results',
    faviconUrl: 'https://9lotto4d.app/favicon.ico',
    url: 'https://9lotto4d.app',
  },
  {
    id: '4',
    title: 'MissAV',
    subtitle: 'Premium video content',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=missav.ws&sz=128',
    url: 'https://missav.ws/',
  },
];

// 单个 Live 卡片组件（带图片加载失败处理）
function LiveCategoryCard({ category, theme, onPress }) {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: theme.cardBackground }]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        {!imageError && category.faviconUrl ? (
          <Image
            source={{ uri: category.faviconUrl }}
            style={styles.faviconImage}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.faviconPlaceholder}>
            <Text style={styles.faviconPlaceholderText}>
              {category.title.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.categoryInfo}>
        <Text style={[styles.categoryTitle, { color: theme.text }]}>
          {category.title}
        </Text>
        <Text style={[styles.categorySubtitle, { color: theme.textSecondary }]}>
          {category.subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={theme.icon} />
    </TouchableOpacity>
  );
}

export default function LiveScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { brands, categories, isLoading, trackBrandClick } = useBrands();

  // 从 brands 中筛选 Live 类别的品牌，或使用 fallback
  const liveCategories = useMemo(() => {
    // 找到 Live 类别
    const liveCategory = categories.find(c => 
      c.name.toLowerCase().includes('live') || 
      c.slug?.toLowerCase().includes('live')
    );
    
    if (liveCategory) {
      // 从 brands 中筛选 Live 类别的品牌
      const liveBrands = brands.filter(b => b.categoryId === liveCategory.id);
      if (liveBrands.length > 0) {
        return liveBrands.map(brand => ({
          id: brand.id,
          title: brand.name,
          subtitle: brand.subtitle || brand.description || 'Premium content',
          faviconUrl: brand.logo || `https://www.google.com/s2/favicons?domain=${new URL(brand.url).hostname}&sz=128`,
          url: brand.url,
        }));
      }
    }
    
    // 如果没有 Live 类别或品牌，使用 fallback 数据
    return FALLBACK_LIVE_CATEGORIES;
  }, [brands, categories]);

  const handleCategoryPress = (category) => {
    // 追踪点击
    if (category.id && !FALLBACK_LIVE_CATEGORIES.find(f => f.id === category.id)) {
      trackBrandClick(category.id);
    }
    navigation.navigate('Window', { url: category.url });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Live</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Partnership Title */}
          <View style={styles.partnershipContainer}>
            <Text style={[styles.partnershipTitle, { color: theme.text }]}>
              RMGROUP Exclusive Partnership
            </Text>
          </View>

          {/* Loading State */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFC837" />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
            </View>
          ) : (
            liveCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: theme.cardBackground }]}
                onPress={() => handleCategoryPress(category)}
              >
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#1C1C1E' : '#2C2C2E' }]}>
                  {category.faviconUrl ? (
                    <Image
                      source={{ uri: category.faviconUrl }}
                      style={styles.faviconImage}
                      resizeMode="contain"
                      defaultSource={require('../assets/icon.png')}
                      onError={() => {}}
                    />
                  ) : (
                    <View style={styles.faviconPlaceholder}>
                      <Text style={styles.faviconPlaceholderText}>
                        {category.title.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryTitle, { color: theme.text }]}>
                    {category.title}
                  </Text>
                  <Text style={[styles.categorySubtitle, { color: theme.textSecondary }]}>
                    {category.subtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={theme.icon} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 15,
  },
  partnershipContainer: {
    marginBottom: 15,
  },
  partnershipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faviconImage: {
    width: 32,
    height: 32,
  },
  faviconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFC837',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faviconPlaceholderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  categorySubtitle: {
    fontSize: 11,
    color: '#999',
  },
});
