import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
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

const API_URL = 'https://lucid-growth-production-c2f0.up.railway.app';

type AppState = 'loading' | 'auth' | 'pricing' | 'senior' | 'family';

interface User {
  id: string;
  email: string;
  role: 'senior' | 'family';
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('loading');
  const [wellnessScore, setWellnessScore] = useState<number | undefined>(undefined);
  const [activities, setActivities] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

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
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        setAppState(parsedUser.role === 'senior' ? 'senior' : 'family');
        await fetchUserData(parsedUser, storedToken);
      } else {
        setAppState('auth');
      }
    } catch (err) {
      console.error('Session check error:', err);
      setAppState('auth');
    } finally {
      // Loading state is handled by appState check
    }
  };

  const fetchUserData = async (userData: User, authToken: string) => {
    try {
      setFetchError(null);
      
      if (userData.role === 'senior') {
        await fetchSeniorData(userData.id, authToken);
      } else {
        await fetchFamilyData(userData.id, authToken);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setFetchError('Failed to load data. Check connection.');
    }
  };

  const fetchSeniorData = async (userId: string, authToken: string) => {
    try {
      // Fetch wellness score
      const wellnessRes = await fetch(`${API_URL}/api/wellness/${userId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (wellnessRes.ok) {
        const wellnessData = await wellnessRes.json();
        setWellnessScore(wellnessData.score);
      }

      // Fetch activities
      const activityRes = await fetch(`${API_URL}/api/activity/${userId}?limit=10`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivities(activityData.map((a: any) => ({
          type: a.type,
          time: new Date(a.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
        })));
      }
    } catch (err) {
      console.error('Failed to fetch senior data:', err);
      throw err;
    }
  };

  const fetchFamilyData = async (userId: string, authToken: string) => {
    try {
      // Family members fetch their connected senior's data
      // This will be updated when family connections are properly implemented
      const connectionsRes = await fetch(`${API_URL}/api/connections/family/${userId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      if (connectionsRes.ok) {
        const connections = await connectionsRes.json();
        if (connections.length > 0) {
          // Fetch the first senior's data
          const seniorId = connections[0].senior_id;
          await fetchSeniorData(seniorId, authToken);
        }
      }
    } catch (err) {
      console.error('Failed to fetch family data:', err);
      throw err;
    }
  };

  const handleAuth = async (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    // Show pricing for new users (skip for now, go directly to app)
    setAppState(userData.role === 'senior' ? 'senior' : 'family');
    await fetchUserData(userData, authToken);
  };

  const handlePricingComplete = () => {
    if (user) {
      setAppState(user.role === 'senior' ? 'senior' : 'family');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setAppState('auth');
    setWellnessScore(undefined);
    setActivities([]);
    setAlerts([]);
  };

  const handleBack = () => {
    // Show pricing or settings view
    // For now, just logout
    handleLogout();
  };

  const handleRecordActivity = async (type: string) => {
    if (!user || !token) return;
    
    if (isOffline) {
      return;
    }
    
    try {
      await fetch(`${API_URL}/api/activity`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          type,
          value: { source: 'manual' },
        }),
      });
      
      await fetchSeniorData(user.id, token);
    } catch (err: any) {
      console.error('Failed to record activity:', err);
    }
  };

  const handleCheckIn = async () => {
    if (!user || !token) return;
    
    if (isOffline) {
      return;
    }
    
    try {
      await fetch(`${API_URL}/api/checkin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          status: 'okay',
          message: 'I am doing great!',
        }),
      });
      
      await fetchSeniorData(user.id, token);
    } catch (err: any) {
      console.error('Failed to send check-in:', err);
    }
  };

  const handleRequestCheckIn = async (message: string) => {
    if (!user || !token) return;
    
    if (isOffline) {
      return;
    }
    
    try {
      await fetch(`${API_URL}/api/checkin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          status: 'pending',
          message,
        }),
      });
    } catch (err: any) {
      console.error('Failed to send request:', err);
    }
  };

  const handleRetry = async () => {
    if (user && token) {
      setAppState('loading');
      await fetchUserData(user, token);
      setAppState(user.role === 'senior' ? 'senior' : 'family');
    }
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <LoadingScreen message="Loading HomeBeacon..." />
        <OfflineBanner />
        <OfflineIndicator isOffline={isOffline} onRetry={handleRetry} />
      </SafeAreaView>
    );
  }

  // Auth state
  if (appState === 'auth') {
    return (
      <ErrorBoundary>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <AuthScreen onAuth={handleAuth} />
          <OfflineBanner />
          <OfflineIndicator isOffline={isOffline} onRetry={handleRetry} />
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  // Pricing state
  if (appState === 'pricing' && user && token) {
    return (
      <ErrorBoundary>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <PricingScreen
            user={user}
            token={token}
            onSubscriptionComplete={handlePricingComplete}
            onSkip={handlePricingComplete}
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
        />
      </ErrorBoundary>
    );
  }

  // Fallback
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.errorText}>Loading...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
});