/**
 * CommunityTipsCard
 * 
 * Displays and allows submission of community-contributed venue knowledge.
 * Shows tips from local sailors that feed into AI strategy generation.
 */

import { useAuth } from '@/providers/AuthProvider';
import {
    CreateTipInput,
    Season,
    TidePhase,
    TIP_CATEGORIES,
    TipCategory,
    VenueCommunityTip,
    venueCommunityTipsService,
} from '@/services/venue/VenueCommunityTipsService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CommunityTipsCardProps {
  venueId: string;
  venueName: string;
  compact?: boolean; // Show condensed view
  onTipAdded?: () => void;
}

export function CommunityTipsCard({
  venueId,
  venueName,
  compact = false,
  onTipAdded,
}: CommunityTipsCardProps) {
  const { user } = useAuth();
  const [tips, setTips] = useState<VenueCommunityTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TipCategory | null>(null);
  const [expanded, setExpanded] = useState(!compact);

  const loadTips = useCallback(async () => {
    try {
      setLoading(true);
      const data = await venueCommunityTipsService.getTipsForVenue(venueId, {
        includeUserVotes: true,
        limit: compact ? 5 : 20,
      });
      setTips(data);
    } catch (error) {
      console.error('Failed to load community tips:', error);
    } finally {
      setLoading(false);
    }
  }, [venueId, compact]);

  useEffect(() => {
    loadTips();
  }, [loadTips]);

  const handleVote = async (tipId: string, voteType: 'up' | 'down') => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to vote on tips.');
      return;
    }

    try {
      await venueCommunityTipsService.voteTip(tipId, voteType);
      // Optimistic update
      setTips(prev =>
        prev.map(tip => {
          if (tip.id !== tipId) return tip;
          
          const wasUp = tip.user_vote === 'up';
          const wasDown = tip.user_vote === 'down';
          const nowUp = voteType === 'up' && !wasUp;
          const nowDown = voteType === 'down' && !wasDown;

          return {
            ...tip,
            user_vote: (wasUp && voteType === 'up') || (wasDown && voteType === 'down') ? null : voteType,
            upvotes: tip.upvotes + (nowUp ? 1 : 0) + (wasUp ? -1 : 0),
            downvotes: tip.downvotes + (nowDown ? 1 : 0) + (wasDown ? -1 : 0),
          };
        })
      );
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleTipAdded = () => {
    setShowAddModal(false);
    loadTips();
    onTipAdded?.();
  };

  const getCategoryIcon = (category: TipCategory): string => {
    return TIP_CATEGORIES[category]?.icon ?? 'help-circle';
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'expert_verified':
        return { icon: 'check-decagram', color: '#10B981', label: 'Expert Verified' };
      case 'community_verified':
        return { icon: 'check-circle', color: '#3B82F6', label: 'Community Verified' };
      default:
        return null;
    }
  };

  const renderTip = (tip: VenueCommunityTip) => {
    const verification = getVerificationBadge(tip.verification_status);
    const score = (tip.upvotes ?? 0) - (tip.downvotes ?? 0);

    return (
      <View key={tip.id} style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <View style={styles.tipCategoryBadge}>
            <MaterialCommunityIcons
              name={getCategoryIcon(tip.category) as any}
              size={14}
              color="#64748B"
            />
            <Text style={styles.tipCategoryText}>
              {TIP_CATEGORIES[tip.category]?.label ?? tip.category}
            </Text>
          </View>
          {verification && (
            <View style={[styles.verificationBadge, { backgroundColor: verification.color + '20' }]}>
              <MaterialCommunityIcons
                name={verification.icon as any}
                size={12}
                color={verification.color}
              />
              <Text style={[styles.verificationText, { color: verification.color }]}>
                {verification.label}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.tipTitle}>{tip.title}</Text>
        <Text style={styles.tipDescription}>{tip.description}</Text>

        {/* Conditions */}
        {(tip.wind_direction_min != null || tip.wind_speed_min != null || tip.tide_phase) && (
          <View style={styles.conditionsRow}>
            {tip.wind_direction_min != null && tip.wind_direction_max != null && (
              <View style={styles.conditionChip}>
                <MaterialCommunityIcons name="compass" size={12} color="#64748B" />
                <Text style={styles.conditionText}>
                  {tip.wind_direction_min}°-{tip.wind_direction_max}°
                </Text>
              </View>
            )}
            {tip.wind_speed_min != null && tip.wind_speed_max != null && (
              <View style={styles.conditionChip}>
                <MaterialCommunityIcons name="weather-windy" size={12} color="#64748B" />
                <Text style={styles.conditionText}>
                  {tip.wind_speed_min}-{tip.wind_speed_max}kt
                </Text>
              </View>
            )}
            {tip.tide_phase && tip.tide_phase !== 'any' && (
              <View style={styles.conditionChip}>
                <MaterialCommunityIcons name="waves" size={12} color="#64748B" />
                <Text style={styles.conditionText}>{tip.tide_phase}</Text>
              </View>
            )}
          </View>
        )}

        {/* Voting */}
        <View style={styles.tipFooter}>
          <View style={styles.voteContainer}>
            <TouchableOpacity
              style={[styles.voteButton, tip.user_vote === 'up' && styles.voteButtonActive]}
              onPress={() => handleVote(tip.id, 'up')}
            >
              <MaterialCommunityIcons
                name="thumb-up"
                size={16}
                color={tip.user_vote === 'up' ? '#10B981' : '#94A3B8'}
              />
            </TouchableOpacity>
            <Text style={[styles.scoreText, score > 0 && styles.scorePositive, score < 0 && styles.scoreNegative]}>
              {score > 0 ? '+' : ''}{score}
            </Text>
            <TouchableOpacity
              style={[styles.voteButton, tip.user_vote === 'down' && styles.voteButtonActive]}
              onPress={() => handleVote(tip.id, 'down')}
            >
              <MaterialCommunityIcons
                name="thumb-down"
                size={16}
                color={tip.user_vote === 'down' ? '#EF4444' : '#94A3B8'}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.usageText}>
            Used in {tip.races_applied ?? 0} strategies
          </Text>
        </View>
      </View>
    );
  };

  if (compact && !expanded) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={() => setExpanded(true)}>
        <View style={styles.compactHeader}>
          <MaterialCommunityIcons name="account-group" size={20} color="#3B82F6" />
          <Text style={styles.compactTitle}>Community Local Knowledge</Text>
          <View style={styles.compactBadge}>
            <Text style={styles.compactBadgeText}>{tips.length} tips</Text>
          </View>
        </View>
        <Text style={styles.compactHint}>Tap to view tips from local sailors</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="account-group" size={24} color="#3B82F6" />
          <View>
            <Text style={styles.title}>Community Local Knowledge</Text>
            <Text style={styles.subtitle}>Tips from sailors who race here</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {Object.entries(TIP_CATEGORIES).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={[styles.categoryChip, selectedCategory === key && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(key as TipCategory)}
          >
            <MaterialCommunityIcons
              name={value.icon as any}
              size={14}
              color={selectedCategory === key ? '#FFF' : '#64748B'}
            />
            <Text style={[styles.categoryChipText, selectedCategory === key && styles.categoryChipTextActive]}>
              {value.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tips List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#3B82F6" />
        </View>
      ) : tips.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="lightbulb-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No tips yet for this venue</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to share local knowledge!
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.emptyButtonText}>Share a Tip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.tipsContainer}>
          {tips
            .filter(t => !selectedCategory || t.category === selectedCategory)
            .map(renderTip)}
        </View>
      )}

      {/* Add Tip Modal */}
      <AddTipModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleTipAdded}
        venueId={venueId}
        venueName={venueName}
      />
    </View>
  );
}

