/**
 * ActivityCatalog — Browse activity templates from followed orgs and coaches.
 *
 * Displayed in the Add Event flow above "Create from scratch".
 * Templates are grouped by publisher and filtered by current interest + event type.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Pressable } from 'react-native';
import { Building2, User, Calendar, MapPin, Users as UsersIcon, ChevronDown, ChevronRight } from 'lucide-react-native';
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
  expanded,
  onToggleExpanded,
}: {
  group: CatalogGroup;
  onSelectTemplate: (t: ActivityTemplate) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const Icon = group.publisherType === 'organization' ? Building2 : User;

  return (
    <View style={styles.publisherGroup}>
      <Pressable style={styles.publisherHeader} onPress={onToggleExpanded}>
        <View style={styles.publisherHeaderLeft}>
          <View style={styles.publisherIcon}>
            <Icon size={14} color={COLORS.blue} />
          </View>
          <View style={styles.publisherTextWrap}>
            <Text style={styles.publisherName}>{group.publisherName}</Text>
            <Text style={styles.publisherMeta}>
              {group.templates.length} {group.templates.length === 1 ? 'template' : 'templates'}
            </Text>
          </View>
        </View>
        <View style={styles.publisherHeaderRight}>
          <Text style={styles.browseLabel}>{expanded ? 'Hide' : 'Browse'}</Text>
          {expanded ? (
            <ChevronDown size={14} color={COLORS.tertiaryLabel} />
          ) : (
            <ChevronRight size={14} color={COLORS.tertiaryLabel} />
          )}
        </View>
      </Pressable>
      {expanded ? (
        <View style={styles.templatesList}>
          {group.templates.map((t) => (
            <TemplateCard key={t.id} template={t} onPress={() => onSelectTemplate(t)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ActivityCatalog({
  templates,
  onSelectTemplate,
  isLoading,
}: ActivityCatalogProps) {
  const groups = useMemo(() => groupTemplatesByPublisher(templates), [templates]);
  const [expandedPublisherKeys, setExpandedPublisherKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (groups.length === 0) {
      setExpandedPublisherKeys(new Set());
      return;
    }
    setExpandedPublisherKeys((prev) => {
      if (prev.size > 0) {
        const valid = new Set(
          Array.from(prev).filter((key) =>
            groups.some((group) => `${group.publisherType}-${group.publisherId}` === key),
          ),
        );
        if (valid.size > 0) return valid;
      }
      const firstKey = `${groups[0].publisherType}-${groups[0].publisherId}`;
      return new Set([firstKey]);
    });
  }, [groups]);

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
      <Text style={styles.sectionSubLabel}>Tap an organization or coach to browse available templates.</Text>
      {groups.map((group) => (
        (() => {
          const key = `${group.publisherType}-${group.publisherId}`;
          const expanded = expandedPublisherKeys.has(key);
          const handleToggle = () => {
            setExpandedPublisherKeys((prev) => {
              const next = new Set(prev);
              if (next.has(key)) {
                next.delete(key);
              } else {
                next.add(key);
              }
              return next;
            });
          };
          return (
        <PublisherGroup
          key={key}
          group={group}
          onSelectTemplate={onSelectTemplate}
          expanded={expanded}
          onToggleExpanded={handleToggle}
        />
          );
        })()
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
  sectionSubLabel: {
    fontSize: 12,
    color: COLORS.tertiaryLabel,
    marginTop: -6,
    paddingHorizontal: 4,
  },
  publisherGroup: {
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray5,
  },
  publisherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  publisherHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  publisherHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  browseLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.blue,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  publisherIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${COLORS.blue}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publisherTextWrap: {
    flexShrink: 1,
  },
  publisherName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.label,
  },
  publisherMeta: {
    fontSize: 12,
    color: COLORS.tertiaryLabel,
    marginTop: 1,
  },
  templatesList: {
    gap: 6,
    paddingLeft: 2,
  },
  templateCard: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gray5,
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
