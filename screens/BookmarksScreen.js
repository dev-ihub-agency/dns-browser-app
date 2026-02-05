import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useData } from '../DataContext';
import { useTheme } from '../ThemeContext';

const FOLDERS_KEY = '@dns_browser_folders';
const DEFAULT_FOLDERS = ['General', 'Development', 'Entertainment', 'Social', 'Shopping'];

export default function BookmarksScreen({ navigation }) {
  const { bookmarks, removeBookmark, addBookmark } = useData();
  const { theme, isDarkMode } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [newBookmarkUrl, setNewBookmarkUrl] = useState('');
  const [newBookmarkFolder, setNewBookmarkFolder] = useState('General');
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [customFolders, setCustomFolders] = useState(DEFAULT_FOLDERS);
  const [newFolderName, setNewFolderName] = useState('');

  // Load folders from AsyncStorage
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const savedFolders = await AsyncStorage.getItem(FOLDERS_KEY);
        if (savedFolders) {
          setCustomFolders(JSON.parse(savedFolders));
        }
      } catch (error) {
        console.error('Error loading folders:', error);
      }
    };
    loadFolders();
  }, []);

  // Save folders to AsyncStorage whenever they change
  useEffect(() => {
    const saveFolders = async () => {
      try {
        await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(customFolders));
      } catch (error) {
        console.error('Error saving folders:', error);
      }
    };
    saveFolders();
  }, [customFolders]);

  // Generate favicon URL from domain
  const getFaviconUrl = (url) => {
    const domain = url.replace(/^(https?:\/\/)?(www\.)?/, '');
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  };

  const folders = ['All', ...customFolders];
  const [selectedFolder, setSelectedFolder] = useState('All');

  const filteredBookmarks = selectedFolder === 'All'
    ? bookmarks
    : bookmarks.filter(b => b && b.folder === selectedFolder);

  const handleBookmarkPress = (bookmark) => {
    let url = bookmark.url;
    // Add https:// if no protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    navigation.navigate('Browser', { url });
  };

  const handleAddBookmark = () => {
    if (!newBookmarkTitle.trim() || !newBookmarkUrl.trim()) {
      Alert.alert('Error', 'Please fill in both title and URL');
      return;
    }

    addBookmark(newBookmarkUrl, newBookmarkTitle, newBookmarkFolder);
    setNewBookmarkTitle('');
    setNewBookmarkUrl('');
    setNewBookmarkFolder('General');
    setShowAddModal(false);
    Alert.alert('Success', 'Bookmark added successfully');
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    if (customFolders.includes(newFolderName)) {
      Alert.alert('Error', 'Folder already exists');
      return;
    }

    setCustomFolders([...customFolders, newFolderName]);
    setNewFolderName('');
    Alert.alert('Success', 'Folder added successfully');
  };

  const handleDeleteFolder = (folderName) => {
    if (folderName === 'General') {
      Alert.alert('Error', 'Cannot delete the default General folder');
      return;
    }

    const hasBookmarks = bookmarks.some(b => b.folder === folderName);
    if (hasBookmarks) {
      Alert.alert(
        'Warning',
        `This folder contains bookmarks. They will be moved to General. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              setCustomFolders(customFolders.filter(f => f !== folderName));
              Alert.alert('Success', 'Folder deleted');
            }
          }
        ]
      );
    } else {
      setCustomFolders(customFolders.filter(f => f !== folderName));
      Alert.alert('Success', 'Folder deleted');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.headerBackground }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Bookmarks</Text>
          <Text style={[styles.bookmarkCount, { color: theme.textSecondary }]}>{bookmarks.length} saved</Text>
        </View>
        <TouchableOpacity
          style={[styles.manageFoldersButton, { backgroundColor: isDarkMode ? '#38383A' : 'rgba(255, 255, 255, 0.7)' }]}
          onPress={() => setShowFolderManager(true)}
        >
          <Ionicons name="folder-outline" size={20} color={theme.text} />
          <Text style={[styles.manageFoldersText, { color: theme.text }]}>Manage</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={[styles.scrollView, { backgroundColor: theme.background }]}>
        {/* Folder Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {folders.map((folder) => (
            <TouchableOpacity
              key={folder}
              style={[
                styles.filterChip,
                { backgroundColor: isDarkMode ? '#38383A' : 'rgba(0, 0, 0, 0.06)' },
                selectedFolder === folder && { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFF' }
              ]}
              onPress={() => setSelectedFolder(folder)}
            >
              <Text style={[
                styles.filterText,
                { color: theme.textSecondary },
                selectedFolder === folder && { color: theme.text, fontWeight: '600' }
              ]}>
                {folder}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Empty State */}
        {bookmarks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color={isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} />
            <Text style={[styles.emptyStateTitle, { color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>No Bookmarks Yet</Text>
            <Text style={[styles.emptyStateText, { color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }]}>
              Tap the star icon while browsing to save bookmarks
            </Text>
          </View>
        ) : (
          <>
            {/* Bookmarks List */}
            <View style={styles.bookmarksList}>
              {filteredBookmarks.filter(bookmark => bookmark && bookmark.url).map((bookmark) => (
            <TouchableOpacity
              key={bookmark.id}
              style={[styles.bookmarkCard, { backgroundColor: theme.cardBackground }]}
              onPress={() => handleBookmarkPress(bookmark)}
            >
              <View style={[styles.faviconContainer, { backgroundColor: isDarkMode ? '#38383A' : '#F8F8F8' }]}>
                <Image
                  source={{ uri: getFaviconUrl(bookmark.url) }}
                  style={styles.favicon}
                />
              </View>
              <View style={styles.bookmarkInfo}>
                <Text style={[styles.bookmarkTitle, { color: theme.text }]} numberOfLines={1}>{bookmark.title}</Text>
                <Text style={[styles.bookmarkUrl, { color: theme.textTertiary }]} numberOfLines={1}>{bookmark.url}</Text>
              </View>
              <View style={[styles.folderBadge, { backgroundColor: isDarkMode ? '#38383A' : '#F5F5F5' }]}>
                <Text style={[styles.folderBadgeText, { color: theme.textSecondary }]}>{bookmark.folder}</Text>
              </View>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => removeBookmark(bookmark.id)}
              >
                <Ionicons name="close" size={18} color={theme.icon} />
              </TouchableOpacity>
            </TouchableOpacity>
              ))}
            </View>

            {/* Add Bookmark Button */}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.cardBackground }]}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="bookmark-outline" size={22} color={theme.textSecondary} />
              <Text style={[styles.addButtonText, { color: theme.textSecondary }]}>Add New Bookmark</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Add Bookmark Modal */}
      <Modal
        visible={showAddModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.addModal, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Bookmark</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={theme.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Title</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text
                }]}
                placeholder="Enter bookmark title"
                placeholderTextColor={theme.placeholder}
                value={newBookmarkTitle}
                onChangeText={setNewBookmarkTitle}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>URL</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text
                }]}
                placeholder="https://example.com"
                placeholderTextColor={theme.placeholder}
                value={newBookmarkUrl}
                onChangeText={setNewBookmarkUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Folder</Text>
              <TouchableOpacity
                style={[styles.folderSelector, {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder
                }]}
                onPress={() => setShowFolderPicker(!showFolderPicker)}
              >
                <Text style={[styles.folderSelectorText, { color: theme.text }]}>{newBookmarkFolder}</Text>
                <Ionicons name="chevron-down" size={20} color={theme.icon} />
              </TouchableOpacity>

              {showFolderPicker && (
                <View style={[styles.folderPicker, { backgroundColor: theme.inputBackground }]}>
                  {folders.filter(f => f !== 'All').map((folder) => (
                    <TouchableOpacity
                      key={folder}
                      style={[styles.folderOption, { borderBottomColor: theme.border }]}
                      onPress={() => {
                        setNewBookmarkFolder(folder);
                        setShowFolderPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.folderOptionText,
                        { color: theme.textSecondary },
                        newBookmarkFolder === folder && { color: theme.text, fontWeight: '600' }
                      ]}>
                        {folder}
                      </Text>
                      {newBookmarkFolder === folder && (
                        <Ionicons name="checkmark" size={20} color="#FFC837" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: isDarkMode ? '#38383A' : '#F5F5F5' }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddBookmark}
              >
                <Text style={styles.saveButtonText}>Add Bookmark</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Folder Manager Modal */}
      <Modal
        visible={showFolderManager}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowFolderManager(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.folderManagerModal, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Manage Folders</Text>
              <TouchableOpacity onPress={() => setShowFolderManager(false)}>
                <Ionicons name="close" size={24} color={theme.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.addFolderSection}>
              <TextInput
                style={[styles.folderInput, {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.text
                }]}
                placeholder="New folder name"
                placeholderTextColor={theme.placeholder}
                value={newFolderName}
                onChangeText={setNewFolderName}
              />
              <TouchableOpacity
                style={styles.addFolderButton}
                onPress={handleAddFolder}
              >
                <Ionicons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.folderList}>
              {customFolders.map((folder) => (
                <View key={folder} style={[styles.folderListItem, { backgroundColor: isDarkMode ? '#38383A' : '#F8F8F8' }]}>
                  <View style={[styles.folderIconContainer, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFF' }]}>
                    <Ionicons name="folder" size={24} color="#FFC837" />
                  </View>
                  <Text style={[styles.folderListItemText, { color: theme.text }]}>{folder}</Text>
                  {folder !== 'General' && (
                    <TouchableOpacity
                      style={styles.deleteFolderButton}
                      onPress={() => handleDeleteFolder(folder)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#E53238" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeManagerButton}
              onPress={() => setShowFolderManager(false)}
            >
              <Text style={styles.closeManagerButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  bookmarkCount: {
    fontSize: 13,
    color: '#666',
  },
  filtersContainer: {
    maxHeight: 50,
    marginBottom: 12,
    marginTop: 12,
  },
  filtersContent: {
    paddingHorizontal: 15,
    paddingVertical: 0,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#FFF',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  bookmarksList: {
    paddingHorizontal: 15,
  },
  bookmarkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  faviconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F8F8F8',
    overflow: 'hidden',
  },
  favicon: {
    width: 24,
    height: 24,
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 3,
  },
  bookmarkUrl: {
    fontSize: 12,
    color: '#999',
  },
  folderBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  folderBadgeText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  moreButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginVertical: 15,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  addModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  folderSelector: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  folderSelectorText: {
    fontSize: 14,
    color: '#000',
  },
  folderPicker: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  folderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  folderOptionText: {
    fontSize: 14,
    color: '#666',
  },
  folderOptionTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FFC837',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  manageFoldersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  manageFoldersText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  folderManagerModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  addFolderSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  folderInput: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  addFolderButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFC837',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderList: {
    maxHeight: 300,
  },
  folderListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  folderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  folderListItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  deleteFolderButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeManagerButton: {
    backgroundColor: '#FFC837',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  closeManagerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
