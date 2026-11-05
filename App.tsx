import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { LoadingScreen } from './src/components/LoadingScreen';
import { OfflineBanner } from './src/components/OfflineBanner';
import { OfflineIndicator } from './src/components/OfflineIndicator';
import { AuthScreen } from './src/screens/AuthScreen';
import { PricingScreen } from './src/screens/PricingScreen';
import { SeniorView } from './src/screens/SeniorView';
import { FamilyView } from './src/screens/FamilyView';
import { ThemeProvider, useThemeColors } from './src/hooks/useThemeColors';
import { ThemeName } from './src/config/theme';
import { API_URL } from './src/config/api';
import { logger } from './src/utils/logger';
import { fetchWithRetry, safeJsonParse } from './src/utils/api';
import { secureFetch, secureFetchJSON, checkSession, logout as authLogout } from './src/utils/auth';
import { unifiedTracking } from './src/services/UnifiedTrackingService';
import { initBilling, checkEntitlement, type Tier } from './src/lib/subscriptions';

type AppState = 'loading' | 'auth' | 'pricing' | 'senior' | 'family';

interface User {
  id: string;
  email: string;
  role: 'senior' | 'family';
}

function AppContent() {
  const { colors, currentTheme, setTheme } = useThemeColors();
  const [user, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>('loading');
  const [subscriptionTier, setSubscriptionTier] = useState<Tier>('free');
  const [wellnessScore, setWellnessScore] = useState<number | undefined>(undefined);
  const [activities, setActivities] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Load saved theme on mount
  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme && ['serene', 'ocean', 'sunset', 'forest'].includes(savedTheme)) {
        setTheme(savedTheme as ThemeName);
      }
    } catch (err) {
      logger.error('Failed to load theme:', err);
    }
  };

  // Check network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setIsOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      // Try to validate session via httpOnly cookie first
      const sessionResult = await checkSession();
      
      if (sessionResult.success && sessionResult.user) {
        setUser(sessionResult.user);

        // Check subscription status with custom Google Play Billing
        await initBilling(sessionResult.user.id);
        const { tier } = await checkEntitlement();
        setSubscriptionTier(tier);

        // If free tier, route to pricing screen first
        if (tier === 'free') {
          setAppState('pricing');
        } else {
          setAppState(sessionResult.user.role === 'senior' ? 'senior' : 'family');
          await fetchUserData(sessionResult.user);
        }

        // Also store user locally for offline reference
        await AsyncStorage.setItem('user', JSON.stringify(sessionResult.user));
      } else {
        // No valid session, go to auth
        setAppState('auth');
      }
    } catch (err) {
      logger.error('Session check error:', err);
      setAppState('auth');
    }
  };

  const fetchUserData = async (userData: User) => {
    try {
      setFetchError(null);
      
      if (userData.role === 'senior') {
        await fetchSeniorData(userData.id);
      } else {
        await fetchFamilyData(userData.id);
      }
    } catch (err) {
      logger.error('Fetch error:', err);
      setFetchError('Failed to load data. Check connection.');
    }
  };

  const fetchSeniorData = async (userId: string) => {
    try {
      // Fetch wellness score with retry (auth via httpOnly cookie)
      const wellnessRes = await fetchWithRetry(`${API_URL}/api/v1/wellness/${userId}`, {
        credentials: 'include',
      });
      if (wellnessRes.ok) {
        const wellnessData = await safeJsonParse(wellnessRes);
        if (wellnessData?.score !== undefined) {
          setWellnessScore(wellnessData.score);
        }
      }

      // Fetch activities with retry (auth via httpOnly cookie)
      const activityRes = await fetchWithRetry(`${API_URL}/api/v1/activity/${userId}?limit=10`, {
        credentials: 'include',
      });
      if (activityRes.ok) {
        const activityData = await safeJsonParse(activityRes);
        if (activityData && Array.isArray(activityData)) {
          setActivities(activityData.map((a: any) => ({
            type: a.type,
            time: new Date(a.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
          })));
        }
      }
    } catch (err) {
      logger.error('Failed to fetch senior data:', err);
      // Don't throw - allow app to continue with partial data
    }
  };

  const fetchFamilyData = async (userId: string) => {
    try {
      const connectionsRes = await fetchWithRetry(`${API_URL}/api/v1/connections/family/${userId}`, {
        credentials: 'include',
      });
      
      if (connectionsRes.ok) {
        const connections = await safeJsonParse(connectionsRes);
        if (connections && Array.isArray(connections) && connections.length > 0) {
          const seniorId = connections[0]?.senior_id;
          if (seniorId) {
            await fetchSeniorData(seniorId);
          }
        }
      }
    } catch (err) {
      logger.error('Failed to fetch family data:', err);
      // Don't throw - allow app to continue with partial data
    }
  };

  const handleAuth = async (userData: User) => {
    setUser(userData);

    // Check subscription status after auth
    await initBilling(userData.id);
    const { tier } = await checkEntitlement();
    setSubscriptionTier(tier);

    // If free tier, route to pricing screen
    if (tier === 'free') {
      setAppState('pricing');
      return;
    }

    setAppState(userData.role === 'senior' ? 'senior' : 'family');
    await fetchUserData(userData);
    
    // Start all tracking services for seniors (opt-in, default enabled)
    if (userData.role === 'senior') {
      try {
        const trackingEnabled = await AsyncStorage.getItem('passive-tracking-enabled');
        if (trackingEnabled !== 'false') {
          // Default to enabled for new users, respects user choice for returning
          const result = await unifiedTracking.startAll();
          if (!result.success) {
            logger.error('Some tracking services failed to start:', result.errors);
          } else {
            logger.info('All tracking services started successfully');
          }
        }
      } catch (error) {
        logger.error('Failed to start tracking services:', error);
      }
    }
  };

  const handlePricingComplete = async () => {
    if (user) {
      // Re-check subscription after pricing is complete
      const { tier } = await checkEntitlement();
      setSubscriptionTier(tier);
      setAppState(user.role === 'senior' ? 'senior' : 'family');
      await fetchUserData(user);
    }
  };

  const handleLogout = async () => {
    // Clear the httpOnly cookie via backend
    await authLogout();
    // Clear local user data
    await AsyncStorage.removeItem('user');
    setUser(null);
    setAppState('auth');
    setWellnessScore(undefined);
    setActivities([]);
    setAlerts([]);
  };

  const handleBack = () => {
    handleLogout();
  };

  const handleRecordActivity = async (type: string) => {
    if (!user || isOffline) return;
    
    try {
      await fetchWithRetry(`${API_URL}/api/v1/activity`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          type,
          value: { source: 'manual' },
        }),
      });
      
      if (user.role === 'senior') {
        await fetchSeniorData(user.id);
      }
    } catch (err: any) {
      logger.error('Failed to record activity:', err);
    }
  };

  const handleCheckIn = async () => {
    if (!user || isOffline) return;

    try {
      const response = await fetchWithRetry(`${API_URL}/api/v1/checkin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          status: 'okay',
          message: 'I am doing great!',
        }),
      });

      if (!response.ok) {
        Alert.alert('Check-in failed', 'Could not complete your check-in. Please try again.');
        return;
      }

      if (user.role === 'senior') {
        await fetchSeniorData(user.id);
      }
    } catch (err: any) {
      logger.error('Failed to send check-in:', err);
      Alert.alert('Check-in failed', 'Could not complete your check-in. Please try again.');
    }
  };

  const handleRequestCheckIn = async (message: string) => {
    if (!user || isOffline) return;
    
    try {
      await fetchWithRetry(`${API_URL}/api/v1/checkin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          status: 'pending',
          message,
        }),
      });
    } catch (err: any) {
      logger.error('Failed to send request:', err);
    }
  };

  const handleRetry = async () => {
    if (user) {
      setAppState('loading');
      await fetchUserData(user);
      setAppState(user.role === 'senior' ? 'senior' : 'family');
    }
  };

  const handleChangeTheme = async (newTheme: ThemeName) => {
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <StatusBar barStyle={currentTheme === 'serene' ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
        <LoadingScreen message="Loading HomeBeacon..." colors={colors} />
        <OfflineBanner />
        <OfflineIndicator isOffline={isOffline} onRetry={handleRetry} />
      </SafeAreaView>
    );
  }

  // Auth state
  if (appState === 'auth') {
    return (
      <ErrorBoundary>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
          <AuthScreen onAuth={handleAuth} colors={colors} />
          <OfflineBanner />
          <OfflineIndicator isOffline={isOffline} onRetry={handleRetry} />
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  // Pricing state
  if (appState === 'pricing' && user) {
    return (
      <ErrorBoundary>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
          <PricingScreen
            user={user}
            onSubscriptionComplete={handlePricingComplete}
            onSkip={handlePricingComplete}
            colors={colors}
          />
          <OfflineBanner />
          <OfflineIndicator isOffline={isOffline} onRetry={handleRetry} />
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  // Senior state
  if (appState === 'senior' && user) {
    return (
      <ErrorBoundary>
        <SeniorView
          user={user}
          wellnessScore={wellnessScore}
          activities={activities}
          onLogout={handleLogout}
          onBack={handleBack}
          onRecordActivity={handleRecordActivity}
          onCheckIn={handleCheckIn}
          colors={colors}
          currentTheme={currentTheme}
          onChangeTheme={handleChangeTheme}
        />
      </ErrorBoundary>
    );
  }

  // Family state
  if (appState === 'family' && user) {
    return (
      <ErrorBoundary>
        <FamilyView
          user={user}
          seniorName="Mom"
          wellnessScore={wellnessScore}
          activities={activities}
          alerts={alerts}
          onLogout={handleLogout}
          onBack={handleBack}
          onRequestCheckIn={handleRequestCheckIn}
          colors={colors}
          currentTheme={currentTheme}
          onChangeTheme={handleChangeTheme}
        />
      </ErrorBoundary>
    );
  }

  // Fallback
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Loading...</Text>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="serene">
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
  },
});