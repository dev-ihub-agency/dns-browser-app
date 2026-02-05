module.exports = {
  name: "VPN RM GROUP",
  slug: "dns-browser-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0D5E2F"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.dnsbrowser.app"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0D5E2F"
    },
    package: "com.dnsbrowser.app",
    permissions: [
      "android.permission.INTERNET",
      "android.permission.BIND_VPN_SERVICE"
    ]
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    [
      "./plugins/withVpnService.js"
    ],
    "expo-secure-store",
    "expo-asset",
    "expo-font"
  ]
};
