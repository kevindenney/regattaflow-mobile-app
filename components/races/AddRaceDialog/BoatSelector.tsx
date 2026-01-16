/**
 * BoatSelector Component
 *
 * Dropdown selector for user's boats in the Add Race dialog.
 * Auto-populates boat class when a boat is selected.
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
} from 'react-native';
import { ChevronDown, Sailboat, Check, X, Plus } from 'lucide-react-native';
import { useUserBoats } from '@/hooks/useUserBoats';
import type { SailorBoat } from '@/services/SailorBoatService';
import { QuickAddBoatForm } from '@/components/boats/QuickAddBoatForm';

const COLORS = {
  primary: '#007AFF',
  label: '#000000',
  secondaryLabel: '#8E8E93',
  tertiaryLabel: '#C7C7CC',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  separator: '#C6C6C8',
  green: '#34C759',
};

interface BoatSelectorProps {
  /** Currently selected boat ID */
  selectedBoatId?: string | null;
  /** Called when boat is selected - provides boat ID, class ID, and class name */
  onSelect: (boatId: string | null, classId: string | null, className: string | null) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field was AI-extracted */
  aiExtracted?: boolean;
  /** Label for the field */
  label?: string;
  /** Whether to show as half-width */
  halfWidth?: boolean;
}

export function BoatSelector({
  selectedBoatId,
  onSelect,
  placeholder = 'Select your boat',
  aiExtracted = false,
  label = 'Boat',
  halfWidth = false,
}: BoatSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const { boats, isLoading, hasBoats, refetch } = useUserBoats();

  // Find the selected boat
  const selectedBoat = boats.find((b) => b.id === selectedBoatId);

  const handleSelectBoat = (boat: SailorBoat | null) => {
    if (boat) {
      // Extract class ID and name from boat's class data
      const classId = boat.class_id || null;
      const className = boat.boat_class?.name || null;
      onSelect(boat.id, classId, className);
    } else {
      onSelect(null, null, null);
    }
    setModalVisible(false);
  };

  const handleBoatAdded = async (newBoatId: string) => {
    // Refetch to get the updated boats list including the new boat
    const result = await refetch();

    // Find the newly added boat and auto-select it
    const newBoat = result.data?.find((b) => b.id === newBoatId);
    if (newBoat) {
      const classId = newBoat.class_id || null;
      const className = newBoat.boat_class?.name || null;
      onSelect(newBoat.id, classId, className);
    }

    setModalVisible(false);
  };

  const formatBoatDisplay = (boat: SailorBoat) => {
    const parts: string[] = [];
    if (boat.sail_number) parts.push(boat.sail_number);
    if (boat.name) parts.push(`"${boat.name}"`);
    return parts.length > 0 ? parts.join(' ') : 'Unnamed Boat';
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
        {selectedBoat ? (
          <View style={styles.selectedContent}>
            <Sailboat size={16} color={COLORS.primary} />
            <Text style={styles.selectedText} numberOfLines={1}>
              {formatBoatDisplay(selectedBoat)}
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
            <Text style={styles.modalTitle}>Select Boat</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading boats...</Text>
            </View>
          ) : !hasBoats ? (
            <View style={styles.emptyContainer}>
              <Sailboat size={48} color={COLORS.tertiaryLabel} />
              <Text style={styles.emptyTitle}>No Boats Found</Text>
              <Text style={styles.emptyDescription}>
                Add a boat to get started.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.addBoatButtonPrimary,
                  pressed && styles.addBoatButtonPressed,
                ]}
                onPress={() => setQuickAddVisible(true)}
              >
                <Plus size={20} color={COLORS.secondaryBackground} />
                <Text style={styles.addBoatButtonPrimaryText}>Add Your First Boat</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView style={styles.boatList}>
              {/* Clear selection option */}
              <Pressable
                style={({ pressed }) => [
                  styles.boatItem,
                  pressed && styles.boatItemPressed,
                ]}
                onPress={() => handleSelectBoat(null)}
              >
                <View style={styles.boatInfo}>
                  <Text style={styles.boatNameClear}>No boat selected</Text>
                </View>
                {!selectedBoatId && (
                  <Check size={20} color={COLORS.primary} />
                )}
              </Pressable>

              {/* Boat list */}
              {boats.map((boat) => (
                <Pressable
                  key={boat.id}
                  style={({ pressed }) => [
                    styles.boatItem,
                    pressed && styles.boatItemPressed,
                    boat.id === selectedBoatId && styles.boatItemSelected,
                  ]}
                  onPress={() => handleSelectBoat(boat)}
                >
                  <View style={styles.boatIcon}>
                    <Sailboat size={24} color={COLORS.primary} />
                    {boat.is_primary && (
                      <View style={styles.primaryBadge} />
                    )}
                  </View>
                  <View style={styles.boatInfo}>
                    <Text style={styles.boatName}>
                      {boat.sail_number || boat.name || 'Unnamed'}
                      {boat.name && boat.sail_number && (
                        <Text style={styles.boatNickname}> "{boat.name}"</Text>
                      )}
                    </Text>
                    <Text style={styles.boatClass}>
                      {boat.boat_class?.name || 'Unknown class'}
                    </Text>
                  </View>
                  {boat.id === selectedBoatId && (
                    <Check size={20} color={COLORS.primary} />
                  )}
                </Pressable>
              ))}

              {/* Add New Boat button */}
              <Pressable
                style={({ pressed }) => [
                  styles.addBoatButton,
                  pressed && styles.addBoatButtonPressed,
                ]}
                onPress={() => setQuickAddVisible(true)}
              >
                <Plus size={20} color={COLORS.primary} />
                <Text style={styles.addBoatButtonText}>Add New Boat</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Quick Add Boat Form */}
      <QuickAddBoatForm
        visible={quickAddVisible}
        onClose={() => setQuickAddVisible(false)}
        onBoatAdded={handleBoatAdded}
      />
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
  boatList: {
    flex: 1,
    padding: 16,
  },
  boatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  boatItemPressed: {
    backgroundColor: COLORS.background,
  },
  boatItemSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  boatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: COLORS.secondaryBackground,
  },
  boatInfo: {
    flex: 1,
  },
  boatName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.label,
  },
  boatNickname: {
    fontWeight: '400',
    fontStyle: 'italic',
  },
  boatNameClear: {
    fontSize: 16,
    color: COLORS.secondaryLabel,
  },
  boatClass: {
    fontSize: 14,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },
  addBoatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  addBoatButtonPressed: {
    backgroundColor: COLORS.background,
  },
  addBoatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  addBoatButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  addBoatButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondaryBackground,
  },
});

export default BoatSelector;
