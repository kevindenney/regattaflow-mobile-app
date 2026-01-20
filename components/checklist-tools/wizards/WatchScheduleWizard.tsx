/**
 * WatchScheduleWizard - Conversational Interface
 *
 * A chat-based wizard for creating crew watch schedules for distance racing.
 * Uses AI to guide users through setting up their watch rotation naturally.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Send,
  Clock,
  Users,
  Calendar,
  Check,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { crewManagementService, CrewMember } from '@/services/crewManagementService';
import { WatchScheduleAgent, ChatMessage, WatchScheduleAgentContext } from '@/services/agents/WatchScheduleAgent';
import type { WatchSchedule } from '@/types/watchSchedule';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  gray: '#8E8E93',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

interface WatchScheduleWizardProps extends ChecklistToolProps {
  raceStartTime?: string;
  raceDate?: string;
  raceDurationHours?: number;
  raceName?: string;
  raceDistance?: number;
}

export function WatchScheduleWizard({
  item,
  regattaId,
  boatId,
  onComplete,
  onCancel,
  raceStartTime,
  raceDate,
  raceDurationHours,
  raceName,
  raceDistance,
}: WatchScheduleWizardProps) {
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [schedulePreview, setSchedulePreview] = useState<WatchSchedule | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [agent, setAgent] = useState<WatchScheduleAgent | null>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, schedulePreview]);

  // Fetch crew and initialize agent
  useEffect(() => {
    const initialize = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch crew members
        let crew: CrewMember[] = [];
        try {
          crew = await crewManagementService.getAllCrew(user.id);
          setCrewMembers(crew || []);
        } catch (crewErr) {
          console.error('[WatchScheduleWizard] Error fetching crew:', crewErr);
        }

        // Check for existing schedule
        let existingSchedule: WatchSchedule | undefined;
        if (regattaId) {
          const { data } = await supabase
            .from('regattas')
            .select('watch_schedule')
            .eq('id', regattaId)
            .maybeSingle();

          if (data?.watch_schedule) {
            existingSchedule = data.watch_schedule as WatchSchedule;
          }
        }

        // Initialize the agent
        const context: WatchScheduleAgentContext = {
          raceName: raceName || 'your race',
          raceDistance,
          raceStartTime,
          raceDate,
          crewMembers: crew.map(c => ({
            id: c.id,
            name: c.name,
            role: c.role,
          })),
          existingSchedule,
        };

        const newAgent = new WatchScheduleAgent(context);
        setAgent(newAgent);

        // Get the initial greeting
        const greeting = newAgent.getInitialMessage();
        setMessages([{
          id: '1',
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
        }]);

        setError(null);
      } catch (err) {
        console.error('Failed to initialize:', err);
        setError('Failed to load. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [user?.id, regattaId, raceName, raceDistance, raceStartTime, raceDate]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending || !agent) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const result = await agent.processMessage(userInput);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (result.schedule) {
        setSchedulePreview(result.schedule);
      }

      if (result.isComplete && result.schedule) {
        // Save the schedule
        await saveSchedule(result.schedule);
        setIsComplete(true);
      }
    } catch (err: any) {
      console.error('Error processing message:', err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I had trouble with that: ${err.message}. Let's try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // Save the schedule to Supabase
  const saveSchedule = async (schedule: WatchSchedule) => {
    if (!regattaId) return;

    // Convert to the format expected by the database
    const dbSchedule = {
      raceDurationHours: schedule.estimatedDuration,
      watchLengthHours: schedule.system === '4on4off' ? 4 : 3,
      watches: [
        {
          id: 'watch-a',
          name: 'Watch A',
          color: IOS_COLORS.blue,
          crewIds: schedule.crew.filter(c => c.watch === 'A').map(c => c.id),
        },
        {
          id: 'watch-b',
          name: 'Watch B',
          color: IOS_COLORS.green,
          crewIds: schedule.crew.filter(c => c.watch === 'B').map(c => c.id),
        },
      ],
      watchMode: 'full_24h' as const,
      scheduleStartTime: raceStartTime || '10:00',
      raceDate,
    };

    const { error: updateError } = await supabase
      .from('regattas')
      .update({ watch_schedule: dbSchedule })
      .eq('id', regattaId);

    if (updateError) {
      throw updateError;
    }
  };

  // Handle completion
  const handleDone = () => {
    onComplete();
  };

  // Render message bubble
  const renderMessage = (message: ChatMessage) => (
    <View
      key={message.id}
      style={[
        styles.messageBubble,
        message.role === 'user' ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          message.role === 'user' ? styles.userText : styles.assistantText,
        ]}
      >
        {message.content}
      </Text>
      <Text style={styles.messageTime}>
        {message.timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );

  // Render schedule preview card
  const renderSchedulePreview = () => {
    if (!schedulePreview) return null;

    const watchA = schedulePreview.crew.filter(c => c.watch === 'A');
    const watchB = schedulePreview.crew.filter(c => c.watch === 'B');

    return (
      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <Clock size={18} color={IOS_COLORS.blue} />
          <Text style={styles.previewTitle}>Watch Schedule Preview</Text>
        </View>

        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>System</Text>
          <Text style={styles.previewValue}>
            {schedulePreview.system === '4on4off' ? '4 on / 4 off' : '3 on / 3 off'}
          </Text>
        </View>

        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Duration</Text>
          <Text style={styles.previewValue}>{schedulePreview.estimatedDuration} hours</Text>
        </View>

        <View style={styles.watchGroupPreview}>
          <View style={styles.watchGroupHeader}>
            <View style={[styles.watchDot, { backgroundColor: IOS_COLORS.blue }]} />
            <Text style={[styles.watchGroupName, { color: IOS_COLORS.blue }]}>Watch A</Text>
          </View>
          <Text style={styles.watchGroupCrew}>
            {watchA.map(c => c.name).join(', ') || 'No crew assigned'}
          </Text>
        </View>

        <View style={styles.watchGroupPreview}>
          <View style={styles.watchGroupHeader}>
            <View style={[styles.watchDot, { backgroundColor: IOS_COLORS.green }]} />
            <Text style={[styles.watchGroupName, { color: IOS_COLORS.green }]}>Watch B</Text>
          </View>
          <Text style={styles.watchGroupCrew}>
            {watchB.map(c => c.name).join(', ') || 'No crew assigned'}
          </Text>
        </View>

        {schedulePreview.notes && (
          <View style={styles.previewNotes}>
            <Text style={styles.previewNotesText}>{schedulePreview.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.blue} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={onCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24} color={IOS_COLORS.blue} />
            <Text style={styles.backText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Watch Schedule</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Context Bar */}
        <View style={styles.contextBar}>
          <View style={styles.contextItem}>
            <Calendar size={14} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.contextText}>{raceName || 'Distance Race'}</Text>
          </View>
          {raceDistance && (
            <View style={styles.contextItem}>
              <Text style={styles.contextText}>{raceDistance}nm</Text>
            </View>
          )}
          {crewMembers.length > 0 && (
            <View style={styles.contextItem}>
              <Users size={14} color={IOS_COLORS.secondaryLabel} />
              <Text style={styles.contextText}>{crewMembers.length} crew</Text>
            </View>
          )}
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(renderMessage)}

          {schedulePreview && renderSchedulePreview()}

          {isSending && (
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <ActivityIndicator size="small" color={IOS_COLORS.blue} />
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        {isComplete ? (
          <View style={styles.completedContainer}>
            <View style={styles.completedBadge}>
              <Check size={20} color={IOS_COLORS.green} />
              <Text style={styles.completedText}>Schedule saved!</Text>
            </View>
            <Pressable style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your response..."
              placeholderTextColor={IOS_COLORS.gray}
              multiline
              maxLength={500}
              style={styles.textInput}
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
              editable={!isSending}
            />
            <Pressable
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isSending}
              style={[
                styles.sendButton,
                (!inputText.trim() || isSending) && styles.sendButtonDisabled,
              ]}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={18} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  backText: {
    fontSize: 17,
    color: IOS_COLORS.blue,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 80,
  },
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contextText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: IOS_COLORS.blue,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: IOS_COLORS.label,
  },
  messageTime: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  previewCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  previewLabel: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  watchGroupPreview: {
    marginTop: 12,
  },
  watchGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  watchDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  watchGroupName: {
    fontSize: 14,
    fontWeight: '600',
  },
  watchGroupCrew: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    paddingLeft: 16,
  },
  previewNotes: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  previewNotesText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 16,
    maxHeight: 100,
    color: IOS_COLORS.label,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: IOS_COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: IOS_COLORS.gray,
  },
  completedContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    gap: 12,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.green,
  },
  doneButton: {
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default WatchScheduleWizard;
