/**
 * ChatOnboardingInterface
 * Conversational AI chat UI for sailor onboarding
 */

import React, { useRef, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Text, TextInput, Pressable } from 'react-native';
import { Send, Anchor, MapPin, Save, FileText, LogOut, List } from 'lucide-react-native';
import { ChatMessage } from '@/hooks/useStreamingChat';

interface ChatOnboardingInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onDetectLocation?: () => void;
  onSaveForLater?: () => void;
  onUseForm?: () => void;
  onExit?: () => void;
  onToggleTally?: () => void;
  showTallyButton?: boolean;
}

export function ChatOnboardingInterface({
  messages,
  isLoading,
  onSendMessage,
  onDetectLocation,
  onSaveForLater,
  onUseForm,
  onExit,
  onToggleTally,
  showTallyButton,
}: ChatOnboardingInterfaceProps) {
  const [inputValue, setInputValue] = React.useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      keyboardVerticalOffset={100}
    >
      <View className="flex-1 bg-white">
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-6"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-4">
            {messages.map(message => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <View className="flex-row justify-start">
                <View className="bg-gray-100 rounded-2xl px-4 py-3 max-w-[80%]">
                  <View className="flex-row gap-2 items-center">
                    <ActivityIndicator size="small" color="#0284c7" />
                    <Text className="text-gray-600 text-sm">Thinking...</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <View className="px-4 pb-2 flex-row gap-2">
            <Pressable
              className="flex-1 border border-blue-600 rounded-lg py-2 px-3 flex-row items-center justify-center"
              onPress={onDetectLocation}
            >
              <MapPin size={16} color="#0284c7" />
              <Text className="ml-2 text-blue-600">Use My Location</Text>
            </Pressable>
          </View>
        )}

        {/* Input Area */}
        <View className="bg-gray-50 border-t border-gray-200">
          <View className="px-4 py-3 flex-row gap-2">
            <TextInput
              className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Type your message..."
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!isLoading}
            />

            <Pressable
              onPress={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                inputValue.trim() && !isLoading
                  ? 'bg-blue-600'
                  : 'bg-gray-300'
              }`}
            >
              <Send size={20} color="white" />
            </Pressable>
          </View>

          {/* Action Buttons - Always visible when messages exist */}
          {messages.length > 0 && (
            <View className="px-4 pb-3 flex-row gap-2">
              {showTallyButton && onToggleTally && (
                <Pressable
                  onPress={onToggleTally}
                  className="border border-blue-600 rounded-lg py-2 px-3 flex-row items-center justify-center"
                >
                  <List size={16} color="#0284c7" />
                  <Text className="ml-2 text-blue-600 text-sm">Profile</Text>
                </Pressable>
              )}

              {onSaveForLater && (
                <Pressable
                  onPress={onSaveForLater}
                  className="flex-1 border border-blue-600 rounded-lg py-2 px-3 flex-row items-center justify-center"
                >
                  <Save size={16} color="#0284c7" />
                  <Text className="ml-2 text-blue-600 text-sm">Save</Text>
                </Pressable>
              )}

              {onUseForm && (
                <Pressable
                  onPress={onUseForm}
                  className="flex-1 border border-gray-400 rounded-lg py-2 px-3 flex-row items-center justify-center"
                >
                  <FileText size={16} color="#6b7280" />
                  <Text className="ml-2 text-gray-600 text-sm">Form</Text>
                </Pressable>
              )}

              {onExit && (
                <Pressable
                  onPress={onExit}
                  className="border border-gray-400 rounded-lg py-2 px-3 flex-row items-center justify-center"
                >
                  <LogOut size={16} color="#6b7280" />
                  <Text className="ml-2 text-gray-600 text-sm">Exit</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/**
 * Individual chat message bubble
 */
function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <View className={`flex-row justify-${isUser ? 'end' : 'start'}`}>
      <View
        className={`rounded-2xl px-4 py-3 max-w-[80%] ${
          isUser
            ? 'bg-blue-600'
            : message.isStreaming
            ? 'bg-gray-100'
            : 'bg-gray-100'
        }`}
      >
        {!isUser && (
          <View className="flex-row gap-1 mb-1 items-center">
            <Anchor size={14} color="#0284c7" />
            <Text className="text-xs font-semibold text-blue-600">
              RegattaFlow Assistant
            </Text>
          </View>
        )}

        <Text
          className={`text-base ${
            isUser ? 'text-white' : 'text-gray-800'
          }`}
        >
          {message.content}
        </Text>

        {message.isStreaming && (
          <View className="mt-2 flex-row gap-1">
            <View className="w-2 h-2 bg-blue-400 rounded-full" />
            <View className="w-2 h-2 bg-blue-400 rounded-full" />
            <View className="w-2 h-2 bg-blue-400 rounded-full" />
          </View>
        )}

        <Text
          className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}

export default ChatOnboardingInterface;
