import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

interface PricingScreenProps {
  user: any;
  token: string;
  onSubscriptionComplete: () => void;
  onSkip?: () => void;
}

interface Plan {
  name: string;
  monthly: number;
  annual: number;
  max_seniors: number;
  max_family_members: number;
  features: string[];
}

export function PricingScreen({ user, token, onSubscriptionComplete, onSkip }: PricingScreenProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [plans, setPlans] = useState<Record<string, Plan>>({});

  useEffect(() => {
    fetchPlans();
    fetchCurrentPlan();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/plans`);
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const fetchCurrentPlan = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setCurrentPlan(data.subscription.tier);
      }
    } catch (error) {
      console.error('Failed to fetch current plan:', error);
    }
  };

  const handleSelectPlan = async (planName: string) => {
    if (planName === 'free') {
      // Free tier is default, just continue
      onSubscriptionComplete();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: planName, billing }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // In production, this would redirect to Stripe checkout
      // For now, simulate successful subscription
      Alert.alert(
        'Payment Integration',
        'Stripe checkout would open here. For testing, subscription will be activated.',
        [
          {
            text: 'Simulate Success',
            onPress: () => simulateSubscription(planName),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const simulateSubscription = async (tier: string) => {
    try {
      // Simulate webhook completion
      const response = await fetch(`${API_URL}/api/subscriptions/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'checkout.session.completed',
          data: { userId: user.id, tier, billing },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentPlan(tier);
        Alert.alert('Success', `You are now on the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan!`);
        onSubscriptionComplete();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to activate subscription');
    }
  };

  const getPrice = (plan: Plan) => {
    if (plan.monthly === 0) return 'Free';
    return billing === 'monthly' ? `$${plan.monthly / 100}/mo` : `$${plan.annual / 100}/yr`;
  };

  const formatFeature = (feature: string) => {
    const featureMap: Record<string, string> = {
      'basic_wellness': 'Basic wellness monitoring',
      'daily_score': 'Daily wellness score',
      'email_support': 'Email support',
      'pattern_detection': 'Advanced pattern detection',
      'realtime_alerts': 'Real-time alerts',
      'priority_support': 'Priority support',
      'privacy_dashboard': 'Privacy dashboard',
      'health_integration': 'Health data integration',
      'smartwatch_support': 'Smartwatch support',
      'advanced_analytics': 'Advanced analytics',
      'custom_alerts': 'Custom alert thresholds',
    };
    return featureMap[feature] || feature;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>
          Start free, upgrade anytime. All plans include a 14-day free trial.
        </Text>

        <View style={styles.billingToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, billing === 'monthly' && styles.toggleActive]}
            onPress={() => setBilling('monthly')}
          >
            <Text style={[styles.toggleText, billing === 'monthly' && styles.toggleTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <View style={styles.toggleSeparator}>
            <Text style={styles.toggleLabel}>or</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleButton, billing === 'annual' && styles.toggleActive]}
            onPress={() => setBilling('annual')}
          >
            <Text style={[styles.toggleText, billing === 'annual' && styles.toggleTextActive]}>
              Annual
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveText}>Save 17%</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {Object.entries(plans).map(([key, plan]) => {
        const isCurrentPlan = currentPlan === key;
        const isPremium = key === 'premium';

        return (
          <View
            key={key}
            style={[
              styles.card,
              isPremium && styles.cardHighlighted,
              isCurrentPlan && styles.cardCurrent,
            ]}
          >
            {isPremium && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}

            {isCurrentPlan && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentText}>Current Plan</Text>
              </View>
            )}

            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
              <View style={styles.priceContainer}>
                <Text style={styles.priceAmount}>{getPrice(plan)}</Text>
              </View>
            </View>

            <View style={styles.cardLimits}>
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>Seniors</Text>
                <Text style={styles.limitValue}>
                  {plan.max_seniors === -1 ? '∞' : plan.max_seniors}
                </Text>
              </View>
              <View style={styles.limitDivider} />
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>Family</Text>
                <Text style={styles.limitValue}>
                  {plan.max_family_members === -1 ? '∞' : plan.max_family_members}
                </Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <Text style={styles.checkIcon}>✓</Text>
                  <Text style={styles.featureText}>{formatFeature(feature)}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.ctaButton,
                isPremium ? styles.ctaPrimary : styles.ctaSecondary,
                isCurrentPlan && styles.ctaCurrent,
              ]}
              onPress={() => handleSelectPlan(key)}
              disabled={loading || isCurrentPlan}
            >
              {loading ? (
                <ActivityIndicator color={isPremium ? 'white' : '#1e293b'} />
              ) : (
                <Text style={[
                  styles.ctaText,
                  isPremium ? styles.ctaTextPrimary : styles.ctaTextSecondary,
                ]}>
                  {isCurrentPlan ? 'Current' : key === 'free' ? 'Start Free' : 'Subscribe'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={styles.footer}>
        <Text style={styles.guarantee}>
          🔒 No credit card required for free tier. Cancel anytime.
        </Text>
        {onSkip && (
          <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  billingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#6366f1',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleTextActive: {
    color: 'white',
  },
  toggleSeparator: {
    paddingHorizontal: 12,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  saveBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  saveText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  cardHighlighted: {
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  cardCurrent: {
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    marginLeft: -50,
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cardLimits: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  limitItem: {
    flex: 1,
    alignItems: 'center',
  },
  limitDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
  limitLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  limitValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  checkIcon: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: 'bold',
    marginRight: 10,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  ctaButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaPrimary: {
    backgroundColor: '#6366f1',
  },
  ctaSecondary: {
    backgroundColor: '#e2e8f0',
  },
  ctaCurrent: {
    backgroundColor: '#f1f5f9',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ctaTextPrimary: {
    color: 'white',
  },
  ctaTextSecondary: {
    color: '#1e293b',
  },
  footer: {
    paddingVertical: 24,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  guarantee: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  skipButton: {
    marginTop: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
});