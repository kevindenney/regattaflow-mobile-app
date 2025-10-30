/**
 * Mark Manager Component
 * Allows adding, editing, and removing individual course marks
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MarkType {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface MarkManagerProps {
  onAddMark: (markType: string) => void;
  onEditMode: (enabled: boolean) => void;
  isEditMode: boolean;
}

const MARK_TYPES: MarkType[] = [
  {
    id: 'committee_boat',
    name: 'Committee Boat',
    icon: 'ferry',
    color: '#f97316',
    description: 'Race committee signal boat - start/finish line end',
  },
  {
    id: 'pin',
    name: 'Pin Buoy',
    icon: 'map-marker',
    color: '#f97316',
    description: 'Start/finish line pin end',
  },
  {
    id: 'windward',
    name: 'Windward Mark',
    icon: 'flag',
    color: '#eab308',
    description: 'Top mark - round to port',
  },
  {
    id: 'leeward',
    name: 'Leeward Mark',
    icon: 'flag-outline',
    color: '#eab308',
    description: 'Bottom mark',
  },
  {
    id: 'gate_left',
    name: 'Gate A (Port)',
    icon: 'flag-triangle',
    color: '#8b5cf6',
    description: 'Leeward gate - port side',
  },
  {
    id: 'gate_right',
    name: 'Gate B (Starboard)',
    icon: 'flag-triangle',
    color: '#8b5cf6',
    description: 'Leeward gate - starboard side',
  },
  {
    id: 'offset',
    name: 'Offset Mark',
    icon: 'circle-outline',
    color: '#ec4899',
    description: 'Offset/spreader mark',
  },
  {
    id: 'finish',
    name: 'Finish Mark',
    icon: 'flag-checkered',
    color: '#3b82f6',
    description: 'Finish line mark',
  },
];

export function MarkManager({
  onAddMark,
  onEditMode,
  isEditMode,
}: MarkManagerProps) {
  const [showModal, setShowModal] = useState(false);

  const handleMarkTypeSelect = (markType: string) => {
    onAddMark(markType);
    setShowModal(false);
  };

  const toggleEditMode = () => {
    onEditMode(!isEditMode);
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        {/* Edit Mode Toggle */}
        <TouchableOpacity
          style={[
            styles.fab,
            styles.fabSecondary,
            isEditMode && styles.fabActive,
          ]}
          onPress={toggleEditMode}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isEditMode ? 'cursor-move' : 'pencil'}
            size={20}
            color={isEditMode ? '#fff' : '#64748B'}
          />
        </TouchableOpacity>

        {/* Add Mark Button */}
        <TouchableOpacity
          style={[styles.fab, styles.fabPrimary]}
          onPress={() => setShowModal(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="map-marker-plus"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Mark Type Selection Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Course Mark</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <MaterialCommunityIcons name="information" size={20} color="#0066CC" />
            <Text style={styles.instructionsText}>
              Select a mark type, then tap on the map to place it
            </Text>
          </View>

          {/* Mark Types List */}
          <ScrollView style={styles.markList}>
            {MARK_TYPES.map((markType) => (
              <TouchableOpacity
                key={markType.id}
                style={styles.markCard}
                onPress={() => handleMarkTypeSelect(markType.id)}
              >
                <View
                  style={[
                    styles.markIcon,
                    { backgroundColor: `${markType.color}20` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={markType.icon as any}
                    size={28}
                    color={markType.color}
                  />
                </View>
                <View style={styles.markInfo}>
                  <Text style={styles.markName}>{markType.name}</Text>
                  <Text style={styles.markDescription}>{markType.description}</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#CBD5E1"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    gap: 12,
    zIndex: 1000,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPrimary: {
    backgroundColor: '#0066CC',
  },
  fabSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  fabActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  markList: {
    flex: 1,
    padding: 16,
  },
  markCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  markIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  markInfo: {
    flex: 1,
  },
  markName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  markDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
});
