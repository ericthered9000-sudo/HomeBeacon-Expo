import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { EmergencyButton } from '../components/EmergencyButton';
import { BottomNav } from '../components/BottomNav';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineBanner } from '../components/OfflineBanner';

interface SeniorViewProps {
  user: any;
  wellnessScore?: number;
  activities?: any[];
  onLogout: () => void;
  onBack: () => void;
  onRecordActivity: (type: string) => void;
  onCheckIn: () => void;
}

export function SeniorView({
  user,
  wellnessScore,
  activities,
  onLogout,
  onBack,
  onRecordActivity,
  onCheckIn,
}: SeniorViewProps) {
  const [navSection, setNavSection] = useState<'home' | 'meds' | 'appts' | 'report'>('home');
  const [loading, setLoading] = useState(false);

  const getScoreColor = (score?: number) => {
    if (!score) return '#94a3b8';
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#eab308';
    return '#ef4444';
  };

  const getScoreLabel = (score?: number) => {
    if (!score) return 'neutral';
    if (score >= 70) return 'good';
    if (score >= 40) return 'moderate';
    return 'low';
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        {/* Header with Settings */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>HomeBeacon</Text>
            <Text style={styles.headerSubtitle}>Welcome back!</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              Alert.alert('Account', 'Settings coming soon!', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: onLogout },
              ]);
            }}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <LoadingSpinner size="large" fullScreen />
          </View>
        )}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Emergency Button - sticky at top */}
          {navSection === 'home' && (
            <View style={styles.emergencyContainer}>
              <EmergencyButton />
            </View>
          )}

        {/* Home Section */}
        {navSection === 'home' && (
          <>
            {/* Wellness Score Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Wellness Score</Text>
              <View style={[styles.scoreDisplay, { borderColor: getScoreColor(wellnessScore) }]}>
                <Text style={[styles.score, { color: getScoreColor(wellnessScore) }]}>
                  {wellnessScore ?? '-'}
                </Text>
              </View>
              <Text style={styles.scoreLabel}>out of 100</Text>
            </View>

            {/* Check-In Button */}
            <View style={styles.checkinSection}>
              <Text style={styles.sectionTitle}>Quick Check-In</Text>
              <TouchableOpacity
                style={styles.checkinButton}
                onPress={onCheckIn}
                activeOpacity={0.7}
              >
                <Text style={styles.checkinIcon}>✅</Text>
                <Text style={styles.checkinText}>I'm Okay!</Text>
              </TouchableOpacity>
            </View>

            {/* Activity Buttons */}
            <View style={styles.activitySection}>
              <Text style={styles.sectionTitle}>Record Activity</Text>
              <Text style={styles.hint}>In the real app, these are tracked automatically</Text>
              <View style={styles.activityButtons}>
                <TouchableOpacity
                  style={styles.activityButton}
                  onPress={() => onRecordActivity('motion')}
                >
                  <Text style={styles.activityIcon}>🚶</Text>
                  <Text style={styles.activityLabel}>Motion</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.activityButton}
                  onPress={() => onRecordActivity('location')}
                >
                  <Text style={styles.activityIcon}>📍</Text>
                  <Text style={styles.activityLabel}>Location</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.activityButton}
                  onPress={() => onRecordActivity('screen')}
                >
                  <Text style={styles.activityIcon}>📱</Text>
                  <Text style={styles.activityLabel}>Screen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.activityButton}
                  onPress={() => onRecordActivity('charging')}
                >
                  <Text style={styles.activityIcon}>🔌</Text>
                  <Text style={styles.activityLabel}>Charging</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Activity</Text>
              {!activities || activities.length === 0 ? (
                <Text style={styles.empty}>No activity recorded yet</Text>
              ) : (
                activities.slice(0, 5).map((a, idx) => (
                  <View key={idx} style={styles.activityItem}>
                    <Text style={styles.activityType}>{a.type}</Text>
                    <Text style={styles.activityTime}>{a.time}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Family Connections */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Family Connections</Text>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>👤</Text>
                <Text style={styles.actionText}>Account Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionIcon}>👨‍👩‍👧</Text>
                <Text style={styles.actionText}>Invite Family Members</Text>
              </TouchableOpacity>
              <Text style={styles.hint}>View your account info and share invite codes with family</Text>
            </View>
          </>
        )}

        {/* Placeholder for other tabs */}
        {navSection === 'meds' && (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderIcon}>💊</Text>
            <Text style={styles.placeholderTitle}>Medications</Text>
            <Text style={styles.placeholderText}>Track your medications and adherence</Text>
          </View>
        )}

        {navSection === 'appts' && (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderIcon}>📅</Text>
            <Text style={styles.placeholderTitle}>Doctor Visits</Text>
            <Text style={styles.placeholderText}>Log and track your appointments</Text>
          </View>
        )}

        {navSection === 'report' && (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderIcon}>📊</Text>
            <Text style={styles.placeholderTitle}>Weekly Report</Text>
            <Text style={styles.placeholderText}>Your wellness summary for the week</Text>
          </View>
        )}

        {/* Bottom Nav */}
        <BottomNav
          items={[
            { id: 'home', label: 'Home', icon: '🏠', onClick: () => setNavSection('home') },
            { id: 'meds', label: 'Meds', icon: '💊', onClick: () => setNavSection('meds') },
            { id: 'appts', label: 'Appts', icon: '📅', onClick: () => setNavSection('appts') },
            { id: 'report', label: 'Report', icon: '📊', onClick: () => setNavSection('report') },
          ]}
          activeId={navSection}
        />

        {/* Back Button - consistent placement */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Back to Home</Text>
        </TouchableOpacity>

        {/* Privacy Note */}
        <View style={styles.privacySection}>
          <Text style={styles.privacyText}>🔒 You control what's shared. Family can see your wellness score and check-ins.</Text>
        </View>
      </ScrollView>
      <OfflineBanner />
    </SafeAreaView>
  </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#6366f1',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  emergencyContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreDisplay: {
    borderWidth: 4,
    borderRadius: 50,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 'auto',
    backgroundColor: 'white',
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  checkinSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  checkinButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  checkinIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  checkinText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  activitySection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  activityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activityType: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 14,
    color: '#64748b',
  },
  empty: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  actionButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionText: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  placeholderCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#e2e8f0',
    margin: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  privacySection: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
  },
  privacyText: {
    fontSize: 13,
    color: '#6366f1',
    textAlign: 'center',
    lineHeight: 20,
  },
});
