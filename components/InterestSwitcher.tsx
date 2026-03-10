/**
 * InterestSwitcher — dropdown/bottom-sheet for switching the active interest.
 *
 * Shows in the NavigationHeader. Each interest renders its accent color dot,
 * name, and a checkmark for the currently selected interest.
 */

import { useInterest } from '@/providers/InterestProvider'
import type { Interest } from '@/providers/InterestProvider'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export function InterestSwitcher() {
  const { currentInterest, userInterests, switchInterest, loading } = useInterest()
  const [open, setOpen] = useState(false)

  if (loading || userInterests.length === 0) return null

  const handleSelect = async (interest: Interest) => {
    setOpen(false)
    if (interest.slug !== currentInterest?.slug) {
      await switchInterest(interest.slug)
    }
  }

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
          <View
            style={[
              styles.dot,
              { backgroundColor: currentInterest.accent_color },
            ]}
          />
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
            <Text style={styles.sheetTitle}>Switch interest</Text>

            {userInterests.map((interest) => {
              const isActive = interest.slug === currentInterest?.slug
              return (
                <TouchableOpacity
                  key={interest.id}
                  style={[styles.row, isActive && styles.rowActive]}
                  onPress={() => handleSelect(interest)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.rowDot,
                      { backgroundColor: interest.accent_color },
                    ]}
                  />
                  <Text
                    style={[styles.rowLabel, isActive && styles.rowLabelActive]}
                    numberOfLines={1}
                  >
                    {interest.name}
                  </Text>
                  {isActive && (
                    <Ionicons name="checkmark" size={18} color="#1F2937" />
                  )}
                </TouchableOpacity>
              )
            })}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setOpen(false)}
            >
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manageBtn}
              onPress={() => {
                setOpen(false)
                router.push('/catalog')
              }}
            >
              <Text style={styles.manageBtnText}>Manage Catalog</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => {
                setOpen(false)
                router.push('/account?section=interest')
              }}
            >
              <Text style={styles.settingsBtnText}>Interest Settings</Text>
            </TouchableOpacity>
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
    maxHeight: '60%',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },

  // Interest row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  rowActive: {
    backgroundColor: '#F9FAFB',
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

  // Close
  closeBtn: {
    marginTop: 16,
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
  manageBtn: {
    marginTop: 10,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
  },
  manageBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4338CA',
  },
  settingsBtn: {
    marginTop: 10,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
  },
  settingsBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#047857',
  },
})
