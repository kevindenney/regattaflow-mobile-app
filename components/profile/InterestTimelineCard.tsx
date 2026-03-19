import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PersonTimelineRow } from '@/components/landing/PersonTimelineRow';
import type { SamplePerson, SampleTimelineStep } from '@/lib/landing/sampleData';

interface InterestTimelineCardProps {
  interestName: string;
  interestSlug: string;
  accentColor: string;
  orgName?: string;
  orgSlug?: string;
  role?: string;
  person: SamplePerson;
  isPersonal?: boolean;
}

export function InterestTimelineCard({
  interestName,
  interestSlug,
  accentColor,
  orgName,
  orgSlug,
  role,
  person,
  isPersonal,
}: InterestTimelineCardProps) {
  const timeline = person.timeline;
  const completedCount = timeline.filter((s) => s.status === 'completed').length;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.colorDot, { backgroundColor: accentColor }]} />
        <View style={styles.headerInfo}>
          <Text style={styles.interestName}>{interestName}</Text>
          <View style={styles.headerMeta}>
            {isPersonal ? (
              <View style={styles.personalBadge}>
                <Ionicons name="person-outline" size={10} color="#6B7280" />
                <Text style={styles.personalText}>Personal</Text>
              </View>
            ) : orgName ? (
              <TouchableOpacity
                onPress={() => router.push(`/${interestSlug}/${orgSlug}` as any)}
                activeOpacity={0.7}
                style={styles.orgLink}
              >
                <Ionicons name="business-outline" size={10} color="#6B7280" />
                <Text style={styles.orgLinkText}>{orgName}</Text>
                <Ionicons name="chevron-forward" size={10} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
            {role ? <Text style={styles.roleText}>{role}</Text> : null}
          </View>
        </View>
      </View>

      {/* Progress summary */}
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: accentColor,
                width: `${timeline.length > 0 ? (completedCount / timeline.length) * 100 : 0}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {completedCount}/{timeline.length} steps
        </Text>
      </View>

      {/* Timeline row */}
      <View style={styles.timelineContainer}>
        <PersonTimelineRow
          person={person}
          accentColor={accentColor}
          interestSlug={interestSlug}
        />
      </View>

      {/* Step list */}
      <View style={styles.stepList}>
        {timeline.map((step, i) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          return (
            <View key={i} style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: isCompleted
                      ? accentColor
                      : isCurrent
                        ? accentColor
                        : '#E5E7EB',
                  },
                ]}
              >
                {isCompleted && <Ionicons name="checkmark" size={10} color="#FFFFFF" />}
                {isCurrent && <View style={styles.stepDotInner} />}
              </View>
              {i < timeline.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    { backgroundColor: isCompleted ? accentColor + '40' : '#E5E7EB' },
                  ]}
                />
              )}
              <View style={styles.stepContent}>
                <View style={styles.stepHeader}>
                  <Text
                    style={[
                      styles.stepLabel,
                      isCurrent && { color: accentColor, fontWeight: '700' },
                      !isCompleted && !isCurrent && { color: '#9CA3AF' },
                    ]}
                  >
                    {step.label}
                  </Text>
                  {isCurrent && (
                    <View style={[styles.nowBadge, { backgroundColor: accentColor }]}>
                      <Text style={styles.nowBadgeText}>NOW</Text>
                    </View>
                  )}
                  {isCompleted && (
                    <View style={[styles.doneBadge, { backgroundColor: accentColor + '15' }]}>
                      <Text style={[styles.doneBadgeText, { color: accentColor }]}>DONE</Text>
                    </View>
                  )}
                </View>
                {step.detail && <Text style={styles.stepDetail}>{step.detail}</Text>}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' } as any,
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 3,
  },
  headerInfo: {
    flex: 1,
  },
  interestName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  personalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  personalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  orgLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  orgLinkText: {
    fontSize: 13,
    color: '#6B7280',
    textDecorationLine: 'underline',
    textDecorationColor: '#D1D5DB',
  },
  roleText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  timelineContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  stepList: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 48,
    position: 'relative',
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    zIndex: 1,
  },
  stepDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  stepLine: {
    position: 'absolute',
    left: 9,
    top: 22,
    bottom: -2,
    width: 2,
  },
  stepContent: {
    flex: 1,
    marginLeft: 14,
    paddingBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  nowBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  nowBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  doneBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  doneBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  stepDetail: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginTop: 4,
  },
});
