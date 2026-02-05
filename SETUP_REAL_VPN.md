# 启用真实 VPN 功能

## 简单步骤（5分钟完成）

### 步骤 1: 安装依赖

```bash
npm install
```

### 步骤 2: 运行 Expo Prebuild

这会生成 Android 原生代码：

```bash
npx expo prebuild --clean
```

### 步骤 3: 运行 App

```bash
npx expo run:android
```

就这样！现在 VPN 功能已经启用了。

## 用户体验流程

1. 用户打开 app
2. 进入 **Settings** → **Security** → **DNS Settings**
3. 点击 **DNS Bypass** 开关
4. **系统自动弹出 VPN 权限请求**（Android系统）
5. 用户点击 **Allow**
6. VPN 自动连接，使用选择的 DNS (1.1.1.1 或 8.8.8.8)
7. 现在可以访问被 ISP 封锁的网站了！ ✅

## 功能特点

- ✅ 一键开关 DNS bypass
- ✅ 两个 DNS 选项：Cloudflare (1.1.1.1) 和 Google (8.8.8.8)
- ✅ 自动请求 VPN 权限
- ✅ 在 app 内完成所有操作
- ✅ 实时显示连接状态
- ✅ 保存用户偏好设置

## 技术细节

### VPN 如何工作

1. App 请求 `BIND_VPN_SERVICE` 权限
2. Android 系统弹出权限对话框
3. 用户允许后，app 创建 VPN 接口
4. 所有 DNS 查询通过选择的 DNS 服务器（1.1.1.1 或 8.8.8.8）
5. ISP 无法再封锁或劫持 DNS 请求

### 文件说明

- `VpnBridge.js` - React Native 与原生模块的桥接
- `DNSContext.js` - DNS 状态管理
- `DNSScreen.js` - DNS 设置界面
- `android-vpn-implementation/VpnModule.java` - Android VPN 原生模块
- `android-vpn-implementation/DnsVpnService.java` - VPN 服务实现
- `plugins/withVpnService.js` - Expo config plugin（自动配置）

### 已自动配置

通过 `expo prebuild`，以下内容会自动配置：

1. ✅ AndroidManifest.xml 权限
2. ✅ VPN Service 注册
3. ✅ 原生模块注册
4. ✅ Java 文件复制到正确位置

## 故障排除

### VpnModule not found

**原因**: 还没有运行 `expo prebuild`

**解决方案**:
```bash
npx expo prebuild --clean
npx expo run:android
```

### VPN 权限被拒绝

**原因**: 用户点击了"拒绝"

**解决方案**: 用户需要去系统设置 → Apps → DNS Browser → Permissions → 允许 VPN 权限

### VPN 连接但网站还是打不开

**原因**: 某些网站可能使用 IP 封锁而不是 DNS 封锁

**解决方案**: DNS bypass 只能绕过 DNS 封锁。对于 IP 封锁，需要完整的 VPN 服务

## iOS 支持

iOS 需要更复杂的配置（Network Extension），暂时只支持 Android。

## 完成！

现在运行 app，用户就可以在 app 内一键切换 DNS，访问被封锁的网站了！ 🎉

### 测试步骤

1. 运行: `npx expo run:android`
2. 打开 app
3. 进入 Settings → Security → DNS Settings
4. 开启 DNS Bypass
5. 允许 VPN 权限
6. 选择 DNS: 1.1.1.1 或 8.8.8.8
7. 测试访问被封锁的网站

如果一切正常，你会看到：
- ✅ "VPN Connected" 状态指示
- ✅ 绿色的图标
- ✅ 可以访问之前打不开的网站
