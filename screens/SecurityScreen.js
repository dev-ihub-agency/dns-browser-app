import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { useDNS } from '../DNSContext';
import { usePassword } from '../PasswordContext';

export default function SecurityScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { dnsEnabled, selectedDnsServer } = useDNS();
  const { passwordSettings, updatePasswordSettings, clearAllPasswords, getPasswordCount } = usePassword();

  const handleClearPasswords = () => {
    const passwordCount = getPasswordCount();

    if (passwordCount === 0) {
      Alert.alert('No Passwords', 'There are no saved passwords to clear.');
      return;
    }

    Alert.alert(
      'Clear Saved Passwords',
      `This will delete all ${passwordCount} saved password(s). Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllPasswords();
            if (success) {
              Alert.alert('Success', 'All saved passwords have been cleared');
            } else {
              Alert.alert('Error', 'Failed to clear passwords');
            }
          }
        }
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
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textTertiary }]}>{subtitle}</Text>}
      </View>
      {type === 'toggle' ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: theme.border, true: '#FFC837' }}
          thumbColor="#FFF"
          ios_backgroundColor={theme.border}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#666' : '#CCC'} />
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={[styles.scrollView, { backgroundColor: theme.background }]}>
        {/* DNS Settings */}
        <SectionHeader title="DNS BYPASS" />
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.separator }]}
            onPress={() => navigation.navigate('DNS')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#38383A' : '#F8F8F8' }]}>
              <Ionicons name="shield-checkmark" size={20} color={dnsEnabled ? '#4CAF50' : theme.icon} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>DNS Settings</Text>
              <Text style={[styles.settingSubtitle, { color: theme.textTertiary }]}>
                {dnsEnabled ? `Active - ${selectedDnsServer.name}` : 'Access blocked websites'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#666' : '#CCC'} />
          </TouchableOpacity>
        </View>

        {/* Password Management */}
        <SectionHeader title="PASSWORD MANAGEMENT" />
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <SettingItem
            icon="key-outline"
            title="Save Passwords"
            subtitle="Offer to save passwords when you log in"
            value={passwordSettings.savePasswords}
            onToggle={(value) => updatePasswordSettings({ savePasswords: value })}
          />
          <SettingItem
            icon="finger-print-outline"
            title="Autofill Passwords"
            subtitle="Automatically fill in saved passwords"
            value={passwordSettings.autofillPasswords}
            onToggle={(value) => updatePasswordSettings({ autofillPasswords: value })}
          />
          <SettingItem
            icon="eye-outline"
            title="Show Passwords"
            subtitle="Display passwords while typing"
            value={passwordSettings.showPasswords}
            onToggle={(value) => updatePasswordSettings({ showPasswords: value })}
          />
          <SettingItem
            icon="trash-outline"
            title="Clear Saved Passwords"
            subtitle="Delete all saved passwords"
            type="arrow"
            onToggle={handleClearPasswords}
          />
        </View>

        {/* Autofill Settings */}
        <SectionHeader title="AUTOFILL" />
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <SettingItem
            icon="document-text-outline"
            title="Autofill Forms"
            subtitle="Fill in forms automatically"
            value={passwordSettings.autofillForms}
            onToggle={(value) => updatePasswordSettings({ autofillForms: value })}
          />
          <SettingItem
            icon="card-outline"
            title="Payment Methods"
            subtitle="Manage saved payment methods"
            type="arrow"
            onToggle={() => Alert.alert('Payment Methods', 'Payment methods management coming soon')}
          />
          <SettingItem
            icon="location-outline"
            title="Addresses"
            subtitle="Manage saved addresses"
            type="arrow"
            onToggle={() => Alert.alert('Addresses', 'Address management coming soon')}
          />
        </View>

        {/* Security Info */}
        <View style={[styles.infoBox, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="information-circle" size={24} color="#FFC837" />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Your passwords and autofill data are encrypted and stored securely on your device only.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC837',
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
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 36,
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 30,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginLeft: 12,
  },
});
