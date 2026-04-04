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
          <Text className="text-gray-500 text-sm mb-4">Last updated: April 4, 2026</Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Introduction</Text>
          <Text className="text-gray-600 mb-4">
            BetterAt ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services. This policy applies to the BetterAt app available on Apple App Store and Google Play Store.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Information We Collect</Text>
          <Text className="text-gray-600 mb-2 font-semibold">Personal Information</Text>
          <Text className="text-gray-600 mb-4">
            • Account information (name, email address){'\n'}
            • Profile information (organization, interests, goals){'\n'}
            • Location data (for venue intelligence and weather services){'\n'}
            • Activity and progress data (timeline steps, plans, reflections)
          </Text>

          <Text className="text-gray-600 mb-2 font-semibold">Authentication Data</Text>
          <Text className="text-gray-600 mb-4">
            If you sign in using Google or Apple, we receive basic profile information (such as your name and email) as provided by those services. We do not receive or store your Google or Apple password.
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
            • Create and manage your account{'\n'}
            • Deliver personalized planning and coaching features{'\n'}
            • Power AI-assisted features (chat, recommendations, assessments){'\n'}
            • Send notifications about activities and events{'\n'}
            • Improve and personalize user experience{'\n'}
            • Process payments for premium features{'\n'}
            • Communicate updates and support
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Third-Party Services</Text>
          <Text className="text-gray-600 mb-4">
            Our app uses the following third-party services:{'\n\n'}
            • Supabase — for authentication, data storage, and backend services (supabase.com/privacy){'\n'}
            • Stripe — for payment processing (stripe.com/privacy){'\n'}
            • Google Maps — to display locations and venue information (policies.google.com/privacy){'\n'}
            • Anthropic (Claude AI) — for AI-powered features; your conversations may be processed by Anthropic's API (anthropic.com/privacy){'\n'}
            • Google AI — for AI-powered features (policies.google.com/privacy){'\n'}
            • Apple Sign-In — for authentication (apple.com/legal/privacy){'\n'}
            • Google Sign-In — for authentication (policies.google.com/privacy)
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Data Sharing</Text>
          <Text className="text-gray-600 mb-4">
            We may share your information with:{'\n'}
            • Organizations you join (for program management){'\n'}
            • Collaborators you invite to shared plans{'\n'}
            • Service providers (cloud hosting, payment processing, analytics){'\n'}
            • Legal authorities (when required by law){'\n\n'}
            We do not sell your personal information to third parties.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Data Security</Text>
          <Text className="text-gray-600 mb-4">
            We implement industry-standard security measures to protect your data, including encryption in transit and at rest, secure authentication, and regular security audits. Your data is stored securely using Supabase, which is hosted on cloud infrastructure with enterprise-grade security.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Data Retention</Text>
          <Text className="text-gray-600 mb-4">
            We retain your personal information for as long as your account is active or as needed to provide you with our services. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it by law.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Your Rights</Text>
          <Text className="text-gray-600 mb-4">
            You have the right to:{'\n'}
            • Access your personal data{'\n'}
            • Correct inaccurate data{'\n'}
            • Request deletion of your data{'\n'}
            • Opt-out of marketing communications{'\n'}
            • Export your data{'\n'}
            • Withdraw consent for data processing at any time
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Account Deletion</Text>
          <Text className="text-gray-600 mb-4">
            You can request deletion of your account and all associated personal data at any time through the app's Settings screen or by contacting us at denneyke@gmail.com. Upon receiving your request, we will delete your account and personal data within 30 days.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Location Data</Text>
          <Text className="text-gray-600 mb-4">
            We collect location data to provide venue intelligence, weather forecasts, and tide information relevant to your location. Location data is only collected when the app is in use and you have granted permission. You can disable location services at any time in your device settings.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">California Residents (CCPA)</Text>
          <Text className="text-gray-600 mb-4">
            If you are a California resident, you have the right to: know what personal data we collect, request deletion of your data, and opt out of any sale of personal data. We do not sell personal data. To exercise these rights, contact us at denneyke@gmail.com.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">European Users (GDPR)</Text>
          <Text className="text-gray-600 mb-4">
            If you are located in the European Economic Area, we process your personal data based on your consent, contractual necessity, and our legitimate interests. You have the right to access, rectify, erase, restrict processing, data portability, and object to processing of your personal data. To exercise these rights, contact us at denneyke@gmail.com.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Children's Privacy</Text>
          <Text className="text-gray-600 mb-4">
            Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected data from a child under 13, we will take steps to delete that information promptly.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Changes to This Policy</Text>
          <Text className="text-gray-600 mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy within the app and updating the "Last updated" date above.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Contact Us</Text>
          <Text className="text-gray-600 mb-4">
            If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us at:{'\n\n'}
            Email: denneyke@gmail.com{'\n'}
            Website: https://better.at
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
