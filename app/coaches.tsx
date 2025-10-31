import { LinearGradient } from 'expo-linear-gradient';
import { DollarSign, Film, MessageCircle, Play, TrendingUp, Trophy, Users } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import React, { type ReactNode } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Image } from '@/components/ui';

cssInterop(LinearGradient, {
className: 'style',
});

const { width } = Dimensions.get('window');

export default function CoachesScreen() {
return (
<ScrollView className="flex-1 bg-white">
{/* Top Banner */}
<View className="bg-blue-500 px-4 py-2">
<Text className="text-white text-center text-sm">
🏆 Join 10,000+ sailors using AI-powered race strategy • Free 14-day trial
</Text>
</View>

{/* Header Navigation */}
<View className="flex-row items-center justify-between px-6 py-4">
<View className="flex-row items-center">
<Text className="text-2xl font-bold text-blue-600">RegattaFlow</Text>
</View>
<TouchableOpacity className="bg-blue-50 rounded-full px-4 py-2">
<Text className="text-blue-600">s2@icloud.com</Text>
</TouchableOpacity>
</View>

{/* Navigation Tabs */}
<View className="flex-row justify-center gap-4 px-6 py-4">
<TouchableOpacity className="px-4 py-2 rounded-full">
<Text className="text-gray-600">For Sailors</Text>
</TouchableOpacity>
<TouchableOpacity className="px-4 py-2 rounded-full">
<Text className="text-gray-600">For Yacht Clubs</Text>
</TouchableOpacity>
<TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-full">
<Text className="text-white">For Coaches</Text>
</TouchableOpacity>
</View>

{/* Hero Section */}
<View className="px-6 py-8">
<View className="bg-blue-50 px-4 py-2 rounded-full self-start mb-4">
<Text className="text-blue-600">🎯 Coaching Platform</Text>
</View>

<Text className="text-4xl font-bold text-gray-900 mb-4">
Professional Sailing Instruction Platform
</Text>

<Text className="text-gray-600 text-lg mb-6">
Performance analysis and student development
</Text>

<View className="flex-row gap-4 mb-8">
<TouchableOpacity className="bg-blue-600 px-6 py-3 rounded-xl flex-row items-center">
<Text className="text-white font-semibold mr-2">Start Coaching</Text>
<Play size={20} color="white" />
</TouchableOpacity>

<TouchableOpacity className="flex-row items-center">
<Text className="text-blue-600 font-semibold mr-2">Watch Coaching Demo</Text>
<Play size={20} color="#2563EB" />
</TouchableOpacity>
</View>

<View className="flex-row gap-4 mb-8">
<View className="flex-row items-center">
<Trophy size={20} color="#2563EB" className="mr-2" />
<Text className="text-gray-700">Performance Analysis</Text>
</View>

<View className="flex-row items-center">
<Users size={20} color="#2563EB" className="mr-2" />
<Text className="text-gray-700">Student Management</Text>
</View>

<View className="flex-row items-center">
<Play size={20} color="#2563EB" className="mr-2" />
<Text className="text-gray-700">Race Replay</Text>
</View>
</View>

{/* Feature Image */}
<Image 
source={{ uri: 'https://placehold.co/800x600/7c3aed/white?text=Student+Progress+Dashboard' }}
style={{ width: width - 48, height: 300 }}
className="rounded-xl mb-12"
/>

{/* Features Section */}
<View>
<Text className="text-3xl font-bold text-center text-gray-900 mb-4">
Coaching tools that drive results
</Text>

<Text className="text-gray-600 text-center mb-8">
Professional coaching platform for sailing instructors
</Text>

<View className="gap-6">
<FeatureItem 
icon={<Users color="#2563EB" size={24} />}
title="Session Management"
description="Schedule, track, and manage all your coaching sessions with integrated calendar and payments."
/>

<FeatureItem 
icon={<Film color="#2563EB" size={24} />}
title="Video Analysis"
description="Review race footage with sailors, add annotations, and create detailed performance breakdowns."
/>

<FeatureItem 
icon={<TrendingUp color="#2563EB" size={24} />}
title="Progress Tracking"
description="Monitor sailor development with detailed analytics and performance metrics over time."
/>

<FeatureItem 
icon={<MessageCircle color="#2563EB" size={24} />}
title="Sailor Communication"
description="Stay connected with your sailors through integrated messaging and session notes."
/>

<FeatureItem 
icon={<DollarSign color="#2563EB" size={24} />}
title="Payment Processing"
description="Automated invoicing and payment collection for all coaching sessions."
/>
</View>
</View>
</View>
</ScrollView>
);
}

type FeatureItemProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

function FeatureItem({ icon, title, description }: FeatureItemProps) {
return (
<View className="flex-row items-start gap-4 p-4 bg-white rounded-xl border border-gray-100">
<View className="bg-blue-50 p-3 rounded-xl">
{icon}
</View>
<View className="flex-1">
<Text className="text-lg font-semibold text-gray-900 mb-1">{title}</Text>
<Text className="text-gray-600">{description}</Text>
</View>
</View>
);
}
