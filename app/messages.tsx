import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, MessageCircle, Users } from 'lucide-react-native';

export default function MessagesScreen() {
  const router = useRouter();

  const conversations = [
    { name: 'Dragon Fleet', lastMessage: 'Race starts at 1400 tomorrow', time: '2h ago', unread: 3 },
    { name: 'Sarah Lee', lastMessage: 'Great race today!', time: '5h ago', unread: 0 },
    { name: 'RHKYC Race Committee', lastMessage: 'Course change notification', time: '1d ago', unread: 1 },
    { name: 'Mike Chen', lastMessage: 'Can you crew this weekend?', time: '2d ago', unread: 0 },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Messages</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {conversations.map((conv, index) => (
          <TouchableOpacity
            key={index}
            className="bg-white px-4 py-4 border-b border-gray-100"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3">
                {conv.name.includes('Fleet') || conv.name.includes('Committee') ? (
                  <Users size={24} color="#2563EB" />
                ) : (
                  <MessageCircle size={24} color="#2563EB" />
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-gray-800 font-semibold">{conv.name}</Text>
                  <Text className="text-gray-400 text-sm">{conv.time}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-500 flex-1" numberOfLines={1}>{conv.lastMessage}</Text>
                  {conv.unread > 0 && (
                    <View className="bg-blue-600 rounded-full w-6 h-6 items-center justify-center ml-2">
                      <Text className="text-white text-xs font-bold">{conv.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
