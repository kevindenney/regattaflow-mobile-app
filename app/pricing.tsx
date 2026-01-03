import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { LandingNav } from '@/components/landing/LandingNav';

const PricingScreen = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      id: 'starter',
      name: 'Club Starter',
      monthlyPrice: '$249',
      annualPrice: '$2,499',
      annualSavings: 'Save $489',
      description: 'Perfect for small yacht clubs',
      features: [
        'Up to 500 members',
        'Basic scoring system',
        'Entry management',
        'Results publication',
        'Email support'
      ],
      buttonText: 'Get Started',
      popular: false
    },
    {
      id: 'professional',
      name: 'Club Pro',
      monthlyPrice: '$499',
      annualPrice: '$4,999',
      annualSavings: 'Save $989',
      description: 'For active sailing clubs',
      features: [
        'Up to 2,000 members',
        'Advanced scoring options',
        'Live race tracking',
        'Custom branding',
        'Priority support',
        'Mobile race committee app'
      ],
      buttonText: 'Get Started',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: '$899',
      annualPrice: '$8,999',
      annualSavings: 'Save $1,789',
      description: 'For major sailing organizations',
      features: [
        'Unlimited members',
        'Multiple venue management',
        'Advanced analytics',
        'API access',
        'Dedicated support',
        'Custom integrations'
      ],
      buttonText: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <View className="flex-1 bg-white">
      <LandingNav transparent={false} sticky={true} />
      <ScrollView className="flex-1">
        <View className="p-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
            Professional regatta management
          </Text>
          <Text className="text-gray-600 text-center">
            Pricing designed for yacht clubs and sailing organizations
          </Text>
        </View>

        {/* Billing Toggle */}
        <View className="flex-row justify-center mb-8">
          <View className="flex-row bg-gray-100 rounded-full p-1">
            <TouchableOpacity
              onPress={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full ${
                billingPeriod === 'monthly' ? 'bg-white' : ''
              }`}
            >
              <Text className={billingPeriod === 'monthly' ? 'text-gray-900 font-semibold' : 'text-gray-500'}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-full ${
                billingPeriod === 'annual' ? 'bg-white' : ''
              }`}
            >
              <Text className={billingPeriod === 'annual' ? 'text-gray-900 font-semibold' : 'text-gray-500'}>
                Annual
              </Text>
            </TouchableOpacity>
          </View>
          {billingPeriod === 'annual' && (
            <View className="ml-3 bg-green-100 px-3 py-1 rounded-full self-center">
              <Text className="text-green-700 text-sm font-medium">2 months free</Text>
            </View>
          )}
        </View>

        {/* Pricing Plans */}
        <View className="flex-row flex-wrap gap-4">
          {plans.map((plan) => (
            <View
              key={plan.id}
              className={`flex-1 min-w-[300px] rounded-3xl p-6 ${
                plan.popular
                  ? 'bg-white border-2 border-blue-500'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {plan.popular && (
                <View className="absolute -top-3 right-6">
                  <View className="bg-blue-500 px-4 py-1 rounded-full">
                    <Text className="text-white text-sm font-medium">Most Popular</Text>
                  </View>
                </View>
              )}

              <Text className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </Text>

              <View className="mb-4">
                <Text className="text-4xl font-bold text-gray-900">
                  {billingPeriod === 'annual' ? plan.annualPrice : plan.monthlyPrice}
                </Text>
                <Text className="text-gray-500 text-base">
                  {billingPeriod === 'annual' ? '/year' : '/month'}
                </Text>
                {billingPeriod === 'annual' && (
                  <Text className="text-green-600 text-sm font-medium mt-1">
                    {plan.annualSavings}
                  </Text>
                )}
              </View>

              <Text className="text-gray-600 mb-6">
                {plan.description}
              </Text>

              <View className="mb-8">
                {plan.features.map((feature, index) => (
                  <View key={index} className="flex-row items-center mb-3">
                    <Check
                      size={20}
                      color="#10B981"
                      className="mr-3"
                    />
                    <Text className="text-gray-700 text-base">
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                className={`py-4 rounded-xl items-center justify-center ${
                  plan.id === 'enterprise'
                    ? 'bg-gray-900'
                    : 'bg-blue-500'
                }`}
              >
                <Text className="text-white font-semibold text-base">
                  {plan.buttonText}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default PricingScreen;