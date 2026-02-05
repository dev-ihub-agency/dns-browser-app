import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useData } from '../DataContext';
import { useTheme } from '../ThemeContext';
import { usePassword } from '../PasswordContext';

export default function WindowScreen({ route, navigation }) {
  const { addBookmark, isBookmarked, addHistory, privateMode } = useData();
  const { theme, isDarkMode } = useTheme();
  const { passwordSettings, addPassword, getPasswordForDomain } = usePassword();
  const [tabs, setTabs] = useState([
    { id: Date.now(), title: 'Google', url: 'https://www.google.com', domain: 'google.com' }
  ]);
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || Date.now());
  const [showTabSwitcher, setShowTabSwitcher] = useState(false);
  const [showBrowserMenu, setShowBrowserMenu] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFindBar, setShowFindBar] = useState(false);
  const [findText, setFindText] = useState('');
  const [findMatches, setFindMatches] = useState({ current: 0, total: 0 });

  const activeTab = useMemo(() => tabs.find(tab => tab.id === activeTabId), [tabs, activeTabId]);
  const [urlInput, setUrlInput] = useState(activeTab?.url || '');
  const webViewRef = useRef(null);
  const webViewRefs = useRef({});
  const cloudflareAlertShown = useRef({});  // Track which tabs have shown the alert

  // Handle incoming URL from navigation (from HomeScreen)
  useEffect(() => {
    if (route?.params?.url) {
      const incomingUrl = route.params.url;

      // Check if current active tab is empty
      if (activeTab && !activeTab.url) {
        // Update current empty tab with the new URL
        setTabs(tabs.map(tab =>
          tab.id === activeTabId
            ? { ...tab, url: incomingUrl, title: 'Loading...' }
            : tab
        ));
        setUrlInput(incomingUrl);
      } else {
        // Create a new tab with the URL
        const newTab = {
          id: Date.now(),
          title: 'Loading...',
          url: incomingUrl,
          domain: ''
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(newTab.id);
        setUrlInput(incomingUrl);
      }

      // Clear the navigation param to avoid re-triggering
      navigation.setParams({ url: undefined });
    }
  }, [route?.params?.url]);

  const closeTab = useCallback((tabId) => {
    setTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== tabId);
      if (newTabs.length === 0) {
        const newTab = { id: Date.now(), title: 'Google', url: 'https://www.google.com', domain: 'google.com' };
        setActiveTabId(newTab.id);
        return [newTab];
      } else {
        if (activeTabId === tabId) {
          setActiveTabId(newTabs[0].id);
          setUrlInput(newTabs[0].url);
        }
        return newTabs;
      }
    });
    delete webViewRefs.current[tabId];
  }, [activeTabId]);

  const addNewTab = useCallback(() => {
    const newTab = { id: Date.now(), title: 'Google', url: 'https://www.google.com', domain: 'google.com' };
    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(newTab.id);
    setUrlInput('https://www.google.com');
    setShowTabSwitcher(false);
  }, []);

  const switchTab = useCallback((tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    setActiveTabId(tabId);
    setUrlInput(tab?.url || '');
    setShowTabSwitcher(false);
  }, [tabs]);

  const handleGoBack = useCallback(() => {
    const ref = webViewRefs.current[activeTabId];
    if (ref && canGoBack) {
      ref.goBack();
    }
  }, [activeTabId, canGoBack]);

  const handleGoForward = useCallback(() => {
    const ref = webViewRefs.current[activeTabId];
    if (ref && canGoForward) {
      ref.goForward();
    }
  }, [activeTabId, canGoForward]);

  const handleReload = useCallback(() => {
    const ref = webViewRefs.current[activeTabId];
    if (ref) {
      ref.reload();
    }
  }, [activeTabId]);

  const handleSubmitUrl = () => {
    let finalUrl = urlInput.trim();
    if (!finalUrl) return;

    // If no protocol, add https://
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      // Check if it looks like a URL (has a dot and no spaces)
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        // Otherwise treat as search query
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
      }
    }

    // Update URL input immediately for faster feedback
    setUrlInput(finalUrl);

    // Update active tab URL
    setTabs(prevTabs => prevTabs.map(tab =>
      tab.id === activeTabId
        ? { ...tab, url: finalUrl }
        : tab
    ));
  };

  const handleWebViewNavigationStateChange = useCallback((navState) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setIsLoading(navState.loading);

    const currentUrl = navState.url;
    const currentTitle = navState.title || 'Untitled';

    setUrlInput(currentUrl);
    setTabs(prevTabs => prevTabs.map(tab =>
      tab.id === activeTabId
        ? { ...tab, url: currentUrl, title: currentTitle }
        : tab
    ));

    if (!navState.loading && currentUrl && currentTitle) {
      addHistory(currentUrl, currentTitle);

      // Detect Cloudflare verification stuck - only show once per tab
      if ((currentTitle.toLowerCase().includes('verifying') ||
          currentTitle.toLowerCase().includes('checking') ||
          currentUrl.includes('challenge-platform')) &&
          !cloudflareAlertShown.current[activeTabId]) {
        cloudflareAlertShown.current[activeTabId] = true;
        setTimeout(() => {
          // Check if still on cloudflare page before showing alert
          Alert.alert(
            'Cloudflare Verification',
            'This site is protected by Cloudflare and may not load properly. Would you like to close this tab?',
            [
              { text: 'Keep Trying', style: 'cancel' },
              {
                text: 'Close Tab',
                onPress: () => closeTab(activeTabId),
                style: 'destructive'
              }
            ]
          );
        }, 10000);
      } else if (!currentUrl.includes('challenge-platform') &&
                 !currentTitle.toLowerCase().includes('verifying') &&
                 !currentTitle.toLowerCase().includes('checking')) {
        // Reset the flag if page successfully loaded
        cloudflareAlertShown.current[activeTabId] = false;
      }
    }
  }, [activeTabId, addHistory, closeTab]);

  const handleToggleBookmark = useCallback(() => {
    if (activeTab && activeTab.url) {
      if (isBookmarked(activeTab.url)) {
        return;
      }
      addBookmark(activeTab.url, activeTab.title || 'Untitled');
    }
  }, [activeTab, isBookmarked, addBookmark]);

  const handleShare = async () => {
    if (activeTab && activeTab.url) {
      try {
        await Share.share({
          message: `${activeTab.title}\n${activeTab.url}`,
          url: activeTab.url,
        });
        setShowBrowserMenu(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to share page');
      }
    }
  };

  const handleFindInPage = () => {
    setShowBrowserMenu(false);
    setShowFindBar(true);
  };

  const findInPage = useCallback((text, direction = 'next') => {
    const ref = webViewRefs.current[activeTabId];
    if (!text || !ref) return;

    const escapedText = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const searchScript = `
      (function() {
        // Remove previous highlights
        var existingHighlights = document.querySelectorAll('.isn-find-highlight');
        existingHighlights.forEach(function(el) {
          var parent = el.parentNode;
          parent.replaceChild(document.createTextNode(el.textContent), el);
          parent.normalize();
        });

        // Remove current highlight
        var existingCurrent = document.querySelectorAll('.isn-find-current');
        existingCurrent.forEach(function(el) {
          el.classList.remove('isn-find-current');
        });

        var searchText = '${escapedText}';
        if (!searchText) return JSON.stringify({ total: 0, current: 0 });

        var body = document.body;
        var walker = document.createTreeWalker(
          body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        var textNodes = [];
        var node;
        while (node = walker.nextNode()) {
          if (node.nodeValue.trim().length > 0) {
            textNodes.push(node);
          }
        }

        var matches = [];
        textNodes.forEach(function(node) {
          var nodeText = node.nodeValue;
          var lowerNodeText = nodeText.toLowerCase();
          var lowerSearch = searchText.toLowerCase();
          var index = lowerNodeText.indexOf(lowerSearch);

          while (index !== -1) {
            matches.push({
              node: node,
              index: index,
              length: searchText.length
            });
            index = lowerNodeText.indexOf(lowerSearch, index + 1);
          }
        });

        // Highlight all matches
        matches.forEach(function(match, idx) {
          var node = match.node;
          var index = match.index;
          var length = match.length;

          var before = node.nodeValue.substring(0, index);
          var highlighted = node.nodeValue.substring(index, index + length);
          var after = node.nodeValue.substring(index + length);

          var span = document.createElement('span');
          span.className = 'isn-find-highlight';
          span.textContent = highlighted;
          span.style.backgroundColor = '#FFC837';
          span.style.color = '#000';

          var afterNode = document.createTextNode(after);
          var beforeNode = document.createTextNode(before);

          var parent = node.parentNode;
          parent.insertBefore(beforeNode, node);
          parent.insertBefore(span, node);
          parent.insertBefore(afterNode, node);
          parent.removeChild(node);
        });

        // Highlight current match
        var highlights = document.querySelectorAll('.isn-find-highlight');
        if (highlights.length > 0) {
          var currentIndex = ${direction === 'next' ? 0 : 'highlights.length - 1'};
          highlights[currentIndex].classList.add('isn-find-current');
          highlights[currentIndex].style.backgroundColor = '#FF6B00';
          highlights[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        var result = { total: matches.length, current: highlights.length > 0 ? 1 : 0 };
        window.ReactNativeWebView.postMessage(JSON.stringify(result));
        return true;
      })();
    `;

    ref.injectJavaScript(searchScript);
  }, [activeTabId]);

  const findNext = useCallback(() => {
    const ref = webViewRefs.current[activeTabId];
    if (!findText || !ref) return;

    const script = `
      (function() {
        var highlights = document.querySelectorAll('.isn-find-highlight');
        if (highlights.length === 0) return JSON.stringify({ total: 0, current: 0 });

        var current = document.querySelector('.isn-find-current');
        var currentIndex = Array.from(highlights).indexOf(current);

        if (current) {
          current.classList.remove('isn-find-current');
          current.style.backgroundColor = '#FFC837';
        }

        var nextIndex = (currentIndex + 1) % highlights.length;
        highlights[nextIndex].classList.add('isn-find-current');
        highlights[nextIndex].style.backgroundColor = '#FF6B00';
        highlights[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });

        var result = { total: highlights.length, current: nextIndex + 1 };
        window.ReactNativeWebView.postMessage(JSON.stringify(result));
        return true;
      })();
    `;

    ref.injectJavaScript(script);
  }, [activeTabId, findText]);

  const findPrevious = useCallback(() => {
    const ref = webViewRefs.current[activeTabId];
    if (!findText || !ref) return;

    const script = `
      (function() {
        var highlights = document.querySelectorAll('.isn-find-highlight');
        if (highlights.length === 0) return JSON.stringify({ total: 0, current: 0 });

        var current = document.querySelector('.isn-find-current');
        var currentIndex = Array.from(highlights).indexOf(current);

        if (current) {
          current.classList.remove('isn-find-current');
          current.style.backgroundColor = '#FFC837';
        }

        var prevIndex = currentIndex <= 0 ? highlights.length - 1 : currentIndex - 1;
        highlights[prevIndex].classList.add('isn-find-current');
        highlights[prevIndex].style.backgroundColor = '#FF6B00';
        highlights[prevIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });

        var result = { total: highlights.length, current: prevIndex + 1 };
        window.ReactNativeWebView.postMessage(JSON.stringify(result));
        return true;
      })();
    `;

    ref.injectJavaScript(script);
  }, [activeTabId, findText]);

  const clearFindHighlights = useCallback(() => {
    const ref = webViewRefs.current[activeTabId];
    if (!ref) return;

    const script = `
      (function() {
        var existingHighlights = document.querySelectorAll('.isn-find-highlight');
        existingHighlights.forEach(function(el) {
          var parent = el.parentNode;
          parent.replaceChild(document.createTextNode(el.textContent), el);
          parent.normalize();
        });
      })();
    `;

    ref.injectJavaScript(script);
    setFindText('');
    setFindMatches({ current: 0, total: 0 });
  }, [activeTabId]);

  const handlePrint = async () => {
    setShowBrowserMenu(false);

    if (!activeTab || !activeTab.url) {
      Alert.alert('Error', 'No page to print');
      return;
    }

    try {
      // Create a simple print-friendly HTML
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 40px;
                line-height: 1.6;
              }
              .header {
                border-bottom: 2px solid #FFC837;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              h1 {
                color: #333;
                margin: 0 0 10px 0;
              }
              .url {
                color: #666;
                font-size: 14px;
                word-break: break-all;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #E5E5E5;
                text-align: center;
                color: #999;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${activeTab.title || 'Untitled Page'}</h1>
              <div class="url">${activeTab.url}</div>
            </div>
            <p>This page was printed from ISN Browser.</p>
            <p>To view the full interactive content, please visit the URL above in a web browser.</p>
            <div class="footer">
              Printed from ISN Browser v1.0.0
            </div>
          </body>
        </html>
      `;

      await Print.printAsync({
        html: html,
        width: 612,
        height: 792,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to print page');
      console.error('Print error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Browser Top Bar */}
      <View style={[styles.browserBar, { backgroundColor: theme.headerBackground }]}>
        <View style={styles.topRow}>
          {/* Navigation Controls */}
          <View style={styles.navControls}>
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.inputBackground }, !canGoBack && styles.navButtonDisabled]}
              disabled={!canGoBack}
              onPress={handleGoBack}
            >
              <Ionicons name="arrow-back" size={20} color={canGoBack ? theme.icon : theme.placeholder} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.inputBackground }, !canGoForward && styles.navButtonDisabled]}
              disabled={!canGoForward}
              onPress={handleGoForward}
            >
              <Ionicons name="arrow-forward" size={20} color={canGoForward ? theme.icon : theme.placeholder} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navButton, { backgroundColor: theme.inputBackground }]} onPress={handleReload}>
              <Ionicons name="reload" size={20} color={theme.icon} />
            </TouchableOpacity>
          </View>

          {/* Address Bar */}
          <View style={[styles.addressBar, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
            <Ionicons name="lock-closed" size={14} color="#34C759" style={styles.lockIcon} />
            <View style={styles.urlInputContainer}>
              <TextInput
                style={[styles.urlInput, { color: theme.text }]}
                value={urlInput}
                onChangeText={setUrlInput}
                onSubmitEditing={handleSubmitUrl}
                placeholder="Search or enter URL"
                placeholderTextColor={theme.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                numberOfLines={1}
                multiline={false}
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsTop}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleToggleBookmark}
            >
              <Ionicons
                name={activeTab?.url && isBookmarked(activeTab.url) ? "star" : "star-outline"}
                size={20}
                color={activeTab?.url && isBookmarked(activeTab.url) ? "#FFC837" : theme.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tabCountButton}
              onPress={() => setShowTabSwitcher(true)}
            >
              <View style={[styles.tabCountBadge, { borderColor: theme.icon }]}>
                <Text style={[styles.tabCountText, { color: theme.icon }]}>{tabs.length}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => setShowBrowserMenu(true)}
            >
              <MaterialCommunityIcons name="dots-vertical" size={20} color={theme.icon} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Browser Content */}
      <View style={[styles.browserContent, { backgroundColor: theme.cardBackground }]}>
        {activeTab && activeTab.url ? (
          <WebView
            ref={(ref) => {
              if (ref) {
                webViewRefs.current[activeTab.id] = ref;
                webViewRef.current = ref;
              }
            }}
            key={activeTab.id}
            source={{
              uri: activeTab.url,
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'none',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'DNT': '1',
              }
            }}
            userAgent="Mozilla/5.0 (Linux; Android 14; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            style={[styles.webview, { backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF' }]}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            renderLoading={() => (
              <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF' }]}>
                <ActivityIndicator size="large" color="#FFC837" />
                <Text style={[styles.loadingText, { color: isDarkMode ? '#AAA' : '#666' }]}>Loading...</Text>
              </View>
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.log('WebView error:', nativeEvent.description);
              setIsLoading(false);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.log('HTTP error:', nativeEvent.statusCode, nativeEvent.url);
              setIsLoading(false);
            }}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);

                // Handle find-in-page results
                if (data.total !== undefined) {
                  setFindMatches({ current: data.current, total: data.total });
                }

                // Handle password field detected
                if (data.type === 'passwordFieldDetected' && passwordSettings.autofillPasswords) {
                  const domain = data.domain;
                  getPasswordForDomain(domain).then(savedCreds => {
                    if (savedCreds && webViewRefs.current[activeTabId]) {
                      // Inject saved credentials for autofill
                      webViewRefs.current[activeTabId].injectJavaScript(`
                        (function() {
                          window.savedCredentials = ${JSON.stringify(savedCreds)};
                          // Autofill password fields
                          const emailInputs = document.querySelectorAll('input[type="email"]');
                          const usernameInputs = document.querySelectorAll('input[type="text"][name*="user" i], input[type="text"][name*="login" i]');
                          const passwordInputs = document.querySelectorAll('input[type="password"]');

                          if (emailInputs.length > 0 && window.savedCredentials.email) {
                            emailInputs[0].value = window.savedCredentials.email;
                            emailInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                          }

                          if (usernameInputs.length > 0 && window.savedCredentials.username) {
                            usernameInputs[0].value = window.savedCredentials.username;
                            usernameInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                          }

                          if (passwordInputs.length > 0 && window.savedCredentials.password) {
                            passwordInputs[0].value = window.savedCredentials.password;
                            passwordInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                          }
                        })();
                      `);
                    }
                  });
                }

                // Handle credentials submitted
                if (data.type === 'credentialsSubmitted' && passwordSettings.savePasswords && !privateMode) {
                  const { domain, email, username, password, url } = data.data;

                  if (password) {
                    Alert.alert(
                      'Save Password',
                      `Save password for ${domain}?`,
                      [
                        { text: 'Not Now', style: 'cancel' },
                        {
                          text: 'Save',
                          onPress: () => {
                            addPassword({
                              domain,
                              email: email || '',
                              username: username || '',
                              password,
                              url
                            });
                          }
                        }
                      ]
                    );
                  }
                }
              } catch (e) {
                // Ignore parse errors
              }
            }}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsBackForwardNavigationGestures={true}
            cacheEnabled={true}
            cacheMode="LOAD_DEFAULT"
            incognito={privateMode}
            // Persist cookies and storage to avoid repeated reCAPTCHA
            dataDetectorTypes="none"
            // Enhanced browser capabilities for anti-bot bypass
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            // Keep session across navigation to maintain reCAPTCHA verification
            pullToRefreshEnabled={false}
            mixedContentMode="always"
            setSupportMultipleWindows={true}
            javaScriptCanOpenWindowsAutomatically={true}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            allowsFullscreenVideo={true}
            originWhitelist={['*']}
            allowUniversalAccessFromFileURLs={true}
            allowFileAccessFromFileURLs={true}
            geolocationEnabled={true}
            saveFormDataDisabled={false}
            androidLayerType="hardware"
            androidHardwareAccelerationDisabled={false}
            overScrollMode="never"
            bounces={false}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            scalesPageToFit={true}
            automaticallyAdjustContentInsets={false}
            onShouldStartLoadWithRequest={(request) => {
              // Allow all requests - don't interfere with navigation
              // This is critical for Cloudflare challenges to work properly
              return true;
            }}
            injectedJavaScriptBeforeContentLoaded={`
              // Comprehensive browser fingerprint spoofing - Enhanced for Cloudflare Turnstile
              (function() {
                // ========== FULLSCREEN SUPPORT FOR H5 GAMES & IFRAMES ==========
                Object.defineProperty(document, 'fullscreenEnabled', { value: true, writable: true });
                Object.defineProperty(document, 'webkitFullscreenEnabled', { value: true, writable: true });
                Object.defineProperty(document, 'mozFullScreenEnabled', { value: true, writable: true });
                
                // Polyfill requestFullscreen for all elements
                if (!Element.prototype.requestFullscreen) {
                  Element.prototype.requestFullscreen = function() {
                    return this.webkitRequestFullscreen ? this.webkitRequestFullscreen() : 
                           this.mozRequestFullScreen ? this.mozRequestFullScreen() :
                           this.msRequestFullscreen ? this.msRequestFullscreen() : Promise.resolve();
                  };
                }
                
                // Polyfill exitFullscreen
                if (!document.exitFullscreen) {
                  document.exitFullscreen = function() {
                    return document.webkitExitFullscreen ? document.webkitExitFullscreen() :
                           document.mozCancelFullScreen ? document.mozCancelFullScreen() :
                           document.msExitFullscreen ? document.msExitFullscreen() : Promise.resolve();
                  };
                }
                
                // Polyfill fullscreenElement
                if (!document.fullscreenElement) {
                  Object.defineProperty(document, 'fullscreenElement', {
                    get: function() {
                      return document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null;
                    }
                  });
                }

                // ========== AUDIO AUTOPLAY SUPPORT ==========
                // Allow audio/video autoplay without user interaction
                document.addEventListener('DOMContentLoaded', function() {
                  // Auto-unmute and play audio/video elements
                  const mediaElements = document.querySelectorAll('audio, video');
                  mediaElements.forEach(function(media) {
                    media.muted = false;
                    media.volume = 1.0;
                  });
                  
                  // Watch for new media elements
                  const mediaObserver = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                      mutation.addedNodes.forEach(function(node) {
                        if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') {
                          node.muted = false;
                          node.volume = 1.0;
                        }
                        if (node.querySelectorAll) {
                          node.querySelectorAll('audio, video').forEach(function(media) {
                            media.muted = false;
                            media.volume = 1.0;
                          });
                        }
                      });
                    });
                  });
                  if (document.body) {
                    mediaObserver.observe(document.body, { childList: true, subtree: true });
                  }
                });
                
                // ========== IFRAME FULLSCREEN SUPPORT ==========
                const setupIframeFullscreen = function(iframe) {
                  iframe.setAttribute('allowfullscreen', 'true');
                  iframe.setAttribute('webkitallowfullscreen', 'true');
                  iframe.setAttribute('mozallowfullscreen', 'true');
                  iframe.setAttribute('allow', 'fullscreen *; autoplay *; encrypted-media *; microphone *; camera *; midi *; payment *; usb *; vr *; xr-spatial-tracking *');
                  iframe.style.border = 'none';
                };
                
                document.addEventListener('DOMContentLoaded', function() {
                  document.querySelectorAll('iframe').forEach(setupIframeFullscreen);
                  
                  const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                      mutation.addedNodes.forEach(function(node) {
                        if (node.tagName === 'IFRAME') {
                          setupIframeFullscreen(node);
                        }
                        if (node.querySelectorAll) {
                          node.querySelectorAll('iframe').forEach(setupIframeFullscreen);
                        }
                      });
                    });
                  });
                  if (document.body) {
                    observer.observe(document.body, { childList: true, subtree: true });
                  }
                });
                
                // ========== REMOVE X-Requested-With HEADER - DISABLED ==========
                // This was causing issues with page functionality (buttons not working)

                // ========== HIDE WEBDRIVER - NUCLEAR OPTION ==========
                const proto = Object.getPrototypeOf(navigator);
                if (proto && 'webdriver' in proto) {
                  delete proto.webdriver;
                }
                
                const webdriverDescriptor = {
                  get: function webdriver() { return undefined; },
                  set: undefined,
                  configurable: true,
                  enumerable: true
                };
                
                try {
                  Object.defineProperty(Navigator.prototype, 'webdriver', webdriverDescriptor);
                } catch(e) {}
                
                try {
                  Object.defineProperty(navigator, 'webdriver', webdriverDescriptor);
                } catch(e) {}
                
                try {
                  delete window.webdriver;
                } catch(e) {}

                // ========== SPOOF PLUGINS (PluginArray type) ==========
                const createPlugin = (name, filename, description, mimeTypes) => {
                  const plugin = { name, filename, description, length: mimeTypes.length, item: (i) => mimeTypes[i], namedItem: (n) => mimeTypes.find(m => m.type === n) };
                  mimeTypes.forEach((mime, i) => { plugin[i] = mime; });
                  return plugin;
                };
                const createMimeType = (type, suffixes, description) => ({ type, suffixes, description, enabledPlugin: null });
                const pluginsData = [
                  createPlugin('Chrome PDF Plugin', 'internal-pdf-viewer', 'Portable Document Format', [createMimeType('application/x-google-chrome-pdf', 'pdf', 'Portable Document Format')]),
                  createPlugin('Chrome PDF Viewer', 'mhjfbmdgcfjbbpaeojofohoefgiehjai', '', [createMimeType('application/pdf', 'pdf', '')]),
                  createPlugin('Native Client', 'internal-nacl-plugin', '', [createMimeType('application/x-nacl', '', 'Native Client Executable'), createMimeType('application/x-pnacl', '', 'Portable Native Client Executable')])
                ];
                const pluginArray = Object.create(PluginArray.prototype);
                pluginsData.forEach((p, i) => { pluginArray[i] = p; });
                Object.defineProperty(pluginArray, 'length', { value: pluginsData.length, writable: false });
                pluginArray.item = (i) => pluginsData[i];
                pluginArray.namedItem = (n) => pluginsData.find(p => p.name === n);
                pluginArray.refresh = () => {};
                Object.defineProperty(navigator, 'plugins', { get: () => pluginArray, configurable: true });
                
                // ========== SPOOF LANGUAGES ==========
                Object.defineProperty(navigator, 'languages', {
                  get: () => ['en-US', 'en', 'zh-CN', 'zh'],
                  configurable: true
                });
                
                // ========== HIDE AUTOMATION INDICATORS ==========
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
                delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
                
                // ========== SPOOF HARDWARE ==========
                Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8, configurable: true });
                Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true });
                Object.defineProperty(navigator, 'platform', { get: () => 'Linux armv8l', configurable: true });
                Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.', configurable: true });
                
                // ========== ADD CHROME OBJECT - COMPLETE ==========
                const mockChrome = {
                  app: {
                    isInstalled: false,
                    InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
                    RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
                  },
                  runtime: {
                    OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install', SHARED_MODULE_UPDATE: 'shared_module_update', UPDATE: 'update' },
                    OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' },
                    PlatformArch: { ARM: 'arm', ARM64: 'arm64', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
                    PlatformNaclArch: { ARM: 'arm', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
                    PlatformOs: { ANDROID: 'android', CROS: 'cros', LINUX: 'linux', MAC: 'mac', OPENBSD: 'openbsd', WIN: 'win' },
                    RequestUpdateCheckStatus: { NO_UPDATE: 'no_update', THROTTLED: 'throttled', UPDATE_AVAILABLE: 'update_available' },
                    connect: function() { return { onDisconnect: { addListener: function() {} }, onMessage: { addListener: function() {} }, postMessage: function() {} }; },
                    sendMessage: function() {}
                  },
                  csi: function() { return { pageT: Date.now(), startE: Date.now(), onloadT: Date.now() }; },
                  loadTimes: function() { 
                    return { 
                      commitLoadTime: Date.now() / 1000,
                      connectionInfo: 'h2',
                      finishDocumentLoadTime: Date.now() / 1000,
                      finishLoadTime: Date.now() / 1000,
                      firstPaintAfterLoadTime: 0,
                      firstPaintTime: Date.now() / 1000,
                      navigationType: 'Other',
                      npnNegotiatedProtocol: 'h2',
                      requestTime: Date.now() / 1000,
                      startLoadTime: Date.now() / 1000,
                      wasAlternateProtocolAvailable: false,
                      wasFetchedViaSpdy: true,
                      wasNpnNegotiated: true
                    }; 
                  }
                };
                window.chrome = mockChrome;
                Object.defineProperty(window, 'chrome', {
                  value: mockChrome,
                  writable: true,
                  enumerable: true,
                  configurable: false
                });
                
                // ========== SPOOF PERMISSIONS ==========
                const originalQuery = window.navigator.permissions?.query;
                if (originalQuery) {
                  window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                      Promise.resolve({ state: Notification.permission }) :
                      originalQuery(parameters)
                  );
                }
                
                // ========== SPOOF WEBGL ==========
                const getParameterProxyHandler = {
                  apply: function(target, thisArg, args) {
                    const param = args[0];
                    if (param === 37445) return 'Google Inc. (Qualcomm)';
                    if (param === 37446) return 'ANGLE (Qualcomm, Adreno (TM) 740, OpenGL ES 3.2)';
                    return target.apply(thisArg, args);
                  }
                };
                
                try {
                  const canvas = document.createElement('canvas');
                  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                  if (gl) {
                    const originalGetParameter = gl.getParameter;
                    WebGLRenderingContext.prototype.getParameter = new Proxy(originalGetParameter, getParameterProxyHandler);
                  }
                  const gl2 = canvas.getContext('webgl2');
                  if (gl2) {
                    const originalGetParameter2 = gl2.getParameter;
                    WebGL2RenderingContext.prototype.getParameter = new Proxy(originalGetParameter2, getParameterProxyHandler);
                  }
                } catch(e) {}
                
                // ========== SPOOF SCREEN ==========
                Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
                Object.defineProperty(screen, 'pixelDepth', { get: () => 24 });
                
                // ========== SPOOF CONNECTION ==========
                Object.defineProperty(navigator, 'connection', {
                  get: () => ({
                    effectiveType: '4g',
                    downlink: 10,
                    rtt: 50,
                    saveData: false
                  }),
                  configurable: true
                });

                // ========== SPOOF BATTERY ==========
                Object.defineProperty(navigator, 'getBattery', {
                  get: () => () => Promise.resolve({
                    charging: false,
                    chargingTime: Infinity,
                    dischargingTime: 18000,
                    level: 0.75
                  }),
                  configurable: true
                });

                // ========== SPOOF TOUCH ==========
                Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5, configurable: true });

                // ========== REMOVE AUTOMATION PROPS ==========
                const automationProps = [
                  '__driver_evaluate', '__webdriver_evaluate', '__selenium_evaluate', '__fxdriver_evaluate',
                  '__driver_unwrapped', '__webdriver_unwrapped', '__selenium_unwrapped', '__fxdriver_unwrapped',
                  '__webdriver_script_fn', '__webdriver_script_func', '__webdriver_script_function',
                  '$cdc_asdjflasutopfhvcZLmcfl_', '$chrome_asyncScriptInfo', '__$webdriverAsyncExecutor',
                ];
                automationProps.forEach(prop => {
                  delete window[prop];
                  delete document[prop];
                });

                // ========== OVERRIDE TOSTRING - DISABLED ==========
                // ========== SPOOF TIMING - DISABLED ==========
                // These modifications can break page functionality

                // ========== SPOOF USER AGENT DATA ==========
                if (navigator.userAgentData) {
                  Object.defineProperty(navigator, 'userAgentData', {
                    get: () => ({
                      brands: [
                        { brand: 'Not_A Brand', version: '8' },
                        { brand: 'Chromium', version: '120' },
                        { brand: 'Google Chrome', version: '120' }
                      ],
                      mobile: true,
                      platform: 'Android'
                    }),
                    configurable: true
                  });
                }

                // ========== SPOOF USER AGENT (NO wv FLAG!) ==========
                Object.defineProperty(navigator, 'userAgent', {
                  get: () => 'Mozilla/5.0 (Linux; Android 14; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                  configurable: true
                });

                // ========== IFRAME CHROME OBJECT FIX ==========
                const injectChromeIntoIframes = () => {
                  document.querySelectorAll('iframe').forEach(iframe => {
                    try {
                      if (iframe.contentWindow && !iframe.contentWindow.chrome) {
                        iframe.contentWindow.chrome = window.chrome;
                      }
                    } catch(e) {}
                  });
                };
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', injectChromeIntoIframes);
                } else {
                  injectChromeIntoIframes();
                }
                const iframeObserver = new MutationObserver(injectChromeIntoIframes);
                if (document.body) {
                  iframeObserver.observe(document.body, { childList: true, subtree: true });
                }

                // ========== ADD INTERACTION LISTENERS ==========
                const addInteractionListeners = () => {
                  ['mousemove', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'touchmove', 'click'].forEach(event => {
                    document.addEventListener(event, () => {}, { passive: true });
                  });
                };
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', addInteractionListeners);
                } else {
                  addInteractionListeners();
                }

                // ========== STORAGE TEST ==========
                try {
                  const testKey = '__webview_storage_test__';
                  localStorage.setItem(testKey, '1');
                  localStorage.removeItem(testKey);
                } catch(e) {}

                // ========== PERFORMANCE TIMING ==========
                if (!window.performance.timing) {
                  const loadTime = Date.now() - 1000 - Math.floor(Math.random() * 500);
                  Object.defineProperty(window.performance, 'timing', {
                    get: () => ({
                      navigationStart: loadTime,
                      fetchStart: loadTime + 10,
                      domainLookupStart: loadTime + 10,
                      domainLookupEnd: loadTime + 20,
                      connectStart: loadTime + 20,
                      connectEnd: loadTime + 50,
                      requestStart: loadTime + 50,
                      responseStart: loadTime + 100,
                      responseEnd: loadTime + 200,
                      domLoading: loadTime + 200,
                      domInteractive: loadTime + 400,
                      domContentLoadedEventStart: loadTime + 450,
                      domContentLoadedEventEnd: loadTime + 460,
                      domComplete: loadTime + 500,
                      loadEventStart: loadTime + 500,
                      loadEventEnd: loadTime + 510
                    }),
                    configurable: true
                  });
                }

                // ========== MOUSE EVENT TRACKING ==========
                let mouseEventCount = 0;
                const originalAddEventListener = EventTarget.prototype.addEventListener;
                EventTarget.prototype.addEventListener = function(type, listener, options) {
                  if (type === 'mousemove' || type === 'touchmove') {
                    mouseEventCount++;
                  }
                  return originalAddEventListener.call(this, type, listener, options);
                };

                // ========== HIDE REACT NATIVE WEBVIEW ==========
                // Store the original for internal use, then hide it
                const _rnwv = window.ReactNativeWebView;
                Object.defineProperty(window, 'ReactNativeWebView', {
                  get: () => undefined,
                  set: () => {},
                  configurable: false
                });
                // Create a hidden way to post messages
                window.__postToRN = (msg) => _rnwv && _rnwv.postMessage(msg);

                // ========== HIDE WEBVIEW SPECIFIC PROPERTIES ==========
                // Remove any traces of being in a WebView
                delete window.__REACT_WEB_VIEW_BRIDGE;
                delete window.webkit;
                delete window._cordovaNative;
                delete window.Capacitor;
                
                // ========== SPOOF NOTIFICATION API ==========
                if (!window.Notification) {
                  window.Notification = {
                    permission: 'default',
                    requestPermission: () => Promise.resolve('default')
                  };
                }

                // ========== SPOOF MEDIA DEVICES ==========
                if (navigator.mediaDevices) {
                  const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices;
                  navigator.mediaDevices.enumerateDevices = () => Promise.resolve([
                    { deviceId: 'default', kind: 'audioinput', label: 'Default', groupId: 'default' },
                    { deviceId: 'default', kind: 'videoinput', label: 'Default', groupId: 'default' },
                    { deviceId: 'default', kind: 'audiooutput', label: 'Default', groupId: 'default' }
                  ]);
                }

                // ========== SPOOF SPEECH SYNTHESIS ==========
                if (!window.speechSynthesis) {
                  window.speechSynthesis = {
                    getVoices: () => [],
                    speak: () => {},
                    cancel: () => {},
                    pause: () => {},
                    resume: () => {}
                  };
                }

                // ========== CANVAS & AUDIO FINGERPRINT PROTECTION - DISABLED ==========
                // These modifications can break page functionality (like Google search clear button)
                // Keeping original behavior for better compatibility

              })();

              // Password Management (using hidden postMessage)
              (function() {
                setTimeout(function() {
                  const passwordInputs = document.querySelectorAll('input[type="password"]');
                  if (passwordInputs.length > 0 && window.__postToRN) {
                    window.__postToRN(JSON.stringify({
                      type: 'passwordFieldDetected',
                      domain: window.location.hostname
                    }));
                  }
                }, 100);

                document.addEventListener('submit', function(e) {
                  const form = e.target;
                  const passwordInput = form.querySelector('input[type="password"]');

                  if (passwordInput && passwordInput.value && window.__postToRN) {
                    const emailInput = form.querySelector('input[type="email"]');
                    const usernameInput = form.querySelector('input[type="text"][name*="user" i], input[type="text"][name*="login" i], input[type="text"][name*="email" i]');

                    const credentials = {
                      domain: window.location.hostname,
                      url: window.location.href,
                      email: emailInput ? emailInput.value : '',
                      username: usernameInput && !emailInput ? usernameInput.value : '',
                      password: passwordInput.value
                    };

                    window.__postToRN(JSON.stringify({
                      type: 'credentialsSubmitted',
                      data: credentials
                    }));
                  }
                }, true);
              })();

              true;
            `}
          />
        ) : (
          <View style={[styles.webviewPlaceholder, { backgroundColor: theme.cardBackground }]}>
            <Ionicons name="globe-outline" size={64} color={theme.placeholder} />
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>New Tab</Text>
            <Text style={[styles.placeholderUrl, { color: theme.textTertiary }]}>Enter a URL or search query</Text>
          </View>
        )}

        {/* Find Bar */}
        {showFindBar && (
          <View style={[styles.findBar, { backgroundColor: theme.headerBackground, borderTopColor: theme.inputBorder }]}>
            <TextInput
              style={[styles.findInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
              placeholder="Find in page"
              placeholderTextColor={theme.placeholder}
              value={findText}
              onChangeText={(text) => {
                setFindText(text);
                if (text) {
                  findInPage(text);
                } else {
                  clearFindHighlights();
                }
              }}
              autoFocus={true}
            />
            {findMatches.total > 0 && (
              <Text style={[styles.findCounter, { color: theme.textSecondary }]}>
                {findMatches.current}/{findMatches.total}
              </Text>
            )}
            <TouchableOpacity
              style={styles.findButton}
              onPress={findPrevious}
              disabled={findMatches.total === 0}
            >
              <Ionicons name="chevron-up" size={20} color={findMatches.total > 0 ? theme.icon : theme.placeholder} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.findButton}
              onPress={findNext}
              disabled={findMatches.total === 0}
            >
              <Ionicons name="chevron-down" size={20} color={findMatches.total > 0 ? theme.icon : theme.placeholder} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.findButton}
              onPress={() => {
                setShowFindBar(false);
                clearFindHighlights();
              }}
            >
              <Ionicons name="close" size={20} color={theme.icon} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tab Switcher Modal */}
      <Modal
        visible={showTabSwitcher}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTabSwitcher(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.tabSwitcher, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.switcherHeader, { backgroundColor: theme.headerBackground, borderBottomColor: theme.inputBorder }]}>
              <Text style={[styles.switcherTitle, { color: theme.text }]}>{tabs.length} {tabs.length === 1 ? 'Tab' : 'Tabs'}</Text>
              <TouchableOpacity onPress={() => setShowTabSwitcher(false)}>
                <Ionicons name="close" size={24} color={theme.icon} />
              </TouchableOpacity>
            </View>

            {/* Tabs Grid */}
            <ScrollView style={styles.tabsScroll} contentContainerStyle={styles.tabsGrid}>
              {tabs.map((tab) => (
                <View key={tab.id} style={styles.tabCard}>
                  <TouchableOpacity
                    style={[styles.tabCardContent, { backgroundColor: theme.cardBackground }, activeTabId === tab.id && styles.activeTabCard]}
                    onPress={() => switchTab(tab.id)}
                  >
                    <View style={[styles.tabCardHeader, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FAFAFA', borderBottomColor: theme.inputBorder }]}>
                      <View style={styles.tabHeaderInfo}>
                        <Text style={[styles.tabCardTitle, { color: theme.text }]} numberOfLines={1}>{tab.title || 'New Tab'}</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.urlScrollContainer}
                        >
                          <Text style={[styles.tabCardUrl, { color: theme.textSecondary }]}>{tab.url || 'about:blank'}</Text>
                        </ScrollView>
                      </View>
                      <TouchableOpacity
                        style={[styles.closeTabButton, { backgroundColor: theme.inputBackground }]}
                        onPress={() => closeTab(tab.id)}
                      >
                        <Ionicons name="close" size={16} color={theme.icon} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.tabPreview}>
                      <Ionicons name="globe-outline" size={48} color={theme.placeholder} />
                    </View>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add New Tab Card */}
              <View style={styles.tabCard}>
                <TouchableOpacity style={[styles.newTabCard, { backgroundColor: theme.cardBackground, borderColor: theme.inputBorder }]} onPress={addNewTab}>
                  <Ionicons name="add" size={32} color={theme.icon} />
                  <Text style={[styles.newTabText, { color: theme.textSecondary }]}>New Tab</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Browser Menu Modal */}
      <Modal
        visible={showBrowserMenu}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowBrowserMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowBrowserMenu(false)}
        >
          <View style={[styles.browserMenu, { backgroundColor: theme.cardBackground }]}>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.inputBorder }]} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color={theme.icon} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Share Page</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.inputBorder }]} onPress={handleFindInPage}>
              <Ionicons name="search-outline" size={22} color={theme.icon} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Find in Page</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.inputBorder }]} onPress={handlePrint}>
              <Ionicons name="print-outline" size={22} color={theme.icon} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Print</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.inputBorder }]}
              onPress={() => {
                setShowBrowserMenu(false);
                navigation.navigate('Settings');
              }}
            >
              <Ionicons name="settings-outline" size={22} color={theme.icon} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Settings</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  browserBar: {
    backgroundColor: '#FFF',
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  navControls: {
    flexDirection: 'row',
    gap: 6,
  },
  navButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  addressBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 36,
  },
  lockIcon: {
    marginRight: 8,
  },
  urlInputContainer: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
  },
  urlInput: {
    fontSize: 13,
    color: '#000',
    padding: 0,
    margin: 0,
  },
  quickActionsTop: {
    flexDirection: 'row',
    gap: 4,
  },
  quickActionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabCountButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabCountBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  browserContent: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  webview: {
    flex: 1,
  },
  webviewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#CCC',
    marginTop: 12,
  },
  placeholderUrl: {
    fontSize: 11,
    color: '#E5E5E5',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  tabSwitcher: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
  },
  switcherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  switcherTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  tabsScroll: {
    flex: 1,
  },
  tabsGrid: {
    padding: 16,
  },
  tabCard: {
    marginBottom: 16,
  },
  tabCardContent: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  activeTabCard: {
    borderWidth: 2.5,
    borderColor: '#FFC837',
  },
  tabCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabHeaderInfo: {
    flex: 1,
    marginRight: 8,
  },
  tabCardTitle: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    marginBottom: 3,
  },
  urlScrollContainer: {
    maxHeight: 16,
    flexGrow: 0,
  },
  tabCardUrl: {
    fontSize: 11,
    color: '#666',
  },
  closeTabButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabPreview: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  newTabCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DDD',
    borderStyle: 'dashed',
  },
  newTabText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    fontWeight: '600',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 12,
  },
  browserMenu: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    fontSize: 15,
    color: '#000',
    marginLeft: 12,
    fontWeight: '500',
  },
  findBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  findInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000',
    marginRight: 8,
  },
  findCounter: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    minWidth: 40,
    textAlign: 'center',
  },
  findButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 4,
  },
  webviewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  placeholderUrl: {
    fontSize: 13,
    marginTop: 8,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});
