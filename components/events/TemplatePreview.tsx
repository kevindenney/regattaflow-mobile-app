/**
 * TemplatePreview — Preview an activity template before enrolling.
 *
 * Shows template details, pre-filled data, and an "Add to My Timeline" button.
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, ActivityIndicator } from 'react-native';
import {
  Calendar,
  MapPin,
  Users,
  Tag,
  ArrowRight,
  Building2,
  User,
  Check,
  X,
} from 'lucide-react-native';
import type { ActivityTemplate } from '@/types/activities';

const COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#C7C7CC',
  blue: '#007AFF',
  green: '#34C759',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  systemBackground: '#FFFFFF',
};

interface TemplatePreviewProps {
  template: ActivityTemplate;
  onEnroll: (template: ActivityTemplate) => Promise<void>;
  onClose: () => void;
  isEnrolled?: boolean;
}

export function TemplatePreview({
  template,
  onEnroll,
  onClose,
  isEnrolled = false,
}: TemplatePreviewProps) {
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(isEnrolled);

  const handleEnroll = useCallback(async () => {
    if (enrolled || enrolling) return;
    setEnrolling(true);
    try {
      await onEnroll(template);
      setEnrolled(true);
    } finally {
      setEnrolling(false);
    }
  }, [template, onEnroll, enrolled, enrolling]);

  const PublisherIcon = template.publisherType === 'organization' ? Building2 : User;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{template.title}</Text>
          <View style={styles.publisherRow}>
            <PublisherIcon size={12} color={COLORS.secondaryLabel} />
            <Text style={styles.publisherName}>
              {template.publisherName ?? 'Unknown'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={20} color={COLORS.secondaryLabel} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        {template.description && (
          <Text style={styles.description}>{template.description}</Text>
        )}

        {/* Details */}
        <View style={styles.detailsGrid}>
          {template.scheduledDate && (
            <View style={styles.detailRow}>
              <Calendar size={14} color={COLORS.secondaryLabel} />
              <Text style={styles.detailText}>
                {new Date(template.scheduledDate).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
          {template.location && (
            <View style={styles.detailRow}>
              <MapPin size={14} color={COLORS.secondaryLabel} />
              <Text style={styles.detailText}>{template.location}</Text>
            </View>
          )}
          {template.enrollmentCount > 0 && (
            <View style={styles.detailRow}>
              <Users size={14} color={COLORS.secondaryLabel} />
              <Text style={styles.detailText}>
                {template.enrollmentCount} enrolled
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {template.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {template.tags.map((tag, i) => (
              <View key={`${tag}-${i}`} style={styles.tag}>
                <Tag size={10} color={COLORS.secondaryLabel} />
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Event type info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Event Type</Text>
          <Text style={styles.infoValue}>
            {template.eventSubtype ?? template.eventType}
          </Text>
        </View>
      </ScrollView>

      {/* Action button */}
      <View style={styles.footer}>
        {enrolled ? (
          <View style={styles.enrolledBadge}>
            <Check size={16} color={COLORS.green} />
            <Text style={styles.enrolledText}>Added to Timeline</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.enrollButton}
            onPress={handleEnroll}
            disabled={enrolling}
            activeOpacity={0.7}
          >
            {enrolling ? (
              <ActivityIndicator size="small" color={COLORS.systemBackground} />
            ) : (
              <>
                <Text style={styles.enrollButtonText}>Add to My Timeline</Text>
                <ArrowRight size={16} color={COLORS.systemBackground} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.systemBackground },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray5,
  },
  headerLeft: { flex: 1, gap: 4, marginRight: 12 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.label },
  publisherRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  publisherName: { fontSize: 13, color: COLORS.secondaryLabel },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 16 },
  description: { fontSize: 15, color: COLORS.label, lineHeight: 22 },
  detailsGrid: { gap: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, color: COLORS.secondaryLabel },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.gray6,
    borderRadius: 6,
  },
  tagText: { fontSize: 12, color: COLORS.secondaryLabel },
  infoCard: {
    padding: 12,
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.tertiaryLabel,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  infoValue: { fontSize: 15, fontWeight: '500', color: COLORS.label },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray5,
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: COLORS.blue,
    borderRadius: 12,
  },
  enrollButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.systemBackground },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: `${COLORS.green}12`,
    borderRadius: 12,
  },
  enrolledText: { fontSize: 16, fontWeight: '600', color: COLORS.green },
});

export default TemplatePreview;
