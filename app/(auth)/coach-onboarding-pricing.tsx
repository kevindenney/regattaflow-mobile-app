import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { ChevronRight, DollarSign, Clock, Calendar, Award } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCoachOnboardingState } from '@/hooks/useCoachOnboardingState';
import { OnboardingProgress } from '@/components/onboarding';

const CoachOnboardingPricing = () => {
  const router = useRouter();
  const { state, updatePricing, loading } = useCoachOnboardingState();

  const [hourlyRate, setHourlyRate] = useState('');
  const [packagePrices, setPackagePrices] = useState({
    'single': '',
    'five': '',
    'ten': ''
  });
  const [currency, setCurrency] = useState('USD');
  const [sessionDuration, setSessionDuration] = useState('60');
  const [pricingModel, setPricingModel] = useState<'hourly' | 'packages'>('hourly');

  // Load saved state
  useEffect(() => {
    if (state.pricing) {
      setPricingModel(state.pricing.pricingModel);
      setCurrency(state.pricing.currency);
      setHourlyRate(state.pricing.hourlyRate || '');
      setSessionDuration(state.pricing.sessionDuration || '60');
      if (state.pricing.packagePrices) {
        setPackagePrices(state.pricing.packagePrices);
      }
    }
  }, [state.pricing]);
  
  const currencies = [
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'AUD', symbol: 'A$' },
    { code: 'CAD', symbol: 'C$' }
  ];

  const sessionDurations = [
    { value: '30', label: '30 minutes' },
    { value: '60', label: '60 minutes' },
    { value: '90', label: '90 minutes' },
    { value: '120', label: '2 hours' }
  ];

  const packageOptions = [
    { key: 'single', label: 'Single Session', description: 'Pay per session' },
    { key: 'five', label: '5 Sessions', description: 'Save 10% with package' },
    { key: 'ten', label: '10 Sessions', description: 'Save 20% with package' }
  ];

  const updatePackagePrice = (key: string, value: string) => {
    setPackagePrices({
      ...packagePrices,
      [key]: value
    });
  };

  const isFormValid = () => {
    if (pricingModel === 'hourly') {
      return hourlyRate.length > 0 && !isNaN(parseFloat(hourlyRate));
    } else {
      return Object.values(packagePrices).every(price =>
        price.length > 0 && !isNaN(parseFloat(price))
      );
    }
  };

  const getSelectedCurrencySymbol = () => {
    const currencyObj = currencies.find(c => c.code === currency);
    return currencyObj ? currencyObj.symbol : '$';
  };

  const handleContinue = () => {
    if (!isFormValid()) return;

    // Save to state
    updatePricing({
      pricingModel,
      currency,
      hourlyRate: pricingModel === 'hourly' ? hourlyRate : undefined,
      sessionDuration: pricingModel === 'hourly' ? sessionDuration : undefined,
      packagePrices: pricingModel === 'packages' ? packagePrices : undefined,
    });

    // Navigate to next step
    router.push('/(auth)/coach-onboarding-profile-preview');
  };

  const handleCompleteLater = () => {
    // Save current progress
    updatePricing({
      pricingModel,
      currency,
      hourlyRate: pricingModel === 'hourly' ? hourlyRate : undefined,
      sessionDuration: pricingModel === 'hourly' ? sessionDuration : undefined,
      packagePrices: pricingModel === 'packages' ? packagePrices : undefined,
    });

    // Navigate back to main app
    router.replace('/(tabs)/dashboard');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Progress Indicator */}
      <View className="px-4 pt-4 bg-white">
        <OnboardingProgress
          currentStep={4}
          totalSteps={5}
          stepLabels={['Welcome', 'Expertise', 'Availability', 'Pricing', 'Review']}
          color="#059669"
          showStepLabels={false}
        />
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <View className="mb-2">
          <Text className="text-2xl font-bold text-gray-800">Set Your Pricing</Text>
          <Text className="text-gray-600 mt-1">Define how you want to be compensated for your expertise</Text>
        </View>
        
        {/* Pricing Model Selection */}
        <View className="mt-6">
          <View className="flex-row items-center mb-3">
            <DollarSign size={18} color="#2563EB" className="mr-2" />
            <Text className="font-bold text-gray-800 text-lg">Pricing Model</Text>
          </View>
          <Text className="text-gray-600 text-sm mb-3">Choose how you want to structure your pricing</Text>
          
          <View className="flex-row rounded-xl border border-gray-300 p-1 bg-gray-50">
            <TouchableOpacity 
              className={`flex-1 py-3 rounded-lg items-center ${
                pricingModel === 'hourly' ? 'bg-white shadow' : ''
              }`}
              onPress={() => setPricingModel('hourly')}
            >
              <Text className={pricingModel === 'hourly' ? 'font-bold text-gray-800' : 'text-gray-600'}>
                Hourly Rate
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-1 py-3 rounded-lg items-center ${
                pricingModel === 'packages' ? 'bg-white shadow' : ''
              }`}
              onPress={() => setPricingModel('packages')}
            >
              <Text className={pricingModel === 'packages' ? 'font-bold text-gray-800' : 'text-gray-600'}>
                Session Packages
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Hourly Rate Form */}
        {pricingModel === 'hourly' && (
          <View className="mt-6">
            <View className="mb-4">
              <Text className="font-medium text-gray-800 mb-2">Hourly Rate</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3">
                <Text className="text-gray-600 mr-2">{getSelectedCurrencySymbol()}</Text>
                <TextInput
                  className="flex-1 text-base"
                  placeholder="0.00"
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View className="mb-4">
              <Text className="font-medium text-gray-800 mb-2">Default Session Duration</Text>
              <View className="border border-gray-300 rounded-xl">
                {sessionDurations.map((duration) => (
                  <TouchableOpacity
                    key={duration.value}
                    className={`flex-row items-center justify-between py-3 px-4 ${
                      sessionDuration !== duration.value ? 'border-b border-gray-200' : ''
                    }`}
                    onPress={() => setSessionDuration(duration.value)}
                  >
                    <Text className={sessionDuration === duration.value ? 'text-blue-600 font-medium' : 'text-gray-700'}>
                      {duration.label}
                    </Text>
                    <View 
                      className={`w-5 h-5 rounded-full border ${
                        sessionDuration === duration.value 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-300'
                      }`}
                    >
                      {sessionDuration === duration.value && (
                        <View className="w-3 h-3 bg-white rounded-full m-1" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
        
        {/* Package Pricing Form */}
        {pricingModel === 'packages' && (
          <View className="mt-6">
            <Text className="text-gray-600 text-sm mb-3">Set prices for different session packages</Text>
            
            <View className="bg-blue-50 rounded-xl p-4 mb-4">
              <View className="flex-row items-center">
                <Award size={18} color="#2563EB" className="mr-2" />
                <Text className="font-bold text-gray-800">Recommended Pricing Strategy</Text>
              </View>
              <Text className="text-gray-600 text-sm mt-1">
                Offer discounts for bulk purchases to encourage long-term commitments
              </Text>
            </View>
            
            {packageOptions.map((option) => (
              <View key={option.key} className="mb-4">
                <Text className="font-medium text-gray-800 mb-1">{option.label}</Text>
                <Text className="text-gray-600 text-sm mb-2">{option.description}</Text>
                <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3">
                  <Text className="text-gray-600 mr-2">{getSelectedCurrencySymbol()}</Text>
                  <TextInput
                    className="flex-1 text-base"
                    placeholder="0.00"
                    value={packagePrices[option.key as keyof typeof packagePrices]}
                    onChangeText={(text) => updatePackagePrice(option.key, text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            ))}
          </View>
        )}
        
        {/* Currency Selection */}
        <View className="mt-6">
          <Text className="font-medium text-gray-800 mb-2">Currency</Text>
          <View className="flex-row flex-wrap">
            {currencies.map((curr) => (
              <TouchableOpacity
                key={curr.code}
                className={`border rounded-full px-4 py-2 mr-2 mb-2 ${
                  currency === curr.code
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => setCurrency(curr.code)}
              >
                <Text
                  className={
                    currency === curr.code
                      ? 'text-white'
                      : 'text-gray-700'
                  }
                >
                  {curr.code} ({curr.symbol})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Pricing Preview */}
        <View className="mt-8 bg-gray-50 rounded-2xl p-5">
          <Text className="font-bold text-gray-800 text-lg mb-3">Pricing Preview</Text>
          
          {pricingModel === 'hourly' ? (
            <View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-600">Hourly Rate</Text>
                <Text className="font-bold text-gray-800">
                  {getSelectedCurrencySymbol()}{hourlyRate || '0.00'}/hr
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Session Duration</Text>
                <Text className="font-bold text-gray-800">
                  {sessionDurations.find(d => d.value === sessionDuration)?.label || '60 minutes'}
                </Text>
              </View>
            </View>
          ) : (
            <View>
              {packageOptions.map((option) => (
                <View key={option.key} className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-600">{option.label}</Text>
                  <Text className="font-bold text-gray-800">
                    {getSelectedCurrencySymbol()}{packagePrices[option.key as keyof typeof packagePrices] || '0.00'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Action Buttons */}
      <View className="px-4 pb-6">
        <TouchableOpacity
          className={`flex-row items-center justify-center py-4 rounded-xl mb-4 ${
            isFormValid() ? 'bg-blue-600' : 'bg-gray-300'
          }`}
          disabled={!isFormValid()}
          onPress={handleContinue}
        >
          <Text className="text-white font-bold text-lg">Continue to Profile Preview</Text>
          <ChevronRight color="white" size={20} className="ml-2" />
        </TouchableOpacity>

        <TouchableOpacity className="py-3 items-center" onPress={handleCompleteLater}>
          <Text className="text-blue-600 font-medium">Complete later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CoachOnboardingPricing;