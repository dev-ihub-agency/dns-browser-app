import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../ThemeContext';

const DOWNLOADS_KEY = '@dns_browser_downloads';

export default function DownloadsManagementScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const [downloads, setDownloads] = useState([]);

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const savedDownloads = await AsyncStorage.getItem(DOWNLOADS_KEY);
      if (savedDownloads) {
        setDownloads(JSON.parse(savedDownloads));
      }
    } catch (error) {
      console.error('Error loading downloads:', error);
    }
  };

  const saveDownloads = async (newDownloads) => {
    try {
      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(newDownloads));
      setDownloads(newDownloads);
    } catch (error) {
      console.error('Error saving downloads:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleShare = async (download) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(download.uri);
      if (fileInfo.exists) {
        await Sharing.shareAsync(download.uri);
      } else {
        Alert.alert('Error', 'File not found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share file');
    }
  };

  const handleDelete = async (downloadId) => {
    Alert.alert(
      'Delete Download',
      'Are you sure you want to delete this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const download = downloads.find(d => d.id === downloadId);
            if (download) {
              try {
                await FileSystem.deleteAsync(download.uri, { idempotent: true });
              } catch (error) {
                console.log('File already deleted or not found');
              }
              const newDownloads = downloads.filter(d => d.id !== downloadId);
              saveDownloads(newDownloads);
            }
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Downloads',
      'Are you sure you want to delete all downloaded files?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            for (const download of downloads) {
              try {
                await FileSystem.deleteAsync(download.uri, { idempotent: true });
              } catch (error) {
                console.log('File already deleted or not found');
              }
            }
            saveDownloads([]);
          }
        }
      ]
    );
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
      'pdf': 'document-text',
      'doc': 'document-text',
      'docx': 'document-text',
      'txt': 'document-text',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'mp4': 'videocam',
      'mov': 'videocam',
      'avi': 'videocam',
      'mp3': 'musical-notes',
      'wav': 'musical-notes',
      'zip': 'archive',
      'rar': 'archive',
    };
    return iconMap[ext] || 'document';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Downloads</Text>
        {downloads.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
        {downloads.length === 0 && <View style={styles.placeholder} />}
      </View>

      <ScrollView style={styles.scrollView}>
        {downloads.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="download-outline" size={80} color={isDarkMode ? '#38383A' : '#E5E5E5'} />
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Downloads</Text>
            <Text style={[styles.emptyStateText, { color: theme.textTertiary }]}>
              Downloaded files will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.downloadsList}>
            {downloads.map((download) => (
              <View key={download.id} style={[styles.downloadItem, { backgroundColor: theme.cardBackground }]}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#38383A' : '#FFF8E5' }]}>
                  <Ionicons
                    name={getFileIcon(download.fileName)}
                    size={28}
                    color="#FFC837"
                  />
                </View>
                <View style={styles.downloadInfo}>
                  <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                    {download.fileName}
                  </Text>
                  <Text style={[styles.fileDetails, { color: theme.textTertiary }]}>
                    {formatFileSize(download.size)} • {formatDate(download.date)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleShare(download)}
                >
                  <Ionicons name="share-outline" size={22} color={theme.icon} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(download.id)}
                >
                  <Ionicons name="trash-outline" size={22} color="#E53238" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFC837',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E53238',
  },
  placeholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  downloadsList: {
    padding: 15,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FFF8E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  downloadInfo: {
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 12,
    color: '#999',
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
