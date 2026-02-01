import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} className="mr-4">
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Privacy Policy</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-gray-500 text-sm mb-4">Last updated: February 1, 2026</Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Introduction</Text>
          <Text className="text-gray-600 mb-4">
            RegattaFlow ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Information We Collect</Text>
          <Text className="text-gray-600 mb-2 font-semibold">Personal Information</Text>
          <Text className="text-gray-600 mb-4">
            • Account information (name, email address){'\n'}
            • Profile information (sailing club, boat details){'\n'}
            • Location data (for venue intelligence and weather services){'\n'}
            • Race participation and results data
          </Text>

          <Text className="text-gray-600 mb-2 font-semibold">Automatically Collected Information</Text>
          <Text className="text-gray-600 mb-4">
            • Device information (device type, operating system){'\n'}
            • Usage data (features used, session duration){'\n'}
            • Log data (access times, pages viewed)
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">How We Use Your Information</Text>
          <Text className="text-gray-600 mb-4">
            • Provide and maintain our services{'\n'}
            • Process race entries and registrations{'\n'}
            • Deliver venue-specific sailing intelligence{'\n'}
            • Send notifications about races and events{'\n'}
            • Improve and personalize user experience{'\n'}
            • Communicate updates and support
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Data Sharing</Text>
          <Text className="text-gray-600 mb-4">
            We may share your information with:{'\n'}
            • Race organizers and sailing clubs (for event management){'\n'}
            • Service providers (cloud hosting, analytics){'\n'}
            • Legal authorities (when required by law){'\n\n'}
            We do not sell your personal information to third parties.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Data Security</Text>
          <Text className="text-gray-600 mb-4">
            We implement industry-standard security measures to protect your data, including encryption in transit and at rest, secure authentication, and regular security audits.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Your Rights</Text>
          <Text className="text-gray-600 mb-4">
            You have the right to:{'\n'}
            • Access your personal data{'\n'}
            • Correct inaccurate data{'\n'}
            • Request deletion of your data{'\n'}
            • Opt-out of marketing communications{'\n'}
            • Export your data
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Location Data</Text>
          <Text className="text-gray-600 mb-4">
            We collect location data to provide venue intelligence, weather forecasts, and tide information relevant to your sailing location. You can disable location services in your device settings.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Children's Privacy</Text>
          <Text className="text-gray-600 mb-4">
            Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Changes to This Policy</Text>
          <Text className="text-gray-600 mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Contact Us</Text>
          <Text className="text-gray-600 mb-4">
            If you have questions about this Privacy Policy, please contact us at:{'\n\n'}
            Email: support@regattaflow.io{'\n'}
            Website: https://regattaflow.io
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
