import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, Alert, Linking, BackHandler } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as Application from 'expo-application';
import { checkAppVersion } from './services/api';

// Map fontWeight to Poppins font family
const getPoppinsFont = (fontWeight) => {
  const weight = String(fontWeight);
  switch (weight) {
    case '300':
    case 'light':
      return 'Poppins_300Light';
    case '500':
    case 'medium':
      return 'Poppins_500Medium';
    case '600':
    case 'semibold':
      return 'Poppins_600SemiBold';
    case '700':
    case 'bold':
      return 'Poppins_700Bold';
    case '800':
    case '900':
      return 'Poppins_700Bold'; // Use bold for extra bold
    default:
      return 'Poppins_400Regular';
  }
};

// Extract fontWeight from style object or array
const extractFontWeight = (style) => {
  if (!style) return null;
  if (Array.isArray(style)) {
    // Flatten and find the last fontWeight
    for (let i = style.length - 1; i >= 0; i--) {
      const weight = extractFontWeight(style[i]);
      if (weight) return weight;
    }
    return null;
  }
  return style.fontWeight;
};

// Override Text component to use Poppins font with proper weight
const originalTextRender = Text.render;
Text.render = function(props, ref) {
  const { style, ...restProps } = props;
  const fontWeight = extractFontWeight(style);
  const fontFamily = getPoppinsFont(fontWeight);
  
  // Create font style (fontWeight is handled by fontFamily in Poppins)
  const fontStyle = { fontFamily };
  
  // Merge font style with existing styles
  const mergedStyle = style 
    ? Array.isArray(style) 
      ? [fontStyle, ...style] 
      : [fontStyle, style]
    : fontStyle;
  
  return originalTextRender.call(this, { ...restProps, style: mergedStyle }, ref);
};

// Override TextInput component to use Poppins font
const originalTextInputRender = TextInput.render;
TextInput.render = function(props, ref) {
  const { style, ...restProps } = props;
  const fontWeight = extractFontWeight(style);
  const fontFamily = getPoppinsFont(fontWeight);
  const fontStyle = { fontFamily };
  
  const mergedStyle = style 
    ? Array.isArray(style) 
      ? [fontStyle, ...style] 
      : [fontStyle, style]
    : fontStyle;
  
  return originalTextInputRender.call(this, { ...restProps, style: mergedStyle }, ref);
};

import { ModeProvider, useMode } from './ModeContext';
import { DataProvider } from './DataContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import { DNSProvider } from './DNSContext';
import { PasswordProvider } from './PasswordContext';
import { NotificationProvider, useNotification } from './NotificationContext';
import { AuthProvider, setSaveTokenToServer } from './AuthContext';
import { BrandsProvider } from './BrandsContext';

// 桥接组件：连接 NotificationContext 和 AuthContext
function NotificationAuthBridge({ children }) {
  const { saveTokenToServer } = useNotification();
  
  React.useEffect(() => {
    // 将 saveTokenToServer 函数传递给 AuthContext
    setSaveTokenToServer(saveTokenToServer);
  }, [saveTokenToServer]);

  return children;
}
import TelegramFloatButton from './components/TelegramFloatButton';
import HomeScreen from './screens/HomeScreen';
import LiveScreen from './screens/LiveScreen';
import WindowScreen from './screens/WindowScreen';
import ProfileScreen from './screens/ProfileScreen';
import TabsScreen from './screens/TabsScreen';
import BookmarksScreen from './screens/BookmarksScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import SecurityScreen from './screens/SecurityScreen';
import DNSScreen from './screens/DNSScreen';
import DownloadsManagementScreen from './screens/DownloadsManagementScreen';
import GameScreen from './screens/GameScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator
      initialRouteName="HomeMain"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Game" component={GameScreen} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="DNS" component={DNSScreen} />
      <Stack.Screen name="DownloadsManagement" component={DownloadsManagementScreen} />
    </Stack.Navigator>
  );
}

function TabBarIcon({ focused, label, iconName, iconFamily = 'Ionicons', isDark }) {
  const color = focused ? '#FFC837' : (isDark ? '#ABABAB' : '#A0A0A0');
  const IconComponent = iconFamily === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

  return (
    <View style={styles.tabIconContainer}>
      <IconComponent name={iconName} size={28} color={color} />
      <Text style={[
        styles.tabLabel,
        { color: color },
        focused && styles.tabLabelFocused,
      ]}>
        {label}
      </Text>
    </View>
  );
}

