/**
 * IOSClientList - Contacts-Style Client List
 *
 * Apple Contacts-style client list:
 * - Alphabetical section headers
 * - Avatar, name, boat class, monthly value
 * - Pull-down search
 * - Index scrubber on right edge
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  SectionList,
  TextInput,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

// Types
interface Client {
  id: string;
  name: string;
  avatarUrl?: string;
  boatClass: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  monthlyValue: number;
  status: 'active' | 'inactive' | 'on_hold';
  lastSession?: Date;
  totalSessions: number;
}

interface IOSClientListProps {
  clients: Client[];
  onClientPress?: (client: Client) => void;
  onAddClient?: () => void;
  isLoading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Level badge configuration
function getLevelInfo(level: Client['level']): { color: string; label: string } {
  switch (level) {
    case 'beginner':
      return { color: IOS_COLORS.systemGreen, label: 'Beginner' };
    case 'intermediate':
      return { color: IOS_COLORS.systemOrange, label: 'Intermediate' };
    case 'advanced':
      return { color: IOS_COLORS.systemRed, label: 'Advanced' };
    case 'professional':
      return { color: IOS_COLORS.systemPurple, label: 'Pro' };
    default:
      return { color: IOS_COLORS.systemGray, label: level };
  }
}

// Status indicator color
function getStatusColor(status: Client['status']): string {
  switch (status) {
    case 'active':
      return IOS_COLORS.systemGreen;
    case 'inactive':
      return IOS_COLORS.systemGray;
    case 'on_hold':
      return IOS_COLORS.systemOrange;
    default:
      return IOS_COLORS.systemGray;
  }
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Client Row Component
interface ClientRowProps {
  client: Client;
  onPress: () => void;
}

function ClientRow({ client, onPress }: ClientRowProps) {
  const scale = useSharedValue(1);
  const levelInfo = getLevelInfo(client.level);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.clientRow, animatedStyle]}
      onPress={() => {
        triggerHaptic('impactLight');
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {client.avatarUrl ? (
          <Image source={{ uri: client.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: levelInfo.color }]}>
            <Text style={styles.avatarInitials}>{getInitials(client.name)}</Text>
          </View>
        )}
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(client.status) }]} />
      </View>

      {/* Content */}
      <View style={styles.clientContent}>
        <Text style={styles.clientName} numberOfLines={1}>
          {client.name}
        </Text>
        <View style={styles.clientMeta}>
          <Text style={styles.boatClass}>{client.boatClass}</Text>
          <View style={[styles.levelBadge, { backgroundColor: `${levelInfo.color}15` }]}>
            <Text style={[styles.levelText, { color: levelInfo.color }]}>
              {levelInfo.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Trailing */}
      <View style={styles.clientTrailing}>
        <Text style={styles.monthlyValue}>
          ${client.monthlyValue.toLocaleString()}
        </Text>
        <Text style={styles.monthlyLabel}>monthly</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={IOS_COLORS.systemGray3} />
    </AnimatedPressable>
  );
}

// Section Header Component
interface SectionHeaderProps {
  title: string;
}

function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

// Index Scrubber Component
interface IndexScrubberProps {
  letters: string[];
  onLetterPress: (letter: string) => void;
}

