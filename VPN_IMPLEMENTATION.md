# VPN-Based DNS Implementation Guide

## Current Status

目前的实现包含了完整的 UI 和状态管理，但 VPN 功能是模拟的。要实现真正的 VPN DNS bypass，你需要添加原生模块。

## 实现真正 VPN 功能的步骤

### Option 1: 使用 React Native VPN 库 (推荐)

#### For Android:

1. **安装必要的包**
```bash
npm install react-native-vpn
```

2. **配置 Android 权限**

在 `android/app/src/main/AndroidManifest.xml` 添加:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.BIND_VPN_SERVICE" />
```

3. **创建 VPN Service**

在 `android/app/src/main/java/com/dnsbrowserapp/` 创建 `DnsVpnService.java`:

```java
package com.dnsbrowserapp;

import android.content.Intent;
import android.net.VpnService;
import android.os.ParcelFileDescriptor;
import java.io.IOException;

public class DnsVpnService extends VpnService {
    private ParcelFileDescriptor vpnInterface = null;
    private String dnsServer = "1.1.1.1";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            dnsServer = intent.getStringExtra("dns_server");
            if (dnsServer == null) {
                dnsServer = "1.1.1.1";
            }
        }

        // Build VPN interface
        Builder builder = new Builder();
        builder.setSession("DNS Browser VPN");
        builder.addAddress("10.0.0.2", 24);
        builder.addRoute("0.0.0.0", 0);
        builder.addDnsServer(dnsServer);
        builder.setBlocking(true);

        try {
            vpnInterface = builder.establish();
            return START_STICKY;
        } catch (Exception e) {
            e.printStackTrace();
            return START_NOT_STICKY;
        }
    }

    @Override
    public void onDestroy() {
        if (vpnInterface != null) {
            try {
                vpnInterface.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        super.onDestroy();
    }
}
```

4. **在 AndroidManifest.xml 注册 Service**

```xml
<service
    android:name=".DnsVpnService"
    android:permission="android.permission.BIND_VPN_SERVICE">
    <intent-filter>
        <action android:name="android.net.VpnService" />
    </intent-filter>
</service>
```

5. **创建 Native Module**

在 `android/app/src/main/java/com/dnsbrowserapp/` 创建 `VpnModule.java`:

```java
package com.dnsbrowserapp;

import android.app.Activity;
import android.content.Intent;
import android.net.VpnService;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class VpnModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static final int VPN_REQUEST_CODE = 1;
    private Promise vpnPromise;

    public VpnModule(ReactApplicationContext context) {
        super(context);
        context.addActivityEventListener(this);
    }

    @Override
    public String getName() {
        return "VpnModule";
    }

    @ReactMethod
    public void startVpn(String dnsServer, Promise promise) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity not available");
            return;
        }

        Intent intent = VpnService.prepare(activity);
        if (intent != null) {
            vpnPromise = promise;
            activity.startActivityForResult(intent, VPN_REQUEST_CODE);
        } else {
            // VPN already prepared
            startVpnService(dnsServer);
            promise.resolve(true);
        }
    }

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

    private void startVpnService(String dnsServer) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            Intent intent = new Intent(activity, DnsVpnService.class);
            intent.putExtra("dns_server", dnsServer);
            activity.startService(intent);
        }
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (requestCode == VPN_REQUEST_CODE && vpnPromise != null) {
            if (resultCode == Activity.RESULT_OK) {
                startVpnService("1.1.1.1");
                vpnPromise.resolve(true);
            } else {
                vpnPromise.reject("VPN_PERMISSION_DENIED", "User denied VPN permission");
            }
            vpnPromise = null;
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        // Not needed
    }
}
```

6. **注册 Native Module**

在 `android/app/src/main/java/com/dnsbrowserapp/MainApplication.java` 添加:

```java
import com.dnsbrowserapp.VpnModule;

