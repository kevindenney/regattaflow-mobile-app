/**
 * Subscription Page
 * Plan selection and Stripe checkout for club subscriptions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Check,
  Crown,
  Zap,
  Building2,
  ChevronLeft,
  Shield,
  CreditCard,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { useTrialStatus } from '@/components/subscription/TrialWarningBanner';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 249,
    annualPrice: 2499,
    annualSavings: 'Save $489',
    description: 'Up to 500 members',
    icon: Zap,
    color: '#6b7280',
    features: [
      'Up to 500 members',
      'Basic scoring system',
      'Entry management',
      'Results publication',
      'Email support',
    ],
    limitations: [
      'No live tracking',
      'No custom branding',
    ],
  },
  {
    id: 'professional',
    name: 'Pro',
    monthlyPrice: 499,
    annualPrice: 4999,
    annualSavings: 'Save $989',
    description: 'Up to 2,000 members',
    icon: Crown,
    color: '#0284c7',
    popular: true,
    features: [
      'Up to 2,000 members',
      'Advanced scoring options',
      'Live race tracking',
      'Custom branding',
      'Priority support',
      'Mobile race committee app',
      'Competitor analytics',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 899,
    annualPrice: 8999,
    annualSavings: 'Save $1,789',
    description: 'Unlimited members',
    icon: Building2,
    color: '#7c3aed',
    features: [
      'Unlimited members',
      'Multiple venue management',
      'Advanced analytics & reporting',
      'API access',
      'Dedicated support manager',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, clubProfile } = useAuth();
  const trialStatus = useTrialStatus();

  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'enterprise') {
      // For enterprise, redirect to contact form
      Alert.alert(
        'Enterprise Plan',
        'Our team will contact you to discuss your organization\'s needs.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Contact Sales', 
            onPress: () => {
              // Could open email or contact form
              Alert.alert('Coming Soon', 'Enterprise contact form will be available soon.');
            }
          },
        ]
      );
      return;
    }

    setSelectedPlan(planId);
  };

  const handleCheckout = async () => {
    if (!user?.id || !clubProfile?.id) {
      Alert.alert('Error', 'Please log in to subscribe.');
      return;
    }

    setIsProcessing(true);
    try {
      // Call edge function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planId: selectedPlan,
          billingPeriod,
          clubId: clubProfile.id,
          userId: user.id,
          successUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/subscription/success`,
          cancelUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/subscription`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe checkout
        if (typeof window !== 'undefined') {
          window.location.href = data.url;
        }
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert(
        'Checkout Error',
        'Unable to start checkout. Please try again or contact support.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const currentPlan = clubProfile?.subscription_status === 'active' 
    ? clubProfile?.subscription_plan 
    : null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2 rounded-full"
        >
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-bold text-gray-900 text-center">
          Choose Your Plan
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Trial Status Banner */}
        {trialStatus.isOnTrial && (
          <View className="mx-4 mt-4 bg-gradient-to-r from-sky-500 to-violet-500 rounded-2xl p-5">
            <Text className="text-white text-lg font-bold">
              {trialStatus.isExpired
                ? '⚠️ Your trial has ended'
                : `🎁 ${trialStatus.daysRemaining} days left in your free trial`}
            </Text>
            <Text className="text-white/80 mt-1">
              {trialStatus.isExpired
                ? 'Subscribe now to restore access to your events.'
                : 'Subscribe before your trial ends to keep all features.'}
            </Text>
          </View>
        )}

        {/* Billing Period Toggle */}
        <View className="flex-row justify-center items-center mx-4 mt-6 mb-2">
          <View className="flex-row bg-gray-100 rounded-full p-1">
            <TouchableOpacity
              onPress={() => setBillingPeriod('monthly')}
              className={`px-5 py-2 rounded-full ${
                billingPeriod === 'monthly' ? 'bg-white' : ''
              }`}
            >
              <Text className={billingPeriod === 'monthly' ? 'text-gray-900 font-semibold' : 'text-gray-500'}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBillingPeriod('annual')}
              className={`px-5 py-2 rounded-full ${
                billingPeriod === 'annual' ? 'bg-white' : ''
              }`}
            >
              <Text className={billingPeriod === 'annual' ? 'text-gray-900 font-semibold' : 'text-gray-500'}>
                Annual
              </Text>
            </TouchableOpacity>
          </View>
          {billingPeriod === 'annual' && (
            <View className="ml-3 bg-emerald-100 px-3 py-1 rounded-full">
              <Text className="text-emerald-700 text-xs font-medium">2 months free</Text>
            </View>
          )}
        </View>

        {/* Plans */}
        <View className="px-4 py-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            const isCurrent = currentPlan === plan.id;

            return (
              <TouchableOpacity
                key={plan.id}
                onPress={() => handleSelectPlan(plan.id)}
                disabled={isCurrent}
                className={`mb-4 rounded-2xl border-2 overflow-hidden ${
                  isSelected
                    ? 'border-sky-500 bg-white'
                    : isCurrent
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <View className="bg-sky-500 py-1 px-3">
                    <Text className="text-white text-xs font-bold text-center">
                      MOST POPULAR
                    </Text>
                  </View>
                )}

                {/* Current Plan Badge */}
                {isCurrent && (
                  <View className="bg-emerald-500 py-1 px-3">
                    <Text className="text-white text-xs font-bold text-center">
                      CURRENT PLAN
                    </Text>
                  </View>
                )}

                <View className="p-5">
                  {/* Plan Header */}
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-row items-center">
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center"
                        style={{ backgroundColor: `${plan.color}15` }}
                      >
                        <Icon size={24} color={plan.color} />
                      </View>
                      <View className="ml-3">
                        <Text className="text-gray-900 font-bold text-lg">
                          {plan.name}
                        </Text>
                        <Text className="text-gray-500 text-sm">
                          {plan.description}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Selection Indicator */}
                    {isSelected && !isCurrent && (
                      <View className="w-6 h-6 bg-sky-500 rounded-full items-center justify-center">
                        <Check size={16} color="#fff" />
                      </View>
                    )}
                  </View>

                  {/* Price */}
                  <View className="mb-4">
                    <Text className="text-gray-900">
                      <Text className="text-3xl font-bold">
                        ${billingPeriod === 'annual' ? plan.annualPrice.toLocaleString() : plan.monthlyPrice}
                      </Text>
                      <Text className="text-gray-500">
                        {billingPeriod === 'annual' ? '/year' : '/month'}
                      </Text>
                    </Text>
                    {billingPeriod === 'annual' && (
                      <Text className="text-emerald-600 text-sm font-medium mt-1">
                        {plan.annualSavings}
                      </Text>
                    )}
                  </View>

                  {/* Features */}
                  <View className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <View key={i} className="flex-row items-start">
                        <Check size={16} color="#22c55e" className="mt-0.5" />
                        <Text className="text-gray-700 ml-2 flex-1">{feature}</Text>
                      </View>
                    ))}
                    {plan.limitations?.map((limitation, i) => (
                      <View key={`lim-${i}`} className="flex-row items-start opacity-50">
                        <Text className="text-gray-400 ml-6">{limitation}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Security Note */}
        <View className="mx-4 mb-6 flex-row items-center justify-center">
          <Shield size={16} color="#9ca3af" />
          <Text className="text-gray-500 text-sm ml-2">
            Secure payment via Stripe • Cancel anytime
          </Text>
        </View>

        {/* Spacer for button */}
        <View className="h-24" />
      </ScrollView>

      {/* Checkout Button */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleCheckout}
          disabled={isProcessing || selectedPlan === 'enterprise' || currentPlan === selectedPlan}
          className={`flex-row items-center justify-center py-4 rounded-2xl ${
            isProcessing || currentPlan === selectedPlan
              ? 'bg-gray-300'
              : 'bg-sky-600'
          }`}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <CreditCard size={20} color="#fff" />
              <Text className="text-white font-bold text-lg ml-2">
                {currentPlan === selectedPlan
                  ? 'Current Plan'
                  : selectedPlan === 'enterprise'
                  ? 'Contact Sales'
                  : `Subscribe to ${PLANS.find(p => p.id === selectedPlan)?.name}`}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <Text className="text-gray-500 text-xs text-center mt-3">
          30-day money-back guarantee • VAT may apply
        </Text>
      </View>
    </SafeAreaView>
  );
}
