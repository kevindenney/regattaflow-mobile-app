/**
 * Club Onboarding Chat Interface
 * Conversational AI-powered club setup experience
 * Transforms 45-minute form into 5-minute conversation
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ClubOnboardingChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome to RegattaFlow Clubs! 🎉\n\nI'm your AI assistant. I'll help you set up your club in about 5 minutes.\n\nWhat's your club's name or location?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const onboardingSkillId = process.env.EXPO_PUBLIC_CLAUDE_SKILL_CLUB_ONBOARDING || null;
  const scrapeSkillId = process.env.EXPO_PUBLIC_CLAUDE_SKILL_CLUB_SCRAPE || null;

  const isLikelyUrl = (value: string) => {
    if (!value) return false;
    const trimmed = value.trim();
    if (trimmed.length < 5) return false;
    try {
      const normalized = trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;
      const parsed = new URL(normalized);
      return Boolean(parsed.hostname);
    } catch {
      return false;
    }
  };

  const formatScrapeSummary = (url: string, data: any) => {
    const summaryLines: string[] = [];
    if (data?.summary) {
      summaryLines.push(data.summary.trim());
    } else {
      summaryLines.push(`I scanned ${url} and pulled out a few highlights.`);
    }

    if (Array.isArray(data?.classes) && data.classes.length > 0) {
      const classLines = data.classes.slice(0, 5).map((cls: any) => `• ${cls.name}${cls.description ? ` — ${cls.description}` : ''}`);
      summaryLines.push('\nKey classes/fleets:\n' + classLines.join('\n'));
    }

    if (Array.isArray(data?.events) && data.events.length > 0) {
      const eventLines = data.events.slice(0, 5).map((evt: any) => {
        const pieces: string[] = [];
        if (evt.name) pieces.push(evt.name);
        if (evt.date) pieces.push(evt.date);
        return `• ${pieces.join(' — ')}`;
      });
      summaryLines.push('\nUpcoming events mentioned:\n' + eventLines.join('\n'));
    }

    return summaryLines.join('\n\n').trim();
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    const userEntry: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    let conversation: Message[] = [...messages, userEntry];
    setMessages(conversation);

    setLoading(true);

    try {
      if (isLikelyUrl(userMessage)) {
        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('club-scrape', {
          body: {
            url: userMessage,
            skillId: scrapeSkillId,
          },
        });

        if (scrapeError) {
          console.error('Club scrape function error:', scrapeError);
          throw new Error(scrapeError.message || 'Failed to scan that website');
        }

        if (scrapeData?.success && scrapeData?.data) {
          const importMessage: Message = {
            role: 'assistant',
            content: formatScrapeSummary(userMessage, scrapeData.data),
            timestamp: new Date(),
          };

          conversation = [...conversation, importMessage];
          setMessages(conversation);
        } else if (scrapeData?.error) {
          const importMessage: Message = {
            role: 'assistant',
            content: `I attempted to scan ${userMessage}, but ran into an issue: ${scrapeData.error}. Try another page or provide key details manually.`,
            timestamp: new Date(),
          };
          conversation = [...conversation, importMessage];
          setMessages(conversation);
        }
      }

      const payloadMessages = conversation.map(({ role, content }) => ({ role, content }));

      const { data, error } = await supabase.functions.invoke('club-onboarding', {
        body: {
          messages: payloadMessages,
          skillId: onboardingSkillId,
        },
      });

      if (error) {
        console.error('Club onboarding function error:', error);
        throw new Error(error.message || 'Edge function error');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Unable to continue onboarding conversation');
      }

      const responseText = typeof data.message === 'string' && data.message.length > 0
        ? data.message
        : 'Thanks! I captured that. Could you share a bit more about your club?';

      const assistantEntry: Message = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      conversation = [...conversation, assistantEntry];
      setMessages(conversation);
    } catch (error: any) {
      console.error('Chat error:', error);
      const fallback = error?.message
        ? `I ran into an issue: ${error.message}. Let's try again — what's your club name or location?`
        : 'Sorry, I had a technical issue. Please try again or contact support if this persists.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fallback,
        timestamp: new Date(),
      }]);
      if (Platform.OS === 'web') {
        Alert.alert?.('Onboarding error', error?.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Let's start fresh! 🎉\n\nWhat's your club's name or location?",
        timestamp: new Date(),
      },
    ]);
    setInputValue('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#F5F7FA' }}
    >
      <View style={{ flex: 1, padding: 16 }}>
        <View style={{
          backgroundColor: '#E3F2FD',
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text style={{ fontSize: 14, color: '#1976D2', fontWeight: '600' }}>
            Chat with our onboarding specialist to set up your workspace.
          </Text>
          <TouchableOpacity onPress={handleStartOver}>
            <Text style={{ fontSize: 14, color: '#1976D2', textDecorationLine: 'underline' }}>
              Start Over
            </Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {messages.map((msg, i) => (
            <View key={i} style={{
              marginBottom: 16,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
            }}>
              {/* Message Bubble */}
              <View style={{
                backgroundColor: msg.role === 'user' ? '#007AFF' : '#FFFFFF',
                padding: 14,
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}>
                <Text style={{
                  color: msg.role === 'user' ? '#FFFFFF' : '#1F2937',
                  fontSize: 15,
                  lineHeight: 22,
                }}>
                  {msg.content}
                </Text>
              </View>

              {/* Timestamp */}
              <Text style={{
                fontSize: 11,
                color: '#9CA3AF',
                marginTop: 4,
                marginLeft: msg.role === 'user' ? 0 : 8,
                marginRight: msg.role === 'user' ? 8 : 0,
                textAlign: msg.role === 'user' ? 'right' : 'left',
              }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <View style={{
              alignSelf: 'flex-start',
              backgroundColor: '#FFFFFF',
              padding: 14,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={{ marginLeft: 8, color: '#6B7280', fontSize: 14 }}>
                AI is thinking...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 16,
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          paddingHorizontal: 16,
          paddingVertical: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Type your message..."
            placeholderTextColor="#9CA3AF"
            style={{
              flex: 1,
              fontSize: 15,
              paddingVertical: 8,
              color: '#1F2937',
            }}
            onSubmitEditing={handleSendMessage}
            editable={!loading}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={loading || !inputValue.trim()}
            style={{
              backgroundColor: loading || !inputValue.trim() ? '#E5E7EB' : '#007AFF',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
              marginLeft: 8,
            }}
          >
            <Text style={{
              color: loading || !inputValue.trim() ? '#9CA3AF' : '#FFFFFF',
              fontSize: 15,
              fontWeight: '600',
            }}>
              Send
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

export default ClubOnboardingChat;
