/**
 * InterestSwitcher — dropdown/bottom-sheet for switching the active interest.
 *
 * Shows in the NavigationHeader. Each interest renders its accent color dot,
 * name, and a checkmark for the currently selected interest.
 * Users can browse an interest's catalog page or switch their active interest.
 */

import { useInterest } from '@/providers/InterestProvider'
import type { Interest, DomainWithInterests } from '@/providers/InterestProvider'
import { router } from 'expo-router'
import { showConfirm } from '@/lib/utils/crossPlatformAlert'
import React, { useMemo, useState } from 'react'
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

/** Group a list of interests by their parent domain, preserving domain order. */
function groupByDomain(
  interests: Interest[],
  groupedInterests: DomainWithInterests[],
): { domain: Interest | null; interests: Interest[] }[] {
  const slugSet = new Set(interests.map((i) => i.slug))
  const groups: { domain: Interest | null; interests: Interest[] }[] = []

  for (const group of groupedInterests) {
    const matching = group.interests.filter((i) => slugSet.has(i.slug))
    if (matching.length > 0) {
      groups.push({ domain: group.domain, interests: matching })
    }
  }

  // Any interests not matched to a domain group
  const grouped = new Set(groups.flatMap((g) => g.interests.map((i) => i.slug)))
  const ungrouped = interests.filter((i) => !grouped.has(i.slug))
  if (ungrouped.length > 0) {
    groups.push({ domain: null, interests: ungrouped })
  }

  return groups
}

export function InterestSwitcher() {
  const { currentInterest, userInterests, allInterests, groupedInterests, switchInterest, removeInterest, loading } = useInterest()
  const [open, setOpen] = useState(false)

  // Group user interests by domain
  const userGroups = useMemo(
    () => groupByDomain(userInterests, groupedInterests),
    [userInterests, groupedInterests],
  )

  // Interests the user hasn't added yet, grouped by domain
  const otherInterests = useMemo(
    () => allInterests.filter((ai) => !userInterests.some((ui) => ui.slug === ai.slug)),
    [allInterests, userInterests],
  )
  const otherGroups = useMemo(
    () => groupByDomain(otherInterests, groupedInterests),
    [otherInterests, groupedInterests],
  )

  if (loading || userInterests.length === 0) return null

  const handleSelect = async (interest: Interest) => {
    if (interest.slug !== currentInterest?.slug) {
      await switchInterest(interest.slug)
    }
    setOpen(false)
  }

  const handleBrowse = (interest: Interest) => {
    setOpen(false)
    router.push(`/${interest.slug}` as any)
  }

  const handleRemove = (interest: Interest) => {
    showConfirm(
      'Remove Interest',
      `Remove ${interest.name} from your interests? You can add it back anytime.`,
      async () => {
        await removeInterest(interest.slug)
      },
    )
  }

  const handleExploreMore = () => {
    setOpen(false)
    router.push('/interests' as any)
  }

  const renderInterestRow = (interest: Interest, isUserSection: boolean) => {
    const isActive = interest.slug === currentInterest?.slug
    if (isUserSection) {
      return (
        <View key={interest.id} style={[styles.row, isActive && styles.rowActive]}>
          <TouchableOpacity
            style={styles.rowMain}
            onPress={() => handleSelect(interest)}
            activeOpacity={0.7}
          >
            <View style={[styles.rowDot, { backgroundColor: interest.accent_color }]} />
            <Text style={[styles.rowLabel, isActive && styles.rowLabelActive]} numberOfLines={1}>
              {interest.name}
            </Text>
            {isActive && <Ionicons name="checkmark" size={18} color="#1F2937" />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => handleBrowse(interest)}
            activeOpacity={0.7}
            accessibilityLabel={`Browse ${interest.name} organizations`}
          >
            <Ionicons name="compass-outline" size={18} color="#6B7280" />
          </TouchableOpacity>
          {!isActive && userInterests.length > 1 && (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(interest)}
              activeOpacity={0.7}
              accessibilityLabel={`Remove ${interest.name} from interests`}
            >
              <Ionicons name="close-circle-outline" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          )}
        </View>
      )
    }

    return (
      <TouchableOpacity
        key={interest.id}
        style={styles.exploreRow}
        onPress={() => handleBrowse(interest)}
        activeOpacity={0.7}
      >
        <View style={[styles.rowDot, { backgroundColor: interest.accent_color, opacity: 0.6 }]} />
        <Text style={styles.exploreLabel} numberOfLines={1}>{interest.name}</Text>
        <Ionicons name="arrow-forward" size={14} color="#9CA3AF" />
      </TouchableOpacity>
    )
  }

  // Only show domain headers when there are multiple domains
  const showDomainHeaders = userGroups.length > 1

  return (
    <>
      {/* Trigger pill */}
      <TouchableOpacity
        style={styles.pill}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Current interest: ${currentInterest?.name ?? 'None'}. Tap to switch.`}
      >
        {currentInterest && (
          <View style={[styles.dot, { backgroundColor: currentInterest.accent_color }]} />
        )}
        <Text style={styles.pillText} numberOfLines={1}>
          {currentInterest?.name ?? 'Interest'}
        </Text>
        <Ionicons name="chevron-down" size={14} color="#6B7280" />
      </TouchableOpacity>

      {/* Dropdown / Bottom Sheet */}
      <Modal
        visible={open}
        transparent
        animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetTitle}>Your Interests</Text>

              {userGroups.map((group) => (
                <View key={group.domain?.slug ?? 'ungrouped'}>
                  {showDomainHeaders && group.domain && (
                    <Text style={styles.domainHeader}>{group.domain.name}</Text>
                  )}
                  {group.interests.map((interest) => renderInterestRow(interest, true))}
                </View>
              ))}

              {/* Explore more interests */}
              <View style={styles.divider} />

              {otherGroups.length > 0 && (
                <Text style={styles.sectionLabel}>Explore More</Text>
              )}
              {otherGroups.map((group) => (
                <View key={group.domain?.slug ?? 'ungrouped-explore'}>
                  {otherGroups.length > 1 && group.domain && (
                    <Text style={styles.domainHeader}>{group.domain.name}</Text>
                  )}
                  {group.interests.slice(0, 3).map((interest) => renderInterestRow(interest, false))}
                </View>
              ))}

              <TouchableOpacity
                style={styles.exploreAllBtn}
                onPress={handleExploreMore}
              >
                <Ionicons name="add-circle-outline" size={18} color="#4338CA" />
                <Text style={styles.exploreAllText}>Explore All Interests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setOpen(false)}
              >
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  // Trigger pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    maxWidth: 120,
  },

  // Backdrop + sheet
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },

  // Interest row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
  },
  rowActive: {
    backgroundColor: '#F9FAFB',
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  rowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  rowLabelActive: {
    fontWeight: '700',
    color: '#1F2937',
  },
  browseBtn: {
    padding: 10,
    borderRadius: 8,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  removeBtn: {
    padding: 6,
    borderRadius: 8,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },

  // Domain header
  domainHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
  },

  // Explore section
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  exploreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  exploreLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Explore all button
  exploreAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  exploreAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4338CA',
  },

  // Close
  closeBtn: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
})
