package com.dnsbrowser.app;

import android.content.Intent;
import android.net.VpnService;
import android.os.ParcelFileDescriptor;
import android.util.Log;
import java.io.IOException;

/**
 * DnsVpnService - Simple DNS-only VPN service
 *
 * This VPN only sets custom DNS servers without routing any traffic.
 * The trick is to use a dummy route that won't match any real traffic,
 * but still allows Android to apply our DNS settings.
 */
public class DnsVpnService extends VpnService {
    private static final String TAG = "DnsVpnService";
    public static boolean isRunning = false;
    private ParcelFileDescriptor vpnInterface = null;
    private String dnsServer = "1.1.1.1";

    public static final String ACTION_STOP = "com.dnsbrowser.app.STOP_VPN";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Check if this is a stop command
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            Log.d(TAG, "Received stop command");
            stop();
            stopSelf();
            return START_NOT_STICKY;
        }

        if (intent != null && intent.hasExtra("dns_server")) {
            dnsServer = intent.getStringExtra("dns_server");
            Log.d(TAG, "Starting VPN with DNS server: " + dnsServer);
        }

        stop();

        try {
            // Build minimal VPN interface - DNS settings only
            Builder builder = new Builder();
            builder.setSession("DNS Browser");
            
            // VPN interface needs an address
            builder.addAddress("10.255.255.1", 32);
            
            // Add a dummy route for a non-routable address
            // This makes the VPN "active" without routing any real traffic
            // 0.0.0.0/32 is a dummy route that won't match any traffic
            builder.addRoute("0.0.0.0", 32);
            
            // Set our custom DNS servers - this is the key part!
            builder.addDnsServer(dnsServer);
            if (dnsServer.equals("1.1.1.1")) {
                builder.addDnsServer("1.0.0.1");
            } else if (dnsServer.equals("8.8.8.8")) {
                builder.addDnsServer("8.8.4.4");
            }
            
            // MTU setting
            builder.setMtu(1500);
            
            // Establish VPN
            vpnInterface = builder.establish();
            
            if (vpnInterface == null) {
                Log.e(TAG, "Failed to establish VPN interface");
                isRunning = false;
                return START_NOT_STICKY;
            }

            Log.d(TAG, "VPN established successfully - DNS: " + dnsServer);
            isRunning = true;
            
            // No need for a read thread since we're not routing any traffic
            // The VPN interface just needs to stay open for DNS settings to apply

            return START_STICKY;
        } catch (Exception e) {
            Log.e(TAG, "Error establishing VPN", e);
            isRunning = false;
            return START_NOT_STICKY;
        }
    }

    /**
     * Stop VPN service
     */
    private void stop() {
        if (vpnInterface != null) {
            try {
                vpnInterface.close();
                Log.d(TAG, "VPN interface closed");
            } catch (IOException e) {
                Log.e(TAG, "Error closing VPN interface", e);
            }
            vpnInterface = null;
        }

        isRunning = false;
        Log.d(TAG, "VPN service stopped");
    }

    @Override
    public void onDestroy() {
        stop();
        super.onDestroy();
    }

    @Override
    public void onRevoke() {
        Log.d(TAG, "VPN permission revoked");
        stop();
        super.onRevoke();
    }
}

/*
 * How this works:
 * 
 * This is a "DNS-only" VPN that doesn't route any actual traffic:
 * 1. We create a VPN interface with a dummy route (0.0.0.0/32)
 * 2. The dummy route won't match any real traffic
 * 3. But Android still applies our DNS server settings
 * 4. All apps will use our custom DNS (1.1.1.1 or 8.8.8.8)
 * 5. Regular internet traffic flows normally through the default route
 * 
 * This bypasses ISP DNS blocking without affecting network performance.
 */
