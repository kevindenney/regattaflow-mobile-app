import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Check, Star, Shield, Clock, Smartphone } from 'lucide-react-native';

const SubscriptionScreen = () => {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'standard' | 'pro'>('standard');

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '$10',
      period: '/month',
      description: 'Perfect for individual sailors',
      features: [
        'Access to core features',
        'GPS-powered venue detection',
        'Boat class selection',
        'Fleet discovery',
        'Personalized dashboard'
      ],
      popular: false
    },
    {
      id: 'standard',
      name: 'Standard',
      price: '$20',
      period: '/month',
      description: 'Ideal for small teams',
      features: [
        'All Basic features',
        'Up to 2 additional crew members',
        '1 email strategy support per month',
        'Race analytics',
        'Weather intelligence',
        'Course mapping'
      ],
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$50',
      period: '/month',
      description: 'For serious sailing teams',
      features: [
        'All Standard features',
        'Up to 10 crew members',
        '4 email strategy support sessions per month',
        'Advanced race analysis',
        'Custom strategy planning',
        'Priority support',
        'Performance insights'
      ],
      popular: false
    }
  ];

  const handleSelectPlan = (planId: 'basic' | 'standard' | 'pro') => {
    setSelectedPlan(planId);
  };

  const handleContinue = () => {
    console.log(`Selected plan: ${selectedPlan}`);
    // In a real app, this would navigate to payment screen
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 pt-12 pb-6 px-4 rounded-b-3xl">
        <Text className="text-white text-2xl font-bold text-center">Subscription Plans</Text>
        <Text className="text-blue-100 text-center mt-2">
          Choose the plan that fits your sailing needs
        </Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        {/* Plan Cards */}
        <View className="flex-row flex-wrap gap-4">
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              className={`flex-1 min-w-[140px] bg-white rounded-2xl p-5 shadow-sm border-2 ${
                selectedPlan === plan.id 
                  ? 'border-blue-500 shadow-blue-100' 
                  : 'border-gray-100'
              } ${plan.popular ? 'mt-0' : 'mt-8'}`}
              onPress={() => handleSelectPlan(plan.id as 'basic' | 'standard' | 'pro')}
              activeOpacity={0.8}
            >
              {plan.popular && (
                <View className="bg-blue-500 rounded-full py-1 px-3 self-start -mt-8 mb-2">
                  <Text className="text-white text-xs font-bold">MOST POPULAR</Text>
                </View>
              )}

              <View className="mb-4">
                <Text className="text-gray-800 text-lg font-bold">{plan.name}</Text>
                <Text className="text-gray-500 text-sm">{plan.description}</Text>
              </View>

              <View className="flex-row items-baseline mb-4">
                <Text className="text-2xl font-bold text-gray-900">{plan.price}</Text>
                <Text className="text-gray-500 text-sm">{plan.period}</Text>
              </View>

              <View className="mb-4">
                {plan.features.map((feature, index) => (
                  <View key={index} className="flex-row items-center mb-2">
                    <Check size={16} color="#2563EB" className="mr-2" />
                    <Text className="text-gray-700 text-sm">{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                className={`py-3 rounded-xl items-center justify-center ${
                  selectedPlan === plan.id 
                    ? 'bg-blue-600' 
                    : 'bg-gray-100'
                }`}
                onPress={() => handleSelectPlan(plan.id as 'basic' | 'standard' | 'pro')}
              >
                <Text 
                  className={`font-bold ${
                    selectedPlan === plan.id 
                      ? 'text-white' 
                      : 'text-gray-700'
                  }`}
                >
                  {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Features Highlight */}
        <View className="mt-8 bg-white rounded-2xl p-5 shadow-sm">
          <Text className="text-gray-800 text-lg font-bold mb-4 text-center">Why Choose RegattaFlow?</Text>

          <View className="flex-row items-start mb-4">
            <Star size={20} color="#2563EB" className="mr-3 mt-1" />
            <View>
              <Text className="text-gray-800 font-bold">Personalized Experience</Text>
              <Text className="text-gray-600 text-sm">Tailored dashboard with race insights in under 2 minutes</Text>
            </View>
          </View>

          <View className="flex-row items-start mb-4">
            <Shield size={20} color="#2563EB" className="mr-3 mt-1" />
            <View>
              <Text className="text-gray-800 font-bold">Secure Payment</Text>
              <Text className="text-gray-600 text-sm">Bank-level encryption for all transactions</Text>
            </View>
          </View>

          <View className="flex-row items-start mb-4">
            <Clock size={20} color="#2563EB" className="mr-3 mt-1" />
            <View>
              <Text className="text-gray-800 font-bold">Flexible Plans</Text>
              <Text className="text-gray-600 text-sm">Cancel anytime with no hidden fees</Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <Smartphone size={20} color="#2563EB" className="mr-3 mt-1" />
            <View>
              <Text className="text-gray-800 font-bold">Mobile Optimized</Text>
              <Text className="text-gray-600 text-sm">Access all features on any device</Text>
            </View>
          </View>
        </View>

        {/* Testimonials */}
        <View className="mt-8">
          <Text className="text-gray-800 text-lg font-bold mb-4 text-center">What Sailors Say</Text>

          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <View className="flex-row items-center mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} color="#FBBF24" fill="#FBBF24" />
              ))}
            </View>
            <Text className="text-gray-700 italic mb-3">
              "RegattaFlow completely transformed how I prepare for races. The weather intelligence alone has saved me hours of planning!"
            </Text>
            <Text className="text-gray-800 font-bold">- Sarah M., Competitive Sailor</Text>
          </View>

          <View className="bg-white rounded-2xl p-5 shadow-sm">
            <View className="flex-row items-center mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} color="#FBBF24" fill="#FBBF24" />
              ))}
            </View>
            <Text className="text-gray-700 italic mb-3">
              "The fleet matching feature helped me connect with sailors at my skill level. My racing performance has improved dramatically."
            </Text>
            <Text className="text-gray-800 font-bold">- James T., Club Racer</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="px-4 pb-6">
        <TouchableOpacity 
          className="bg-blue-600 py-4 rounded-2xl items-center shadow-md"
          onPress={handleContinue}
        >
          <Text className="text-white font-bold text-lg">
            Continue with {plans.find(p => p.id === selectedPlan)?.name} Plan
          </Text>
        </TouchableOpacity>

        <Text className="text-gray-500 text-xs text-center mt-3">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
};

export default SubscriptionScreen;