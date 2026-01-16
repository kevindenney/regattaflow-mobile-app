import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CoachProfile } from '@/services/CoachingService';
import { TufteCoachRow } from './TufteCoachRow';

interface CoachWithScore extends CoachProfile {
  display_name?: string | null;
  compatibilityScore?: number;
  matchReasoning?: string;
}

interface ForYouSectionProps {
  coaches: CoachWithScore[];
  onCoachPress: (coachId: string) => void;
  isLoading?: boolean;
  contextDescription?: string;
  maxVisible?: number;
}

/**
 * ForYouSection - AI-powered coach recommendations
 *
 * Design principles:
 * - Collapsible to respect user preference
 * - Shows context for personalization
 * - Uses same TufteCoachRow component for consistency
 * - Minimal chrome, focus on recommendations
 */
export function ForYouSection({
  coaches,
  onCoachPress,
  isLoading = false,
  contextDescription = 'Based on your sailing profile',
  maxVisible = 3,
}: ForYouSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Don't render if no coaches and not loading
  if (!isLoading && coaches.length === 0) {
    return null;
  }

  const visibleCoaches = coaches.slice(0, maxVisible);

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.title}>FOR YOU</Text>
          <Text style={styles.context}>{contextDescription}</Text>
        </View>
        <Text style={styles.toggle}>
          {isCollapsed ? 'Show' : 'Hide'}
        </Text>
      </TouchableOpacity>

      {/* Content */}
      {!isCollapsed && (
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.loadingText}>Finding your matches...</Text>
            </View>
          ) : (
            visibleCoaches.map((coach) => (
              <TufteCoachRow
                key={coach.id}
                coach={coach}
                onPress={() => onCoachPress(coach.id)}
                showMatchInfo={true}
              />
            ))
          )}
        </View>
      )}

      {/* Section divider */}
      <View style={styles.sectionDivider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ALL COACHES</Text>
        <View style={styles.dividerLine} />
      </View>
    </View>
  );
}

const colors = {
  text: '#1a1a1a',
  textMuted: '#666666',
  textLight: '#999999',
  border: '#e5e5e5',
  background: '#ffffff',
  backgroundMuted: '#f9f9f9',
  accent: '#2563eb',
  match: '#059669',
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  } as any,
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.match,
    letterSpacing: 1,
    marginBottom: 2,
  },
  context: {
    fontSize: 12,
    color: colors.textMuted,
  },
  toggle: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '500',
  },
  content: {
    backgroundColor: colors.backgroundMuted,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
    letterSpacing: 1,
    paddingHorizontal: 12,
  },
});

export default ForYouSection;
