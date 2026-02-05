/**
 * VPN Bridge - Real VPN Implementation
 *
 * This uses native Android VPN service to provide DNS bypass functionality
 */

import { NativeModules, Platform } from 'react-native';

const { VpnModule } = NativeModules;

class VpnBridge {
  constructor() {
    this.isConnected = false;
    this.currentDns = null;
  }

  /**
   * Start VPN with specified DNS server
   * @param {string} dnsServer - Primary DNS server IP (e.g., "1.1.1.1" or "8.8.8.8")
   * @returns {Promise<boolean>} - Success status
   */
  async startVpn(dnsServer) {
    console.log(`[VpnBridge] Starting VPN with DNS: ${dnsServer}`);

    if (Platform.OS !== 'android') {
      console.warn('[VpnBridge] VPN is only supported on Android');
      throw new Error('VPN is only supported on Android');
    }

    if (!VpnModule) {
      console.error('[VpnBridge] VpnModule not found. Did you run expo prebuild?');
      throw new Error('VpnModule not available. Please run: expo prebuild');
    }

    try {
      // Start VPN with selected DNS
      const success = await VpnModule.startVpn(dnsServer);

      if (success) {
        this.isConnected = true;
        this.currentDns = dnsServer;
        console.log(`[VpnBridge] VPN started successfully with ${dnsServer}`);
        return true;
      } else {
        throw new Error('Failed to start VPN');
      }
    } catch (error) {
      console.error('[VpnBridge] Error starting VPN:', error);
      this.isConnected = false;
      this.currentDns = null;

      if (error.message && error.message.includes('VPN_PERMISSION_DENIED')) {
        throw new Error('VPN permission denied by user');
      }

      throw error;
    }
  }

  /**
   * Stop VPN service
   * @returns {Promise<boolean>} - Success status
   */
  async stopVpn() {
    console.log('[VpnBridge] Stopping VPN');

    if (Platform.OS !== 'android') {
      console.warn('[VpnBridge] VPN is only supported on Android');
      return true;
    }

    if (!VpnModule) {
      console.error('[VpnBridge] VpnModule not found');
      return true;
    }

    try {
      const success = await VpnModule.stopVpn();

      this.isConnected = false;
      this.currentDns = null;

      console.log('[VpnBridge] VPN stopped successfully');
      return success;
    } catch (error) {
      console.error('[VpnBridge] Error stopping VPN:', error);

      // Even if stopping fails, mark as disconnected
      this.isConnected = false;
      this.currentDns = null;

      throw error;
    }
  }

  /**
   * Check if VPN permission is granted
   * @returns {Promise<boolean>} - Permission status
   */
  async checkVpnPermission() {
    console.log('[VpnBridge] Checking VPN permission');

    if (Platform.OS !== 'android') {
      return true;
    }

    if (!VpnModule) {
      return false;
    }

    try {
      const hasPermission = await VpnModule.checkPermission();
      return hasPermission;
    } catch (error) {
      console.error('[VpnBridge] Error checking permission:', error);
      return false;
    }
  }

  /**
   * Get current VPN status
   * @returns {Promise<{connected: boolean, dns: string|null}>}
   */
  async getVpnStatus() {
    console.log('[VpnBridge] Getting VPN status');

    if (Platform.OS !== 'android') {
      return {
        connected: false,
        dns: null,
      };
    }

    if (!VpnModule) {
      return {
        connected: false,
        dns: null,
      };
    }

    try {
      // Try to get actual VPN status from native module
      const isRunning = await VpnModule.isVpnRunning();
      this.isConnected = isRunning;
      
      return {
        connected: isRunning,
        dns: isRunning ? this.currentDns : null,
      };
    } catch (error) {
      console.log('[VpnBridge] Could not get VPN status from native, using cached:', error);
      // Fallback to cached state
      return {
        connected: this.isConnected,
        dns: this.currentDns,
      };
    }
  }
}

export default new VpnBridge();
