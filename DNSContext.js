import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VpnBridge from './VpnBridge';
import { getDnsServers } from './services/api';

const DNSContext = createContext();

const DNS_ENABLED_KEY = '@dns_browser_dns_enabled';
const DNS_SERVER_KEY = '@dns_browser_dns_server';

// Fallback DNS servers (used when API is unavailable)
const FALLBACK_DNS_SERVERS = [
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    primary: '1.1.1.1',
    secondary: '1.0.0.1',
    description: 'Fast and privacy-focused',
    icon: 'cloud-outline',
    color: '#F6821F',
  },
  {
    id: 'google',
    name: 'Google',
    primary: '8.8.8.8',
    secondary: '8.8.4.4',
    description: 'Reliable and fast',
    icon: 'logo-google',
    color: '#4285F4',
  },
];

// Helper to get icon based on DNS name
const getDnsIcon = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('cloudflare')) return { icon: 'cloud-outline', color: '#F6821F' };
  if (lowerName.includes('google')) return { icon: 'logo-google', color: '#4285F4' };
  if (lowerName.includes('opendns')) return { icon: 'shield-outline', color: '#FF6600' };
  if (lowerName.includes('quad9')) return { icon: 'lock-closed-outline', color: '#4A90D9' };
  return { icon: 'globe-outline', color: '#666666' };
};

