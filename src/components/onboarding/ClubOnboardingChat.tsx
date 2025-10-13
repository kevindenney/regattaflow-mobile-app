/**
 * Club Onboarding Chat Interface
 * Conversational AI-powered club setup experience
 * Transforms 45-minute form into 5-minute conversation
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { ClubOnboardingAgent } from '@/src/services/agents/ClubOnboardingAgent';
import { useAuth } from '@/src/lib/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ToolExecution {
  name: string;
  status: 'running' | 'completed' | 'failed';
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
  const [toolsExecuted, setToolsExecuted] = useState<ToolExecution[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const agent = new ClubOnboardingAgent();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }]);

    setLoading(true);

    try {
      // Call agent with user message
      const result = await agent.run({
        userMessage,
        context: {
          messages,
          userId: user.id,
        },
        maxIterations: 15,
      });

      // Track tools that were used
      if (result.toolsUsed && result.toolsUsed.length > 0) {
        setToolsExecuted(prev => [
          ...prev,
          ...result.toolsUsed.map(name => ({ name, status: 'completed' as const })),
        ]);
      }

      if (result.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: result.result as string,
          timestamp: new Date(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I encountered an issue: ${result.error}\n\nLet's try again - what's your club name or location?`,
          timestamp: new Date(),
        }]);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had a technical issue. Please try again or contact support if this persists.',
        timestamp: new Date(),
      }]);
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
    setToolsExecuted([]);
    setInputValue('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#F5F7FA' }}
    >
      <View style={{ flex: 1, padding: 16 }}>
        {/* Progress Indicator */}
        {toolsExecuted.length > 0 && (
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
              Setup Progress: {toolsExecuted.length}/8 steps
            </Text>
            <TouchableOpacity onPress={handleStartOver}>
              <Text style={{ fontSize: 14, color: '#1976D2', textDecorationLine: 'underline' }}>
                Start Over
              </Text>
            </TouchableOpacity>
          </View>
        )}

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

        {/* Tool Execution Status (optional debug info) */}
        {toolsExecuted.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center' }}>
              Completed: {toolsExecuted.map(t => t.name.replace('_', ' ')).join(', ')}
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

export default ClubOnboardingChat;
