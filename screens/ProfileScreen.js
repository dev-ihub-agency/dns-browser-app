import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  Share,
  Linking,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import * as api from '../services/api';

export default function ProfileScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { 
    user, 
    isAuthenticated, 
    isLoading: authLoading,
    login, 
    register, 
    logout, 
    checkIn, 
    getCheckInStatus,
    redeemItem,
    refreshUser,
  } = useAuth();

  // Modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Check-in state
  const [checkInStatus, setCheckInStatus] = useState({
    checkedInToday: false,
    consecutiveDays: 0,
    totalCheckIns: 0,
  });
  const [checkingIn, setCheckingIn] = useState(false);

  // Redemption items
  const [redemptionItems, setRedemptionItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Redemption history
  const [myRedemptions, setMyRedemptions] = useState([]);

  // App config (settings, levels, FAQ)
  const [appConfig, setAppConfig] = useState(null);
  const [faqItems, setFaqItems] = useState([]);

  // Load app config on mount
  useEffect(() => {
    loadAppConfig();
  }, []);

  // Load check-in status when user is logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCheckInStatus();
    }
  }, [isAuthenticated, user]);

  const loadAppConfig = async () => {
    try {
      const config = await api.getAppConfig();
      setAppConfig(config);
      if (config.faqs) {
        setFaqItems(config.faqs);
      }
    } catch (error) {
      console.error('Error loading app config:', error);
    }
  };

  const loadCheckInStatus = async () => {
    try {
      const status = await getCheckInStatus();
      setCheckInStatus({
        checkedInToday: status.checkedInToday || false,
        consecutiveDays: status.consecutiveDays || 0,
        totalCheckIns: status.totalCheckIns || 0,
      });
    } catch (error) {
      console.error('Error loading check-in status:', error);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail) {
      Alert.alert('Error', 'Please enter your email or username');
      return;
    }

    const result = await login(loginEmail);
    if (result.success) {
      setShowLoginModal(false);
      setLoginEmail('');
      Alert.alert('Success', 'Welcome back!');
      loadCheckInStatus();
    } else {
      Alert.alert('Error', result.error || 'Login failed');
    }
  };

  const handleRegister = async () => {
    if (!registerEmail || !registerUsername) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const result = await register(registerUsername, registerEmail, referralCode || null);
    if (result.success) {
      setShowRegisterModal(false);
      setRegisterEmail('');
      setRegisterUsername('');
      setReferralCode('');
      const referralBonus = appConfig?.settings?.points?.referralBonus || 50;
      const bonusMsg = referralCode ? ` You got ${referralBonus} bonus points from referral!` : '';
      Alert.alert('Success', `Welcome ${result.user.username}!${bonusMsg}`);
    } else {
      Alert.alert('Error', result.error || 'Registration failed');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleCheckIn = async () => {
    if (checkInStatus.checkedInToday) {
      Alert.alert('Already Checked In', 'You have already checked in today!');
      return;
    }

    setCheckingIn(true);
    try {
      const result = await checkIn();
      if (result.success) {
        setCheckInStatus({
          checkedInToday: true,
          consecutiveDays: result.consecutiveDays,
          totalCheckIns: result.totalCheckIns,
        });
        Alert.alert(
          'Check-in Success!',
          `Day ${result.consecutiveDays}\n+${result.pointsEarned} points\nTotal: ${result.totalPoints} points`
        );
      } else {
        Alert.alert('Error', result.error || 'Check-in failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleInviteFriend = async () => {
    try {
      await Share.share({
        message: `Join WarpDNS using my referral code: ${user.referralCode}\nDownload now and get bonus points!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyReferralCode = async () => {
    try {
      await Clipboard.setStringAsync(user.referralCode);
      Alert.alert('Copied!', `Referral code ${user.referralCode} copied to clipboard`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      Alert.alert('Error', 'Failed to copy referral code');
    }
  };

  const loadRedemptionItems = async () => {
    setLoadingItems(true);
    try {
      const items = await api.getRedemptionItems();
      setRedemptionItems(items || []);
    } catch (error) {
      console.error('Error loading redemption items:', error);
      // Use fallback items
      setRedemptionItems(FALLBACK_REDEEM_ITEMS);
    } finally {
      setLoadingItems(false);
    }
  };

  const loadMyRedemptions = async () => {
    try {
      const redemptions = await api.getMyRedemptions();
      setMyRedemptions(redemptions || []);
    } catch (error) {
      console.error('Error loading redemptions:', error);
    }
  };

  const openRedeemModal = () => {
    loadRedemptionItems();
    setShowRedeemModal(true);
  };

  const openRewardsModal = () => {
    loadMyRedemptions();
    setShowRewardsModal(true);
  };

  const handleRedeemItem = (item) => {
    if (user.points < item.pointsCost) {
      Alert.alert(
        'Insufficient Points',
        `You need ${item.pointsCost - user.points} more points to redeem this item.`
      );
      return;
    }

    Alert.alert(
      'Confirm Redeem',
      `Redeem ${item.name} for ${item.pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            const result = await redeemItem(item.id);
            if (result.success) {
              Alert.alert('Success', 'Redemption request submitted! Our team will process it shortly.');
              setShowRedeemModal(false);
            } else {
              Alert.alert('Error', result.error || 'Redemption failed');
            }
          },
        },
      ]
    );
  };

  const getLevelInfo = (points) => {
    // Use dynamic levels from config, with fallback
    const levels = appConfig?.levels || {
      bronze: { name: 'Bronze', minPoints: 0, color: '#CD7F32' },
      silver: { name: 'Silver', minPoints: 500, color: '#C0C0C0' },
      gold: { name: 'Gold', minPoints: 1500, color: '#FFD700' },
      platinum: { name: 'Platinum', minPoints: 3000, color: '#E5E4E2' },
    };
    
    const levelOrder = ['bronze', 'silver', 'gold', 'platinum'];
    let currentLevel = levels.bronze;
    let nextThreshold = levels.silver?.minPoints || 500;
    
    for (let i = levelOrder.length - 1; i >= 0; i--) {
      const key = levelOrder[i];
      if (levels[key] && points >= levels[key].minPoints) {
        currentLevel = levels[key];
        const nextKey = levelOrder[i + 1];
        nextThreshold = nextKey && levels[nextKey] ? levels[nextKey].minPoints : null;
        break;
      }
    }
    
    return { 
      level: levelOrder.indexOf(Object.keys(levels).find(k => levels[k] === currentLevel)) + 1,
      name: currentLevel.name, 
      color: currentLevel.color, 
      next: nextThreshold 
    };
  };

  // Loading state
  if (authLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#FFC837" />
      </View>
    );
  }

  // Guest View
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        </View>

        <View style={styles.guestContainer}>
          <Ionicons name="person-circle-outline" size={100} color={theme.icon} />
          <Text style={[styles.guestTitle, { color: theme.text }]}>Welcome to WARP</Text>
          <Text style={[styles.guestSubtitle, { color: theme.textSecondary }]}>
            Login or register to unlock all features
          </Text>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: '#FFC837' }]}
            onPress={() => setShowLoginModal(true)}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.registerButton, { borderColor: '#FFC837' }]}
            onPress={() => setShowRegisterModal(true)}
          >
            <Text style={[styles.registerButtonText, { color: '#FFC837' }]}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Login Modal */}
        <Modal
          visible={showLoginModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowLoginModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Login</Text>
                <TouchableOpacity onPress={() => setShowLoginModal(false)}>
                  <Ionicons name="close" size={28} color={theme.icon} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder="Email or Username"
                placeholderTextColor={theme.placeholder}
                value={loginEmail}
                onChangeText={setLoginEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#FFC837' }]}
                onPress={handleLogin}
              >
                <Text style={styles.submitButtonText}>Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowLoginModal(false);
                  setShowRegisterModal(true);
                }}
              >
                <Text style={[styles.switchModalText, { color: theme.textSecondary }]}>
                  Don't have an account? <Text style={{ color: '#FFC837' }}>Register</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Register Modal */}
        <Modal
          visible={showRegisterModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowRegisterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Create Account</Text>
                <TouchableOpacity onPress={() => setShowRegisterModal(false)}>
                  <Ionicons name="close" size={28} color={theme.icon} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder="Username"
                placeholderTextColor={theme.placeholder}
                value={registerUsername}
                onChangeText={setRegisterUsername}
                autoCapitalize="none"
              />

              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder="Email"
                placeholderTextColor={theme.placeholder}
                value={registerEmail}
                onChangeText={setRegisterEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder="Referral Code (Optional)"
                placeholderTextColor={theme.placeholder}
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#FFC837' }]}
                onPress={handleRegister}
              >
                <Text style={styles.submitButtonText}>Create Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowRegisterModal(false);
                  setShowLoginModal(true);
                }}
              >
                <Text style={[styles.switchModalText, { color: theme.textSecondary }]}>
                  Already have an account? <Text style={{ color: '#FFC837' }}>Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Logged In View
  const levelInfo = getLevelInfo(user.points || 0);
  const progress = levelInfo.next ? ((user.points || 0) / levelInfo.next) * 100 : 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={theme.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View style={[styles.userCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.userHeader}>
            <View style={[styles.avatar, { backgroundColor: levelInfo.color }]}>
              <Text style={styles.avatarText}>{(user.username || 'U').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.username, { color: theme.text }]}>{user.username}</Text>
              <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user.email}</Text>
              <View style={styles.levelBadge}>
                <Text style={[styles.levelText, { color: levelInfo.color }]}>{levelInfo.name}</Text>
              </View>
            </View>
          </View>

          {/* Points & Progress */}
          <View style={styles.pointsContainer}>
            <View style={styles.pointsRow}>
              <Text style={[styles.pointsLabel, { color: theme.textSecondary }]}>Total Points</Text>
              <Text style={[styles.pointsValue, { color: '#FFC837' }]}>{user.points || 0}</Text>
            </View>
            {levelInfo.next && (
              <>
                <View style={[styles.progressBar, { backgroundColor: theme.inputBackground }]}>
                  <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: levelInfo.color }]} />
                </View>
                <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                  {levelInfo.next - (user.points || 0)} points to next level
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Check-in Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="calendar" size={24} color="#FFC837" />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Daily Check-in</Text>
            </View>
            {checkInStatus.consecutiveDays > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={16} color="#FF6B35" />
                <Text style={styles.streakText}>{checkInStatus.consecutiveDays} days</Text>
              </View>
            )}
          </View>

          <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
            Check in daily to earn points. Consecutive check-ins earn more!
          </Text>

          <TouchableOpacity
            style={[
              styles.checkInButton,
              { backgroundColor: !checkInStatus.checkedInToday ? '#FFC837' : theme.inputBackground }
            ]}
            onPress={handleCheckIn}
            disabled={checkInStatus.checkedInToday || checkingIn}
          >
            {checkingIn ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={[styles.checkInButtonText, { color: !checkInStatus.checkedInToday ? '#000' : theme.textSecondary }]}>
                {!checkInStatus.checkedInToday ? 'Check In Now' : 'Already Checked In Today'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Referral Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <MaterialCommunityIcons name="account-multiple" size={24} color="#4CAF50" />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Invite Friends</Text>
            </View>
          </View>

          <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
            Invite friends and earn {appConfig?.settings?.points?.referralBonus || 50} points for each signup!
          </Text>

          <View style={[styles.referralCodeContainer, { backgroundColor: theme.inputBackground }]}>
            <Text style={[styles.referralCode, { color: theme.text }]}>{user.referralCode}</Text>
            <TouchableOpacity onPress={handleCopyReferralCode}>
              <Ionicons name="copy-outline" size={24} color="#FFC837" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.inviteButton, { backgroundColor: '#4CAF50' }]}
            onPress={handleInviteFriend}
          >
            <Ionicons name="share-social" size={20} color="#FFF" />
            <Text style={styles.inviteButtonText}>Share Referral Code</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="stats-chart" size={24} color="#2196F3" />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Statistics</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{user.points || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{user.totalPointsEarned || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Points Earned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{checkInStatus.consecutiveDays}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Streak Days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{levelInfo.level}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Level</Text>
            </View>
          </View>
        </View>

        {/* Settings Options */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <TouchableOpacity style={styles.settingItem} onPress={openRewardsModal}>
            <View style={styles.settingLeft}>
              <Ionicons name="trophy-outline" size={24} color="#FF9800" />
              <Text style={[styles.settingText, { color: theme.text }]}>My Redemptions</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.icon} />
          </TouchableOpacity>

          <View style={[styles.settingDivider, { backgroundColor: theme.inputBorder }]} />

          <TouchableOpacity style={styles.settingItem} onPress={openRedeemModal}>
            <View style={styles.settingLeft}>
              <Ionicons name="gift-outline" size={24} color="#E91E63" />
              <Text style={[styles.settingText, { color: theme.text }]}>Redeem Points</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.icon} />
          </TouchableOpacity>

          <View style={[styles.settingDivider, { backgroundColor: theme.inputBorder }]} />

          <TouchableOpacity style={styles.settingItem} onPress={() => setShowHelpModal(true)}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#9C27B0" />
              <Text style={[styles.settingText, { color: theme.text }]}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.icon} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Redeem Points Modal */}
      <Modal
        visible={showRedeemModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRedeemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.redeemModalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Redeem Points</Text>
              <TouchableOpacity onPress={() => setShowRedeemModal(false)}>
                <Ionicons name="close" size={28} color={theme.icon} />
              </TouchableOpacity>
            </View>

            <View style={[styles.pointsBalanceCard, { backgroundColor: theme.inputBackground }]}>
              <Text style={[styles.pointsBalanceLabel, { color: theme.textSecondary }]}>Available Points</Text>
              <Text style={[styles.pointsBalanceValue, { color: '#FFC837' }]}>{user.points || 0}</Text>
            </View>

            {loadingItems ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFC837" />
              </View>
            ) : (
              <ScrollView style={styles.redeemList} showsVerticalScrollIndicator={false}>
                {redemptionItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.redeemItem, { backgroundColor: theme.inputBackground }]}
                    onPress={() => handleRedeemItem(item)}
                  >
                    <View style={styles.redeemItemLeft}>
                      <View style={[styles.redeemIcon, { backgroundColor: '#FFC837' + '20' }]}>
                        <Text style={styles.redeemEmoji}>{item.brand?.charAt(0) || '🎁'}</Text>
                      </View>
                      <View style={styles.redeemInfo}>
                        <Text style={[styles.redeemBrand, { color: theme.text }]}>{item.brand || item.name}</Text>
                        <Text style={[styles.redeemDescription, { color: theme.textSecondary }]}>
                          {item.description || item.name}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.redeemRight}>
                      <View style={[styles.redeemPointsBadge, { backgroundColor: '#FFC837' }]}>
                        <Text style={styles.redeemPointsText}>{item.pointsCost}</Text>
                        <Ionicons name="star" size={14} color="#FFF" style={{ marginLeft: 2 }} />
                      </View>
                      {(user.points || 0) >= item.pointsCost ? (
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={{ marginTop: 4 }} />
                      ) : (
                        <Ionicons name="lock-closed" size={18} color={theme.textTertiary} style={{ marginTop: 4 }} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={[styles.redeemNotice, { backgroundColor: theme.inputBackground }]}>
              <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
              <Text style={[styles.redeemNoticeText, { color: theme.textSecondary }]}>
                Redemption requests will be processed by our support team
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* My Redemptions Modal */}
      <Modal
        visible={showRewardsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRewardsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.redeemModalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>My Redemptions</Text>
              <TouchableOpacity onPress={() => setShowRewardsModal(false)}>
                <Ionicons name="close" size={28} color={theme.icon} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.redeemList} showsVerticalScrollIndicator={false}>
              {myRedemptions.length === 0 ? (
                <View style={styles.emptyRewardsContainer}>
                  <Ionicons name="trophy-outline" size={48} color={theme.placeholder} />
                  <Text style={[styles.emptyRewardsText, { color: theme.textSecondary }]}>
                    No redemptions yet
                  </Text>
                  <Text style={[styles.emptyRewardsSubtext, { color: theme.textTertiary }]}>
                    Redeem your points for rewards!
                  </Text>
                </View>
              ) : (
                myRedemptions.map((redemption) => (
                  <View
                    key={redemption.id}
                    style={[styles.rewardHistoryItem, { backgroundColor: theme.inputBackground }]}
                  >
                    <View style={styles.rewardHistoryLeft}>
                      <View style={[styles.rewardHistoryIcon, { backgroundColor: getStatusColor(redemption.status) + '20' }]}>
                        <Ionicons
                          name={getStatusIcon(redemption.status)}
                          size={20}
                          color={getStatusColor(redemption.status)}
                        />
                      </View>
                      <View style={styles.rewardHistoryInfo}>
                        <Text style={[styles.rewardHistoryDesc, { color: theme.text }]}>
                          {redemption.item?.name || 'Redemption'}
                        </Text>
                        <Text style={[styles.rewardHistoryDate, { color: theme.textSecondary }]}>
                          {new Date(redemption.requestDate).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.rewardHistoryRight}>
                      <Text style={[styles.rewardHistoryPoints, { color: '#FF9800' }]}>
                        -{redemption.pointsCost}
                      </Text>
                      <Text style={[styles.rewardStatus, { color: getStatusColor(redemption.status) }]}>
                        {redemption.status}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.helpModalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Help & Support</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Ionicons name="close" size={28} color={theme.icon} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.helpList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.helpItem, { backgroundColor: theme.inputBackground }]}
                onPress={() => Linking.openURL(`https://t.me/${appConfig?.settings?.general?.supportTelegram || 'WarpDNS_Support'}`)}
              >
                <View style={styles.helpItemLeft}>
                  <View style={[styles.helpIcon, { backgroundColor: '#0088cc' + '20' }]}>
                    <Ionicons name="paper-plane" size={24} color="#0088cc" />
                  </View>
                  <View style={styles.helpInfo}>
                    <Text style={[styles.helpTitle, { color: theme.text }]}>Telegram Support</Text>
                    <Text style={[styles.helpDescription, { color: theme.textSecondary }]}>
                      Contact us on Telegram
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.icon} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.helpItem, { backgroundColor: theme.inputBackground }]}
                onPress={() => Linking.openURL(`mailto:${appConfig?.settings?.general?.supportEmail || 'support@warpdns.com'}`)}
              >
                <View style={styles.helpItemLeft}>
                  <View style={[styles.helpIcon, { backgroundColor: '#EA4335' + '20' }]}>
                    <Ionicons name="mail" size={24} color="#EA4335" />
                  </View>
                  <View style={styles.helpInfo}>
                    <Text style={[styles.helpTitle, { color: theme.text }]}>Email Support</Text>
                    <Text style={[styles.helpDescription, { color: theme.textSecondary }]}>
                      {appConfig?.settings?.general?.supportEmail || 'support@warpdns.com'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.icon} />
              </TouchableOpacity>

              <View style={[styles.helpSection, { backgroundColor: theme.inputBackground }]}>
                <Text style={[styles.helpSectionTitle, { color: theme.text }]}>FAQ</Text>

                {(faqItems.length > 0 ? faqItems : FALLBACK_FAQ).map((faq, index) => (
                  <View key={faq.id || index} style={styles.faqItem}>
                    <Text style={[styles.faqQuestion, { color: theme.text }]}>
                      {faq.question}
                    </Text>
                    <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                      {faq.answer}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper functions
function getStatusColor(status) {
  const colors = {
    pending: '#FF9800',
    approved: '#4CAF50',
    completed: '#2196F3',
    rejected: '#F44336',
  };
  return colors[status] || '#888';
}

function getStatusIcon(status) {
  const icons = {
    pending: 'time-outline',
    approved: 'checkmark-circle-outline',
    completed: 'checkmark-done-circle-outline',
    rejected: 'close-circle-outline',
  };
  return icons[status] || 'help-circle-outline';
}

// Fallback redemption items
const FALLBACK_REDEEM_ITEMS = [
  { id: '1', brand: 'MissAV', name: '7-Day Premium Access', pointsCost: 500 },
  { id: '2', brand: 'Pornhub', name: '30-Day Premium Access', pointsCost: 1000 },
  { id: '3', brand: 'OnlyFans', name: '$20 Free Credit', pointsCost: 800 },
  { id: '4', brand: 'Stripchat', name: '500 Tokens', pointsCost: 600 },
  { id: '5', brand: 'Chaturbate', name: '1000 Tokens', pointsCost: 1200 },
  { id: '6', brand: 'Brazzers', name: '14-Day Premium Pass', pointsCost: 700 },
];

// Fallback FAQ items
const FALLBACK_FAQ = [
  {
    id: '1',
    question: 'How do I earn points?',
    answer: 'You can earn points by daily check-ins, inviting friends, and completing tasks.',
  },
  {
    id: '2',
    question: 'How do I redeem my points?',
    answer: 'Go to Profile → Redeem Points and select the reward you want. Our support team will process your request.',
  },
  {
    id: '3',
    question: 'Is my browsing data safe?',
    answer: 'Yes! We use private mode and advanced anti-tracking features to protect your privacy.',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  guestSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  loginButton: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  registerButton: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  registerButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '88%',
    borderRadius: 14,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    marginBottom: 10,
  },
  submitButton: {
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  switchModalText: {
    fontSize: 13,
    textAlign: 'center',
  },
  userCard: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 12,
    marginBottom: 6,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 200, 55, 0.1)',
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pointsContainer: {
    marginTop: 8,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pointsLabel: {
    fontSize: 13,
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 17,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 3,
  },
  checkInButton: {
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkInButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  referralCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  referralCode: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 2,
  },
  inviteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 10,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 14,
    marginLeft: 10,
  },
  settingDivider: {
    height: 1,
    marginVertical: 3,
  },
  redeemModalContent: {
    width: '88%',
    height: '70%',
    borderRadius: 14,
    padding: 16,
  },
  pointsBalanceCard: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  pointsBalanceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  pointsBalanceValue: {
    fontSize: 26,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redeemList: {
    flex: 1,
    marginBottom: 10,
  },
  redeemItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  redeemItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  redeemIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  redeemEmoji: {
    fontSize: 20,
  },
  redeemInfo: {
    flex: 1,
  },
  redeemBrand: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  redeemDescription: {
    fontSize: 11,
  },
  redeemRight: {
    alignItems: 'flex-end',
  },
  redeemPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  redeemPointsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  redeemNotice: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  redeemNoticeText: {
    fontSize: 10,
    marginLeft: 6,
    flex: 1,
    lineHeight: 14,
  },
  rewardHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  rewardHistoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rewardHistoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rewardHistoryInfo: {
    flex: 1,
  },
  rewardHistoryDesc: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  rewardHistoryDate: {
    fontSize: 11,
  },
  rewardHistoryRight: {
    alignItems: 'flex-end',
  },
  rewardHistoryPoints: {
    fontSize: 16,
    fontWeight: '700',
  },
  rewardStatus: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  helpModalContent: {
    width: '88%',
    height: '70%',
    borderRadius: 14,
    padding: 16,
  },
  helpList: {
    flex: 1,
  },
  helpItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  helpItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helpIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpInfo: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  helpDescription: {
    fontSize: 12,
  },
  helpSection: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  helpSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  faqItem: {
    marginBottom: 14,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
  },
  emptyRewardsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyRewardsText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyRewardsSubtext: {
    fontSize: 13,
    marginTop: 4,
  },
});