export function DNSProvider({ children }) {
  const [dnsEnabled, setDnsEnabled] = useState(false);
  const [selectedDnsServer, setSelectedDnsServer] = useState(FALLBACK_DNS_SERVERS[0]); // Default: Cloudflare
  const [isVpnConnected, setIsVpnConnected] = useState(false);
  const [availableDnsServers, setAvailableDnsServers] = useState(FALLBACK_DNS_SERVERS);
  const [isLoading, setIsLoading] = useState(true);

  // Load DNS servers from API and settings from AsyncStorage
  useEffect(() => {
    const loadDnsData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch DNS servers from API
        let servers = FALLBACK_DNS_SERVERS;
        try {
          const apiServers = await getDnsServers();
          if (apiServers && apiServers.length > 0) {
            // Filter only active servers and map to our format
            servers = apiServers
              .filter(s => s.status === 'active')
              .map(s => {
                const iconInfo = getDnsIcon(s.name);
                return {
                  id: s.id,
                  name: s.name,
                  primary: s.primary,
                  secondary: s.secondary,
                  description: s.description || '',
                  icon: iconInfo.icon,
                  color: iconInfo.color,
                  isDefault: s.isDefault,
                };
              });
            
            // If no active servers, use fallback
            if (servers.length === 0) {
              servers = FALLBACK_DNS_SERVERS;
            }
          }
        } catch (apiError) {
          console.log('Failed to fetch DNS servers from API, using fallback:', apiError);
        }
        
        setAvailableDnsServers(servers);
        
        // Load saved settings
        const savedEnabled = await AsyncStorage.getItem(DNS_ENABLED_KEY);
        const savedServerId = await AsyncStorage.getItem(DNS_SERVER_KEY);

        // Find default server (first one with isDefault=true, or first in list)
        let defaultServer = servers.find(s => s.isDefault) || servers[0];
        let server = defaultServer;
        
        if (savedServerId) {
          const foundServer = servers.find(s => s.id === savedServerId);
          if (foundServer) {
            server = foundServer;
          }
        }
        
        setSelectedDnsServer(server);

        // Check if DNS was enabled in saved state
        if (savedEnabled === 'true') {
          // VPN was enabled before - check actual VPN status
          const vpnStatus = await VpnBridge.getVpnStatus();
          
          if (vpnStatus.connected) {
            // VPN is actually running
            setDnsEnabled(true);
            setIsVpnConnected(true);
          } else {
            // VPN is not running but was saved as enabled
            // Reset the saved state to false (VPN was closed externally)
            console.log('VPN was closed externally, resetting state');
            await AsyncStorage.setItem(DNS_ENABLED_KEY, 'false');
            setDnsEnabled(false);
            setIsVpnConnected(false);
          }
        } else {
          setDnsEnabled(false);
          setIsVpnConnected(false);
        }
      } catch (error) {
        console.error('Error loading DNS data:', error);
        // On error, reset to safe state
        setDnsEnabled(false);
        setIsVpnConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadDnsData();
  }, []);

  // Save DNS enabled state
  // dnsServerOverride allows passing DNS directly to ensure correct server is used
  const toggleDns = async (enabled, dnsServerOverride = null) => {
    try {
      await AsyncStorage.setItem(DNS_ENABLED_KEY, enabled.toString());
      setDnsEnabled(enabled);

      if (enabled) {
        // Start VPN service with optional DNS override
        await startVpnService(dnsServerOverride);
      } else {
        // Stop VPN service
        await stopVpnService();
      }
    } catch (error) {
      console.error('Error toggling DNS:', error);
      throw error;
    }
  };

  // Save selected DNS server
  const changeDnsServer = async (server) => {
    try {
      await AsyncStorage.setItem(DNS_SERVER_KEY, server.id);
      setSelectedDnsServer(server);

      // If DNS is enabled, restart VPN with new server
      if (dnsEnabled) {
        await stopVpnService();
        // Pass the new server directly to ensure it uses the correct DNS
        await startVpnService(server.primary);
      }
    } catch (error) {
      console.error('Error changing DNS server:', error);
      throw error;
    }
  };

  // Start VPN service with selected DNS
  // dnsServerOverride allows passing DNS directly when switching servers
  const startVpnService = async (dnsServerOverride = null) => {
    try {
      const dnsToUse = dnsServerOverride || selectedDnsServer.primary;
      console.log(`Starting VPN with DNS: ${dnsToUse}`);

      // Call VPN bridge to start VPN service
      const success = await VpnBridge.startVpn(dnsToUse);

      if (success) {
        setIsVpnConnected(true);
        return { success: true, message: 'VPN started successfully' };
      } else {
        throw new Error('Failed to start VPN');
      }
    } catch (error) {
      console.error('Error starting VPN service:', error);
      setIsVpnConnected(false);
      throw error;
    }
  };

  // Stop VPN service
  const stopVpnService = async () => {
    try {
      console.log('Stopping VPN service');

      // Call VPN bridge to stop VPN service
      const success = await VpnBridge.stopVpn();

      if (success) {
        setIsVpnConnected(false);
        return { success: true, message: 'VPN stopped successfully' };
      } else {
        throw new Error('Failed to stop VPN');
      }
    } catch (error) {
      console.error('Error stopping VPN service:', error);
      throw error;
    }
  };

  // Reload DNS servers from API (can be called to refresh)
  const reloadDnsServers = async () => {
    try {
      const apiServers = await getDnsServers();
      if (apiServers && apiServers.length > 0) {
        const servers = apiServers
          .filter(s => s.status === 'active')
          .map(s => {
            const iconInfo = getDnsIcon(s.name);
            return {
              id: s.id,
              name: s.name,
              primary: s.primary,
              secondary: s.secondary,
              description: s.description || '',
              icon: iconInfo.icon,
              color: iconInfo.color,
              isDefault: s.isDefault,
            };
          });
        
        if (servers.length > 0) {
          setAvailableDnsServers(servers);
          
          // If current selected server is no longer available, switch to default
          const currentStillExists = servers.find(s => s.id === selectedDnsServer.id);
          if (!currentStillExists) {
            const defaultServer = servers.find(s => s.isDefault) || servers[0];
            setSelectedDnsServer(defaultServer);
            await AsyncStorage.setItem(DNS_SERVER_KEY, defaultServer.id);
          }
        }
      }
    } catch (error) {
      console.error('Error reloading DNS servers:', error);
    }
  };

  return (
    <DNSContext.Provider value={{
      dnsEnabled,
      selectedDnsServer,
      isVpnConnected,
      isLoading,
      toggleDns,
      changeDnsServer,
      availableDnsServers,
      reloadDnsServers,
    }}>
      {children}
    </DNSContext.Provider>
  );
}

export function useDNS() {
  const context = useContext(DNSContext);
  if (!context) {
    throw new Error('useDNS must be used within a DNSProvider');
  }
  return context;
}
