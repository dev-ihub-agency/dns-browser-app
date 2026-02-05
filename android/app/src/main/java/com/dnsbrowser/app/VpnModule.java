package com.dnsbrowser.app;

import android.app.Activity;
import android.content.Intent;
import android.net.VpnService;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * VpnModule - React Native bridge for VPN functionality
 *
 * Installation:
 * 1. Copy this file to: android/app/src/main/java/com/dnsbrowserapp/VpnModule.java
 * 2. Copy DnsVpnService.java to the same directory
 * 3. Register module in MainApplication.java (see below)
 * 4. Add permissions to AndroidManifest.xml (see VPN_IMPLEMENTATION.md)
 */
public class VpnModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static final int VPN_REQUEST_CODE = 1;
    private Promise vpnPromise;
    private String pendingDnsServer;

    public VpnModule(ReactApplicationContext context) {
        super(context);
        context.addActivityEventListener(this);
    }

    @Override
    public String getName() {
        return "VpnModule";
    }

    /**
     * Start VPN with specified DNS server
     * This will request VPN permission if not already granted
     */
    @ReactMethod
    public void startVpn(String dnsServer, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity not available");
            return;
        }

        // Store DNS server for later use
        pendingDnsServer = dnsServer;

        // Check if VPN permission is already granted
        Intent intent = VpnService.prepare(activity);
        if (intent != null) {
            // Need to request permission
            vpnPromise = promise;
            activity.startActivityForResult(intent, VPN_REQUEST_CODE);
        } else {
            // Permission already granted, start VPN
            startVpnService(dnsServer);
            promise.resolve(true);
        }
    }

    /**
     * Stop VPN service
     */
    @ReactMethod
    public void stopVpn(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            Intent intent = new Intent(activity, DnsVpnService.class);
            activity.stopService(intent);
            promise.resolve(true);
        } else {
            promise.reject("NO_ACTIVITY", "Activity not available");
        }
    }

    /**
     * Check if VPN permission is granted
     */
    @ReactMethod
    public void checkPermission(Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            Intent intent = VpnService.prepare(activity);
            promise.resolve(intent == null); // null means permission granted
        } else {
            promise.reject("NO_ACTIVITY", "Activity not available");
        }
    }

    /**
     * Get current VPN status
     */
    @ReactMethod
    public void getStatus(Promise promise) {
        // Note: This is a simplified implementation
        // In production, you would check the actual VPN service status
        promise.resolve(DnsVpnService.isRunning);
    }

    /**
     * Check if VPN is currently running
     */
    @ReactMethod
    public void isVpnRunning(Promise promise) {
        promise.resolve(DnsVpnService.isRunning);
    }

    /**
     * Helper method to start VPN service
     */
    private void startVpnService(String dnsServer) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            Intent intent = new Intent(activity, DnsVpnService.class);
            intent.putExtra("dns_server", dnsServer);
            activity.startService(intent);
        }
    }

    /**
     * Handle activity result from VPN permission request
     */
    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (requestCode == VPN_REQUEST_CODE && vpnPromise != null) {
            if (resultCode == Activity.RESULT_OK) {
                // Permission granted, start VPN
                startVpnService(pendingDnsServer);
                vpnPromise.resolve(true);
            } else {
                // Permission denied
                vpnPromise.reject("VPN_PERMISSION_DENIED", "User denied VPN permission");
            }
            vpnPromise = null;
            pendingDnsServer = null;
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        // Not needed for VPN
    }
}

/**
 * Registration in MainApplication.java:
 *
 * 1. Import the module:
 *    import com.dnsbrowserapp.VpnModule;
 *
 * 2. Add to getPackages() in MainApplication.java:
 *
 * @Override
 * protected List<ReactPackage> getPackages() {
 *   List<ReactPackage> packages = new PackageList(this).getPackages();
 *
 *   // Add VPN module
 *   packages.add(new ReactPackage() {
 *     @Override
 *     public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
 *       List<NativeModule> modules = new ArrayList<>();
 *       modules.add(new VpnModule(reactContext));
 *       return modules;
 *     }
 *
 *     @Override
 *     public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
 *       return Collections.emptyList();
 *     }
 *   });
 *
 *   return packages;
 * }
 */
