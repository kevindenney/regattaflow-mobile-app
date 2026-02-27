/**
 * ActivityCatalog — Browse activity templates from followed orgs and coaches.
 *
 * Displayed in the Add Event flow above "Create from scratch".
 * Templates are grouped by publisher and filtered by current interest + event type.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, FlatList } from 'react-native';
import { Building2, User, Calendar, MapPin, Users as UsersIcon } from 'lucide-react-native';
import type { ActivityTemplate, CatalogGroup } from '@/types/activities';
import { groupTemplatesByPublisher } from '@/services/activityCatalog';

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

interface ActivityCatalogProps {
  templates: ActivityTemplate[];
  onSelectTemplate: (template: ActivityTemplate) => void;
  isLoading?: boolean;
}

function TemplateCard({
  template,
  onPress,
}: {
  template: ActivityTemplate;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.templateCard} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.templateTitle} numberOfLines={1}>
        {template.title}
      </Text>
      {template.description ? (
        <Text style={styles.templateDesc} numberOfLines={2}>
          {template.description}
        </Text>
      ) : null}
      <View style={styles.templateMeta}>
        {template.scheduledDate && (
          <View style={styles.metaItem}>
            <Calendar size={11} color={COLORS.tertiaryLabel} />
            <Text style={styles.metaText}>
              {new Date(template.scheduledDate).toLocaleDateString()}
            </Text>
          </View>
        )}
        {template.location && (
          <View style={styles.metaItem}>
            <MapPin size={11} color={COLORS.tertiaryLabel} />
            <Text style={styles.metaText} numberOfLines={1}>
              {template.location}
            </Text>
          </View>
        )}
        {template.enrollmentCount > 0 && (
          <View style={styles.metaItem}>
            <UsersIcon size={11} color={COLORS.tertiaryLabel} />
            <Text style={styles.metaText}>{template.enrollmentCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function PublisherGroup({
  group,
  onSelectTemplate,
}: {
  group: CatalogGroup;
  onSelectTemplate: (t: ActivityTemplate) => void;
}) {
  const Icon = group.publisherType === 'organization' ? Building2 : User;

  return (
    <View style={styles.publisherGroup}>
      <View style={styles.publisherHeader}>
        <View style={styles.publisherIcon}>
          <Icon size={14} color={COLORS.blue} />
        </View>
        <Text style={styles.publisherName}>{group.publisherName}</Text>
      </View>
      {group.templates.map((t) => (
        <TemplateCard key={t.id} template={t} onPress={() => onSelectTemplate(t)} />
      ))}
    </View>
  );
}

export function ActivityCatalog({
  templates,
  onSelectTemplate,
  isLoading,
}: ActivityCatalogProps) {
  const groups = useMemo(() => groupTemplatesByPublisher(templates), [templates]);

  if (isLoading) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Loading catalog...</Text>
      </View>
    );
  }

  if (groups.length === 0) {
    return null; // Don't render if no templates available
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>FROM YOUR ORGANIZATIONS & COACHES</Text>
      {groups.map((group) => (
        <PublisherGroup
          key={`${group.publisherType}-${group.publisherId}`}
          group={group}
          onSelectTemplate={onSelectTemplate}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  publisherGroup: { gap: 6 },
  publisherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  publisherIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${COLORS.blue}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publisherName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.label,
  },
  templateCard: {
    padding: 12,
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
    gap: 4,
  },
  templateTitle: { fontSize: 15, fontWeight: '600', color: COLORS.label },
  templateDesc: { fontSize: 13, color: COLORS.secondaryLabel, lineHeight: 18 },
  templateMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: COLORS.tertiaryLabel },
  empty: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.tertiaryLabel },
});

export default ActivityCatalog;