// In getPackages():
packages.add(new ReactPackage() {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new VpnModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
});
```

#### For iOS:

1. **配置 Capabilities**
- 打开 Xcode
- 选择 Target → Capabilities
- 开启 "Network Extensions"
- 开启 "Personal VPN"

2. **安装 NetworkExtension**

iOS 使用 NetworkExtension framework，需要创建一个 PacketTunnelProvider。

3. **创建 Native Module**

创建 `VpnModule.m`:

```objective-c
#import "VpnModule.h"
#import <NetworkExtension/NetworkExtension.h>

@implementation VpnModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(startVpn:(NSString *)dnsServer
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NEVPNManager *manager = [NEVPNManager sharedManager];
    [manager loadFromPreferencesWithCompletionHandler:^(NSError *error) {
        if (error) {
            reject(@"LOAD_ERROR", @"Failed to load VPN preferences", error);
            return;
        }

        NEVPNProtocolIKEv2 *protocol = [[NEVPNProtocolIKEv2 alloc] init];
        protocol.serverAddress = dnsServer;
        protocol.useExtendedAuthentication = YES;

        manager.protocolConfiguration = protocol;
        manager.localizedDescription = @"DNS Browser VPN";
        manager.enabled = YES;

        [manager saveToPreferencesWithCompletionHandler:^(NSError *error) {
            if (error) {
                reject(@"SAVE_ERROR", @"Failed to save VPN config", error);
                return;
            }

            NSError *startError = nil;
            [manager.connection startVPNTunnelAndReturnError:&startError];

            if (startError) {
                reject(@"START_ERROR", @"Failed to start VPN", startError);
            } else {
                resolve(@YES);
            }
        }];
    }];
}

RCT_EXPORT_METHOD(stopVpn:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NEVPNManager *manager = [NEVPNManager sharedManager];
    [manager.connection stopVPNTunnel];
    resolve(@YES);
}

@end
```

### Option 2: 使用 Expo Config Plugin

如果使用 Expo managed workflow，你需要创建一个 config plugin:

```javascript
// app.config.js
module.exports = {
  expo: {
    plugins: [
      [
        "@config-plugins/react-native-vpn",
        {
          android: {
            vpnServiceName: "DnsVpnService"
          },
          ios: {
            networkExtension: true
          }
        }
      ]
    ]
  }
}
```

### 更新 DNSContext.js 使用真实 VPN

替换 `startVpnService` 和 `stopVpnService` 函数:

```javascript
import { NativeModules } from 'react-native';
const { VpnModule } = NativeModules;

// Start VPN service with selected DNS
const startVpnService = async () => {
  try {
    console.log(`Starting VPN with DNS: ${selectedDnsServer.primary}`);

    // Call native VPN module
    await VpnModule.startVpn(selectedDnsServer.primary);

    setIsVpnConnected(true);
    return { success: true, message: 'VPN started successfully' };
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

    // Call native VPN module
    await VpnModule.stopVpn();

    setIsVpnConnected(false);
    return { success: true, message: 'VPN stopped successfully' };
  } catch (error) {
    console.error('Error stopping VPN service:', error);
    throw error;
  }
};
```

## 测试

1. 启动 app: `npm start`
2. 进入 Settings → Security → DNS Settings
3. 开启 DNS Bypass
4. 选择一个 DNS server (例如 Cloudflare 1.1.1.1)
5. 允许 VPN 权限
6. 测试访问被 ISP 封锁的网站

## 重要提示

- **Android**: 用户必须批准 VPN 权限弹窗
- **iOS**: 需要在 Xcode 中配置 Network Extensions capability
- **性能**: VPN 会略微增加延迟，但能绕过 DNS 封锁
- **隐私**: 只路由 DNS 查询，不路由所有流量（轻量级 VPN）

## 推荐的 DNS 服务器

1. **Cloudflare (1.1.1.1)** - 最快，注重隐私
2. **Google (8.8.8.8)** - 稳定可靠
3. **Quad9 (9.9.9.9)** - 安全过滤
4. **OpenDNS (208.67.222.222)** - 家长控制
5. **AdGuard (94.140.14.14)** - 广告拦截

## 故障排除

- 如果 VPN 连接失败，检查权限设置
- 如果无法访问网站，尝试切换不同的 DNS server
- 查看 Android logcat 或 iOS Console 获取详细错误信息
