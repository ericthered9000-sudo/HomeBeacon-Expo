import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineBanner } from '../components/OfflineBanner';

interface FamilyViewProps {
  user: any;
  seniorName?: string;
  wellnessScore?: number;
  activities?: any[];
  alerts?: string[];
  onLogout: () => void;
  onBack: () => void;
  onRequestCheckIn: (message: string) => void;
}

export function FamilyView({
  user,
  seniorName,
  wellnessScore,
  activities,
  alerts,
  onLogout,
  onBack,
  onRequestCheckIn,
}: FamilyViewProps) {
  const [activeTab, setActiveTab] = useState<'wellness' | 'activity' | 'alerts' | 'report'>('wellness');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const getScoreColor = (score?: number) => {
    if (!score) return '#94a3b8';
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#eab308';
    return '#ef4444';
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        {/* Header with Settings */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{seniorName || 'Mom'}'s Wellness</Text>
            <Text style={styles.headerSubtitle}>Last updated: just now</Text>
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
          {/* Family Header removed - using new header */}

        {/* Wellness Score Card - same design as SeniorView */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wellness Score</Text>
          <View style={[styles.scoreDisplay, { borderColor: getScoreColor(wellnessScore) }]}>
            <Text style={[styles.score, { color: getScoreColor(wellnessScore) }]}>
              {wellnessScore ?? '-'}
            </Text>
          </View>
          <Text style={styles.scoreLabel}>out of 100</Text>
        </View>

        {/* Tabs - same style as BottomNav */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'wellness' ? styles.tabActive : styles.tabInactive]}
            onPress={() => setActiveTab('wellness')}
          >
            <Text style={[styles.tabText, activeTab === 'wellness' ? styles.tabTextActive : styles.tabTextInactive]}>
              Wellness
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'activity' ? styles.tabActive : styles.tabInactive]}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={[styles.tabText, activeTab === 'activity' ? styles.tabTextActive : styles.tabTextInactive]}>
              Activity
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'alerts' ? styles.tabActive : styles.tabInactive]}
            onPress={() => setActiveTab('alerts')}
          >
            <Text style={[styles.tabText, activeTab === 'alerts' ? styles.tabTextActive : styles.tabTextInactive]}>
              Alerts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'report' ? styles.tabActive : styles.tabInactive]}
            onPress={() => setActiveTab('report')}
          >
            <Text style={[styles.tabText, activeTab === 'report' ? styles.tabTextActive : styles.tabTextInactive]}>
              Report
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'wellness' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Wellness Overview</Text>
            <Text style={styles.wellnessText}>
              Wellness score is calculated based on daily activity patterns, check-ins, and health metrics.
            </Text>
          </View>
        )}

        {activeTab === 'activity' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activity Timeline</Text>
            {!activities || activities.length === 0 ? (
              <Text style={styles.empty}>No activity recorded yet</Text>
            ) : (
              activities.map((a, idx) => (
                <View key={idx} style={styles.activityItem}>
                  <Text style={styles.activityType}>{a.type}</Text>
                  <Text style={styles.activityTime}>{a.time}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'alerts' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Alerts</Text>
            {!alerts || alerts.length === 0 ? (
              <View style={styles.statusOk}>
                <Text style={styles.statusIcon}>✅</Text>
                <Text style={styles.statusText}>No alerts</Text>
              </View>
            ) : (
              alerts.map((alert, idx) => (
                <View key={idx} style={styles.alertItem}>
                  <Text style={styles.alertIcon}>⚠️</Text>
                  <Text style={styles.alertText}>{alert}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'report' && (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderIcon}>📊</Text>
            <Text style={styles.placeholderTitle}>Weekly Report</Text>
            <Text style={styles.placeholderText}>
              Comprehensive wellness summary for the week
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🔗</Text>
            <Text style={styles.actionText}>Connect to Senior</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCheckInModal(true)}
          >
            <Text style={styles.actionIcon}>📩</Text>
            <Text style={styles.actionText}>Request Check-In</Text>
          </TouchableOpacity>
        </View>

        {/* Connection Note */}
        <View style={styles.connectionNote}>
          <Text style={styles.connectionText}>
            💝 You're connected to {seniorName || 'Mom'}'s wellness updates. She chooses what to share.
          </Text>
        </View>

        {/* Back Button - same placement as SeniorView */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Check-In Request Modal */}
      <Modal
        visible={showCheckInModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCheckInModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Check-In</Text>
            <Text style={styles.modalSubtitle}>Ask how they're doing...</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Type your message..."
              multiline
              numberOfLines={4}
              value={checkInMessage}
              onChangeText={setCheckInMessage}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCheckInModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSend]}
                onPress={() => {
                  if (checkInMessage.trim()) {
                    onRequestCheckIn(checkInMessage);
                    setShowCheckInModal(false);
                    setCheckInMessage('');
                  }
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSend]}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  tabInactive: {
    opacity: 0.7,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#6366f1',
  },
  tabTextInactive: {
    color: '#64748b',
  },
  wellnessText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
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
  statusOk: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '600',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  alertIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  alertText: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
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
  quickActions: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
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
  connectionNote: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
  },
  connectionText: {
    fontSize: 13,
    color: '#6366f1',
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: '#e2e8f0',
    margin: 16,
    marginBottom: 24,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#e2e8f0',
  },
  modalButtonSend: {
    backgroundColor: '#6366f1',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalButtonTextSend: {
    color: 'white',
  },
});
