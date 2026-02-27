import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            className="mr-4"
          >
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Terms of Service</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-gray-500 text-sm mb-4">Last updated: February 1, 2026</Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Acceptance of Terms</Text>
          <Text className="text-gray-600 mb-4">
            By using RegattaFlow, you agree to these terms and our privacy policy. If you do not
            agree, stop using the service.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Service Description</Text>
          <Text className="text-gray-600 mb-4">
            RegattaFlow provides race planning, coaching, club operations, and sailing data tools.
            Features may evolve over time.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Accounts and Security</Text>
          <Text className="text-gray-600 mb-4">
            You are responsible for account credentials and activity under your account. You must
            provide accurate profile details.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">User Content</Text>
          <Text className="text-gray-600 mb-4">
            You retain ownership of your uploaded data. You grant us a limited license to host and
            process content needed to operate the product.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Acceptable Use</Text>
          <Text className="text-gray-600 mb-4">
            Do not misuse the service, interfere with operations, scrape unauthorized data, or
            violate applicable laws and racing regulations.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Payments and Subscriptions</Text>
          <Text className="text-gray-600 mb-4">
            Paid features renew per your selected plan unless canceled. Taxes and payment terms are
            shown at checkout.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Availability and Changes</Text>
          <Text className="text-gray-600 mb-4">
            We may modify or discontinue features, and we may update these terms. Material changes
            will be reflected by an updated date.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Limitation of Liability</Text>
          <Text className="text-gray-600 mb-4">
            RegattaFlow is provided as-is to the extent permitted by law. We are not liable for
            indirect or consequential damages.
          </Text>

          <Text className="text-lg font-bold text-gray-800 mb-3">Contact</Text>
          <Text className="text-gray-600">
            Questions about these terms: support@regattaflow.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
