# DNS Browser App

A React Native browser application with integrated DNS bypass functionality and VPN-based ISP blocking circumvention.

## Features

### 🌐 Dual Mode System
- **Normal Mode**: Social media integration, news feed, and general browsing
- **WARP Mode**: Gaming-focused interface with DNS bypass functionality

### 🔒 DNS Bypass & VPN Integration
- **One-Tap DNS Switching**: Switch between Cloudflare (1.1.1.1) and Google (8.8.8.8) DNS servers
- **VPN-Based Bypass**: Circumvent ISP DNS blocking using Android VPN service
- **Visual Indicators**: Green border shows active DNS connection
- **Automatic VPN Permission**: System prompts for VPN permission on first use
- **Real-Time Status**: Connection status displayed in app header

### 🏠 Home Screen (Normal Mode)
- Real-time clock with date display
- Dynamic greeting (Good morning/afternoon/evening)
- Social media quick access (Facebook, Instagram, YouTube, Telegram)
- News feed with category filters (All, Technology, Business, Entertainment, Sports, Politics)
- Famous quotes display
- Integrated URL bar with search functionality

### 🎮 WARP Mode Home Screen
- Gaming website quick access (Steam, Epic Games, Discord, Twitch)
- DNS server controls (1.1.1.1 Cloudflare / 8.8.8.8 Google)
- Popular games showcase (Valorant, CS:GO, PUBG, League of Legends)
- Gaming news feed
- VPN status indicator

### 🌟 Hot Sites
- Search functionality
- Category filters: Hot, New, Bonus, Free, VIP, Top Rated, Promo, Trusted
- Website cards with ratings and descriptions
- Visit counter tracking

### 🎯 Profile & Rewards System
- Points and rewards tracking
- Daily check-in system
- Transaction history
- Profile customization
- Achievement badges

### 🎨 Theme System
- Light and Dark mode support
- Smooth theme transitions
- Persistent theme preference
- Consistent color scheme across all screens

### ⚙️ Settings & Security
- Comprehensive settings menu
- DNS settings screen with server selection
- Privacy controls
- App customization options
- Help and support section

## Project Structure

```
dns-browser-app/
├── App.js                              # Main app with navigation and providers
├── ThemeContext.js                     # Theme state management
├── ModeContext.js                      # Normal/WARP mode state management
├── DNSContext.js                       # DNS and VPN state management
├── VpnBridge.js                        # Native VPN module bridge
├── DataContext.js                      # App data state management
├── app.config.js                       # Expo configuration with VPN plugin
├── plugins/
│   └── withVpnService.js              # Expo config plugin for VPN setup
├── screens/
│   ├── HomeScreen.js                  # Main home screen (dual mode)
│   ├── HotSitesScreen.js              # Hot sites listing
│   ├── GamesScreen.js                 # Games browser
│   ├── DownloadScreen.js              # Download manager
│   ├── ProfileScreen.js               # User profile and rewards
│   ├── SettingsScreen.js              # App settings
│   ├── SecurityScreen.js              # Security settings
│   ├── DNSScreen.js                   # DNS configuration
│   ├── PrivacyScreen.js               # Privacy settings
│   ├── AboutScreen.js                 # About app
│   └── HelpScreen.js                  # Help and support
├── android-vpn-implementation/
│   ├── VpnModule.java                 # Android native VPN module
│   └── DnsVpnService.java             # VPN service implementation
├── assets/                             # Images and resources
├── package.json                        # Dependencies
└── babel.config.js                     # Babel configuration
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Android Studio (for Android development)
- Expo CLI

### Setup Steps

1. **Clone and Navigate to Project**:
```bash
cd dns-browser-app
```

2. **Install Dependencies**:
```bash
npm install
```

3. **For DNS/VPN Functionality (Important!)**:

The DNS bypass and VPN features require native Android modules. You **cannot** use Expo Go for testing these features.

**Run these commands to enable VPN functionality**:

```bash
# Generate native Android project
npx expo prebuild --clean

