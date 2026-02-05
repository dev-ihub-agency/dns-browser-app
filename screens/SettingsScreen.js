import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useData } from '../DataContext';
import { useTheme } from '../ThemeContext';

const SETTINGS_KEY = '@dns_browser_app_settings';

export default function SettingsScreen({ navigation }) {
  const { clearHistory, privateMode, setPrivateMode, username, saveUsername } = useData();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Load settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.notifications !== undefined) setNotifications(settings.notifications);
          if (settings.autoplay !== undefined) setAutoplay(settings.autoplay);
          if (settings.saveData !== undefined) setSaveData(settings.saveData);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Save settings when they change
  const saveSettings = async (key, value) => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      const settings = savedSettings ? JSON.parse(savedSettings) : {};
      settings[key] = value;
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleNotificationsChange = (value) => {
    setNotifications(value);
    saveSettings('notifications', value);
  };

  const handleAutoplayChange = (value) => {
    setAutoplay(value);
    saveSettings('autoplay', value);
  };

  const handleSaveDataChange = (value) => {
    setSaveData(value);
    saveSettings('saveData', value);
  };

  const handleClearBrowsingData = () => {
    Alert.alert(
      'Clear Browsing Data',
      'This will delete your browsing history. Bookmarks will not be affected. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            Alert.alert('Success', 'Browsing history has been cleared');
          }
        }
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your browsing data will be preserved.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await saveUsername('');
            Alert.alert('Signed Out', 'You have been signed out successfully');
          }
        }
      ]
    );
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate VPN RM GROUP',
      'Thank you for your support! Would you like to rate us on the app store?',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Rate Now', onPress: () => {
          // In production, this would open the app store
          Alert.alert('Thank you!', 'App store link would open here');
        }}
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, value, onToggle, type = 'toggle' }) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: theme.separator }]}
      onPress={type === 'arrow' ? onToggle : null}
      activeOpacity={type === 'arrow' ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#38383A' : '#F8F8F8' }]}>
        <Ionicons name={icon} size={20} color={theme.icon} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      {type === 'toggle' ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor="#FFF"
          ios_backgroundColor={theme.border}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>{title}</Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.headerBackground }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={[styles.scrollView, { backgroundColor: theme.background }]}>
        {/* Appearance Section */}
        <SectionHeader title="APPEARANCE" />
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Enable dark theme"
            value={isDarkMode}
            onToggle={toggleTheme}
          />
        </View>

        {/* Privacy Section */}
        <SectionHeader title="PRIVACY & SECURITY" />
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <SettingItem
            icon="eye-off-outline"
            title="Private Browsing"
            subtitle="Don't save history and cookies"
            value={privateMode}
            onToggle={setPrivateMode}
          />
          <SettingItem
            icon="trash-outline"
            title="Clear Browsing Data"
            subtitle="History, cache, cookies"
            type="arrow"
            onToggle={handleClearBrowsingData}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Security"
            subtitle="Passwords and autofill"
            type="arrow"
            onToggle={() => navigation.navigate('Security')}
          />
        </View>

        {/* General Section */}
        <SectionHeader title="GENERAL" />
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <SettingItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Push notifications"
            value={notifications}
            onToggle={handleNotificationsChange}
          />
          <SettingItem
            icon="play-circle-outline"
            title="Autoplay Videos"
            subtitle="Play videos automatically"
            value={autoplay}
            onToggle={handleAutoplayChange}
          />
          <SettingItem
            icon="cloud-download-outline"
            title="Save Data"
            subtitle="Reduce data usage"
            value={saveData}
            onToggle={handleSaveDataChange}
          />
          <SettingItem
            icon="download-outline"
            title="Downloads"
            subtitle="Manage download settings"
            type="arrow"
            onToggle={() => navigation.navigate('DownloadsManagement')}
          />
        </View>

        {/* About Section */}
        <SectionHeader title="ABOUT" />
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <SettingItem
            icon="information-circle-outline"
            title="About VPN RM GROUP"
            subtitle="Version 1.0.0"
            type="arrow"
            onToggle={() => setShowAboutModal(true)}
          />
          <SettingItem
            icon="help-circle-outline"
            title="Help & Support"
            type="arrow"
            onToggle={() => setShowHelpModal(true)}
          />
          <SettingItem
            icon="star-outline"
            title="Rate App"
            type="arrow"
            onToggle={handleRateApp}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.cardBackground }]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#E53238" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textTertiary }]}>VPN RM GROUP v1.0.0</Text>
        </View>
      </ScrollView>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.aboutModal}>
            <Ionicons name="globe" size={60} color="#FFC837" />
            <Text style={styles.aboutTitle}>VPN RM GROUP</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            <Text style={styles.aboutDescription}>
              A fast and secure browser built with React Native. Browse the web with confidence and privacy.
            </Text>
            <View style={styles.aboutInfo}>
              <Text style={styles.aboutInfoText}>• WebView powered browsing</Text>
              <Text style={styles.aboutInfoText}>• Private mode support</Text>
              <Text style={styles.aboutInfoText}>• Bookmark management</Text>
              <Text style={styles.aboutInfoText}>• History tracking</Text>
            </View>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowAboutModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={showHelpModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.helpModal}>
            <Ionicons name="help-circle" size={60} color="#FFC837" />
            <Text style={styles.helpTitle}>Help & Support</Text>
            <Text style={styles.helpDescription}>
              Need assistance? We're here to help!
            </Text>
            <View style={styles.helpOptions}>
              <TouchableOpacity
                style={styles.helpOption}
                onPress={() => {
                  setShowHelpModal(false);
                  Alert.alert('FAQ', 'Frequently Asked Questions will be available soon!');
                }}
              >
                <Ionicons name="document-text-outline" size={24} color="#666" />
                <Text style={styles.helpOptionText}>FAQ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.helpOption}
                onPress={() => {
                  setShowHelpModal(false);
                  Linking.openURL('mailto:support@rmgroup.com');
                }}
              >
                <Ionicons name="mail-outline" size={24} color="#666" />
                <Text style={styles.helpOptionText}>Email Support</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.helpOption}
                onPress={() => {
                  setShowHelpModal(false);
                  Alert.alert('Report Bug', 'Bug reporting feature coming soon!');
                }}
              >
                <Ionicons name="bug-outline" size={24} color="#666" />
                <Text style={styles.helpOptionText}>Report Bug</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC837',
  },
  header: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E53238',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  aboutModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  aboutDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  aboutInfo: {
    width: '100%',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  aboutInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  helpModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  helpDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  helpOptions: {
    width: '100%',
    marginBottom: 20,
  },
  helpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  helpOptionText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    marginLeft: 12,
  },
  closeModalButton: {
    backgroundColor: '#FFC837',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
