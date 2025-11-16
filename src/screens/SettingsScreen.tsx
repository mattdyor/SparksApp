import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, RefreshControl, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSparkStore, useAppStore } from '../store';
import { useTheme } from '../contexts/ThemeContext';
import { HapticFeedback } from '../utils/haptics';
import { NotificationService } from '../utils/notifications';
import { SettingsFeedbackSection, SettingsScrollView } from '../components/SettingsComponents';
import { AdminFeedbackManager } from '../components/AdminFeedbackManager';
import { AdminReviewsManager } from '../components/AdminReviewsManager';
import { NotificationBadge } from '../components/NotificationBadge';
import { AdminResponseService } from '../services/AdminResponseService';
import { FeedbackNotificationService } from '../services/FeedbackNotificationService';
import { ServiceFactory } from '../services/ServiceFactory';
import { FeedbackService } from '../services/FeedbackService';
import { getSparkById } from '../components/SparkRegistry';

export const SettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  
  const { 
    sparkData, 
    sparkProgress, 
    userSparkIds, 
    favoriteSparkIds,
    reorderUserSparks,
    removeSparkFromUser
  } = useSparkStore();
  
  const {
    preferences,
    setPreferences
  } = useAppStore();

  // Admin and initialization state
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAdminManager, setShowAdminManager] = useState(false);
  const [showReviewsManager, setShowReviewsManager] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
  const [unreadReviewsCount, setUnreadReviewsCount] = useState(0);

  // Refresh unread counts periodically for admins
  useEffect(() => {
    if (!isAdmin) return;

    const refreshUnreadCounts = async () => {
      try {
        const feedbackCount = await AdminResponseService.getUnreadFeedbackCount();
        const reviewsCount = await AdminResponseService.getUnreadReviewsCount();
        setUnreadFeedbackCount(feedbackCount);
        setUnreadReviewsCount(reviewsCount);
        
        // Update app icon badge when admin counts change
        await FeedbackNotificationService.updateAppIconBadge();
      } catch (error) {
        console.error('Error refreshing unread counts:', error);
      }
    };

    // Refresh immediately
    refreshUnreadCounts();

    // Refresh every 5 seconds
    const interval = setInterval(refreshUnreadCounts, 5000);

    return () => clearInterval(interval);
  }, [isAdmin]);
  
  // Spark management state
  const [isReordering, setIsReordering] = useState(false);
  
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  
  // Debug state
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  // Initialize analytics service
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        console.log('🚀 SettingsScreen: Starting analytics initialization...');
        await ServiceFactory.ensureAnalyticsInitialized();
        await ServiceFactory.ensureFirebaseInitialized();
        setIsInitialized(true);
        console.log('✅ SettingsScreen: Analytics initialized successfully');
        
        // Track settings access
        const AnalyticsService = ServiceFactory.getAnalyticsService();
        if (AnalyticsService.trackSettingsAccess) {
          AnalyticsService.trackSettingsAccess();
        }
        
        // Check if current device is admin
        const adminStatus = await AdminResponseService.isAdmin();
        setIsAdmin(adminStatus);
        console.log('🔑 Admin status:', adminStatus);
        
            // Load unread counts for admin
            if (adminStatus) {
              const feedbackCount = await AdminResponseService.getUnreadFeedbackCount();
              const reviewsCount = await AdminResponseService.getUnreadReviewsCount();
              setUnreadFeedbackCount(feedbackCount);
              setUnreadReviewsCount(reviewsCount);
            }
        
        // Debug: Show current device ID
        const sessionInfo = AnalyticsService.getSessionInfo();
        console.log('🔍 Current device ID:', sessionInfo.userId);
        console.log('🔍 Session ID:', sessionInfo.sessionId);
        console.log('🔍 Analytics initialized:', sessionInfo.isInitialized);
        console.log('🔍 Analytics service type:', AnalyticsService.constructor.name);
        
        // Fallback: Get device ID directly from AsyncStorage
        let deviceId: string | null = sessionInfo.userId || sessionInfo.sessionId;
        if (!deviceId || deviceId === 'unknown') {
          try {
            deviceId = await AsyncStorage.getItem('analytics_device_id');
            console.log('🔍 Device ID from AsyncStorage:', deviceId);
          } catch (error) {
            console.error('❌ Error getting device ID from AsyncStorage:', error);
          }
        }
        
        setCurrentDeviceId(deviceId || 'Unknown');
      } catch (error) {
        console.error('❌ SettingsScreen: Error initializing analytics:', error);
        setIsInitialized(false);
      }
    };

    initializeAnalytics();
  }, []);





  // Handle daily notification toggle
  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      await NotificationService.scheduleDailyNotification();
    } else {
      await NotificationService.cancelDailyNotification();
    }
    setPreferences({ dailyNotificationsEnabled: enabled });
    HapticFeedback.light();
  };

  const handleResetAllData = () => {
    Alert.alert(
      "Reset All Data",
      "This will permanently delete all your spark progress, scores, and preferences. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive",
          onPress: () => {
            // Clear all spark data
            Object.keys(sparkData).forEach(sparkId => {
              useSparkStore.getState().setSparkData(sparkId, {});
            });
            
            // Clear all progress
            useSparkStore.setState({ sparkProgress: {} });
            
            // Reset settings
            setPreferences({
              theme: 'system',
              soundEnabled: true,
              hapticsEnabled: true,
              dailyNotificationsEnabled: false
            });
            
            Alert.alert("Success", "All data has been reset.");
          }
        }
      ]
    );
  };


  // Spark management functions
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderUserSparks(index, index - 1);
      HapticFeedback.light();
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < userSparkIds.length - 1) {
      reorderUserSparks(index, index + 1);
      HapticFeedback.light();
    }
  };

  const handleRemoveSpark = (sparkId: string, sparkName: string) => {
    Alert.alert(
      'Remove Spark',
      `Are you sure you want to remove "${sparkName}" from your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeSparkFromUser(sparkId);
            HapticFeedback.medium();
          }
        }
      ]
    );
  };

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 SettingsScreen: Starting refresh...');
      
      // Refresh analytics initialization
      const AnalyticsService = ServiceFactory.getAnalyticsService();
      await AnalyticsService.initialize();
      
      // Refresh admin status
      const adminStatus = await AdminResponseService.isAdmin();
      setIsAdmin(adminStatus);
      
      // Refresh feedback data (this will be handled by SettingsFeedbackSection)
      console.log('✅ SettingsScreen: Refresh completed');
      
      HapticFeedback.light();
    } catch (error) {
      console.error('❌ SettingsScreen: Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getDataStats = () => {
    const totalSparks = userSparkIds.length;
    const totalProgress = Object.keys(sparkProgress).length;
    const totalFavorites = favoriteSparkIds.length;
    const totalSessions = Object.values(sparkProgress).reduce((sum, progress) => sum + progress.timesPlayed, 0);

    return { totalSparks, totalProgress, totalFavorites, totalSessions };
  };


  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <SettingsScrollView onRefresh={handleRefresh} refreshing={refreshing}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
        <Text style={styles.subtitle}>Customize your Sparks experience</Text>
      </View>

      <View style={styles.feedbackSection}>
        <SettingsFeedbackSection sparkName="Sparks App" />
      </View>

      {/* Debug Section - Remove after testing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Debug Info</Text>
        <Text style={styles.debugText}>Admin Status: {isAdmin ? '✅ Admin' : '❌ Not Admin'}</Text>
        {/* <Text style={styles.debugText}>Device ID: {currentDeviceId || 'Loading...'}</Text> */}
        {/* <Text style={styles.debugText}>Analytics Initialized: {isInitialized ? '✅ Yes' : '❌ No'}</Text> */}
        <Text style={styles.debugText}>Expected Device ID: device_1761186342237_3wfem84rw</Text>
        
        <TouchableOpacity
          style={styles.debugButton}
          onPress={async () => {
            try {
              // Check if we're in a development build vs Expo Go
              let isDevBuild = false;
              let buildType = 'Unknown';
              
              try {
                // Check for expo-dev-client (development builds have this)
                const Constants = await import('expo-constants');
                if (Constants.default?.executionEnvironment) {
                  const env = Constants.default.executionEnvironment;
                  buildType = env;
                  isDevBuild = env === 'standalone' || env === 'storeClient' || env === 'bare';
                  console.log('📱 Execution environment:', env);
                }
              } catch (e) {
                console.log('⚠️ Could not check execution environment:', e);
              }
              
              // Also check for native modules (dev builds have these)
              if (typeof (global as any).nativeCallSyncHook !== 'undefined') {
                isDevBuild = true;
                buildType = 'Development Build (native modules detected)';
                console.log('✅ Native modules detected - this is a development build');
              } else {
                buildType = 'Expo Go (no native modules)';
                console.log('⚠️ No native modules detected - might be Expo Go');
              }
              
              console.log('📱 Build type:', buildType);
              console.log('📱 Is development build:', isDevBuild);
              
              // Import expo-notifications - try multiple patterns
              let Notifications: any = null;
              
              try {
                // Import expo-notifications the same way as App.tsx: import * as Notifications
                // When using dynamic import, we get the module namespace
                const NotificationsModule = await import('expo-notifications');
                // The module itself IS the Notifications object (all methods are on it)
                Notifications = NotificationsModule;
                console.log('📱 Import method: dynamic import (namespace)');
                console.log('📱 Module has scheduleNotificationAsync:', typeof Notifications.scheduleNotificationAsync === 'function');
              } catch (importError) {
                console.log('⚠️ Dynamic import failed, trying require:', importError);
                try {
                  // Fallback to require - same pattern
                  Notifications = require('expo-notifications');
                  console.log('📱 Import method: require');
                } catch (requireError) {
                  throw new Error(`expo-notifications is not available. Import error: ${importError}. Require error: ${requireError}. Build type: ${buildType}`);
                }
              }
              
              if (!Notifications) {
                throw new Error(`expo-notifications module loaded but API is undefined. Build type: ${buildType}. Make sure you are using a development build, not Expo Go.`);
              }
              
              console.log('✅ Notifications module loaded successfully');
              console.log('📱 Notifications type:', typeof Notifications);
              console.log('📱 Has scheduleNotificationAsync:', typeof Notifications.scheduleNotificationAsync === 'function');
              
              console.log('📱 Notifications module loaded:', !!Notifications);
              console.log('📱 Available methods:', Object.keys(Notifications as any).filter((k: string) => typeof (Notifications as any)[k] === 'function').slice(0, 10));
              
              // Check current permission status with full details
              const permissions = await Notifications.getPermissionsAsync();
              console.log('📱 Current notification permission status:', permissions.status);
              console.log('📱 Full permission details:', JSON.stringify(permissions, null, 2));
              
              // Check iOS-specific permissions - CRITICAL for scheduled notifications
              if (Platform.OS === 'ios' && permissions.ios) {
                const iosPerms = {
                  allowsAlert: permissions.ios.allowsAlert,
                  allowsBadge: permissions.ios.allowsBadge,
                  allowsSound: permissions.ios.allowsSound,
                  allowsDisplayInCarPlay: permissions.ios.allowsDisplayInCarPlay,
                  allowsDisplayOnLockScreen: permissions.ios.allowsDisplayOnLockScreen,
                  allowsDisplayInNotificationCenter: permissions.ios.allowsDisplayInNotificationCenter,
                  allowsAnnouncements: permissions.ios.allowsAnnouncements,
                };
                console.log('📱 iOS permissions:', iosPerms);
                
                // CRITICAL: iOS requires allowsAlert to be true for scheduled notifications to fire
                if (!iosPerms.allowsAlert) {
                  Alert.alert(
                    'Alert Permission Required',
                    'iOS requires "Alert" permission to be enabled for scheduled notifications to fire.\n\nEven if notifications are "granted", alerts must be specifically enabled.\n\nPlease enable alerts in:\nSettings > Sparks > Notifications > Allow Notifications > Alerts',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Open Settings', 
                        onPress: () => {
                          Linking.openURL('app-settings:');
                        }
                      }
                    ]
                  );
                  return;
                }
              }
              
              let finalStatus = permissions.status;
              
              // Request permissions if not already granted
              if (permissions.status !== 'granted') {
                console.log('📱 Requesting notification permissions...');
                const requestResult = await Notifications.requestPermissionsAsync({
                  ios: {
                    allowAlert: true,
                    allowBadge: true,
                    allowSound: true,
                    allowDisplayInCarPlay: false,
                    allowDisplayOnLockScreen: true,
                    allowDisplayInNotificationCenter: true,
                    allowAnnouncements: false,
                  },
                });
                finalStatus = requestResult.status;
                console.log('📱 Permission request result:', requestResult.status);
                console.log('📱 Full permission details after request:', JSON.stringify(requestResult, null, 2));
                
                // Double-check iOS-specific permissions after request
                if (Platform.OS === 'ios' && requestResult.ios && !requestResult.ios.allowsAlert) {
                  Alert.alert(
                    'Alert Permission Required',
                    'iOS requires "Alert" permission to be enabled for scheduled notifications.\n\nPlease enable alerts in:\nSettings > Sparks > Notifications > Allow Notifications > Alerts',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Open Settings', 
                        onPress: () => {
                          Linking.openURL('app-settings:');
                        }
                      }
                    ]
                  );
                  return;
                }
              }
              
              if (finalStatus !== 'granted') {
                Alert.alert(
                  'Permissions Required',
                  `Notification permissions are ${finalStatus}. Please enable notifications in your device settings to test notifications.\n\nOn iOS: Settings > Sparks > Notifications\nOn Android: Settings > Apps > Sparks > Notifications`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Open Settings', 
                      onPress: () => {
                        if (Platform.OS === 'ios') {
                          Linking.openURL('app-settings:');
                        } else {
                          Linking.openSettings();
                        }
                      }
                    }
                  ]
                );
                return;
              }
              
              // Final verification: Check that iOS alert permission is actually enabled
              const finalCheck = await Notifications.getPermissionsAsync();
              if (Platform.OS === 'ios' && finalCheck.ios && !finalCheck.ios.allowsAlert) {
                Alert.alert(
                  'Alert Permission Not Enabled',
                  'Even though notification permissions are granted, iOS "Alert" permission is not enabled.\n\nThis is REQUIRED for scheduled notifications to fire.\n\nPlease enable:\nSettings > Sparks > Notifications > Allow Notifications > Alerts',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Open Settings', 
                      onPress: () => {
                        Linking.openURL('app-settings:');
                      }
                    }
                  ]
                );
                return;
              }

              // Ensure Android notification channel exists
              if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
                try {
                  await Notifications.setNotificationChannelAsync('default', {
                    name: 'Default',
                    importance: Notifications.AndroidImportance?.HIGH || 4,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#2E86AB',
                    sound: 'default',
                    enableVibrate: true,
                    showBadge: true,
                  });
                  console.log('✅ Android notification channel created');
                } catch (channelError) {
                  console.warn('⚠️ Could not create notification channel:', channelError);
                }
              }

              // Check current scheduled notification count (iOS limit is 64)
              // According to Stack Overflow: iOS has a hard limit of 64 scheduled notifications
              try {
                const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
                console.log(`📊 Current scheduled notifications: ${existingNotifications.length}/64`);
                if (existingNotifications.length >= 64) {
                  Alert.alert(
                    'Notification Limit Reached',
                    `iOS allows a maximum of 64 scheduled notifications. You currently have ${existingNotifications.length} scheduled.\n\nPlease cancel some existing notifications first using:\n\nawait Notifications.cancelAllScheduledNotificationsAsync();`,
                    [{ text: 'OK' }]
                  );
                  return;
                }
              } catch (checkError) {
                console.warn('Could not check scheduled notifications:', checkError);
              }
              
              // First, test with immediate notification to verify the system works
              // Use scheduleNotificationAsync with null trigger for immediate notification
              console.log('🧪 Testing immediate notification first...');
              try {
                const immediateId = await Notifications.scheduleNotificationAsync({
                  content: {
                    title: '🧪 Immediate Test',
                    body: 'If you see this, notifications are working!',
                    data: { type: 'immediate-test' },
                    sound: 'default',
                  },
                  trigger: null, // null trigger = immediate notification
                });
                console.log('✅ Immediate notification scheduled:', immediateId);
              } catch (immediateError) {
                console.warn('⚠️ Could not schedule immediate notification:', immediateError);
                Alert.alert(
                  'Notification System Error',
                  'Could not schedule immediate notification. This suggests a fundamental issue with the notification system.\n\nCheck:\n• iOS Settings > Sparks > Notifications\n• App permissions\n• Device restart may be needed',
                  [{ text: 'OK' }]
                );
                return;
              }
              
              // Cancel any existing test notification first
              try {
                await Notifications.cancelScheduledNotificationAsync('test-notification');
                console.log('🧹 Cancelled any existing test notification');
              } catch (cancelError) {
                // Ignore if doesn't exist
              }
              
              // Calculate seconds until trigger (1 minute = 60 seconds)
              const secondsUntilTrigger = 60;
              const now = new Date();
              const futureTime = new Date(now.getTime() + secondsUntilTrigger * 1000);
              
              console.log('📅 Current time:', now.toISOString());
              console.log('📅 Current time (local):', now.toLocaleString());
              console.log('📅 Scheduled time:', futureTime.toISOString());
              console.log('📅 Scheduled time (local):', futureTime.toLocaleString());
              console.log('📅 Seconds until trigger:', secondsUntilTrigger);
              console.log('📅 Is future time valid?', futureTime.getTime() > now.getTime());
              
              // Schedule notification - use seconds trigger (matches working code in notifications.ts)
              const notificationContent = {
                title: '🔔 Test Notification',
                body: 'This is a test notification scheduled 1 minute in the future.',
                data: { 
                  type: 'test-notification',
                  timestamp: Date.now()
                },
                sound: 'default',
                badge: 1,
                ...(Platform.OS === 'android' && {
                  channelId: 'default',
                }),
              };
              
              console.log('📝 Notification content:', notificationContent);
              
              // Use seconds trigger (same format as working code in NotificationService)
              // According to Stack Overflow: seconds trigger is more reliable than date trigger on iOS
              const trigger = { 
                seconds: secondsUntilTrigger
              } as any; // Type assertion needed due to expo-notifications type definitions
              console.log('⏰ Notification trigger:', JSON.stringify(trigger));
              
              // Schedule the notification with retry logic
              let notificationId: string = '';
              let scheduleAttempt = 0;
              const maxScheduleAttempts = 3;
              let scheduleSuccess = false;
              
              while (scheduleAttempt < maxScheduleAttempts) {
                scheduleAttempt++;
                console.log(`🔄 Scheduling attempt ${scheduleAttempt}/${maxScheduleAttempts}...`);
                
                try {
                  if (scheduleAttempt === 1) {
                    // First attempt: with identifier
                    notificationId = await Notifications.scheduleNotificationAsync({
                      identifier: 'test-notification',
                      content: notificationContent,
                      trigger: trigger,
                    });
                    console.log('✅ Test notification scheduled with ID:', notificationId);
                    scheduleSuccess = true;
                  } else if (scheduleAttempt === 2) {
                    // Second attempt: without identifier
                    console.log('🔄 Retrying without identifier...');
                    notificationId = await Notifications.scheduleNotificationAsync({
                      content: notificationContent,
                      trigger: trigger,
                    });
                    console.log('✅ Test notification scheduled (no identifier) with ID:', notificationId);
                    scheduleSuccess = true;
                  } else {
                    // Third attempt: with different trigger format (seconds as number, not object)
                    console.log('🔄 Retrying with simplified trigger...');
                    notificationId = await Notifications.scheduleNotificationAsync({
                      content: notificationContent,
                      trigger: secondsUntilTrigger, // Try direct number instead of object
                    });
                    console.log('✅ Test notification scheduled (simplified trigger) with ID:', notificationId);
                    scheduleSuccess = true;
                  }
                  
                  // If we got here, scheduling succeeded
                  break;
                } catch (scheduleError) {
                  console.error(`❌ Scheduling attempt ${scheduleAttempt} failed:`, scheduleError);
                  if (scheduleAttempt === maxScheduleAttempts) {
                    Alert.alert(
                      'Scheduling Failed',
                      `Failed to schedule notification after ${maxScheduleAttempts} attempts.\n\nError: ${scheduleError instanceof Error ? scheduleError.message : 'Unknown error'}\n\nCheck console for details.`,
                      [{ text: 'OK' }]
                    );
                    return;
                  }
                  // Wait a bit before retrying
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              }
              
              if (!scheduleSuccess || !notificationId) {
                Alert.alert('Error', 'Failed to schedule notification. Check console for details.');
                return;
              }
              
              // Wait longer for iOS to process (iOS can be slow to update the scheduled list)
              console.log('⏳ Waiting for iOS to process notification...');
              
              // Check multiple times with delays (iOS can be slow)
              let notificationFound = false;
              let scheduledNotifications: any[] = [];
              const maxVerificationAttempts = 5; // Increased from 3 to 5
              
              for (let attempt = 0; attempt < maxVerificationAttempts; attempt++) {
                console.log(`🔍 Verification attempt ${attempt + 1}/${maxVerificationAttempts}...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay to 1 second
                
                try {
                  scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
                  console.log(`📋 Attempt ${attempt + 1}: Found ${scheduledNotifications.length} scheduled notifications`);
                  
                  // Check both with and without identifier
                  const ourNotificationById = scheduledNotifications.find((n: any) => n.identifier === 'test-notification');
                  const ourNotificationByIdMatch = scheduledNotifications.find((n: any) => n.identifier === notificationId);
                  const ourNotificationByContent = scheduledNotifications.find((n: any) => 
                    n.content?.title === '🔔 Test Notification'
                  );
                  
                  const ourNotification = ourNotificationById || ourNotificationByIdMatch || ourNotificationByContent;
                  
                  if (ourNotification) {
                    notificationFound = true;
                    console.log('✅ Notification found in scheduled list!');
                    console.log('📋 Notification identifier:', ourNotification.identifier);
                    console.log('📋 Notification trigger:', JSON.stringify(ourNotification.trigger, null, 2));
                    console.log('📋 Notification content:', ourNotification.content);
                    break;
                  } else {
                    console.log(`⚠️ Notification not found in attempt ${attempt + 1}, checking again...`);
                  }
                } catch (checkError) {
                  console.warn(`⚠️ Verification attempt ${attempt + 1} failed:`, checkError);
                }
              }
              
              // Final verification
              if (!notificationFound) {
                console.log('📋 Final check - All scheduled notifications:', scheduledNotifications.map((n: any) => ({
                  id: n.identifier,
                  trigger: n.trigger,
                  title: n.content?.title,
                  date: n.trigger?.date || n.trigger?.seconds || 'unknown'
                })));
                
                console.error('❌ Notification was not found in scheduled list after 5 attempts!');
                console.error('❌ Scheduled ID returned:', notificationId);
                console.error('❌ This is a known iOS issue with expo-notifications.');
                console.error('❌ According to Stack Overflow and Expo docs:');
                console.error('   - iOS sometimes schedules notifications but doesn\'t list them');
                console.error('   - The notification may still fire even if not listed');
                console.error('   - This is NOT necessarily a configuration error');
                console.error('   - Try putting app in background and waiting 1 minute');
                
                // Check if there are too many scheduled notifications
                if (scheduledNotifications.length >= 64) {
                  console.error('⚠️ iOS limit reached: Maximum 64 scheduled notifications allowed');
                  Alert.alert(
                    'Notification Limit Reached',
                    'iOS allows a maximum of 64 scheduled notifications. Please cancel some existing notifications and try again.',
                    [{ text: 'OK' }]
                  );
                }
              }
              
              // Show appropriate alert based on whether notification was found
              if (notificationFound) {
                Alert.alert(
                  '✅ Test Notification Scheduled',
                  `A test notification has been scheduled for ${futureTime.toLocaleTimeString()} (1 minute from now).\n\nNotification ID: ${notificationId}\n\n⚠️ IMPORTANT: For the notification to appear, you may need to:\n• Put the app in the background (press home button)\n• Lock your device\n• Or close the app completely`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  '⚠️ Notification Scheduled (May Not Be Listed)',
                  `A test notification has been scheduled for ${futureTime.toLocaleTimeString()} (1 minute from now).\n\nNotification ID: ${notificationId}\n\n⚠️ iOS QUIRK: The notification was scheduled but doesn't appear in the scheduled list. This is a known iOS limitation.\n\n✅ The notification may still fire! To test:\n• Put the app in the background\n• Lock your device\n• Wait 1 minute\n• Check if notification appears\n\nIf it doesn't appear, check:\n• iOS Settings > Sparks > Notifications (must be enabled)\n• Do Not Disturb mode (may suppress notifications)\n• Notification limit (64 max scheduled)`,
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('❌ Error scheduling test notification:', error);
              console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
              Alert.alert(
                'Error',
                `Failed to schedule test notification:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`,
                [{ text: 'OK' }]
              );
            }
          }}
        >
          <Text style={styles.debugButtonText}>🔔 Test Notifications (1 min)</Text>
        </TouchableOpacity>
        
        {currentDeviceId && !isAdmin && (
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => {
              Alert.alert(
                'Add Device to Admin List',
                `Add this device ID to the admin list?\n\n${currentDeviceId}`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Add', 
                    onPress: () => {
                      // Open email client with device ID
                      const subject = encodeURIComponent('DEVICE_IDS');
                      const body = encodeURIComponent(currentDeviceId);
                      const mailtoUrl = `mailto:matt@dyor.com?subject=${subject}&body=${body}`;
                      
                      Linking.openURL(mailtoUrl).catch((err) => {
                        console.error('Error opening email client:', err);
                        Alert.alert('Error', 'Could not open email client. Please send an email to matt@dyor.com with subject "DEVICE_IDS" and body containing your device ID.');
                      });
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.debugButtonText}>Add This Device to Admin List</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Admin Section */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔑 Admin Tools</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={async () => {
              setShowAdminManager(true);
              // Refresh unread counts when opening
              const feedbackCount = await AdminResponseService.getUnreadFeedbackCount();
              const reviewsCount = await AdminResponseService.getUnreadReviewsCount();
              setUnreadFeedbackCount(feedbackCount);
              setUnreadReviewsCount(reviewsCount);
            }}
          >
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonText}>📢 Manage Feedback</Text>
              {unreadFeedbackCount > 0 && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>
                    {unreadFeedbackCount > 99 ? '99+' : unreadFeedbackCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={async () => {
              setShowReviewsManager(true);
              // Refresh unread counts when opening
              const feedbackCount = await AdminResponseService.getUnreadFeedbackCount();
              const reviewsCount = await AdminResponseService.getUnreadReviewsCount();
              setUnreadFeedbackCount(feedbackCount);
              setUnreadReviewsCount(reviewsCount);
            }}
          >
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonText}>⭐ View Recent Reviews</Text>
              {unreadReviewsCount > 0 && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>
                    {unreadReviewsCount > 99 ? '99+' : unreadReviewsCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experience</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <Text style={styles.settingDescription}>Feel vibrations on interactions</Text>
          </View>
          <Switch
            value={preferences.hapticsEnabled}
            onValueChange={(value) => {
              HapticFeedback.light();
              setPreferences({ hapticsEnabled: value });
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={preferences.hapticsEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Sound Effects</Text>
            <Text style={styles.settingDescription}>Play audio feedback</Text>
          </View>
          <Switch
            value={preferences.soundEnabled}
            onValueChange={(value) => {
              HapticFeedback.light();
              setPreferences({ soundEnabled: value });
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={preferences.soundEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Daily Spark Reminders</Text>
            <Text style={styles.settingDescription}>Get notified at 8 AM to explore new sparks</Text>
          </View>
          <Switch
            value={preferences.dailyNotificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={preferences.dailyNotificationsEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Spark Management Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Sparks</Text>
          {userSparkIds.length > 1 && (
            <TouchableOpacity
              style={[styles.reorderButton, { backgroundColor: isReordering ? colors.primary : colors.secondary }]}
              onPress={() => setIsReordering(!isReordering)}
            >
              <Text style={[styles.reorderButtonText, { color: colors.background }]}>
                {isReordering ? 'Done' : 'Reorder'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {userSparkIds.length === 0 ? (
          <Text style={styles.emptyText}>No sparks in your collection yet</Text>
        ) : (
          <View style={styles.sparkList}>
            {userSparkIds.map((sparkId, index) => {
              const spark = getSparkById(sparkId);
              if (!spark) return null;
              
              return (
                <View key={sparkId} style={styles.sparkCard}>
                  <View style={styles.sparkCardContent}>
                    <View style={styles.sparkIconContainer}>
                      <Text style={styles.sparkIcon}>{spark.metadata.icon}</Text>
                      <NotificationBadge sparkId={sparkId} size="small" />
                    </View>
                    <View style={styles.sparkInfo}>
                      <Text style={styles.sparkTitle}>{spark.metadata.title}</Text>
                      <Text style={styles.sparkDescription}>{spark.metadata.description}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.sparkActions}>
                    {isReordering && (
                      <View style={styles.reorderControls}>
                        <TouchableOpacity
                          style={[styles.reorderButton, { opacity: index > 0 ? 1 : 0.3 }]}
                          onPress={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <Text style={styles.reorderButtonText}>↑</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.reorderButton, { opacity: index < userSparkIds.length - 1 ? 1 : 0.3 }]}
                          onPress={() => handleMoveDown(index)}
                          disabled={index === userSparkIds.length - 1}
                        >
                          <Text style={styles.reorderButtonText}>↓</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={[styles.removeButton, { backgroundColor: colors.error }]}
                      onPress={() => handleRemoveSpark(sparkId, spark.metadata.title)}
                    >
                      <Text style={[styles.removeButtonText, { color: colors.background }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton]} 
          onPress={handleResetAllData}
        >
          <Text style={[styles.actionButtonText, styles.dangerText]}>🗑️ Reset All Data</Text>
        </TouchableOpacity>
        
        <Text style={styles.dangerWarning}>
          This will permanently delete all your progress, scores, and preferences.
        </Text>
      </View>

      {/* Admin Feedback Manager Modal */}
      <AdminFeedbackManager
        visible={showAdminManager}
        onClose={async () => {
          setShowAdminManager(false);
          // Refresh unread counts when closing
          if (isAdmin) {
            const feedbackCount = await AdminResponseService.getUnreadFeedbackCount();
            const reviewsCount = await AdminResponseService.getUnreadReviewsCount();
            setUnreadFeedbackCount(feedbackCount);
            setUnreadReviewsCount(reviewsCount);
            // Update app icon badge
            await FeedbackNotificationService.updateAppIconBadge();
          }
        }}
      />
      
      {/* Admin Reviews Manager Modal */}
      <AdminReviewsManager
        visible={showReviewsManager}
        onClose={async () => {
          setShowReviewsManager(false);
          // Refresh unread counts when closing
          if (isAdmin) {
            const feedbackCount = await AdminResponseService.getUnreadFeedbackCount();
            const reviewsCount = await AdminResponseService.getUnreadReviewsCount();
            setUnreadFeedbackCount(feedbackCount);
            setUnreadReviewsCount(reviewsCount);
            // Update app icon badge
            await FeedbackNotificationService.updateAppIconBadge();
          }
        }}
      />
      </SettingsScrollView>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  feedbackSection: {
    marginBottom: 20,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 5,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  adminBadge: {
    backgroundColor: colors.error || '#FF3B30',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  dangerText: {
    color: '#fff',
  },
  dangerWarning: {
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  
  // Spark management styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reorderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reorderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  sparkList: {
    gap: 12,
  },
  sparkCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sparkCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sparkIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  sparkIcon: {
    fontSize: 24,
  },
  sparkInfo: {
    flex: 1,
  },
  sparkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sparkDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sparkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reorderControls: {
    flexDirection: 'row',
    gap: 8,
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  debugText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  debugButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});