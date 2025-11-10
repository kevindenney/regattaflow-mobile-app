/**
 * Race Suggestions Drawer
 * Displays intelligent race recommendations categorized by source
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import type { RaceSuggestion, CategorizedSuggestions } from '@/services/RaceSuggestionService';

interface RaceSuggestionsDrawerProps {
  suggestions: CategorizedSuggestions | null;
  loading: boolean;
  onSelectSuggestion: (suggestion: RaceSuggestion) => void;
  onDismissSuggestion?: (suggestionId: string) => void;
  onRefresh?: () => void;
}

export function RaceSuggestionsDrawer({
  suggestions,
  loading,
  onSelectSuggestion,
  onDismissSuggestion,
  onRefresh,
}: RaceSuggestionsDrawerProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('club');

  // Debug logging
  console.log('[RaceSuggestionsDrawer] Rendering with:', {
    loading,
    suggestions: suggestions ? {
      total: suggestions.total,
      clubRaces: suggestions.clubRaces.length,
      fleetRaces: suggestions.fleetRaces.length,
      patterns: suggestions.patterns.length,
      templates: suggestions.templates.length,
    } : null
  });

  if (loading) {
    console.log('[RaceSuggestionsDrawer] Showing loading state');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading suggestions...</Text>
      </View>
    );
  }

  if (!suggestions || suggestions.total === 0) {
    console.log('[RaceSuggestionsDrawer] Showing empty state');
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="lightbulb-outline" size={40} color="#94A3B8" />
        <Text style={styles.emptyTitle}>No Suggestions Yet</Text>
        <Text style={styles.emptySubtitle}>
          Join clubs and fleets to see race recommendations here
        </Text>
      </View>
    );
  }

  console.log('[RaceSuggestionsDrawer] Showing suggestions drawer');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="star-shooting" size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>Suggested Races</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{suggestions.total}</Text>
          </View>
        </View>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Club Races Section */}
        {suggestions.clubRaces.length > 0 && (
          <SuggestionSection
            title="From Your Clubs"
            icon="office-building"
            iconColor="#3B82F6"
            count={suggestions.clubRaces.length}
            expanded={expandedSection === 'club'}
            onToggle={() => toggleSection('club')}
          >
            {suggestions.clubRaces.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onSelect={() => onSelectSuggestion(suggestion)}
                onDismiss={onDismissSuggestion ? () => onDismissSuggestion(suggestion.id) : undefined}
              />
            ))}
          </SuggestionSection>
        )}

        {/* Fleet Races Section */}
        {suggestions.fleetRaces.length > 0 && (
          <SuggestionSection
            title="From Your Fleets"
            icon="sail-boat"
            iconColor="#10B981"
            count={suggestions.fleetRaces.length}
            expanded={expandedSection === 'fleet'}
            onToggle={() => toggleSection('fleet')}
          >
            {suggestions.fleetRaces.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onSelect={() => onSelectSuggestion(suggestion)}
                onDismiss={onDismissSuggestion ? () => onDismissSuggestion(suggestion.id) : undefined}
              />
            ))}
          </SuggestionSection>
        )}

        {/* Pattern-Based Suggestions */}
        {suggestions.patterns.length > 0 && (
          <SuggestionSection
            title="Based on Your History"
            icon="history"
            iconColor="#8B5CF6"
            count={suggestions.patterns.length}
            expanded={expandedSection === 'pattern'}
            onToggle={() => toggleSection('pattern')}
          >
            {suggestions.patterns.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onSelect={() => onSelectSuggestion(suggestion)}
                onDismiss={onDismissSuggestion ? () => onDismissSuggestion(suggestion.id) : undefined}
              />
            ))}
          </SuggestionSection>
        )}

        {/* Template Suggestions */}
        {suggestions.templates.length > 0 && (
          <SuggestionSection
            title="Your Common Races"
            icon="file-document-outline"
            iconColor="#F59E0B"
            count={suggestions.templates.length}
            expanded={expandedSection === 'template'}
            onToggle={() => toggleSection('template')}
          >
            {suggestions.templates.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onSelect={() => onSelectSuggestion(suggestion)}
                onDismiss={onDismissSuggestion ? () => onDismissSuggestion(suggestion.id) : undefined}
              />
            ))}
          </SuggestionSection>
        )}
      </ScrollView>
    </View>
  );
}

// =====================================================
// Section Component
// =====================================================

interface SuggestionSectionProps {
  title: string;
  icon: string;
  iconColor: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SuggestionSection({
  title,
  icon,
  iconColor,
  count,
  expanded,
  onToggle,
  children,
}: SuggestionSectionProps) {
  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
        <View style={styles.sectionHeaderLeft}>
          <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={[styles.sectionBadge, { backgroundColor: iconColor + '20' }]}>
            <Text style={[styles.sectionBadgeText, { color: iconColor }]}>{count}</Text>
          </View>
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#64748B"
        />
      </TouchableOpacity>

      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
}

// =====================================================
// Card Component
// =====================================================

interface SuggestionCardProps {
  suggestion: RaceSuggestion;
  onSelect: () => void;
  onDismiss?: () => void;
}

function SuggestionCard({ suggestion, onSelect, onDismiss }: SuggestionCardProps) {
  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return { label: 'High Match', color: '#10B981' };
    if (score >= 0.6) return { label: 'Good Match', color: '#F59E0B' };
    return { label: 'Possible Match', color: '#64748B' };
  };

  const badge = getConfidenceBadge(suggestion.confidenceScore);
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {suggestion.raceData.raceName}
          </Text>
          <View style={[styles.confidenceBadge, { backgroundColor: badge.color + '20' }]}>
            <Text style={[styles.confidenceBadgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Details */}
      <View style={styles.cardDetails}>
        {suggestion.raceData.venue && (
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#64748B" />
            <Text style={styles.detailText} numberOfLines={1}>
              {suggestion.raceData.venue}
            </Text>
          </View>
        )}
        {suggestion.raceData.startDate && (
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={14} color="#64748B" />
            <Text style={styles.detailText}>{formatDate(suggestion.raceData.startDate)}</Text>
          </View>
        )}
        {suggestion.raceData.boatClass && (
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="sail-boat" size={14} color="#64748B" />
            <Text style={styles.detailText}>{suggestion.raceData.boatClass}</Text>
          </View>
        )}
      </View>

      {/* Reason */}
      <View style={styles.reasonContainer}>
        <MaterialCommunityIcons name="information-outline" size={14} color="#3B82F6" />
        <Text style={styles.reasonText}>{suggestion.reason}</Text>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.addButton} onPress={onSelect}>
          <MaterialCommunityIcons name="plus-circle" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>
            {suggestion.canAddDirectly ? 'Add to Calendar' : 'Use as Template'}
          </Text>
        </TouchableOpacity>
        {onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <MaterialCommunityIcons name="close" size={18} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// =====================================================
// Styles
// =====================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  badge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 400,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  sectionBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionContent: {
    padding: 12,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  confidenceBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  confidenceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 8,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