// ============================================================================
// ADD TIP MODAL
// ============================================================================

interface AddTipModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  venueId: string;
  venueName: string;
}

function AddTipModal({ visible, onClose, onSuccess, venueId, venueName }: AddTipModalProps) {
  const [category, setCategory] = useState<TipCategory>('tactical_tips');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [windDirMin, setWindDirMin] = useState('');
  const [windDirMax, setWindDirMax] = useState('');
  const [windSpeedMin, setWindSpeedMin] = useState('');
  const [windSpeedMax, setWindSpeedMax] = useState('');
  const [tidePhase, setTidePhase] = useState<TidePhase>('any');
  const [season, setSeason] = useState<Season>('any');
  const [showConditions, setShowConditions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setCategory('tactical_tips');
    setTitle('');
    setDescription('');
    setWindDirMin('');
    setWindDirMax('');
    setWindSpeedMin('');
    setWindSpeedMax('');
    setTidePhase('any');
    setSeason('any');
    setShowConditions(false);
  };

  const handleSubmit = async () => {
    console.log('[CommunityTipsCard] handleSubmit called', { title, description, venueId, category });
    
    if (!title.trim() || !description.trim()) {
      Alert.alert('Required Fields', 'Please enter a title and description.');
      return;
    }

    try {
      setSubmitting(true);
      console.log('[CommunityTipsCard] Creating tip...');

      const input: CreateTipInput = {
        venue_id: venueId,
        category,
        title: title.trim(),
        description: description.trim(),
        wind_direction_min: windDirMin ? parseInt(windDirMin) : undefined,
        wind_direction_max: windDirMax ? parseInt(windDirMax) : undefined,
        wind_speed_min: windSpeedMin ? parseInt(windSpeedMin) : undefined,
        wind_speed_max: windSpeedMax ? parseInt(windSpeedMax) : undefined,
        tide_phase: tidePhase !== 'any' ? tidePhase : undefined,
        season: season !== 'any' ? season : undefined,
      };

      console.log('[CommunityTipsCard] Input:', input);
      const result = await venueCommunityTipsService.createTip(input);
      console.log('[CommunityTipsCard] Tip created successfully:', result);
      
      // Alert doesn't work well on web, so just close and reset
      if (Platform.OS === 'web') {
        window.alert('Tip Shared! 🎉\n\nThanks for sharing your local knowledge. Other sailors will benefit from your experience!');
        resetForm();
        onSuccess();
      } else {
        Alert.alert(
          'Tip Shared! 🎉',
          'Thanks for sharing your local knowledge. Other sailors will benefit from your experience!',
          [{ text: 'OK', onPress: () => { resetForm(); onSuccess(); } }]
        );
      }
    } catch (error: any) {
      console.error('Failed to create tip:', error);
      const message = error?.message || error?.toString() || 'Unknown error';
      Alert.alert('Error', `Failed to share tip: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <MaterialCommunityIcons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Share Local Knowledge</Text>
          <Pressable
            onPress={() => {
              console.log('[CommunityTipsCard] Share button pressed!');
              handleSubmit();
            }}
            disabled={submitting || !title.trim() || !description.trim()}
            style={({ pressed }) => [
              styles.modalSubmitButton,
              (!title.trim() || !description.trim()) && styles.modalSubmitButtonDisabled,
              pressed && { opacity: 0.8 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.modalSubmitText}>Share</Text>
            )}
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.modalVenueName}>📍 {venueName}</Text>

          {/* Category Selection */}
          <Text style={styles.inputLabel}>Category *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categorySelector}
          >
            {Object.entries(TIP_CATEGORIES).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.categorySelectorItem,
                  category === key && styles.categorySelectorItemActive,
                ]}
                onPress={() => setCategory(key as TipCategory)}
              >
                <MaterialCommunityIcons
                  name={value.icon as any}
                  size={20}
                  color={category === key ? '#3B82F6' : '#64748B'}
                />
                <Text
                  style={[
                    styles.categorySelectorText,
                    category === key && styles.categorySelectorTextActive,
                  ]}
                >
                  {value.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Title */}
          <Text style={styles.inputLabel}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Afternoon seabreeze timing"
            placeholderTextColor="#94A3B8"
            maxLength={100}
          />

          {/* Description */}
          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Share your local knowledge... What should sailors know about racing here?"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>

          {/* Conditions Toggle */}
          <TouchableOpacity
            style={styles.conditionsToggle}
            onPress={() => setShowConditions(!showConditions)}
          >
            <MaterialCommunityIcons
              name={showConditions ? 'chevron-down' : 'chevron-right'}
              size={20}
              color="#64748B"
            />
            <Text style={styles.conditionsToggleText}>
              Specify when this applies (optional)
            </Text>
          </TouchableOpacity>

          {showConditions && (
            <View style={styles.conditionsForm}>
              {/* Wind Direction */}
              <Text style={styles.conditionLabel}>Wind Direction Range</Text>
              <View style={styles.rangeRow}>
                <TextInput
                  style={styles.rangeInput}
                  value={windDirMin}
                  onChangeText={setWindDirMin}
                  placeholder="Min °"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.rangeSeparator}>to</Text>
                <TextInput
                  style={styles.rangeInput}
                  value={windDirMax}
                  onChangeText={setWindDirMax}
                  placeholder="Max °"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>

              {/* Wind Speed */}
              <Text style={styles.conditionLabel}>Wind Speed Range (knots)</Text>
              <View style={styles.rangeRow}>
                <TextInput
                  style={styles.rangeInput}
                  value={windSpeedMin}
                  onChangeText={setWindSpeedMin}
                  placeholder="Min"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.rangeSeparator}>to</Text>
                <TextInput
                  style={styles.rangeInput}
                  value={windSpeedMax}
                  onChangeText={setWindSpeedMax}
                  placeholder="Max"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>

              {/* Tide Phase */}
              <Text style={styles.conditionLabel}>Tide Phase</Text>
              <View style={styles.optionRow}>
                {(['any', 'flood', 'ebb', 'slack_high', 'slack_low'] as TidePhase[]).map((phase) => (
                  <TouchableOpacity
                    key={phase}
                    style={[styles.optionChip, tidePhase === phase && styles.optionChipActive]}
                    onPress={() => setTidePhase(phase)}
                  >
                    <Text style={[styles.optionChipText, tidePhase === phase && styles.optionChipTextActive]}>
                      {phase === 'any' ? 'Any' : phase.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Season */}
              <Text style={styles.conditionLabel}>Season</Text>
              <View style={styles.optionRow}>
                {(['any', 'spring', 'summer', 'fall', 'winter'] as Season[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.optionChip, season === s && styles.optionChipActive]}
                    onPress={() => setSeason(s)}
                  >
                    <Text style={[styles.optionChipText, season === s && styles.optionChipTextActive]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.modalFooterSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryFilterContent: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    gap: 6,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 12,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  tipsContainer: {
    gap: 12,
  },
  tipCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tipCategoryText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  verificationText: {
    fontSize: 10,
    fontWeight: '600',
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  tipDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  conditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  conditionText: {
    fontSize: 11,
    color: '#64748B',
  },
  tipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voteButton: {
    padding: 6,
    borderRadius: 6,
  },
  voteButtonActive: {
    backgroundColor: '#F1F5F9',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    minWidth: 24,
    textAlign: 'center',
  },
  scorePositive: {
    color: '#10B981',
  },
  scoreNegative: {
    color: '#EF4444',
  },
  usageText: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // Compact card
  compactCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  compactBadge: {
    backgroundColor: '#3B82F620',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  compactBadgeText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600',
  },
  compactHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginLeft: 28,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalSubmitButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSubmitButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  modalSubmitText: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalVenueName: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  categorySelector: {
    marginBottom: 8,
  },
  categorySelectorItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginRight: 10,
    minWidth: 80,
    gap: 6,
  },
  categorySelectorItemActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  categorySelectorText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  categorySelectorTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  conditionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  conditionsToggleText: {
    fontSize: 14,
    color: '#64748B',
  },
  conditionsForm: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  conditionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    marginTop: 12,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rangeInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlign: 'center',
  },
  rangeSeparator: {
    color: '#64748B',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  optionChipText: {
    fontSize: 12,
    color: '#64748B',
  },
  optionChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalFooterSpacer: {
    height: 40,
  },
});

