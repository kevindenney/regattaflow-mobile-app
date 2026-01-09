/**
 * Unified Sharing Sheet
 * Bottom sheet for sharing pre-race strategy or post-race analysis
 * Supports WhatsApp, Email, Copy, Native share, and Coach sharing
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from '@/components/ui/actionsheet';
import { useShareHandlers } from './hooks/useShareHandlers';
import { ShareChannelGrid } from './ShareChannelGrid';
import type {
  UnifiedSharingSheetProps,
  ShareChannel,
  ShareResult,
  CoachProfile,
} from './types';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('UnifiedSharingSheet');

export function UnifiedSharingSheet({
  visible,
  onClose,
  onShareComplete,
  context,
  content,
  sailorId,
  primaryCoachId,
  primaryCoachName,
  config,
}: UnifiedSharingSheetProps) {
  const [loading, setLoading] = useState(false);
  const [loadingChannel, setLoadingChannel] = useState<ShareChannel | null>(null);
  const [primaryCoach, setPrimaryCoach] = useState<CoachProfile | null>(null);
  const [sharing, setSharing] = useState(false);

  const { handleShare, generateShareableText } = useShareHandlers({
    content,
    onShareComplete,
  });

  // Load primary coach info if ID provided
  useEffect(() => {
    if (primaryCoachId && visible) {
      loadPrimaryCoach();
    }
  }, [primaryCoachId, visible]);

  const loadPrimaryCoach = async () => {
    if (!primaryCoachId) return;

    try {
      const { data } = await supabase
        .from('coach_profiles')
        .select('id, user_id, display_name, is_verified, profile_image_url')
        .eq('id', primaryCoachId)
        .maybeSingle();

      if (data) {
        setPrimaryCoach(data as CoachProfile);
      }
    } catch (error) {
      logger.error('Failed to load primary coach:', error);
    }
  };

  const handleChannelSelect = useCallback(async (channel: ShareChannel) => {
    setLoadingChannel(channel);
    setLoading(true);

    try {
      await handleShare(channel);
    } finally {
      setLoadingChannel(null);
      setLoading(false);
    }
  }, [handleShare]);

  const handleShareWithCoach = useCallback(async () => {
    if (!primaryCoach) return;

    setSharing(true);
    try {
      // Create a share record or notification for the coach
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: primaryCoach.user_id,
          type: context === 'pre-race' ? 'strategy_shared' : 'analysis_shared',
          title: context === 'pre-race' ? 'Strategy Shared' : 'Analysis Shared',
          message: `${context === 'pre-race' ? 'Race strategy' : 'Race analysis'} for ${content.raceName} has been shared with you`,
          data: {
            race_id: content.raceId,
            sailor_id: sailorId,
            share_type: context,
          },
          read: false,
        });

      if (error) {
        throw error;
      }

      const result: ShareResult = {
        success: true,
        channel: 'coach',
        recipientName: primaryCoach.display_name,
      };

      onShareComplete?.(result);

      if (Platform.OS === 'web') {
        alert(`Shared with ${primaryCoach.display_name}!`);
      } else {
        Alert.alert(
          'Shared!',
          `Your ${context === 'pre-race' ? 'strategy' : 'analysis'} has been shared with ${primaryCoach.display_name}.`,
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      logger.error('Failed to share with coach:', error);
      if (Platform.OS === 'web') {
        alert('Failed to share. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to share. Please try again.');
      }
    } finally {
      setSharing(false);
    }
  }, [primaryCoach, context, content, sailorId, onShareComplete, onClose]);

  const formatPosition = (pos: number) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = pos % 100;
    return pos + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  const renderPreview = () => {
    if (context === 'pre-race') {
      return (
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <MaterialCommunityIcons name="flag-checkered" size={20} color="#3B82F6" />
            <Text style={styles.previewTitle}>Pre-Race Strategy</Text>
          </View>
          <Text style={styles.previewRaceName}>{content.raceName}</Text>
          <Text style={styles.previewDate}>
            {new Date(content.raceDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          {content.venue && (
            <Text style={styles.previewVenue}>{content.venue}</Text>
          )}
        </View>
      );
    }

    // Post-race preview
    const result = content.postRace?.result;
    return (
      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <MaterialCommunityIcons name="trophy" size={20} color="#F59E0B" />
          <Text style={styles.previewTitle}>Race Analysis</Text>
        </View>
        <Text style={styles.previewRaceName}>{content.raceName}</Text>
        <Text style={styles.previewDate}>
          {new Date(content.raceDate).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        {result && !result.status && (
          <View style={styles.resultBadge}>
            <Text style={styles.resultText}>
              {formatPosition(result.position)} of {result.fleetSize}
            </Text>
          </View>
        )}
        {result?.status && (
          <View style={[styles.resultBadge, styles.resultBadgeStatus]}>
            <Text style={styles.resultStatusText}>{result.status}</Text>
          </View>
        )}
        {content.postRace?.keyLearning && (
          <Text style={styles.keyLearning} numberOfLines={2}>
            "{content.postRace.keyLearning}"
          </Text>
        )}
      </View>
    );
  };

  return (
    <Actionsheet isOpen={visible} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={styles.sheetContent}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Share {context === 'pre-race' ? 'Strategy' : 'Analysis'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Content Preview */}
          {renderPreview()}

          {/* Quick Share Channels */}
          <ShareChannelGrid
            onSelectChannel={handleChannelSelect}
            loading={loading}
            loadingChannel={loadingChannel}
          />

          {/* Divider */}
          <View style={styles.divider} />

          {/* Share with Coach (One-tap if primary coach is set) */}
          {primaryCoach && (
            <View style={styles.coachSection}>
              <Text style={styles.sectionLabel}>Share with Coach</Text>
              <TouchableOpacity
                style={styles.coachCard}
                onPress={handleShareWithCoach}
                disabled={sharing}
                activeOpacity={0.7}
              >
                <View style={styles.coachAvatar}>
                  <MaterialCommunityIcons name="account" size={24} color="#3B82F6" />
                </View>
                <View style={styles.coachInfo}>
                  <View style={styles.coachNameRow}>
                    <Text style={styles.coachName}>{primaryCoach.display_name}</Text>
                    {primaryCoach.is_verified && (
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={16}
                        color="#3B82F6"
                      />
                    )}
                  </View>
                  <Text style={styles.coachHint}>Tap to share instantly</Text>
                </View>
                {sharing ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <View style={styles.sendButton}>
                    <MaterialCommunityIcons name="send" size={18} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* No coach hint */}
          {!primaryCoach && config?.showCoachOption !== false && (
            <View style={styles.noCoachHint}>
              <MaterialCommunityIcons name="information-outline" size={18} color="#94A3B8" />
              <Text style={styles.noCoachText}>
                Connect with a coach to share directly
              </Text>
            </View>
          )}

          {/* Bottom padding */}
          <View style={{ height: 32 }} />
        </ScrollView>
      </ActionsheetContent>
    </Actionsheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    padding: 4,
  },
  previewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewRaceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  previewDate: {
    fontSize: 14,
    color: '#64748B',
  },
  previewVenue: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  resultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  resultBadgeStatus: {
    backgroundColor: '#FEE2E2',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  resultStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  keyLearning: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#475569',
    marginTop: 12,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coachSection: {
    marginBottom: 16,
  },
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  coachAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coachInfo: {
    flex: 1,
  },
  coachNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coachName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  coachHint: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 2,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noCoachHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
  },
  noCoachText: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
