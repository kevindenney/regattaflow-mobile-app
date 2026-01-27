/**
 * VHFInputWizard
 *
 * Simple form for inputting VHF channels for race communications.
 * Auto-extracts from SI if available, allows manual entry.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Radio,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react-native';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray2: '#636366',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
};

// Common VHF channels for sailing
const COMMON_CHANNELS = [
  { channel: '72', label: 'Ch 72', description: 'Common US race channel' },
  { channel: '77', label: 'Ch 77', description: 'Common US race channel' },
  { channel: '69', label: 'Ch 69', description: 'UK/EU race channel' },
  { channel: '37', label: 'Ch 37', description: 'UK race channel' },
  { channel: '16', label: 'Ch 16', description: 'Emergency/calling' },
];

interface VHFInputWizardProps extends ChecklistToolProps {
  /** Pre-filled channel from SI extraction */
  extractedChannel?: string;
  /** Pre-filled safety channel */
  extractedSafetyChannel?: string;
  /** Callback to save VHF data */
  onSave?: (data: { raceChannel: string; safetyChannel: string }) => void;
}

export function VHFInputWizard({
  item,
  regattaId,
  onComplete,
  onCancel,
  extractedChannel,
  extractedSafetyChannel,
}: VHFInputWizardProps) {
  const [raceChannel, setRaceChannel] = useState(extractedChannel || '');
  const [safetyChannel, setSafetyChannel] = useState(extractedSafetyChannel || '16');
  const [notes, setNotes] = useState('');

  // Validate channel input
  const isValidChannel = useCallback((ch: string) => {
    if (!ch) return false;
    const num = parseInt(ch, 10);
    return num >= 1 && num <= 88;
  }, []);

  const canSave = isValidChannel(raceChannel);

  const handleQuickSelect = useCallback((channel: string) => {
    setRaceChannel(channel);
  }, []);

  const handleSave = useCallback(() => {
    if (!canSave) return;
    // In a full implementation, save to race data via RaceService
    onComplete();
  }, [canSave, onComplete]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.closeButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={IOS_COLORS.gray} />
        </Pressable>
        <Text style={styles.headerTitle}>VHF Channels</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentInner}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon Header */}
          <View style={styles.iconHeader}>
            <View style={styles.iconCircle}>
              <Radio size={32} color={IOS_COLORS.green} />
            </View>
            <Text style={styles.title}>Race Communications</Text>
            <Text style={styles.subtitle}>
              Note the VHF channels for race committee and safety communications
            </Text>
          </View>

          {/* Race Channel Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Race Channel</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputPrefix}>Ch</Text>
              <TextInput
                style={styles.channelInput}
                value={raceChannel}
                onChangeText={setRaceChannel}
                placeholder="72"
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                keyboardType="number-pad"
                maxLength={2}
                autoFocus
              />
            </View>
            {raceChannel && !isValidChannel(raceChannel) && (
              <View style={styles.errorRow}>
                <AlertCircle size={14} color={IOS_COLORS.red} />
                <Text style={styles.errorText}>
                  Enter a valid channel (1-88)
                </Text>
              </View>
            )}
          </View>

          {/* Quick Select */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Common Channels</Text>
            <View style={styles.quickSelectRow}>
              {COMMON_CHANNELS.filter(c => c.channel !== '16').map((ch) => (
                <Pressable
                  key={ch.channel}
                  style={[
                    styles.quickSelectButton,
                    raceChannel === ch.channel && styles.quickSelectButtonActive,
                  ]}
                  onPress={() => handleQuickSelect(ch.channel)}
                >
                  <Text
                    style={[
                      styles.quickSelectText,
                      raceChannel === ch.channel && styles.quickSelectTextActive,
                    ]}
                  >
                    {ch.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Safety Channel */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Channel</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputPrefix}>Ch</Text>
              <TextInput
                style={styles.channelInput}
                value={safetyChannel}
                onChangeText={setSafetyChannel}
                placeholder="16"
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <View style={styles.infoRow}>
              <Info size={14} color={IOS_COLORS.blue} />
              <Text style={styles.infoText}>
                Channel 16 is the international emergency channel
              </Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g., RC boat name, backup channel..."
              placeholderTextColor={IOS_COLORS.tertiaryLabel}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Tips</Text>
            <View style={styles.tipRow}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>
                Test your VHF before leaving the dock
              </Text>
            </View>
            <View style={styles.tipRow}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>
                Monitor the race channel from launch until return
              </Text>
            </View>
            <View style={styles.tipRow}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>
                Keep transmissions brief and professional
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomAction}>
          <Pressable
            style={[
              styles.saveButton,
              !canSave && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Check size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Channels</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 4,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 20,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${IOS_COLORS.green}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  channelInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: IOS_COLORS.label,
    padding: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: IOS_COLORS.red,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  quickSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickSelectButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
  },
  quickSelectButtonActive: {
    backgroundColor: IOS_COLORS.blue,
    borderColor: IOS_COLORS.blue,
  },
  quickSelectText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  quickSelectTextActive: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: IOS_COLORS.label,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tipsCard: {
    backgroundColor: `${IOS_COLORS.blue}08`,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.blue,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  bottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.green,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: IOS_COLORS.gray,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default VHFInputWizard;
