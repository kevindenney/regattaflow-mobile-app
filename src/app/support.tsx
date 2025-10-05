import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, MessageCircle, Book, ExternalLink } from 'lucide-react-native';

export default function SupportScreen() {
  const router = useRouter();

  const faqs = [
    {
      question: 'How do I upload sailing instructions?',
      answer: 'Go to AI Strategy Center and tap "Upload Document". You can upload PDFs, photos, or paste text.'
    },
    {
      question: 'How does venue intelligence work?',
      answer: 'Our AI detects your location and provides local sailing knowledge, weather patterns, and tactical insights for that specific venue.'
    },
    {
      question: 'Can I track multiple boats?',
      answer: 'Yes! In Fleet Management, you can add and track multiple boats with different equipment setups.'
    }
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Help & Support</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Contact Options */}
        <View className="bg-white rounded-xl mb-4 overflow-hidden">
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:support@regattaflow.com')}
            className="flex-row items-center p-4 border-b border-gray-100"
          >
            <Mail size={20} color="#2563EB" />
            <Text className="text-gray-800 font-medium ml-3 flex-1">Email Support</Text>
            <ExternalLink size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
            <MessageCircle size={20} color="#2563EB" />
            <Text className="text-gray-800 font-medium ml-3 flex-1">Live Chat</Text>
            <ExternalLink size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-4">
            <Book size={20} color="#2563EB" />
            <Text className="text-gray-800 font-medium ml-3 flex-1">Documentation</Text>
            <ExternalLink size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text className="text-lg font-bold text-gray-800 mb-3">Frequently Asked Questions</Text>

        {faqs.map((faq, index) => (
          <View key={index} className="bg-white rounded-xl p-4 mb-3">
            <Text className="text-gray-800 font-semibold mb-2">{faq.question}</Text>
            <Text className="text-gray-600">{faq.answer}</Text>
          </View>
        ))}

        {/* App Info */}
        <View className="bg-white rounded-xl p-4 mt-4">
          <Text className="text-gray-800 font-semibold mb-3">App Information</Text>
          <View className="mb-2">
            <Text className="text-gray-500 text-sm">Version</Text>
            <Text className="text-gray-800">1.0.0</Text>
          </View>
          <View className="mb-2">
            <Text className="text-gray-500 text-sm">Build</Text>
            <Text className="text-gray-800">2024.10.03</Text>
          </View>
          <View>
            <Text className="text-gray-500 text-sm">Platform</Text>
            <Text className="text-gray-800">Expo Universal (iOS/Android/Web)</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
