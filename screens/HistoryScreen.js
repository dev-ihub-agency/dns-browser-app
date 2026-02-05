import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../DataContext';
import { useTheme } from '../ThemeContext';

export default function HistoryScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { history, clearHistory, removeHistoryItem } = useData();
  const { theme, isDarkMode } = useTheme();

  // Generate favicon URL from domain
  const getFaviconUrl = (url) => {
    const domain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  };

  const handleHistoryPress = (item) => {
    let url = item.url;
    // Add https:// if no protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    navigation.navigate('Browser', { url });
  };

  // Filter history based on search query
  const filteredHistory = searchQuery.trim()
    ? history.map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.url.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(group => group.items.length > 0)
    : history;

  return (
    <View style={[styles.container, { backgroundColor: theme.headerBackground }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>History</Text>
        <TouchableOpacity style={[styles.clearButton, { backgroundColor: isDarkMode ? '#38383A' : 'rgba(255, 255, 255, 0.7)' }]} onPress={clearHistory}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="search" size={18} color={theme.icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search history..."
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.icon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={[styles.scrollView, { backgroundColor: theme.background }]}>
        {/* Empty State */}
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color={isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} />
            <Text style={[styles.emptyStateTitle, { color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
              {searchQuery.trim() ? 'No Results Found' : 'No History Yet'}
            </Text>
            <Text style={[styles.emptyStateText, { color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }]}>
              {searchQuery.trim()
                ? 'Try searching with different keywords'
                : 'Your browsing history will appear here'}
            </Text>
          </View>
        ) : (
          <>
            {/* History Groups */}
            {filteredHistory.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.historyGroup}>
            <Text style={[styles.dateHeader, { color: theme.text }]}>{group.date}</Text>
            <View style={styles.historyList}>
              {group.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.historyItem, { backgroundColor: theme.cardBackground }]}
                  onPress={() => handleHistoryPress(item)}
                >
                  <View style={[styles.faviconContainer, { backgroundColor: isDarkMode ? '#38383A' : '#F8F8F8' }]}>
                    <Image
                      source={{ uri: getFaviconUrl(item.url) }}
                      style={styles.favicon}
                    />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={[styles.historyTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.historyUrl, { color: theme.textTertiary }]} numberOfLines={1}>{item.url}</Text>
                  </View>
                  <Text style={[styles.timeText, { color: theme.textTertiary }]}>{item.time}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeHistoryItem(item.id)}
                  >
                    <Ionicons name="close" size={18} color={isDarkMode ? '#666' : '#CCC'} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC837',
  },
  header: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E53238',
  },
  searchContainer: {
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  historyGroup: {
    marginBottom: 20,
    marginTop: 12,
  },
  dateHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: 15,
    marginBottom: 8,
  },
  historyList: {
    paddingHorizontal: 15,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  faviconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  favicon: {
    width: 20,
    height: 20,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  historyUrl: {
    fontSize: 11,
    color: '#999',
  },
  timeText: {
    fontSize: 11,
    color: '#999',
    marginRight: 8,
  },
  deleteButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.4)',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
    textAlign: 'center',
  },
});
