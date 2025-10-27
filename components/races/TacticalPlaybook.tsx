/**
 * Tactical Playbook
 *
 * Interactive, searchable reference for championship racing tactics.
 * Combines theory, execution techniques, and champion examples.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { TACTICAL_PLAYBOOK_DATA } from '@/data/tacticalPlaybook';

export interface TacticalTactic {
  id: string;
  name: string;
  category: 'start' | 'upwind' | 'downwind' | 'mark_rounding' | 'covering' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  theory: string;
  execution: string;
  championExample?: string;
  whenToUse: string[];
  commonMistakes?: string[];
  relatedTactics?: string[];
}

export interface TacticalPlaybookProps {
  onClose?: () => void;
  initialCategory?: TacticalTactic['category'];
  highlightTacticId?: string;
}

export function TacticalPlaybook({
  onClose,
  initialCategory,
  highlightTacticId,
}: TacticalPlaybookProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TacticalTactic['category'] | 'all'>(
    initialCategory || 'all'
  );
  const [selectedTactic, setSelectedTactic] = useState<TacticalTactic | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  /**
   * Filter and search tactics
   */
  const filteredTactics = useMemo(() => {
    let tactics = TACTICAL_PLAYBOOK_DATA;

    // Filter by category
    if (selectedCategory !== 'all') {
      tactics = tactics.filter((t) => t.category === selectedCategory);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      tactics = tactics.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.theory.toLowerCase().includes(query) ||
          t.execution.toLowerCase().includes(query) ||
          t.whenToUse.some((w) => w.toLowerCase().includes(query))
      );
    }

    return tactics;
  }, [searchQuery, selectedCategory]);

  /**
   * Toggle bookmark
   */
  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /**
   * Get difficulty color
   */
  const getDifficultyColor = (difficulty: TacticalTactic['difficulty']): string => {
    switch (difficulty) {
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#FFA500';
      case 'advanced':
        return '#FF5722';
      case 'expert':
        return '#9C27B0';
    }
  };

  /**
   * Get category icon
   */
  const getCategoryIcon = (category: TacticalTactic['category']): string => {
    switch (category) {
      case 'start':
        return '🏁';
      case 'upwind':
        return '⛵';
      case 'downwind':
        return '🌊';
      case 'mark_rounding':
        return '🎯';
      case 'covering':
        return '🛡️';
      case 'general':
        return '📚';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Tactical Playbook</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerSubtitle}>
          {filteredTactics.length} tactics • Championship racing reference
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tactics, situations, techniques..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <View style={styles.categoryContainer}>
          <CategoryButton
            label="All"
            icon="📖"
            active={selectedCategory === 'all'}
            onPress={() => setSelectedCategory('all')}
          />
          <CategoryButton
            label="Start"
            icon="🏁"
            active={selectedCategory === 'start'}
            onPress={() => setSelectedCategory('start')}
          />
          <CategoryButton
            label="Upwind"
            icon="⛵"
            active={selectedCategory === 'upwind'}
            onPress={() => setSelectedCategory('upwind')}
          />
          <CategoryButton
            label="Downwind"
            icon="🌊"
            active={selectedCategory === 'downwind'}
            onPress={() => setSelectedCategory('downwind')}
          />
          <CategoryButton
            label="Marks"
            icon="🎯"
            active={selectedCategory === 'mark_rounding'}
            onPress={() => setSelectedCategory('mark_rounding')}
          />
          <CategoryButton
            label="Covering"
            icon="🛡️"
            active={selectedCategory === 'covering'}
            onPress={() => setSelectedCategory('covering')}
          />
        </View>
      </ScrollView>

      {/* Tactics List */}
      <ScrollView style={styles.tacticsScroll} contentContainerStyle={styles.tacticsContent}>
        {filteredTactics.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateTitle}>No tactics found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or category filter
            </Text>
          </View>
        ) : (
          filteredTactics.map((tactic) => (
            <TacticCard
              key={tactic.id}
              tactic={tactic}
              isBookmarked={bookmarkedIds.has(tactic.id)}
              isHighlighted={tactic.id === highlightTacticId}
              onPress={() => setSelectedTactic(tactic)}
              onBookmark={() => toggleBookmark(tactic.id)}
              getDifficultyColor={getDifficultyColor}
              getCategoryIcon={getCategoryIcon}
            />
          ))
        )}
      </ScrollView>

      {/* Tactic Detail Modal */}
      {selectedTactic && (
        <TacticDetailModal
          tactic={selectedTactic}
          isBookmarked={bookmarkedIds.has(selectedTactic.id)}
          onClose={() => setSelectedTactic(null)}
          onBookmark={() => toggleBookmark(selectedTactic.id)}
          getDifficultyColor={getDifficultyColor}
          getCategoryIcon={getCategoryIcon}
        />
      )}
    </View>
  );
}

/**
 * Category Button
 */
function CategoryButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.categoryButton, active && styles.categoryButtonActive]}
      onPress={onPress}
    >
      <Text style={styles.categoryButtonIcon}>{icon}</Text>
      <Text style={[styles.categoryButtonText, active && styles.categoryButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Tactic Card
 */
function TacticCard({
  tactic,
  isBookmarked,
  isHighlighted,
  onPress,
  onBookmark,
  getDifficultyColor,
  getCategoryIcon,
}: {
  tactic: TacticalTactic;
  isBookmarked: boolean;
  isHighlighted: boolean;
  onPress: () => void;
  onBookmark: () => void;
  getDifficultyColor: (d: TacticalTactic['difficulty']) => string;
  getCategoryIcon: (c: TacticalTactic['category']) => string;
}) {
  return (
    <TouchableOpacity
      style={[styles.tacticCard, isHighlighted && styles.tacticCardHighlighted]}
      onPress={onPress}
    >
      <View style={styles.tacticCardHeader}>
        <View style={styles.tacticCardHeaderLeft}>
          <Text style={styles.tacticCardIcon}>{getCategoryIcon(tactic.category)}</Text>
          <View>
            <Text style={styles.tacticCardName}>{tactic.name}</Text>
            <View style={styles.tacticCardMeta}>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(tactic.difficulty) },
                ]}
              >
                <Text style={styles.difficultyBadgeText}>{tactic.difficulty}</Text>
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={onBookmark} style={styles.bookmarkButton}>
          <Text style={styles.bookmarkIcon}>{isBookmarked ? '⭐' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.tacticCardTheory} numberOfLines={2}>
        {tactic.theory}
      </Text>

      <View style={styles.tacticCardFooter}>
        <Text style={styles.tacticCardFooterText}>Tap to view details →</Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Tactic Detail Modal
 */
function TacticDetailModal({
  tactic,
  isBookmarked,
  onClose,
  onBookmark,
  getDifficultyColor,
  getCategoryIcon,
}: {
  tactic: TacticalTactic;
  isBookmarked: boolean;
  onClose: () => void;
  onBookmark: () => void;
  getDifficultyColor: (d: TacticalTactic['difficulty']) => string;
  getCategoryIcon: (c: TacticalTactic['category']) => string;
}) {
  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderLeft}>
            <Text style={styles.modalIcon}>{getCategoryIcon(tactic.category)}</Text>
            <View>
              <Text style={styles.modalTitle}>{tactic.name}</Text>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(tactic.difficulty) },
                ]}
              >
                <Text style={styles.difficultyBadgeText}>{tactic.difficulty}</Text>
              </View>
            </View>
          </View>
          <View style={styles.modalHeaderRight}>
            <TouchableOpacity onPress={onBookmark} style={styles.modalBookmarkButton}>
              <Text style={styles.modalBookmarkIcon}>{isBookmarked ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Theory Section */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>📚 Theory</Text>
            <Text style={styles.modalSectionText}>{tactic.theory}</Text>
          </View>

          {/* Execution Section */}
          <View style={[styles.modalSection, styles.executionSection]}>
            <Text style={styles.modalSectionTitle}>⚙️ Execution</Text>
            <Text style={styles.modalSectionText}>{tactic.execution}</Text>
          </View>

          {/* Champion Example */}
          {tactic.championExample && (
            <View style={[styles.modalSection, styles.championSection]}>
              <Text style={styles.modalSectionTitle}>🏅 Championship Example</Text>
              <Text style={[styles.modalSectionText, styles.championText]}>
                {tactic.championExample}
              </Text>
            </View>
          )}

          {/* When to Use */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>🎯 When to Use</Text>
            {tactic.whenToUse.map((situation, index) => (
              <View key={index} style={styles.bulletPoint}>
                <Text style={styles.bulletPointDot}>•</Text>
                <Text style={styles.bulletPointText}>{situation}</Text>
              </View>
            ))}
          </View>

          {/* Common Mistakes */}
          {tactic.commonMistakes && tactic.commonMistakes.length > 0 && (
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>⚠️ Common Mistakes</Text>
              {tactic.commonMistakes.map((mistake, index) => (
                <View key={index} style={styles.bulletPoint}>
                  <Text style={styles.bulletPointDot}>•</Text>
                  <Text style={styles.bulletPointText}>{mistake}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Related Tactics */}
          {tactic.relatedTactics && tactic.relatedTactics.length > 0 && (
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>🔗 Related Tactics</Text>
              {tactic.relatedTactics.map((related, index) => (
                <View key={index} style={styles.relatedTacticTag}>
                  <Text style={styles.relatedTacticText}>{related}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999',
  },
  categoryScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  tacticsScroll: {
    flex: 1,
  },
  tacticsContent: {
    padding: 16,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  tacticCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tacticCardHighlighted: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  tacticCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tacticCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tacticCardIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  tacticCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  tacticCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  difficultyBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  bookmarkButton: {
    padding: 4,
  },
  bookmarkIcon: {
    fontSize: 24,
  },
  tacticCardTheory: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  tacticCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  tacticCardFooterText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  modalHeaderRight: {
    flexDirection: 'row',
    gap: 8,
  },
  modalBookmarkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBookmarkIcon: {
    fontSize: 24,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
  },
  modalSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  executionSection: {
    backgroundColor: '#F0F4FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  championSection: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  modalSectionText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },
  championText: {
    fontStyle: 'italic',
    color: '#5D4037',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletPointDot: {
    fontSize: 15,
    color: '#007AFF',
    marginRight: 8,
    marginTop: 2,
  },
  bulletPointText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },
  relatedTacticTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  relatedTacticText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
