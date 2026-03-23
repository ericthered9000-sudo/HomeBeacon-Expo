import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface PricingTier {
  name: string;
  monthly: number;
  annual: number;
  seniors: string;
  familyMembers: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

const tiers: PricingTier[] = [
  {
    name: 'Free',
    monthly: 0,
    annual: 0,
    seniors: '1',
    familyMembers: '1',
    features: [
      'Basic wellness monitoring',
      '1 senior profile',
      '1 family member',
      'Basic movement alerts',
      'Daily wellness score',
      'Email support',
    ],
    highlighted: false,
    cta: 'Get Started',
  },
  {
    name: 'Family',
    monthly: 9.99,
    annual: 99,
    seniors: '2',
    familyMembers: '5',
    features: [
      'Everything in Free',
      '2 senior profiles',
      'Up to 5 family members',
      'Advanced pattern detection',
      'Wellness score trends',
      'Real-time alerts',
      'Priority support',
      'Privacy dashboard',
    ],
    highlighted: false,
    cta: 'Start Free Trial',
  },
  {
    name: 'Premium',
    monthly: 14.99,
    annual: 149,
    seniors: 'Unlimited',
    familyMembers: 'Unlimited',
    features: [
      'Everything in Family',
      'Unlimited senior profiles',
      'Unlimited family members',
      'Health data integration',
      'Smartwatch support',
      'Advanced analytics',
      'Dedicated support',
      'Custom alert thresholds',
      '🔜 Calendar integration (v2)',
    ],
    highlighted: true,
    cta: 'Start Free Trial',
  },
];

interface PricingProps {
  onSelectPlan?: (plan: string, billing: 'monthly' | 'annual') => void;
}

export function Pricing({ onSelectPlan }: PricingProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Simple, Transparent Pricing</Text>
        <Text style={styles.subtitle}>
          Choose the plan that fits your family. All plans include a 14-day free trial.
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

      {tiers.map((tier) => (
        <View
          key={tier.name}
          style={[
            styles.card,
            tier.highlighted && styles.cardHighlighted,
            tier.name === 'free' && styles.cardFree,
          ]}
        >
          {tier.highlighted && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Most Popular</Text>
            </View>
          )}
          
          <View style={styles.cardHeader}>
            <Text style={styles.cardName}>{tier.name}</Text>
            <View style={styles.priceContainer}>
              {billing === 'monthly' ? (
                <>
                  <Text style={styles.priceAmount}>
                    {tier.monthly === 0 ? 'Free' : `$${tier.monthly}`}
                  </Text>
                  {tier.monthly > 0 && <Text style={styles.pricePeriod}>/month</Text>}
                </>
              ) : (
                <>
                  <Text style={styles.priceAmount}>
                    {tier.annual === 0 ? 'Free' : `$${tier.annual}`}
                  </Text>
                  {tier.annual > 0 && <Text style={styles.pricePeriod}>/year</Text>}
                </>
              )}
            </View>
          </View>

          <View style={styles.cardLimits}>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Seniors</Text>
              <Text style={styles.limitValue}>{tier.seniors}</Text>
            </View>
            <View style={styles.limitDivider} />
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Family Members</Text>
              <Text style={styles.limitValue}>{tier.familyMembers}</Text>
            </View>
          </View>

          <View style={styles.featuresList}>
            {tier.features.map((feature, idx) => (
              <View key={idx} style={styles.featureItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={[
                  styles.featureText,
                  feature.includes('🔜') && styles.featureComingSoon
                ]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.ctaButton,
              tier.highlighted ? styles.ctaPrimary : styles.ctaSecondary,
              (tier.monthly === 0 && billing === 'annual') && styles.ctaDisabled,
            ]}
            onPress={() => onSelectPlan?.(tier.name, billing)}
            disabled={tier.monthly === 0 && billing === 'annual'}
          >
            <Text style={[
              styles.ctaText,
              tier.highlighted ? styles.ctaTextPrimary : styles.ctaTextSecondary,
            ]}>
              {tier.cta}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.guarantee}>
          🔒 No credit card required for free trial. Cancel anytime.
        </Text>
        <Text style={styles.note}>
          <em>Business and church plans coming in v2 — contact us for volume pricing.</em>
        </Text>
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
  cardFree: {
    backgroundColor: '#f1f5f9',
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
  pricePeriod: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 4,
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
  featureComingSoon: {
    color: '#94a3b8',
    fontStyle: 'italic',
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
  ctaDisabled: {
    opacity: 0.5,
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
  },
  guarantee: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  note: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
