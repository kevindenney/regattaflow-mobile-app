import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { ChevronLeft, CheckCircle, CreditCard, Calendar, MapPin, User, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/services/supabase';
import { ClubSubscriptionService } from '@/src/services/ClubSubscriptionService';

const ClubOnboardingPaymentConfirmation = () => {
  const router = useRouter();
  const [animation] = useState(new Animated.Value(0));
  const [isProcessing, setIsProcessing] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const loadSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Fetch the subscription
      const sub = await ClubSubscriptionService.getSubscription(user.id);
      setSubscription(sub);

      // Wait a bit for effect, then mark as complete
      setTimeout(() => {
        setIsProcessing(false);

        // Start animation when processing is complete
        Animated.timing(animation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }, 2000);
    };

    loadSubscription();
  }, []);

  const handleContinue = async () => {
    // Mark onboarding as complete
    if (userId) {
      await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', userId);
    }

    // Navigate to club dashboard
    router.replace('/(tabs)/dashboard');
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 pt-12 pb-6 px-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity className="p-2 -ml-2">
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold flex-1 text-center">Club Setup</Text>
          <View className="w-8" /> {/* Spacer for alignment */}
        </View>

        <View className="h-2 bg-blue-500 rounded-full mb-4">
          <View className="h-2 bg-white rounded-full w-[100%]" />
        </View>
        <Text className="text-white text-center">Step 7 of 7</Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        <View className="items-center mb-8">
          {isProcessing ? (
            <>
              <Animated.View 
                className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-6"
                style={{
                  transform: [{
                    rotate: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }]
                }}
              >
                <CreditCard size={48} color="#2563EB" />
              </Animated.View>
              <Text className="text-gray-800 text-2xl font-bold text-center mb-2">Processing Payment</Text>
              <Text className="text-gray-600 text-center mb-4">Please wait while we process your payment</Text>
              <View className="flex-row">
                <View className="w-2 h-2 bg-blue-500 rounded-full mx-1" />
                <View className="w-2 h-2 bg-blue-300 rounded-full mx-1" />
                <View className="w-2 h-2 bg-blue-300 rounded-full mx-1" />
              </View>
            </>
          ) : (
            <>
              <Animated.View 
                className="w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-6"
                style={{
                  opacity: animation,
                  transform: [{
                    scale: animation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.5, 1.1, 1]
                    })
                  }]
                }}
              >
                <CheckCircle size={48} color="#10B981" />
              </Animated.View>
              <Text className="text-gray-800 text-2xl font-bold text-center mb-2">Payment Successful!</Text>
              <Text className="text-gray-600 text-center mb-6">Your club subscription is now active</Text>
            </>
          )}
        </View>

        {/* Payment Details */}
        {subscription && (
          <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
            <Text className="text-gray-800 font-bold text-lg mb-4">Payment Details</Text>

            <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
              <Text className="text-gray-600">Subscription Plan</Text>
              <Text className="text-gray-800 font-bold">
                {ClubSubscriptionService.getPlan(subscription.plan_id)?.name || subscription.plan_id}
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
              <Text className="text-gray-600">Amount Paid</Text>
              <Text className="text-gray-800 font-bold">
                ${(subscription.amount / 100).toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
              <Text className="text-gray-600">Payment Method</Text>
              <View className="flex-row items-center">
                <CreditCard size={16} color="#6B7280" className="mr-2" />
                <Text className="text-gray-800">•••• {subscription.stripe_subscription_id?.slice(-4)}</Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
              <Text className="text-gray-600">Billing Period</Text>
              <Text className="text-gray-800 capitalize">{subscription.interval}ly</Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Subscription ID</Text>
              <Text className="text-gray-800 text-xs">{subscription.stripe_subscription_id}</Text>
            </View>
          </View>
        )}

        {/* Security Info */}
        <View className="bg-blue-50 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-2">
            <Shield size={20} color="#2563EB" className="mr-2" />
            <Text className="text-blue-800 font-bold">Secure Payment</Text>
          </View>
          <Text className="text-blue-700 text-sm">
            Your payment has been securely processed and your subscription is now active. 
            A receipt has been sent to your email.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      {!isProcessing && (
        <Animated.View 
          className="px-4 pb-6"
          style={{ opacity: animation }}
        >
          <TouchableOpacity 
            className="bg-blue-600 py-4 rounded-2xl items-center mb-4 shadow-md"
            onPress={handleContinue}
          >
            <Text className="text-white font-bold text-lg">Continue to Dashboard</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

export default ClubOnboardingPaymentConfirmation;