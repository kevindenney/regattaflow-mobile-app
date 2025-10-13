/**
 * Sailor Onboarding - Conversational Chat Interface
 * AI-powered onboarding that extracts sailor profile data through natural conversation
 * User can switch to comprehensive form at any time
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Send, FileText, Sparkles, ChevronRight, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { ConversationalOnboardingAgent } from '@/src/services/agents/ConversationalOnboardingAgent';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ExtractedData {
  sailorRole?: 'owner' | 'crew' | 'both';
  boats?: Array<{ className: string; sailNumber: string; boatName?: string }>;
  clubs?: Array<{ name: string; url?: string }>;
  venues?: Array<{ name: string }>;
  crew?: Array<{ name: string; role?: string }>;
  documents?: Array<{ url: string; type: string }>;
}

export default function SailorOnboardingChat() {
  const router = useRouter();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your sailing assistant. Let's get you started!\n\n🎯 Are you a:\n• **Owner** (you own/helm a boat)\n• **Crew** (you crew on boats)\n• **Both** (you own a boat AND crew on others)\n\nJust type 'owner', 'crew', or 'both'!\n\n✨ That's all we need to get started. You can add boat details, club info, and race information later from your dashboard!",
      timestamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [agent] = useState(() => new ConversationalOnboardingAgent());
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Scroll to bottom when messages update
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    const userInput = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    console.log('📝 [CHAT DEBUG] Starting to process user input:', userInput);
    console.log('📝 [CHAT DEBUG] Current extracted data:', extractedData);

    try {
      // Use AI agent to extract entities from user message
      console.log('📝 [CHAT DEBUG] Calling agent.processUserMessage...');
      const result = await agent.processUserMessage(userInput, extractedData);
      console.log('📝 [CHAT DEBUG] Agent result:', result);

      if (result.success && result.result) {
        // Update extracted data with AI-parsed entities
        setExtractedData(result.result);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.result.aiResponse || "Got it! I've noted that information. Feel free to share more details, or click 'Switch to Form' when you're ready to review everything.",
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Fallback if AI extraction fails
        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Thanks for sharing! Keep adding details or switch to the form when ready.",
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, fallbackMessage]);
      }
    } catch (error: any) {
      console.error('Error processing message:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Thanks for sharing! Keep adding details or switch to the form when ready.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const hasMinimumRequiredData = (data?: ExtractedData): boolean => {
    if (!data) return false;
    // Minimum requirement: sailor role selected
    // Boats, clubs, venues are all optional
    return !!data.sailorRole;
  };

  const handleSwitchToForm = () => {
    router.push({
      pathname: '/(auth)/sailor-onboarding-comprehensive',
      params: {
        chatData: JSON.stringify(extractedData),
      },
    });
  };

  const getDataSummary = () => {
    const items = [];
    if (extractedData.sailorRole) {
      items.push(`${extractedData.sailorRole}`);
    }
    if (extractedData.boats?.length) {
      items.push(`${extractedData.boats.length} boat${extractedData.boats.length > 1 ? 's' : ''}`);
    }
    if (extractedData.clubs?.length) {
      items.push(`${extractedData.clubs.length} club${extractedData.clubs.length > 1 ? 's' : ''}`);
    }
    if (extractedData.crew?.length) {
      items.push(`${extractedData.crew.length} crew`);
    }
    return items.length > 0 ? items.join(', ') : 'No data yet';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View className="flex-1">
        {/* Header */}
        <View className="bg-sky-600 pt-12 pb-4 px-4">
          <Text className="text-white text-2xl font-bold mb-1">Welcome Aboard!</Text>
          <Text className="text-sky-100 text-sm">Let's set up your sailing profile</Text>
        </View>

        {/* Data Summary Bar */}
        <View className="bg-sky-50 border-b border-sky-200 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color="#0284c7" />
              <Text className="text-sm text-sky-700 font-medium">
                Collected: {getDataSummary()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSwitchToForm}
              className="bg-sky-600 px-4 py-2 rounded-lg flex-row items-center gap-1"
            >
              <FileText size={16} color="white" />
              <Text className="text-white font-semibold text-sm">Switch to Form</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              className={`mb-4 ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <View
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-sky-600'
                    : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-base ${
                    message.role === 'user' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {message.content}
                </Text>
              </View>
              <Text className="text-xs text-gray-400 mt-1 px-2">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          ))}

          {isProcessing && (
            <View className="items-start mb-4">
              <View className="bg-gray-100 rounded-2xl px-4 py-3">
                <ActivityIndicator size="small" color="#0284c7" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View className="border-t border-gray-200 px-4 py-3 bg-white">
          <View className="flex-row items-center gap-2">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Tell me about your boat, club, next race... or paste any links!"
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={1000}
              className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-base max-h-24"
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isProcessing}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                inputText.trim() && !isProcessing
                  ? 'bg-sky-600'
                  : 'bg-gray-300'
              }`}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Send size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>

          {/* Help Toggle */}
          <TouchableOpacity
            onPress={() => setShowHelp(!showHelp)}
            className="mt-2 py-2 items-center flex-row justify-center gap-1"
          >
            <HelpCircle size={14} color="#6b7280" />
            <Text className="text-gray-500 text-xs font-medium">
              {showHelp ? 'Hide tips' : 'What can I share?'}
            </Text>
            {showHelp ? (
              <ChevronUp size={14} color="#6b7280" />
            ) : (
              <ChevronDown size={14} color="#6b7280" />
            )}
          </TouchableOpacity>

          {/* Expandable Help */}
          {showHelp && (
            <View className="mt-2 p-3 bg-sky-50 rounded-lg border border-sky-200">
              <Text className="text-xs font-bold text-sky-900 mb-1">
                🎯 Sailor Role:
              </Text>
              <Text className="text-xs text-sky-800 mb-2">
                Tell me if you're an "owner", "crew", or "both" - this helps customize your experience
              </Text>

              <Text className="text-xs font-bold text-sky-900 mb-1">
                📋 Boat & Equipment (Optional):
              </Text>
              <Text className="text-xs text-sky-800 mb-2">
                Class, sail #, boat name, hull maker, rig maker, sail maker (North, Quantum, etc.)
              </Text>

              <Text className="text-xs font-bold text-sky-900 mb-1">
                🏛️ Clubs & Venues (Optional):
              </Text>
              <Text className="text-xs text-sky-800 mb-2">
                Yacht club, home venue, regular sailing locations
              </Text>

              <Text className="text-xs font-bold text-sky-900 mb-1">
                🔗 Helpful Links (Optional - just paste URLs):
              </Text>
              <Text className="text-xs text-sky-800">
                • Club websites{'\n'}
                • Class associations{'\n'}
                • Tuning guides & setup sheets
              </Text>
            </View>
          )}

          {/* Quick Action - Skip to Form */}
          <TouchableOpacity
            onPress={handleSwitchToForm}
            className="mt-2 py-2 items-center"
          >
            <Text className="text-sky-600 text-sm font-medium">
              Or fill out the complete form instead →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
