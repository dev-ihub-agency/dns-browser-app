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

export default function DNSScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const {
    dnsEnabled,
    selectedDnsServer,
    isVpnConnected,
    toggleDns,
    changeDnsServer,
    availableDnsServers,
  } = useDNS();

  const handleToggleDns = async (enabled) => {
    try {
      if (enabled) {
        // Show VPN permission alert
        Alert.alert(
          'VPN Permission Required',
          'This app needs VPN permission to route DNS queries through secure servers and bypass ISP DNS blocking. Your data will remain private.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Allow',
              onPress: async () => {
                try {
                  await toggleDns(true);
                  Alert.alert('DNS Enabled', `Now using ${selectedDnsServer.name}`);
                } catch (error) {
                  Alert.alert('Error', 'Failed to enable DNS bypass. Please try again.');
                }
              },
            },
          ]
        );
      } else {
        await toggleDns(false);
        Alert.alert('DNS Disabled', 'Using default DNS settings');
      }
    } catch (error) {
      console.error('Error toggling DNS:', error);
    }
  };

  const handleSelectDnsServer = async (server) => {
    try {
      // If DNS is enabled, we need to stop, change server, then restart with explicit DNS
      if (dnsEnabled) {
        await toggleDns(false); // Stop first
        await changeDnsServer(server);
        await toggleDns(true, server.primary); // Start with explicit DNS IP
      } else {
        await changeDnsServer(server);
      }
      Alert.alert('DNS Server Changed', `Now using ${server.name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to change DNS server. Please try again.');
    }
  };

  const DNSServerItem = ({ server, isSelected }) => (
    <TouchableOpacity
      style={[
        styles.dnsServerItem,
        { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
        isSelected && { borderColor: '#FFC837', borderWidth: 2 },
      ]}
      onPress={() => handleSelectDnsServer(server)}
      activeOpacity={0.7}
    >
      <Text style={[styles.serverDns, { color: theme.text }]}>
        {server.primary}
      </Text>
      <Text style={[styles.serverName, { color: theme.textSecondary }]}>{server.name}</Text>
      {isSelected && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark-circle" size={20} color="#FFC837" />
        </View>
      )}
    </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>DNS Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[styles.scrollView, { backgroundColor: theme.background }]}
      >
        {/* DNS Toggle */}
        <View style={[styles.toggleCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.toggleHeader}>
            <View style={[styles.toggleIcon, { backgroundColor: '#4CAF50' + '20' }]}>
              <Ionicons name="shield-checkmark" size={28} color="#4CAF50" />
            </View>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: theme.text }]}>DNS Bypass</Text>
              <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                {dnsEnabled
                  ? `Active - Using ${selectedDnsServer.name}`
                  : 'Access blocked websites'}
              </Text>
            </View>
            <Switch
              value={dnsEnabled}
              onValueChange={handleToggleDns}
              trackColor={{ false: theme.border, true: '#4CAF50' }}
              thumbColor="#FFF"
              ios_backgroundColor={theme.border}
            />
          </View>

          {isVpnConnected && (
            <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' + '15' }]}>
              <View style={styles.statusDot} />
              <Text style={[styles.statusText, { color: '#4CAF50' }]}>
                VPN Connected
              </Text>
            </View>
          )}
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            DNS bypass routes your DNS queries through secure servers to access websites blocked by your ISP.
          </Text>
        </View>

        {/* DNS Servers List */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
          DNS
        </Text>

        <View style={styles.dnsServersRow}>
          {availableDnsServers.map((server) => (
            <DNSServerItem
              key={server.id}
              server={server}
              isSelected={selectedDnsServer.id === server.id}
            />
          ))}
        </View>

        {/* Benefits */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
          BENEFITS
        </Text>

        <View style={[styles.benefitsCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.benefitItem}>
            <Ionicons name="unlock-outline" size={20} color="#4CAF50" />
            <Text style={[styles.benefitText, { color: theme.text }]}>
              Access ISP-blocked websites
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="flash-outline" size={20} color="#FF9800" />
            <Text style={[styles.benefitText, { color: theme.text }]}>
              Faster DNS resolution
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="eye-off-outline" size={20} color="#2196F3" />
            <Text style={[styles.benefitText, { color: theme.text }]}>
              Enhanced privacy
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="shield-outline" size={20} color="#9C27B0" />
            <Text style={[styles.benefitText, { color: theme.text }]}>
              Protection from DNS hijacking
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
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
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  toggleCard: {
    marginHorizontal: 15,
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    marginLeft: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  dnsServersRow: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 10,
  },
  dnsServerItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  serverName: {
    fontSize: 12,
    marginTop: 6,
  },
  serverDns: {
    fontSize: 16,
    fontWeight: '700',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  benefitsCard: {
    marginHorizontal: 15,
    padding: 14,
    borderRadius: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 13,
    marginLeft: 10,
  },
  bottomPadding: {
    height: 30,
  },
});
