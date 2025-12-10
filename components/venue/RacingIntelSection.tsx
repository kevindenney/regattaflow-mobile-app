/**
 * RacingIntelSection Component
 * Displays AI-generated tactical intelligence and local knowledge for a venue
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useVenueTactics, useVenueWeather } from '@/hooks/useVenueIntelligence';

interface RacingIntelSectionProps {
  venueId?: string;
  venueName?: string;
  compact?: boolean;
}

interface IntelCategory {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  items: string[];
  expanded?: boolean;
}

/**
 * Expandable intel card
 */
function IntelCard({ 
  category, 
  isExpanded, 
  onToggle 
}: { 
  category: IntelCategory;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity 
      style={styles.intelCard}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.intelCardHeader}>
        <View style={[styles.intelIconContainer, { backgroundColor: category.bgColor }]}>
          <Ionicons name={category.icon as any} size={18} color={category.iconColor} />
        </View>
        <ThemedText style={styles.intelTitle}>{category.title}</ThemedText>
        <Ionicons 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#6b7280" 
        />
      </View>
      
      {isExpanded && (
        <View style={styles.intelContent}>
          {category.items.map((item, index) => (
            <View key={index} style={styles.intelItem}>
              <View style={[styles.intelBullet, { backgroundColor: category.iconColor }]} />
              <ThemedText style={styles.intelItemText}>{item}</ThemedText>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

export function RacingIntelSection({
  venueId,
  venueName,
  compact = false,
}: RacingIntelSectionProps) {
  const { tacticalIntelligence, isLoading: tacticsLoading, refreshIntelligence } = useVenueTactics(venueId);
  const { weatherIntelligence, isLoading: weatherLoading } = useVenueWeather(venueId);
  
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(['wind']));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isLoading = tacticsLoading || weatherLoading;

  // Build intelligence categories from available data
  const categories: IntelCategory[] = [
    {
      id: 'wind',
      title: 'Wind Patterns',
      icon: 'flag',
      iconColor: '#0284c7',
      bgColor: '#e0f2fe',
      items: tacticalIntelligence?.windPatterns || [
        'Sea breeze typically fills 1300-1400 local time',
        'Morning easterlies tend to be lighter and steadier',
        'Afternoon westerlies can be gusty, especially near shore',
        'Watch for velocity bands on the water surface',
      ],
    },
    {
      id: 'current',
      title: 'Current Effects',
      icon: 'git-merge-outline',
      iconColor: '#0891b2',
      bgColor: '#cffafe',
      items: tacticalIntelligence?.currentEffects || [
        'Flood tide sets NE through the main channel',
        'Ebb runs strongest 2 hours after high water',
        'Eddy forms close to shore on the eastern side',
        'Current is weakest near the marks at slack water',
      ],
    },
    {
      id: 'tactics',
      title: 'Course Tips',
      icon: 'navigate',
      iconColor: '#059669',
      bgColor: '#d1fae5',
      items: tacticalIntelligence?.courseTips || [
        'Right side favored in typical afternoon breeze',
        'Stay in pressure; boat speed beats pointing',
        'Gate rounds: choose based on next leg strategy',
        'Watch laylines carefully - current affects them',
      ],
    },
    {
      id: 'hazards',
      title: 'Local Hazards',
      icon: 'warning',
      iconColor: '#dc2626',
      bgColor: '#fee2e2',
      items: tacticalIntelligence?.hazards || [
        'Ferries cross the racing area - give way',
        'Shallow patch near the western mark',
        'Fishing nets occasionally present in practice area',
        'Commercial traffic uses main shipping channel',
      ],
    },
  ];

  const handleToggleCard = (cardId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshIntelligence?.();
    setIsRefreshing(false);
  };

  if (!venueId) return null;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name="bulb" size={16} color="#059669" />
        <ThemedText style={styles.compactText}>
          {categories[0].items[0] || 'Local racing intel available'}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb" size={20} color="#059669" />
          <ThemedText style={styles.headerTitle}>Racing Intel</ThemedText>
        </View>
        <View style={styles.headerRight}>
          {tacticalIntelligence && (
            <View style={styles.aiIndicator}>
              <Ionicons name="sparkles" size={12} color="#8b5cf6" />
              <ThemedText style={styles.aiIndicatorText}>AI</ThemedText>
            </View>
          )}
          <TouchableOpacity 
            onPress={handleRefresh} 
            style={styles.refreshButton} 
            disabled={isLoading || isRefreshing}
          >
            {isLoading || isRefreshing ? (
              <ActivityIndicator size="small" color="#6b7280" />
            ) : (
              <Ionicons name="refresh" size={18} color="#6b7280" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Intel Cards */}
      <View style={styles.intelList}>
        {categories.map(category => (
          <IntelCard
            key={category.id}
            category={category}
            isExpanded={expandedCards.has(category.id)}
            onToggle={() => handleToggleCard(category.id)}
          />
        ))}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={14} color="#9ca3af" />
        <ThemedText style={styles.disclaimerText}>
          Local intel based on typical conditions. Always assess current conditions before racing.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  aiIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  refreshButton: {
    padding: 6,
  },

  // Intel List
  intelList: {
    padding: 12,
    gap: 8,
  },
  intelCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  intelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  intelIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  intelContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  intelItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingLeft: 42,
  },
  intelBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  intelItemText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
    flex: 1,
  },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#9ca3af',
    lineHeight: 14,
    flex: 1,
  },

  // Compact
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  compactText: {
    fontSize: 13,
    color: '#4b5563',
    flex: 1,
  },
});

export default RacingIntelSection;

