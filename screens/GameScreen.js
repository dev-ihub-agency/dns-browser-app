import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  ActivityIndicator,
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

export default function GameScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { brands, categories, isLoading, error, trackBrandClick } = useBrands();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Hot Brands');

  // 获取过滤器列表
  const filters = useMemo(() => {
    if (categories.length > 0) {
      return categories.map(c => c.name);
    }
    return ['Hot Brands', 'KIOSK 7E', '4D Lotto', 'Slots', 'Casino', 'Sports', 'Promo'];
  }, [categories]);

  // 过滤品牌
  const filteredGames = useMemo(() => {
    let filtered = brands;

    // 按分类过滤
    if (selectedFilter !== 'All') {
      const category = categories.find(c => c.name === selectedFilter);
      if (category) {
        filtered = filtered.filter(b => b.categoryId === category.id);
      }
    }

    // 按搜索词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(game =>
        game.name.toLowerCase().includes(query) ||
        (game.subtitle && game.subtitle.toLowerCase().includes(query))
      );
    }

    // 按热度（点击数）从高到低排序
    filtered = [...filtered].sort((a, b) => (b.clicks || 0) - (a.clicks || 0));

    // 添加图片（优先本地图片，否则用网络图片）
    return filtered.map(brand => {
      const localImage = BRAND_LOGOS[brand.name];
      let networkImage = null;
      
      // 如果没有本地图片，尝试用品牌的 logo 或 favicon
      if (!localImage && brand.url) {
        try {
          const hostname = new URL(brand.url).hostname;
          networkImage = brand.logo || `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
        } catch (e) {
          networkImage = brand.logo || null;
        }
      }
      
      return {
        ...brand,
        image: localImage || null,
        networkImage: networkImage,
      };
    });
  }, [brands, categories, selectedFilter, searchQuery]);

  // 处理游戏点击
  const handleGamePress = async (game) => {
    // 追踪点击
    if (game.id) {
      trackBrandClick(game.id);
    }

    // 打开 URL
    if (game.url) {
      if (game.launchType === 'app' && game.appScheme) {
        // 尝试打开 App
        try {
          const canOpen = await Linking.canOpenURL(game.appScheme);
          if (canOpen) {
            await Linking.openURL(game.appScheme);
            return;
          }
        } catch (error) {
          console.log('Cannot open app scheme:', error);
        }
        // 如果无法打开 App，打开下载页面
        if (game.androidAppUrl) {
          navigation.navigate('Window', { url: game.androidAppUrl });
          return;
        }
      }
      // 默认打开网页 - 使用 Window 屏幕 (Warp 模式下的浏览器)
      navigation.navigate('Window', { url: game.url });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.headerBackground }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Hot Sites</Text>
        <View style={styles.placeholder} />
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

      <ScrollView style={[styles.scrollView, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {/* Main Content - Filter + Games */}
        <View style={styles.mainContent}>
          {/* Left Filter Column */}
          <View style={styles.filterColumn}>
            {filters.map((filter, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterItem,
                  selectedFilter === filter && styles.filterItemActive
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter && styles.filterTextActive
                ]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Right Games List */}
          <View style={styles.gamesColumn}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFC837" />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.errorText, { color: theme.textSecondary }]}>Failed to load games</Text>
              </View>
            ) : filteredGames.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No games found</Text>
              </View>
            ) : (
              filteredGames.map((game, index) => (
                <TouchableOpacity
                  key={game.id || index}
                  style={[styles.gameCard, { backgroundColor: theme.cardBackground }]}
                  onPress={() => handleGamePress(game)}
                >
                  {/* Game Logo */}
                  {game.image ? (
                    <Image
                      source={game.image}
                      style={styles.gameLogo}
                      resizeMode="contain"
                    />
                  ) : game.networkImage ? (
                    <Image
                      source={{ uri: game.networkImage }}
                      style={styles.gameLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.gameLogo, styles.gameLogoPlaceholder]}>
                      <Text style={styles.gameLogoText}>{game.name.slice(0, 2)}</Text>
                    </View>
                  )}
                  {/* Game Info */}
                  <View style={styles.gameInfo}>
                    <Text style={[styles.gameName, { color: theme.text }]}>{game.name}</Text>
                    <Text style={[styles.gameSubtitle, { color: theme.textSecondary }]}>
                      {game.subtitle || 'Premium gaming platform'}
                    </Text>
                  </View>
                  {/* Clicks indicator */}
                  {game.clicks > 0 && (
                    <View style={styles.clicksBadge}>
                      <Ionicons name="flame" size={12} color="#FF6B35" />
                      <Text style={styles.clicksText}>{game.clicks}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
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
    color: '#000',
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  mainContent: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  filterColumn: {
    width: 75,
    paddingRight: 8,
  },
  filterItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderRadius: 8,
  },
  filterItemActive: {
    backgroundColor: '#FFC837',
  },
  filterText: {
    fontSize: 11,
    color: '#B0B0B0',
    fontWeight: '500',
    textAlign: 'center',
  },
  filterTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  gamesColumn: {
    flex: 1,
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
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  gameLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#2C2C2E',
  },
  gameLogoPlaceholder: {
    backgroundColor: '#FFC837',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameLogoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  gameSubtitle: {
    fontSize: 11,
    color: '#B0B0B0',
    fontWeight: '400',
  },
  clicksBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  clicksText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 2,
  },
});
