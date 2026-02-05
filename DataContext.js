import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMode } from './ModeContext';

const DataContext = createContext();

const BOOKMARKS_KEY = '@dns_browser_bookmarks';
const HISTORY_KEY = '@dns_browser_history';
const USERNAME_KEY = '@dns_browser_username';
const FIRST_LAUNCH_KEY = '@dns_browser_first_launch';

export function DataProvider({ children }) {
  const { mode } = useMode();
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);
  const [privateMode, setPrivateMode] = useState(false);
  const [username, setUsername] = useState('');
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Refs for debouncing
  const bookmarksTimeoutRef = useRef(null);
  const historyTimeoutRef = useRef(null);

  // Helper function to update date labels based on current date
  const updateHistoryDateLabels = (historyData) => {
    if (!historyData || historyData.length === 0) return historyData;
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    
    return historyData.map(group => {
      // If the group has items with timestamps, use the first item's timestamp
      if (group.items && group.items.length > 0 && group.items[0].id) {
        const itemDate = new Date(group.items[0].id);
        const itemDateStr = itemDate.toDateString();
        
        let newDateLabel;
        if (itemDateStr === todayStr) {
          newDateLabel = 'Today';
        } else if (itemDateStr === yesterdayStr) {
          newDateLabel = 'Yesterday';
        } else {
          // Format as readable date
          newDateLabel = itemDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          });
        }
        
        return { ...group, date: newDateLabel };
      }
      return group;
    });
  };

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedBookmarks = await AsyncStorage.getItem(BOOKMARKS_KEY);
        const savedHistory = await AsyncStorage.getItem(HISTORY_KEY);
        const savedUsername = await AsyncStorage.getItem(USERNAME_KEY);
        const firstLaunch = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);

        if (savedBookmarks) {
          setBookmarks(JSON.parse(savedBookmarks));
        }
        if (savedHistory) {
          // Update date labels when loading history
          const loadedHistory = JSON.parse(savedHistory);
          const updatedHistory = updateHistoryDateLabels(loadedHistory);
          setHistory(updatedHistory);
        }
        if (savedUsername) {
          setUsername(savedUsername);
        }
        // If firstLaunch has never been set, it's the first launch
        // Otherwise, it's not the first launch
        setIsFirstLaunch(firstLaunch === null);
        // Mark data as loaded
        setIsDataLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsDataLoaded(true);
      }
    };

    loadData();
  }, []);

  // Debounced save for bookmarks (wait 1 second after last change)
  useEffect(() => {
    if (bookmarksTimeoutRef.current) {
      clearTimeout(bookmarksTimeoutRef.current);
    }

    bookmarksTimeoutRef.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      } catch (error) {
        console.error('Error saving bookmarks:', error);
      }
    }, 1000);

    return () => {
      if (bookmarksTimeoutRef.current) {
        clearTimeout(bookmarksTimeoutRef.current);
      }
    };
  }, [bookmarks]);

  // Debounced save for history (wait 2 seconds after last change)
  useEffect(() => {
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }

    historyTimeoutRef.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      } catch (error) {
        console.error('Error saving history:', error);
      }
    }, 2000);

    return () => {
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
      }
    };
  }, [history]);

  const addBookmark = (url, title, folder = 'General') => {
    const newBookmark = {
      id: Date.now(),
      title,
      url: url.replace(/^https?:\/\/(www\.)?/, ''), // Remove protocol and www
      folder
    };
    setBookmarks([...bookmarks, newBookmark]);
  };

  const removeBookmark = (id) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  // Memoized isBookmarked function for better performance
  const isBookmarked = useCallback((url) => {
    const cleanUrl = url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    return bookmarks.some(b => {
      const bookmarkUrl = b.url.replace(/\/$/, '');
      return bookmarkUrl === cleanUrl || cleanUrl.startsWith(bookmarkUrl);
    });
  }, [bookmarks]);

  const addHistory = (url, title) => {
    // Don't add to history if in private mode or in Warp mode
    if (privateMode || mode === 'Warp') {
      return;
    }

    // Skip empty or invalid URLs
    if (!url || url === 'about:blank') {
      return;
    }

    const cleanUrl = url.replace(/^https?:\/\/(www\.)?/, '');
    
    // Skip if the same URL was just added (prevent duplicates from page refreshes)
    setHistory(prevHistory => {
      // First, update all date labels
      const updatedHistory = updateHistoryDateLabels([...prevHistory]);
      
      const todayGroup = updatedHistory.find(group => group.date === 'Today');
      
      // Check if the last item in today's history is the same URL
      if (todayGroup && todayGroup.items.length > 0) {
        const lastItem = todayGroup.items[0];
        if (lastItem.url === cleanUrl) {
          // Same URL, don't add duplicate
          return updatedHistory;
        }
      }

      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

      const newHistoryItem = {
        id: Date.now(),
        title: title || 'Untitled',
        url: cleanUrl,
        time: timeString
      };

      if (todayGroup) {
        todayGroup.items.unshift(newHistoryItem);
      } else {
        updatedHistory.unshift({
          date: 'Today',
          items: [newHistoryItem]
        });
      }

      return updatedHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const removeHistoryItem = (itemId) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.map(group => ({
        ...group,
        items: group.items.filter(item => item.id !== itemId)
      })).filter(group => group.items.length > 0); // Remove empty groups

      return newHistory;
    });
  };

  const saveUsername = async (name) => {
    try {
      await AsyncStorage.setItem(USERNAME_KEY, name);
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'false');
      setUsername(name);
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Error saving username:', error);
    }
  };

  return (
    <DataContext.Provider value={{
      bookmarks,
      history,
      privateMode,
      setPrivateMode,
      username,
      isFirstLaunch,
      isDataLoaded,
      saveUsername,
      addBookmark,
      removeBookmark,
      isBookmarked,
      addHistory,
      clearHistory,
      removeHistoryItem
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
