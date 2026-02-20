/**
 * CoachSelectionSheet - Bottom sheet for selecting from multiple coaches
 *
 * Shows when a sailor has multiple active coaching relationships
 * and needs to choose which coach to contact or share with.
 *
 * Features:
 *   - Lists active coaches with relevance indicators
 *   - Quick action buttons per coach
 *   - Uses IOSActionSheet-style animations
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Animated,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, User, MessageCircle, Share2, Star, ChevronRight } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import type { ActiveCoach } from '@/hooks/useSailorActiveCoaches';
import type { CoachingPhase } from './CoachingSuggestionTile';

// =============================================================================
// TYPES
// =============================================================================

export interface CoachSelectionSheetProps {
  /** Whether the sheet is visible */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** List of active coaches */
  coaches: ActiveCoach[];
  /** Current phase context */
  phase: CoachingPhase;
  /** Race ID for sharing context */
  raceId?: string;
  /** Race boat class for relevance display */
  raceBoatClass?: string;
  /** Callback when a coach is selected for action */
  onSelectCoach: (coach: ActiveCoach, action: 'message' | 'share') => void;
}

// =============================================================================
// COLORS
// =============================================================================

const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#48484A',
  background: '#FFFFFF',
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CoachSelectionSheet({
  isOpen,
  onClose,
  coaches,
  phase,
  raceBoatClass,
  onSelectCoach,
}: CoachSelectionSheetProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(400)).current;

  React.useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 28,
          stiffness: 400,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 400,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, fadeAnim, slideAnim]);

  const handleCoachPress = (coach: ActiveCoach) => {
    triggerHaptic('impactLight');
    const action = phase === 'prep' ? 'message' : 'share';
    onClose();
    setTimeout(() => onSelectCoach(coach, action), 150);
  };

  const getActionIcon = () => {
    return phase === 'prep' ? MessageCircle : Share2;
  };

  /**
   * Check if coach specializes in the race's boat class
   */
  const isBoatClassMatch = (coach: ActiveCoach) => {
    if (!raceBoatClass) return false;
    return coach.boatClasses.includes(raceBoatClass);
  };

  /**
   * Get relevance badge text based on coach attributes
   */
  const getRelevanceBadge = (coach: ActiveCoach): string | null => {
    if (isBoatClassMatch(coach)) {
      return raceBoatClass || 'Class expert';
    }
    if (coach.relevanceScore >= 60) {
      return 'Recommended';
    }
    return null;
  };

  const ActionIcon = getActionIcon();

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          opacity: fadeAnim,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '70%',
          paddingBottom: insets.bottom || 16,
          transform: [{ translateY: slideAnim }],
        }}
        pointerEvents="box-none"
      >
        <View
          style={{
            backgroundColor: COLORS.background,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          {/* Drag Indicator */}
          <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
            <View
              style={{
                width: 36,
                height: 5,
                borderRadius: 3,
                backgroundColor: COLORS.gray3,
              }}
            />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: 20,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: 12,
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: 17,
                fontWeight: '600',
                color: COLORS.label,
                letterSpacing: -0.4,
              }}
              numberOfLines={1}
            >
              Choose Coach
            </Text>
            <Pressable
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: COLORS.gray5,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={onClose}
              hitSlop={8}
            >
              <X size={18} color={COLORS.gray} strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Subtitle */}
          <Text
            style={{
              fontSize: 13,
              color: COLORS.gray,
              paddingHorizontal: 20,
              paddingBottom: 12,
            }}
          >
            {phase === 'prep'
              ? 'Select a coach to ask about your race plan'
              : 'Select a coach to share your race debrief'}
          </Text>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: COLORS.gray5,
              marginHorizontal: 20,
            }}
          />

          {/* Coach List */}
          <ScrollView
            style={{ maxHeight: 300 }}
            showsVerticalScrollIndicator={false}
          >
            {coaches.length === 0 && (
              <View style={{ paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, color: COLORS.secondaryLabel, textAlign: 'center' }}>
                  No coaches available yet. Browse the coach directory to find your match.
                </Text>
              </View>
            )}
            {coaches.map((coach, idx) => {
              const isLast = idx === coaches.length - 1;
              const relevanceBadge = getRelevanceBadge(coach);

              return (
                <Pressable
                  key={coach.id}
                  onPress={() => handleCoachPress(coach)}
                >
                  {({ pressed }) => (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 20,
                        paddingVertical: 14,
                        backgroundColor: pressed ? COLORS.gray6 : 'transparent',
                      }}
                    >
                      {/* Coach Avatar */}
                      {coach.avatarUrl ? (
                        <Image
                          source={{ uri: coach.avatarUrl }}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            marginRight: 12,
                          }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: `${COLORS.blue}15`,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                          }}
                        >
                          <User size={22} color={COLORS.blue} />
                        </View>
                      )}

                      {/* Coach Info */}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: '600',
                              color: COLORS.label,
                            }}
                            numberOfLines={1}
                          >
                            {coach.displayName}
                          </Text>
                          {relevanceBadge && (
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: `${COLORS.orange}15`,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                                gap: 2,
                              }}
                            >
                              <Star size={10} color={COLORS.orange} fill={COLORS.orange} />
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: '600',
                                  color: COLORS.orange,
                                }}
                              >
                                {relevanceBadge}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={{
                            fontSize: 13,
                            color: COLORS.gray,
                            marginTop: 2,
                          }}
                          numberOfLines={1}
                        >
                          {coach.totalSessions} sessions
                          {coach.specialties.length > 0 &&
                            ` • ${coach.specialties.slice(0, 2).join(', ')}`}
                        </Text>
                      </View>

                      {/* Action indicator */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: `${COLORS.blue}15`,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ActionIcon size={16} color={COLORS.blue} />
                        </View>
                        <ChevronRight size={16} color={COLORS.gray3} />
                      </View>

                      {/* Separator */}
                      {!isLast && (
                        <View
                          style={{
                            position: 'absolute',
                            left: 76,
                            right: 20,
                            bottom: 0,
                            height: 1,
                            backgroundColor: COLORS.gray5,
                          }}
                        />
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Bottom padding */}
          <View style={{ height: 8 }} />
        </View>
      </Animated.View>
    </Modal>
  );
}

export default CoachSelectionSheet;
