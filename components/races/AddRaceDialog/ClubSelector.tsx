/**
 * ClubSelector Component
 *
 * Dropdown selector for clubs in the Add Race dialog.
 * Shows user's clubs (memberships + home clubs from boats).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { ChevronDown, Building2, Check, X, Star } from 'lucide-react-native';
import { useUserClubs, type UserClub } from '@/hooks/useUserClubs';

const COLORS = {
  primary: '#007AFF',
  label: '#000000',
  secondaryLabel: '#8E8E93',
  tertiaryLabel: '#C7C7CC',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  separator: '#C6C6C8',
  green: '#34C759',
  gold: '#FFD700',
};

interface ClubSelectorProps {
  /** Currently selected club ID */
  selectedClubId?: string | null;
  /** Called when club is selected - provides club ID and name */
  onSelect: (clubId: string | null, clubName: string | null) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field was AI-extracted */
  aiExtracted?: boolean;
  /** Label for the field */
  label?: string;
  /** Whether to show as half-width */
  halfWidth?: boolean;
}

export function ClubSelector({
  selectedClubId,
  onSelect,
  placeholder = 'Select club',
  aiExtracted = false,
  label = 'Club',
  halfWidth = false,
}: ClubSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { clubs, isLoading, hasClubs } = useUserClubs();

  // Find the selected club
  const selectedClub = clubs.find((c) => c.id === selectedClubId);

  const handleSelectClub = (club: UserClub | null) => {
    if (club) {
      onSelect(club.id, club.name);
    } else {
      onSelect(null, null);
    }
    setModalVisible(false);
  };

  const formatClubDisplay = (club: UserClub) => {
    if (club.short_name && club.short_name !== club.name) {
      return club.short_name;
    }
    return club.name;
  };

  return (
    <View style={[styles.container, halfWidth && styles.halfWidth]}>
      {/* Label */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {aiExtracted && <View style={styles.aiDot} />}
      </View>

      {/* Selector Button */}
      <Pressable
        style={({ pressed }) => [
          styles.selectorButton,
          pressed && styles.selectorButtonPressed,
        ]}
        onPress={() => setModalVisible(true)}
      >
        {selectedClub ? (
          <View style={styles.selectedContent}>
            {selectedClub.logo_url ? (
              <Image
                source={{ uri: selectedClub.logo_url }}
                style={styles.clubLogo}
              />
            ) : (
              <Building2 size={16} color={COLORS.primary} />
            )}
            <Text style={styles.selectedText} numberOfLines={1}>
              {formatClubDisplay(selectedClub)}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>{placeholder}</Text>
        )}
        <ChevronDown size={16} color={COLORS.secondaryLabel} />
      </Pressable>

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <X size={24} color={COLORS.secondaryLabel} />
            </Pressable>
            <Text style={styles.modalTitle}>Select Club</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading clubs...</Text>
            </View>
          ) : !hasClubs ? (
            <View style={styles.emptyContainer}>
              <Building2 size={48} color={COLORS.tertiaryLabel} />
              <Text style={styles.emptyTitle}>No Clubs Found</Text>
              <Text style={styles.emptyDescription}>
                Join a club or set a home club on your boat to select it here.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.clubList}>
              {/* Clear selection option */}
              <Pressable
                style={({ pressed }) => [
                  styles.clubItem,
                  pressed && styles.clubItemPressed,
                ]}
                onPress={() => handleSelectClub(null)}
              >
                <View style={styles.clubInfo}>
                  <Text style={styles.clubNameClear}>No club selected</Text>
                </View>
                {!selectedClubId && (
                  <Check size={20} color={COLORS.primary} />
                )}
              </Pressable>

              {/* Club list */}
              {clubs.map((club) => (
                <Pressable
                  key={club.id}
                  style={({ pressed }) => [
                    styles.clubItem,
                    pressed && styles.clubItemPressed,
                    club.id === selectedClubId && styles.clubItemSelected,
                  ]}
                  onPress={() => handleSelectClub(club)}
                >
                  <View style={styles.clubIconContainer}>
                    {club.logo_url ? (
                      <Image
                        source={{ uri: club.logo_url }}
                        style={styles.clubLogoLarge}
                      />
                    ) : (
                      <View style={styles.clubIcon}>
                        <Building2 size={24} color={COLORS.primary} />
                      </View>
                    )}
                    {club.isHomeClub && (
                      <View style={styles.homeBadge}>
                        <Star size={8} color="#FFF" fill="#FFF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.clubInfo}>
                    <Text style={styles.clubName}>{club.name}</Text>
                    <View style={styles.clubMeta}>
                      {club.city && (
                        <Text style={styles.clubLocation}>
                          {club.city}{club.country ? `, ${club.country}` : ''}
                        </Text>
                      )}
                      {(club.isMember || club.isHomeClub) && (
                        <View style={styles.badges}>
                          {club.isMember && (
                            <View style={styles.memberBadge}>
                              <Text style={styles.badgeText}>Member</Text>
                            </View>
                          )}
                          {club.isHomeClub && (
                            <View style={styles.homeClubBadge}>
                              <Text style={styles.badgeText}>Home</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                  {club.id === selectedClubId && (
                    <Check size={20} color={COLORS.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  halfWidth: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
    marginLeft: 6,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.separator,
  },
  selectorButtonPressed: {
    backgroundColor: COLORS.background,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  clubLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  selectedText: {
    fontSize: 15,
    color: COLORS.label,
    flex: 1,
  },
  placeholderText: {
    fontSize: 15,
    color: COLORS.tertiaryLabel,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  headerSpacer: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  emptyDescription: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
  },
  clubList: {
    flex: 1,
    padding: 16,
  },
  clubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  clubItemPressed: {
    backgroundColor: COLORS.background,
  },
  clubItemSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  clubIconContainer: {
    position: 'relative',
  },
  clubIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubLogoLarge: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  homeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondaryBackground,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.label,
  },
  clubNameClear: {
    fontSize: 16,
    color: COLORS.secondaryLabel,
  },
  clubMeta: {
    marginTop: 2,
  },
  clubLocation: {
    fontSize: 14,
    color: COLORS.secondaryLabel,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  memberBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  homeClubBadge: {
    backgroundColor: COLORS.gold + '30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
  },
});

export default ClubSelector;
