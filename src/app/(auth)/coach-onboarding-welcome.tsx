import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ChevronRight, User, Briefcase, Award, Phone, Globe } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCoachOnboardingState } from '@/src/hooks/useCoachOnboardingState';
import { useAuth } from '@/src/providers/AuthProvider';
import { OnboardingProgress } from '@/src/components/onboarding';

const CoachOnboardingWelcome = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { state, updateWelcome, loading } = useCoachOnboardingState();

  const [fullName, setFullName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Load saved state
  useEffect(() => {
    if (state.welcome) {
      setFullName(state.welcome.fullName);
      setProfessionalTitle(state.welcome.professionalTitle);
      setExperience(state.welcome.experience);
      setOrganization(state.welcome.organization || '');
      setPhone(state.welcome.phone || '');
      setSelectedLanguages(state.welcome.languages);
    }
  }, [state.welcome]);

const experienceOptions = [
"1-2 years",
"3-5 years",
"6-10 years",
"10-15 years",
"15+ years",
"Olympic/Professional Level"
];

const languageOptions = [
"English",
"Spanish",
"French",
"Mandarin",
"Cantonese",
"Portuguese"
];

const toggleLanguage = (language: string) => {
if (selectedLanguages.includes(language)) {
setSelectedLanguages(selectedLanguages.filter(lang => lang !== language));
} else {
setSelectedLanguages([...selectedLanguages, language]);
}
};

const isFormValid = () => {
    return (
      fullName.length >= 2 &&
      professionalTitle.length > 0 &&
      experience.length > 0 &&
      selectedLanguages.length > 0
    );
  };

  const handleContinue = () => {
    if (!isFormValid()) return;

    // Save to state
    updateWelcome({
      fullName,
      professionalTitle,
      experience,
      organization: organization || undefined,
      phone: phone || undefined,
      languages: selectedLanguages,
    });

    // Navigate to next step
    router.push('/(auth)/coach-onboarding-expertise');
  };

  const handleCompleteLater = () => {
    // Save current progress
    if (fullName.length >= 2 || professionalTitle.length > 0) {
      updateWelcome({
        fullName,
        professionalTitle,
        experience,
        organization: organization || undefined,
        phone: phone || undefined,
        languages: selectedLanguages,
      });
    }
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
    <View testID="onboarding-coach" className="flex-1 bg-white">
      {/* Progress Indicator */}
      <View className="px-4 pt-4 bg-white">
        <OnboardingProgress
          currentStep={1}
          totalSteps={5}
          stepLabels={['Welcome', 'Expertise', 'Availability', 'Pricing', 'Review']}
          color="#059669"
          showStepLabels={false}
        />
      </View>

<ScrollView className="flex-1 px-4 py-6">
<View className="mb-2">
<Text className="text-2xl font-bold text-gray-800">Welcome to RegattaFlow Coaches</Text>
<Text className="text-gray-600 mt-1">Join the world's premier sailing coaching marketplace</Text>
</View>

{/* Form Fields */}
<View className="mt-6">
{/* Full Name */}
<View className="mb-5">
<View className="flex-row items-center mb-2">
<User size={18} color="#6B7280" className="mr-2" />
<Text className="font-medium text-gray-800">Full Name</Text>
</View>
<TextInput
className="border border-gray-300 rounded-xl px-4 py-3 text-base"
placeholder="Enter your full name"
value={fullName}
onChangeText={setFullName}
/>
{fullName.length > 0 && fullName.length < 2 && (
<Text className="text-red-500 text-sm mt-1">Name must be at least 2 characters</Text>
)}
</View>

{/* Professional Title */}
<View className="mb-5">
<View className="flex-row items-center mb-2">
<Briefcase size={18} color="#6B7280" className="mr-2" />
<Text className="font-medium text-gray-800">Professional Title</Text>
</View>
<TextInput
className="border border-gray-300 rounded-xl px-4 py-3 text-base"
placeholder="e.g., Head Coach, Tactical Coach, Olympic Coach"
value={professionalTitle}
onChangeText={setProfessionalTitle}
/>
<View className="flex-row flex-wrap mt-2">
{['Head Coach', 'Performance Coach', 'Tactical Specialist'].map((title) => (
<TouchableOpacity 
key={title}
className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mr-2 mb-2"
onPress={() => setProfessionalTitle(title)}
>
<Text className="text-blue-700 text-xs">{title}</Text>
</TouchableOpacity>
))}
</View>
</View>

{/* Coaching Experience */}
<View className="mb-5">
<View className="flex-row items-center mb-2">
<Award size={18} color="#6B7280" className="mr-2" />
<Text className="font-medium text-gray-800">Coaching Experience</Text>
</View>
<View className="border border-gray-300 rounded-xl px-4 py-3">
<TouchableOpacity>
<Text className={experience ? "text-gray-800" : "text-gray-400"}>
{experience || "Select experience level"}
</Text>
</TouchableOpacity>
</View>
<View className="mt-2">
{experienceOptions.map((option) => (
<TouchableOpacity 
key={option}
className={`py-2 px-4 rounded-lg mb-2 ${experience === option ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50'}`}
onPress={() => setExperience(option)}
>
<Text className={experience === option ? "text-blue-700 font-medium" : "text-gray-700"}>
{option}
</Text>
</TouchableOpacity>
))}
</View>
</View>

{/* Coaching Organization */}
<View className="mb-5">
<Text className="font-medium text-gray-800 mb-2">Coaching Organization (Optional)</Text>
<TextInput
className="border border-gray-300 rounded-xl px-4 py-3 text-base"
placeholder="Your club, team, or organization"
value={organization}
onChangeText={setOrganization}
/>
<View className="flex-row flex-wrap mt-2">
{['Royal Hong Kong Yacht Club', 'US Sailing Team', 'Independent'].map((org) => (
<TouchableOpacity 
key={org}
className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mr-2 mb-2"
onPress={() => setOrganization(org)}
>
<Text className="text-blue-700 text-xs">{org}</Text>
</TouchableOpacity>
))}
</View>
</View>

{/* Contact Information */}
<View className="mb-5">
<View className="flex-row items-center mb-2">
<Phone size={18} color="#6B7280" className="mr-2" />
<Text className="font-medium text-gray-800">Contact Information</Text>
</View>

<View className="mb-4">
<Text className="text-gray-700 mb-1">Email (pre-filled from auth)</Text>
<TextInput
className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-gray-50"
value={email}
editable={false}
/>
</View>

<View>
<Text className="text-gray-700 mb-1">Phone Number</Text>
<TextInput
className="border border-gray-300 rounded-xl px-4 py-3 text-base"
placeholder="+1 (555) 123-4567"
value={phone}
onChangeText={setPhone}
keyboardType="phone-pad"
/>
</View>
</View>

{/* Languages Spoken */}
<View className="mb-5">
<View className="flex-row items-center mb-2">
<Globe size={18} color="#6B7280" className="mr-2" />
<Text className="font-medium text-gray-800">Languages Spoken</Text>
</View>
<Text className="text-gray-600 text-sm mb-3">Select all that apply</Text>

<View className="flex-row flex-wrap">
{[...languageOptions, '+ add other languages'].map((language) => (
<TouchableOpacity
key={language}
className={`border rounded-full px-4 py-2 mr-2 mb-2 ${
selectedLanguages.includes(language)
? 'bg-blue-600 border-blue-600'
: language === '+ add other languages'
? 'border-dashed border-gray-400 bg-white'
: 'bg-white border-gray-300'
}`}
onPress={() => toggleLanguage(language)}
>
<Text
className={
selectedLanguages.includes(language)
? 'text-white'
: language === '+ add other languages'
? 'text-gray-500'
: 'text-gray-700'
}
>
{language}
</Text>
</TouchableOpacity>
))}
</View>
</View>
</View>
</ScrollView>

{/* Action Buttons */}
      <View className="px-4 pb-6">
        <TouchableOpacity
          testID="next-coach"
          className={`flex-row items-center justify-center py-4 rounded-xl mb-4 ${
            isFormValid() ? 'bg-blue-600' : 'bg-gray-300'
          }`}
          disabled={!isFormValid()}
          onPress={handleContinue}
        >
          <Text className="text-white font-bold text-lg">Continue to Expertise</Text>
          <ChevronRight color="white" size={20} className="ml-2" />
        </TouchableOpacity>

        <TouchableOpacity className="py-3 items-center" onPress={handleCompleteLater}>
          <Text className="text-blue-600 font-medium">Complete later</Text>
        </TouchableOpacity>
      </View>
</View>
);
};


export default CoachOnboardingWelcome;