# Build and run on Android device/emulator
npx expo run:android
```

**Windows Users**: Use the provided setup script:
```bash
setup-vpn.bat
```

**Mac/Linux Users**: Use the bash script:
```bash
chmod +x setup-vpn.sh
./setup-vpn.sh
```

4. **For Development Without VPN** (Expo Go):
```bash
npm start
```
Then scan QR code with Expo Go app. Note: DNS/VPN features will not work in Expo Go.

## How DNS Bypass Works

### User Flow
1. User opens app and navigates to **Settings** → **Security** → **DNS Settings**
2. User toggles **DNS Bypass** switch ON
3. **Android system automatically prompts for VPN permission**
4. User clicks **Allow**
5. VPN connects automatically using selected DNS server (1.1.1.1 or 8.8.8.8)
6. User can now access websites blocked by ISP DNS filtering

### Quick Access (WARP Mode)
1. Switch to **WARP Mode** from home screen
2. Tap either **1.1.1.1** or **8.8.8.8** button
3. DNS bypass activates with selected server
4. Green border indicates active connection

### Technical Implementation

The DNS bypass uses Android's VPN Service API to route DNS queries through selected servers:

1. **VPN Permission**: App requests `BIND_VPN_SERVICE` permission
2. **VPN Interface**: Creates virtual network interface with custom DNS
3. **DNS Routing**: Routes DNS queries through:
   - **Cloudflare**: 1.1.1.1 (primary), 1.0.0.1 (secondary)
   - **Google**: 8.8.8.8 (primary), 8.8.4.4 (secondary)
4. **ISP Bypass**: ISP cannot block or hijack DNS requests

### Files Involved

- **VpnBridge.js**: JavaScript bridge to native module
- **DNSContext.js**: React Context for DNS state management
- **VpnModule.java**: Native Android module for VPN control
- **DnsVpnService.java**: VPN service implementation
- **withVpnService.js**: Expo config plugin (auto-configures AndroidManifest.xml)

## Technology Stack

- **React Native**: 0.72.6
- **Expo**: ~49.0.0
- **React Navigation**: 6.x
- **React**: 18.2.0
- **AsyncStorage**: Persistent data storage
- **Expo Network**: Network state monitoring
- **Native Modules**: Android VPN Service API

## Supported Platforms

- ✅ **Android**: Full support (VPN functionality requires `expo prebuild`)
- ⚠️ **iOS**: UI only (VPN requires Network Extension framework - not yet implemented)
- ⚠️ **Expo Go**: Limited support (VPN features unavailable)

## Configuration

### DNS Servers

Available DNS servers are configured in `DNSContext.js`:

```javascript
export const DNS_SERVERS = [
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    primary: '1.1.1.1',
    secondary: '1.0.0.1',
  },
  {
    id: 'google',
    name: 'Google',
    primary: '8.8.8.8',
    secondary: '8.8.4.4',
  },
];
```

### Adding More DNS Servers

To add additional DNS servers, edit `DNSContext.js` and add entries to the `DNS_SERVERS` array.

## Troubleshooting

### VPN Module Not Found

**Error**: `VpnModule not available`

**Cause**: Native modules not generated yet

**Solution**:
```bash
npx expo prebuild --clean
npx expo run:android
```

### VPN Permission Denied

**Error**: `VPN permission denied by user`

**Cause**: User clicked "Deny" on VPN permission prompt

**Solution**:
1. Go to Android Settings → Apps → DNS Browser
2. Permissions → Allow VPN permission
3. Return to app and retry

### DNS Connected But Sites Still Blocked

**Cause**: Website uses IP-based blocking, not DNS blocking

**Note**: DNS bypass only circumvents DNS-level blocking. IP-based blocking requires a full VPN tunnel (future feature).

### App Crashes on Startup

**Solution**:
```bash
# Clear cache and rebuild
npx expo prebuild --clean
cd android
./gradlew clean
cd ..
npx expo run:android
```

## Development

### Running in Development Mode

For features that don't require VPN (UI testing):
```bash
npm start
```

For full functionality with VPN:
```bash
npx expo run:android
```

### Building for Production

```bash
# Build Android APK
npx expo build:android -t apk

# Build Android App Bundle (for Play Store)
npx expo build:android -t app-bundle
```

## Security & Privacy

- **Local VPN Only**: DNS bypass runs entirely on device
- **No Data Collection**: App does not collect or transmit user data
- **Open Source**: Code is available for security auditing
- **Minimal Permissions**: Only requests necessary permissions (Internet, VPN)

## Limitations

- **Android Only**: VPN features currently Android-exclusive
- **DNS Bypass Only**: Does not provide full VPN tunnel encryption
- **ISP Dependent**: Effectiveness depends on ISP blocking method (DNS vs IP)
- **No Background Mode**: VPN disconnects when app is closed

## Future Roadmap

- [ ] iOS VPN support (Network Extension framework)
- [ ] Full VPN tunnel mode (not just DNS)
- [ ] Background VPN service
- [ ] Custom DNS server configuration
- [ ] VPN usage statistics
- [ ] Multiple DNS profiles
- [ ] Split tunneling support

## Documentation

- **Setup Guide**: [SETUP_REAL_VPN.md](SETUP_REAL_VPN.md) - Detailed VPN setup instructions (Chinese)
- **Setup Scripts**: `setup-vpn.bat` (Windows) / `setup-vpn.sh` (Mac/Linux)

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions:
1. Check the Troubleshooting section
2. Review [SETUP_REAL_VPN.md](SETUP_REAL_VPN.md)
3. Open an issue on GitHub

---

**Note**: This app is designed for legitimate use cases such as bypassing ISP-level DNS censorship in regions with internet restrictions. Users are responsible for complying with local laws and regulations.
