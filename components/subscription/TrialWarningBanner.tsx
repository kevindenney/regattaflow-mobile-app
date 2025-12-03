/**
 * Trial Warning Banner Component
 * Shows countdown and upgrade prompt for clubs on trial
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, AlertTriangle, Zap, X } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';

interface TrialWarningBannerProps {
  onDismiss?: () => void;
  compact?: boolean;
}

export function TrialWarningBanner({ onDismiss, compact = false }: TrialWarningBannerProps) {
  const router = useRouter();
  const { clubProfile } = useAuth();

  const trialInfo = useMemo(() => {
    if (!clubProfile?.trial_ends_at) return null;
    
    const trialEndDate = new Date(clubProfile.trial_ends_at);
    const now = new Date();
    const diffMs = trialEndDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    // Only show if trial is active and ending soon (within 14 days)
    if (daysRemaining > 14 || daysRemaining < 0) return null;
    if (clubProfile.subscription_status !== 'trial') return null;
    
    return {
      daysRemaining,
      endDate: trialEndDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      isUrgent: daysRemaining <= 3,
      isWarning: daysRemaining <= 7,
    };
  }, [clubProfile]);

  if (!trialInfo) return null;

  const handleUpgrade = () => {
    router.push('/subscription');
  };

  // Urgent state (3 days or less)
  if (trialInfo.isUrgent) {
    return (
      <View className="mx-4 my-2">
        <View className="bg-red-50 border border-red-200 rounded-xl p-4">
          <View className="flex-row items-start">
            <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center">
              <AlertTriangle size={20} color="#dc2626" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-red-800 font-bold text-base">
                {trialInfo.daysRemaining === 0
                  ? '🚨 Trial ends today!'
                  : trialInfo.daysRemaining === 1
                  ? '🚨 Trial ends tomorrow!'
                  : `🚨 Only ${trialInfo.daysRemaining} days left!`}
              </Text>
              <Text className="text-red-700 text-sm mt-1">
                Upgrade now to keep managing your events and data.
              </Text>
              <TouchableOpacity
                onPress={handleUpgrade}
                className="bg-red-600 px-4 py-2.5 rounded-lg mt-3 self-start"
              >
                <Text className="text-white font-semibold">Upgrade Now →</Text>
              </TouchableOpacity>
            </View>
            {onDismiss && (
              <TouchableOpacity onPress={onDismiss} className="p-1">
                <X size={18} color="#dc2626" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Warning state (7 days or less)
  if (trialInfo.isWarning) {
    return (
      <View className="mx-4 my-2">
        <View className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-9 h-9 bg-amber-100 rounded-full items-center justify-center">
                <Clock size={18} color="#d97706" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-amber-800 font-semibold">
                  {trialInfo.daysRemaining} days left in trial
                </Text>
                <Text className="text-amber-700 text-sm">
                  Ends {trialInfo.endDate}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleUpgrade}
              className="bg-amber-600 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-semibold text-sm">Upgrade</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Compact mode for header integration
  if (compact) {
    return (
      <TouchableOpacity
        onPress={handleUpgrade}
        className="flex-row items-center bg-sky-50 px-3 py-1.5 rounded-full"
      >
        <Zap size={14} color="#0284c7" />
        <Text className="text-sky-700 text-sm font-medium ml-1.5">
          {trialInfo.daysRemaining}d trial
        </Text>
      </TouchableOpacity>
    );
  }

  // Normal state (8-14 days)
  return (
    <View className="mx-4 my-2">
      <View className="bg-sky-50 border border-sky-100 rounded-xl p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-8 h-8 bg-sky-100 rounded-full items-center justify-center">
              <Zap size={16} color="#0284c7" />
            </View>
            <View className="ml-3">
              <Text className="text-sky-800 font-medium">
                Free trial: {trialInfo.daysRemaining} days remaining
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleUpgrade}
            className="border border-sky-300 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-sky-700 font-medium text-sm">View Plans</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/**
 * Hook to get trial status for programmatic use
 */
export function useTrialStatus() {
  const { clubProfile } = useAuth();

  return useMemo(() => {
    if (!clubProfile?.trial_ends_at) {
      return { isOnTrial: false, daysRemaining: null, isExpired: false };
    }

    const trialEndDate = new Date(clubProfile.trial_ends_at);
    const now = new Date();
    const diffMs = trialEndDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    const isOnTrial = clubProfile.subscription_status === 'trial';
    const isExpired = daysRemaining < 0;

    return {
      isOnTrial,
      daysRemaining: isOnTrial ? Math.max(0, daysRemaining) : null,
      isExpired: isOnTrial && isExpired,
      endDate: trialEndDate,
      isUrgent: isOnTrial && daysRemaining <= 3 && daysRemaining >= 0,
      isWarning: isOnTrial && daysRemaining <= 7 && daysRemaining >= 0,
    };
  }, [clubProfile]);
}