function AppNavigator() {
  const { mode } = useMode();
  const { theme, isDarkMode } = useTheme();
  const [currentScreen, setCurrentScreen] = React.useState('Home');

  // Only show Telegram Float in WARP mode
  const showTelegramFloat = mode === 'Warp';

  return (
    <View style={{ flex: 1 }}>
    <Tab.Navigator
      screenListeners={{
        state: (e) => {
          // Get current tab name
          const route = e.data.state.routes[e.data.state.index];
          setCurrentScreen(route.name);
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? '#333' : '#E0E0E0',
          height: 95,
          paddingTop: 12,
          paddingBottom: 28,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFC837',
        tabBarInactiveTintColor: isDarkMode ? '#888' : '#999',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} label="Home" iconName="home" isDark={isDarkMode} />
          ),
        }}
      />

      {mode === 'Normal' ? (
        <>
          <Tab.Screen
            name="Browser"
            component={TabsScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabBarIcon focused={focused} label="Browser" iconName="globe-outline" isDark={isDarkMode} />
              ),
            }}
          />
          <Tab.Screen
            name="Bookmarks"
            component={BookmarksScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabBarIcon focused={focused} label="Bookmarks" iconName="bookmark-outline" isDark={isDarkMode} />
              ),
            }}
          />
          <Tab.Screen
            name="History"
            component={HistoryScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabBarIcon focused={focused} label="History" iconName="time-outline" isDark={isDarkMode} />
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsStack}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabBarIcon focused={focused} label="Settings" iconName="sunny-outline" isDark={isDarkMode} />
              ),
            }}
          />
        </>
      ) : (
        <>
          <Tab.Screen
            name="Games"
            component={GameScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabBarIcon focused={focused} label="Games" iconName="game-controller" isDark={isDarkMode} />
              ),
            }}
          />
          <Tab.Screen
            name="Live"
            component={LiveScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabBarIcon focused={focused} label="Live" iconName="radio" isDark={isDarkMode} />
              ),
            }}
          />
          <Tab.Screen
            name="Window"
            component={WindowScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabBarIcon
                  focused={focused}
                  label="Window"
                  iconName="window-maximize"
                  iconFamily="MaterialCommunityIcons"
                  isDark={isDarkMode}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabBarIcon focused={focused} label="Profile" iconName="person" isDark={isDarkMode} />
              ),
            }}
          />
        </>
      )}
    </Tab.Navigator>
    {showTelegramFloat && <TelegramFloatButton currentScreen={currentScreen} />}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // 检查 App 版本
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const currentVersion = Application.nativeApplicationVersion || '1.0.0';
        const result = await checkAppVersion(currentVersion);
        
        if (result && result.mustUpdate) {
          // 强制更新 - 用户必须更新才能继续
          Alert.alert(
            'Update Required',
            result.updateMessage || 'Please update to the latest version to continue.',
            [
              {
                text: 'Update Now',
                onPress: () => {
                  if (result.updateUrl) {
                    Linking.openURL(result.updateUrl);
                  }
                  // 关闭 App
                  BackHandler.exitApp();
                },
              },
            ],
            { cancelable: false }
          );
        } else if (result && result.needsUpdate) {
          // 可选更新 - 用户可以跳过
          Alert.alert(
            'Update Available',
            `A new version (${result.currentVersion}) is available. Would you like to update?`,
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Update',
                onPress: () => {
                  if (result.updateUrl) {
                    Linking.openURL(result.updateUrl);
                  }
                },
              },
            ]
          );
        }
      } catch (error) {
        console.log('Version check failed:', error);
      }
    };

    checkVersion();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D5E2F' }}>
        <ActivityIndicator size="large" color="#FFC837" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <DNSProvider>
        <PasswordProvider>
          <NotificationProvider>
            <AuthProvider>
              <NotificationAuthBridge>
                <BrandsProvider>
                  <ModeProvider>
                    <DataProvider>
                      <NavigationContainer>
                        <AppNavigator />
                      </NavigationContainer>
                    </DataProvider>
                  </ModeProvider>
                </BrandsProvider>
              </NotificationAuthBridge>
            </AuthProvider>
          </NotificationProvider>
        </PasswordProvider>
      </DNSProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 5,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  tabLabelFocused: {
    fontFamily: 'Poppins_600SemiBold',
  },
});
