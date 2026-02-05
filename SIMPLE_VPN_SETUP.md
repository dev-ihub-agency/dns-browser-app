# 简单 VPN 设置指南

这个指南会帮你快速启用真正的 DNS bypass VPN 功能。

## 当前状态

✅ UI 已完成 - 用户可以选择 1.1.1.1 或 8.8.8.8
✅ 状态管理已完成
⚠️ VPN 功能目前是模拟的（需要添加原生代码）

## 快速启用真正的 VPN (Android)

### 步骤 1: 复制原生文件

将以下两个文件复制到你的 Android 项目中：

```bash
# 从
android-vpn-implementation/VpnModule.java
android-vpn-implementation/DnsVpnService.java

# 复制到
android/app/src/main/java/com/dnsbrowserapp/
```

### 步骤 2: 修改 AndroidManifest.xml

打开 `android/app/src/main/AndroidManifest.xml`，添加以下内容：

**在 `<manifest>` 标签内，`<application>` 标签之前添加权限：**

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.BIND_VPN_SERVICE" />
```

**在 `<application>` 标签内添加 VPN 服务：**

```xml
<service
    android:name=".DnsVpnService"
    android:permission="android.permission.BIND_VPN_SERVICE"
    android:exported="false">
    <intent-filter>
        <action android:name="android.net.VpnService" />
    </intent-filter>
</service>
```

### 步骤 3: 注册 Native Module

打开 `android/app/src/main/java/com/dnsbrowserapp/MainApplication.java`

**添加 import：**

```java
import com.dnsbrowserapp.VpnModule;
import java.util.ArrayList;
import java.util.Collections;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.ReactPackage;
```

**在 `getPackages()` 方法中添加：**

```java
@Override
protected List<ReactPackage> getPackages() {
  @SuppressWarnings("UnnecessaryLocalVariable")
  List<ReactPackage> packages = new PackageList(this).getPackages();

  // Add VPN module
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

  return packages;
}
```

### 步骤 4: 启用 VpnBridge

打开 `VpnBridge.js`，取消注释以下行：

**找到这些行：**
```javascript
// Uncomment when native modules are implemented:
// import { NativeModules } from 'react-native';
// const { VpnModule } = NativeModules;
```

**改为：**
```javascript
// Uncomment when native modules are implemented:
import { NativeModules } from 'react-native';
const { VpnModule } = NativeModules;
```

**然后在每个方法中，注释掉 mock 实现，启用真实调用：**

```javascript
async startVpn(dnsServer) {
  console.log(`[VpnBridge] Starting VPN with DNS: ${dnsServer}`);

  // Real implementation
  return await VpnModule.startVpn(dnsServer);

  // Mock implementation for testing (comment this out)
  // return new Promise((resolve) => {
  //   setTimeout(() => {
  //     console.log(`[VpnBridge] VPN started successfully with ${dnsServer}`);
  //     resolve(true);
  //   }, 500);
  // });
}
```

对其他方法做同样的修改。

### 步骤 5: 重新编译并运行

```bash
# 清理并重新编译
cd android
./gradlew clean
cd ..

# 运行 app
npm run android
```

## 测试

1. 打开 app
2. 进入 **Settings** → **Security** → **DNS Settings**
3. 开启 **DNS Bypass**
4. 系统会弹出 VPN 权限请求
5. 点击 **Allow**
6. 选择 DNS server (1.1.1.1 或 8.8.8.8)
7. 测试访问被 ISP 封锁的网站

## 故障排除

### VPN 无法启动
- 检查权限是否正确添加到 AndroidManifest.xml
- 检查服务是否正确注册
- 查看 `adb logcat` 获取详细错误信息

### 找不到 VpnModule
- 确认 VpnModule.java 和 DnsVpnService.java 在正确的目录
- 确认 MainApplication.java 正确注册了模块
- 运行 `./gradlew clean` 清理缓存

### VPN 连接但网站还是打不开
- 尝试切换不同的 DNS server
- 检查设备的网络连接
- 某些网站可能使用 IP 封锁而不是 DNS 封锁

## iOS 支持

iOS 的 VPN 实现更复杂，需要：
1. Network Extension capability
2. Personal VPN entitlement
3. NEVPNManager configuration

详细说明请参考 `VPN_IMPLEMENTATION.md`

## 简化版本（只修改 DNS，不需要 VPN）

如果你不想实现完整的 VPN，还有一个更简单的方法：

在 Android 中，你可以使用 `ConnectivityManager` 设置私有 DNS（Android 9+）：

```java
// This is simpler but requires Android 9+
Settings.Global.putString(
    getContentResolver(),
    Settings.Global.PRIVATE_DNS_MODE,
    "hostname"
);
Settings.Global.putString(
    getContentResolver(),
    "private_dns_specifier",
    "1dot1dot1dot1.cloudflare-dns.com"
);
```

但这需要系统权限，一般 app 无法使用。所以 VPN 方案是最佳选择。

## 完成！

现在你的 DNS Browser app 应该可以真正绕过 ISP DNS 封锁了！ 🎉

用户可以：
- 选择 1.1.1.1 (Cloudflare) 或 8.8.8.8 (Google)
- 一键开启/关闭 DNS bypass
- 访问被 ISP 封锁的网站
