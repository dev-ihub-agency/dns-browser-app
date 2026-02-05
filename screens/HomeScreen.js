import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome, FontAwesome5, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { useMode } from '../ModeContext';
import { useData } from '../DataContext';
import { useTheme } from '../ThemeContext';
import { useDNS } from '../DNSContext';
import { useBrands } from '../BrandsContext';
import * as api from '../services/api';

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

export default function HomeScreen({ navigation }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { mode, setMode } = useMode();
  const { username, isFirstLaunch, isDataLoaded, saveUsername } = useData();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { dnsEnabled, selectedDnsServer, toggleDns, changeDnsServer, availableDnsServers } = useDNS();
  const { brands, gameProviders, isLoading: brandsLoading, trackBrandClick, getWarpBrands } = useBrands();
  const [searchQuery, setSearchQuery] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [newsItems, setNewsItems] = useState([]);

  // 从 API 获取的 warp 品牌，添加本地图片
  const warpSites = useMemo(() => {
    const warpBrands = getWarpBrands();
    if (warpBrands.length === 0) {
      // 如果 API 没有返回数据，使用所有品牌
      return brands.slice(0, 13).map(brand => ({
        ...brand,
        image: BRAND_LOGOS[brand.name] || null,
      }));
    }
    return warpBrands.map(brand => ({
      ...brand,
      image: BRAND_LOGOS[brand.name] || null,
    }));
  }, [brands, getWarpBrands]);

  // 从 API 获取的 game providers
  const gameProvidersList = useMemo(() => {
    if (gameProviders.length === 0) {
      return FALLBACK_PROVIDERS;
    }
    return gameProviders;
  }, [gameProviders]);

  // 处理品牌点击
  const handleBrandPress = async (brand) => {
    // 追踪点击
    if (brand.id) {
      trackBrandClick(brand.id);
    }
    
    // 打开 URL
    if (brand.url) {
      if (brand.launchType === 'app' && brand.appScheme) {
        // 尝试打开 App
        try {
          const canOpen = await Linking.canOpenURL(brand.appScheme);
          if (canOpen) {
            await Linking.openURL(brand.appScheme);
            return;
          }
        } catch (error) {
          console.log('Cannot open app scheme:', error);
        }
        // 如果无法打开 App，打开下载页面或网页
        if (brand.androidAppUrl) {
          navigation.navigate('Window', { url: brand.androidAppUrl });
          return;
        }
      }
      // 默认打开网页
      navigation.navigate('Window', { url: brand.url });
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`;
      // Navigate to correct tab based on mode: Browser (Normal) or Window (Warp)
      const targetTab = mode === 'Normal' ? 'Browser' : 'Window';
      navigation.navigate(targetTab, { url: searchUrl });
    }
  };

  const handleSitePress = (siteName) => {
    const siteUrls = {
      'Google': 'https://www.google.com',
      'YouTube': 'https://www.youtube.com',
      'Twitter': 'https://twitter.com',
      'Facebook': 'https://www.facebook.com',
      'Instagram': 'https://www.instagram.com',
      'TikTok': 'https://www.tiktok.com',
      'Reddit': 'https://www.reddit.com',
      'Discord': 'https://discord.com',
      'Telegram': 'https://web.telegram.org',
      'WhatsApp': 'https://web.whatsapp.com',
      'Netflix': 'https://www.netflix.com',
      'Spotify': 'https://www.spotify.com',
      'Amazon': 'https://www.amazon.com',
      'eBay': 'https://www.ebay.com',
    };

    const url = siteUrls[siteName];
    if (url) {
      // Navigate to correct tab based on mode: Browser (Normal) or Window (Warp)
      const targetTab = mode === 'Normal' ? 'Browser' : 'Window';
      navigation.navigate(targetTab, { url });
    }
  };

  // Load news from API
  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const data = await api.getNews(5);
      if (data && data.length > 0) {
        setNewsItems(data.map(item => ({
          title: item.title,
          source: item.type === 'promotion' ? 'Promo' : item.type === 'alert' ? 'Alert' : 'News',
          time: getTimeAgo(new Date(item.publishAt)),
          linkUrl: item.linkUrl,
        })));
      } else {
        // Use fallback news
        setNewsItems(FALLBACK_NEWS);
      }
    } catch (error) {
      console.log('Error loading news:', error);
      setNewsItems(FALLBACK_NEWS);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHrs / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHrs > 0) return `${diffHrs}h ago`;
    return 'Just now';
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Only show welcome modal after data is loaded, and only if it's first launch with no username
    if (isDataLoaded && isFirstLaunch && !username) {
      setShowWelcomeModal(true);
    }
  }, [isDataLoaded, isFirstLaunch, username]);

  const handleSaveName = async () => {
    if (nameInput.trim()) {
      await saveUsername(nameInput.trim());
      setShowWelcomeModal(false);
    }
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const formatDate = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    const greetingTime = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return username ? `${greetingTime}, ${username}` : `${greetingTime}`;
  };

  const normalSites = [
    { name: 'Google', iconFamily: 'AntDesign', iconName: 'google', iconColor: '#4285F4', bgColor: '#FFF' },
    { name: 'YouTube', iconFamily: 'AntDesign', iconName: 'youtube', iconColor: '#FF0000', bgColor: '#FFF' },
    { name: 'Twitter', iconFamily: 'AntDesign', iconName: 'twitter', iconColor: '#000000', bgColor: '#FFF' },
    { name: 'Facebook', iconFamily: 'FontAwesome', iconName: 'facebook', iconColor: '#1877F2', bgColor: '#FFF' },
    { name: 'Instagram', iconFamily: 'AntDesign', iconName: 'instagram', iconColor: '#E4405F', bgColor: '#FFF' },
    { name: 'TikTok', iconFamily: 'MaterialCommunityIcons', iconName: 'music-note', iconColor: '#000000', bgColor: '#FFF' },
    { name: 'Reddit', iconFamily: 'FontAwesome5', iconName: 'reddit-alien', iconColor: '#FF4500', bgColor: '#FFF' },
    { name: 'Discord', iconFamily: 'MaterialCommunityIcons', iconName: 'discord', iconColor: '#5865F2', bgColor: '#FFF' },
    { name: 'Telegram', iconFamily: 'FontAwesome5', iconName: 'telegram-plane', iconColor: '#0088CC', bgColor: '#FFF' },
    { name: 'WhatsApp', iconFamily: 'FontAwesome', iconName: 'whatsapp', iconColor: '#25D366', bgColor: '#FFF' },
    { name: 'Netflix', iconFamily: 'MaterialCommunityIcons', iconName: 'netflix', iconColor: '#E50914', bgColor: '#FFF' },
    { name: 'Spotify', iconFamily: 'FontAwesome5', iconName: 'spotify', iconColor: '#1DB954', bgColor: '#FFF' },
    { name: 'Amazon', iconFamily: 'FontAwesome', iconName: 'amazon', iconColor: '#FF9900', bgColor: '#FFF' },
    { name: 'eBay', iconFamily: 'FontAwesome', iconName: 'shopping-bag', iconColor: '#E53238', bgColor: '#FFF' },
    { name: 'More', color: '#E8E8E8' },
  ];

  // warpSites 和 gameProvidersList 现在通过 useMemo 从 API 获取

  const currentSites = mode === 'Normal' ? normalSites : warpSites;

  return (
    <View style={[styles.container, { backgroundColor: theme.headerBackground }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} translucent={false} />
      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: theme.headerBackground }}>
        {/* Header Section */}
        <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
          {/* Top Row: Time and Mode Selector */}
          <View style={styles.topRow}>
            <View style={styles.timeContainer}>
              <Text style={[styles.timeText, { color: isDarkMode ? '#FFF' : '#000' }]}>{formatTime(currentTime)}</Text>
            </View>

            {/* Mode Selector */}
            <View style={styles.modeSelectorWrapper}>
              <View style={[styles.modeSelectorContainer, { backgroundColor: isDarkMode ? '#2C2C2E' : 'rgba(255, 200, 55, 0.25)' }]}>
                <TouchableOpacity
                  style={styles.modeButton}
                  onPress={() => setMode(mode === 'Normal' ? 'Warp' : 'Normal')}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.modeButtonText, { color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)' }]}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={[styles.modeText, { color: isDarkMode ? '#FFF' : 'rgba(0, 0, 0, 0.65)' }]}>{mode}</Text>
                <TouchableOpacity
                  style={styles.modeButton}
                  onPress={() => setMode(mode === 'Normal' ? 'Warp' : 'Normal')}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.modeButtonText, { color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)' }]}>{'>'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.brightnessButton, { backgroundColor: isDarkMode ? '#2C2C2E' : 'rgba(255, 200, 55, 0.25)' }]}
                onPress={toggleTheme}
                activeOpacity={0.6}
              >
                <Text style={[styles.brightnessIcon, { color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}>☀</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Greeting */}
          <View style={styles.greetingContainer}>
            <Text style={[styles.greetingText, { color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.75)' }]}>{getGreeting()}</Text>
          </View>
        </View>

        {/* Google Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Image
            source={{ uri: 'https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png' }}
            style={styles.googleIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search Google or type a URL"
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.qrIconContainer}>
            <Text style={[styles.qrIcon, { color: theme.icon }]}>⊞</Text>
          </TouchableOpacity>
        </View>

        {mode === 'Normal' && (
          <>
            {/* Quote Section */}
            <View style={[styles.quoteContainer, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.quoteText, { color: theme.text }]}>
                "In order to write about life first you must live it."
              </Text>
              <Text style={[styles.quoteAuthor, { color: theme.textSecondary }]}>– Ernest Hemingway</Text>
            </View>

            {/* Social Media Icons Grid */}
            <View style={[styles.iconsGrid, { backgroundColor: theme.cardBackground }]}>
              {normalSites.map((site, index) => {
                const getIconComponent = () => {
                  switch(site.iconFamily) {
                    case 'AntDesign': return AntDesign;
                    case 'FontAwesome': return FontAwesome;
                    case 'FontAwesome5': return FontAwesome5;
                    case 'MaterialCommunityIcons': return MaterialCommunityIcons;
                    default: return Ionicons;
                  }
                };
                const IconComponent = getIconComponent();

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.iconItem}
                    onPress={() => handleSitePress(site.name)}
                  >
                    {site.iconName ? (
                      <View style={[styles.socialIconBox, { backgroundColor: isDarkMode ? '#38383A' : site.bgColor }]}>
                        <IconComponent name={site.iconName} size={32} color={site.iconColor} />
                      </View>
                    ) : (
                      <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#38383A' : site.color }]}>
                        <Text style={[styles.iconText, { color: isDarkMode ? '#999' : '#000' }]}>{site.name[0]}</Text>
                      </View>
                    )}
                    <Text style={[styles.iconLabel, { color: theme.textSecondary }]}>{site.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* News Section */}
            <View style={styles.newsSection}>
              <View style={styles.newsTitleRow}>
                <Text style={[styles.newsTitle, { color: theme.text }]}>News For You</Text>
                <Text style={styles.seeAllText}>See All</Text>
              </View>
              {newsItems.map((news, index) => (
                <View key={index} style={[styles.newsItem, { backgroundColor: theme.cardBackground, borderBottomColor: theme.separator }]}>
                  <View style={[styles.newsIcon, { backgroundColor: isDarkMode ? '#38383A' : '#F5F5F5' }]}>
                    <Text>📱</Text>
                  </View>
                  <View style={styles.newsContent}>
                    <Text style={[styles.newsItemTitle, { color: theme.text }]}>{news.title}</Text>
                    <Text style={[styles.newsItemSource, { color: theme.textSecondary }]}>
                      {news.source} · {news.time}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {mode === 'Warp' && (
          <>
            {/* RM GROUP PARTNERSHIP Header */}
            <View style={styles.partnershipHeader}>
              <Text style={styles.fireEmoji}>🔥</Text>
              <Text style={[styles.partnershipTitle, { color: theme.text }]}>RM GROUP PARTNERSHIP</Text>
            </View>

            {/* Warp Sites Grid */}
            {brandsLoading ? (
              <View style={[styles.warpIconsGrid, { justifyContent: 'center', alignItems: 'center', minHeight: 150 }]}>
                <ActivityIndicator size="small" color="#FFC837" />
              </View>
            ) : (
            <View style={styles.warpIconsGrid}>
              {warpSites.map((site, index) => (
                <TouchableOpacity 
                  key={site.id || index} 
                  style={styles.warpIconItem}
                  onPress={() => handleBrandPress(site)}
                >
                  <View style={[styles.warpIconBox, { backgroundColor: theme.cardBackground }]}>
                    {site.image ? (
                      <Image
                        source={site.image}
                        style={styles.brandLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFC837' }}>
                        {site.name.slice(0, 2)}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.warpIconLabel, { color: theme.text }]} numberOfLines={1}>{site.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            )}

            {/* WarpDNS Welcome Card */}
            <View style={[styles.warpDnsCard, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.warpDnsTitle, { color: theme.text }]}>Welcome to WarpDNS</Text>
              <Text style={[styles.warpDnsSubtitle, { color: theme.textSecondary }]}>Fast & Secure Browsing</Text>
            </View>

            {/* DNS Section - Dynamic from API */}
            <Text style={[styles.dnsSectionTitle, { color: theme.text }]}>DNS</Text>
            <View style={styles.dnsContainer}>
              {availableDnsServers.map((server) => (
                <TouchableOpacity
                  key={server.id}
                  style={[
                    styles.dnsCard,
                    { backgroundColor: theme.cardBackground },
                    dnsEnabled && selectedDnsServer.id === server.id && { borderColor: '#34C759', borderWidth: 2 }
                  ]}
                  onPress={async () => {
                    try {
                      if (dnsEnabled && selectedDnsServer.id === server.id) {
                        await toggleDns(false);
                      } else {
                        if (dnsEnabled) {
                          await toggleDns(false);
                        }
                        await changeDnsServer(server);
                        await toggleDns(true, server.primary);
                      }
                    } catch (error) {
                      console.error(`Error toggling ${server.name} DNS:`, error);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.dnsInfo}>
                    <Text style={[styles.dnsIp, { color: theme.text }]}>{server.primary}</Text>
                    <Text style={[styles.dnsProvider, { color: theme.textSecondary }]}>{server.name}</Text>
                  </View>
                  <Switch
                    value={dnsEnabled && selectedDnsServer.id === server.id}
                    onValueChange={async (enabled) => {
                      try {
                        if (enabled) {
                          if (dnsEnabled) {
                            await toggleDns(false);
                          }
                          await changeDnsServer(server);
                          await toggleDns(true, server.primary);
                        } else {
                          await toggleDns(false);
                        }
                      } catch (error) {
                        console.error(`Error toggling ${server.name} DNS:`, error);
                      }
                    }}
                    trackColor={{ false: theme.border, true: '#34C759' }}
                    ios_backgroundColor={theme.border}
                    thumbColor="#FFF"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* 7E GAMES Section */}
            <View style={[styles.gamesSection, { backgroundColor: theme.cardBackground }]}>
              <View style={styles.gamesTitleRow}>
                <Text style={[styles.gamesTitle, { color: theme.text }]}>7E GAMES</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Game')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.gamesContainer}>
                <View style={styles.gamesGrid}>
                  {gameProvidersList.slice(0, 6).map((game, index) => (
                    <TouchableOpacity key={game.id || index} style={styles.gameItem}>
                      <View style={[styles.gameIcon, { backgroundColor: isDarkMode ? '#38383A' : '#FFC837' }]}>
                        <Text style={[styles.gameIconText, { color: isDarkMode ? '#FFF' : '#000' }]}>{game.name[0]}</Text>
                      </View>
                      <Text style={[styles.gameLabel, { color: theme.text }]} numberOfLines={1}>{game.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.gamesGrid}>
                  {gameProvidersList.slice(6, 12).map((game, index) => (
                    <TouchableOpacity key={game.id || index} style={styles.gameItem}>
                      <View style={[styles.gameIcon, { backgroundColor: isDarkMode ? '#38383A' : '#FFC837' }]}>
                        <Text style={[styles.gameIconText, { color: isDarkMode ? '#FFF' : '#000' }]}>{game.name[0]}</Text>
                      </View>
                      <Text style={[styles.gameLabel, { color: theme.text }]} numberOfLines={1}>{game.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Welcome Modal */}
      <Modal
        visible={showWelcomeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {}}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.welcomeModal, { backgroundColor: theme.cardBackground }]}>
            <Ionicons name="person-circle-outline" size={80} color="#FFC837" />
            <Text style={[styles.welcomeTitle, { color: theme.text }]}>Welcome to RMGroup Browser!</Text>
            <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
              What should we call you?
            </Text>
            <TextInput
              style={[styles.nameInputField, {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.text
              }]}
              placeholder="Enter your name"
              placeholderTextColor={theme.placeholder}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <TouchableOpacity
              style={[styles.saveNameButton, !nameInput.trim() && styles.saveNameButtonDisabled]}
              onPress={handleSaveName}
              disabled={!nameInput.trim()}
            >
              <Text style={styles.saveNameButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  timeContainer: {
    alignItems: 'flex-start',
    flex: 1,
  },
  timeText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -1.8,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.5)',
    marginTop: 1,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  greetingContainer: {
    marginBottom: 0,
  },
  greetingText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.65)',
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.4,
  },
  modeSelectorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 200, 55, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  modeButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modeButtonText: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.4)',
    fontWeight: '400',
  },
  modeText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.65)',
    marginHorizontal: 8,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  brightnessButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 200, 55, 0.25)',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  brightnessIcon: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
    opacity: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: -6,
    marginBottom: 18,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    padding: 0,
    margin: 0,
    fontWeight: '500',
    letterSpacing: 0.1,
    height: 24,
    lineHeight: 24,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  qrIconContainer: {
    padding: 6,
  },
  qrIcon: {
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  quoteContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(0, 0, 0, 0.7)',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 21,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  quoteAuthor: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.45)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  iconsGrid: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  iconItem: {
    width: '18%',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  iconText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  iconLabel: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0,
  },
  socialIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  socialIcon: {
    width: 40,
    height: 40,
  },
  newsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  newsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  newsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.2,
  },
  seeAllButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  seeAllText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '400',
    letterSpacing: 0,
    opacity: 0.8,
  },
  newsItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  newsIcon: {
    width: 44,
    height: 44,
    backgroundColor: '#F8F8F8',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  newsContent: {
    flex: 1,
  },
  newsItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  newsItemSource: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.45)',
    fontWeight: '500',
    letterSpacing: 0,
  },
  warpDnsCard: {
    backgroundColor: '#1C1C1E',
    marginHorizontal: 20,
    marginBottom: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  warpDnsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  warpDnsSubtitle: {
    fontSize: 12,
    color: '#FFC837',
    fontWeight: '500',
    letterSpacing: 0.05,
    opacity: 0.9,
  },
  partnershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
    marginLeft: 20,
  },
  fireEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  partnershipTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 0.8,
    opacity: 0.75,
  },
  dnsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 20,
    marginBottom: 10,
    letterSpacing: -0.1,
    opacity: 0.8,
  },
  dnsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 8,
  },
  dnsCard: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dnsIp: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  dnsProvider: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },
  dnsInfo: {
    flex: 1,
  },
  gamesSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  gamesTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  gamesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.1,
    opacity: 0.8,
  },
  gamesContainer: {
    gap: 10,
  },
  gamesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  gameItem: {
    alignItems: 'center',
    flex: 1,
  },
  gameIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  gameIconText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    letterSpacing: -0.3,
  },
  gameLabel: {
    fontSize: 9,
    color: '#888',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  warpIconsGrid: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  warpIconItem: {
    width: '20%',
    alignItems: 'center',
    marginBottom: 14,
  },
  warpIconBox: {
    width: 52,
    height: 52,
    backgroundColor: '#FFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  brandLogo: {
    width: '86%',
    height: '86%',
  },
  warpIconLabel: {
    fontSize: 8,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  nameInputField: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
  },
  saveNameButton: {
    width: '100%',
    backgroundColor: '#FFC837',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveNameButtonDisabled: {
    opacity: 0.5,
  },
  saveNameButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});

// Fallback game providers (when API is unavailable)
const FALLBACK_PROVIDERS = [
  { id: '1', name: '918KISS', slug: '918kiss' },
  { id: '2', name: 'MEGA888', slug: 'mega888' },
  { id: '3', name: 'PUSSY888', slug: 'pussy888' },
  { id: '4', name: 'XE88', slug: 'xe88' },
  { id: '5', name: 'JOKER123', slug: 'joker123' },
  { id: '6', name: 'LIVE22', slug: 'live22' },
  { id: '7', name: 'PLAYTECH', slug: 'playtech' },
  { id: '8', name: 'PRAGMATIC', slug: 'pragmatic' },
  { id: '9', name: 'SPADEGAMING', slug: 'spadegaming' },
  { id: '10', name: 'JILI', slug: 'jili' },
  { id: '11', name: 'CQ9', slug: 'cq9' },
  { id: '12', name: 'PG SOFT', slug: 'pg-soft' },
];

// Fallback news items (when API is unavailable)
const FALLBACK_NEWS = [
  { title: 'Welcome to DNS Browser!', source: 'News', time: 'Just now' },
  { title: 'Check in daily to earn bonus points', source: 'Promo', time: '1h ago' },
  { title: 'Invite friends and earn rewards', source: 'News', time: '2h ago' },
];