function IndexScrubber({ letters, onLetterPress }: IndexScrubberProps) {
  return (
    <View style={styles.indexScrubber}>
      {letters.map((letter) => (
        <Pressable
          key={letter}
          style={styles.indexLetter}
          onPress={() => {
            triggerHaptic('selection');
            onLetterPress(letter);
          }}
        >
          <Text style={styles.indexLetterText}>{letter}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// Main Component
export function IOSClientList({
  clients,
  onClientPress,
  onAddClient,
  isLoading = false,
}: IOSClientListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const sectionListRef = useRef<SectionList>(null);

  // Filter clients by search query
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.boatClass.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  // Group clients by first letter
  const sections = useMemo(() => {
    const grouped: Record<string, Client[]> = {};

    filteredClients
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((client) => {
        const letter = client.name[0].toUpperCase();
        if (!grouped[letter]) {
          grouped[letter] = [];
        }
        grouped[letter].push(client);
      });

    return Object.keys(grouped)
      .sort()
      .map((letter) => ({
        title: letter,
        data: grouped[letter],
      }));
  }, [filteredClients]);

  // Get all section letters for scrubber
  const sectionLetters = sections.map((s) => s.title);

  // Handle letter press from scrubber
  const handleLetterPress = (letter: string) => {
    const sectionIndex = sections.findIndex((s) => s.title === letter);
    if (sectionIndex >= 0 && sectionListRef.current) {
      sectionListRef.current.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: true,
      });
    }
  };

  // Calculate totals
  const totalMonthly = clients.reduce((sum, c) => sum + c.monthlyValue, 0);
  const activeCount = clients.filter((c) => c.status === 'active').length;

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={IOS_COLORS.secondaryLabel} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={IOS_COLORS.systemGray3} />
            </Pressable>
          )}
        </View>
        {onAddClient && (
          <Pressable
            style={styles.addButton}
            onPress={() => {
              triggerHaptic('impactLight');
              onAddClient();
            }}
          >
            <Ionicons name="add" size={24} color={IOS_COLORS.systemBlue} />
          </Pressable>
        )}
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{clients.length}</Text>
          <Text style={styles.summaryLabel}>Total Clients</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>${totalMonthly.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Monthly</Text>
        </View>
      </View>

      {/* Client List */}
      <View style={styles.listContainer}>
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClientRow
              client={item}
              onPress={() => onClientPress?.(item)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} />
          )}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={48} color={IOS_COLORS.systemGray3} />
              </View>
              <Text style={styles.emptyTitle}>No Clients Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try a different search' : 'Add your first client to get started'}
              </Text>
              {!searchQuery && onAddClient && (
                <Pressable
                  style={styles.addClientButton}
                  onPress={() => {
                    triggerHaptic('impactLight');
                    onAddClient();
                  }}
                >
                  <Ionicons name="person-add" size={18} color="#FFFFFF" />
                  <Text style={styles.addClientButtonText}>Add Client</Text>
                </Pressable>
              )}
            </View>
          }
          getItemLayout={(data, index) => ({
            length: 72,
            offset: 72 * index,
            index,
          })}
        />

        {/* Index Scrubber */}
        {sectionLetters.length > 0 && (
          <IndexScrubber
            letters={sectionLetters}
            onLetterPress={handleLetterPress}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    gap: IOS_SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    paddingHorizontal: IOS_SPACING.md,
    height: 40,
    gap: IOS_SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    color: IOS_COLORS.label,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Summary Bar
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    marginVertical: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: IOS_COLORS.separator,
  },
  summaryValue: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  summaryLabel: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },

  // List
  listContainer: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingBottom: IOS_SPACING.xxxl,
  },

  // Section Header
  sectionHeader: {
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.xs,
  },
  sectionHeaderText: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },

  // Client Row
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  clientContent: {
    flex: 1,
    minWidth: 0,
  },
  clientName: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  clientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    marginTop: 4,
  },
  boatClass: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.secondaryLabel,
  },
  levelBadge: {
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelText: {
    fontSize: IOS_TYPOGRAPHY.caption2.fontSize,
    fontWeight: '600',
  },
  clientTrailing: {
    alignItems: 'flex-end',
  },
  monthlyValue: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  monthlyLabel: {
    fontSize: IOS_TYPOGRAPHY.caption2.fontSize,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
  },

  // Index Scrubber
  indexScrubber: {
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.lg,
  },
  indexLetter: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  indexLetterText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: IOS_SPACING.xxxl * 2,
    paddingHorizontal: IOS_SPACING.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: IOS_COLORS.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: IOS_SPACING.lg,
  },
  emptyTitle: {
    fontSize: IOS_TYPOGRAPHY.title3.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.xs,
  },
  emptySubtitle: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    marginBottom: IOS_SPACING.lg,
  },
  addClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemBlue,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    borderRadius: IOS_RADIUS.md,
  },
  addClientButtonText: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default IOSClientList;
