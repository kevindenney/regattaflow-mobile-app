import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';

const PricingScreen = () => {
  const plans = [
    {
      id: 'starter',
      name: 'Club Starter',
      price: '$99',
      period: '/per month',
      description: 'Perfect for small yacht clubs',
      features: [
        'Up to 5 events per month',
        'Basic scoring system',
        'Entry management',
        'Results publication',
        'Email support'
      ],
      buttonText: 'Start Free Trial',
      popular: false
    },
    {
      id: 'professional',
      name: 'Club Professional',
      price: '$299',
      period: '/per month',
      description: 'For active sailing clubs',
      features: [
        'Unlimited events',
        'Advanced scoring options',
        'Live race tracking',
        'Custom branding',
        'Priority support',
        'Mobile race committee app'
      ],
      buttonText: 'Start Free Trial',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$999',
      period: '/per month',
      description: 'For major sailing organizations',
      features: [
        'Everything in Professional',
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
    <ScrollView className="flex-1 bg-white">
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
                  {plan.price}
                </Text>
                <Text className="text-gray-500 text-base">
                  {plan.period}
                </Text>
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
  );
};

export default PricingScreen;