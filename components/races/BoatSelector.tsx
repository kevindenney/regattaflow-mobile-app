/**
 * BoatSelector Component
 * Reusable boat selection component for race forms
 * Shows user's boats with default boat pre-selected
 * Supports quick add for crew scenario
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/providers/AuthProvider';
import { sailorBoatService, SailorBoat } from '@/services/SailorBoatService';
import { QuickAddBoatForm } from '@/components/boats/QuickAddBoatForm';
import { createLogger } from '@/lib/utils/logger';

interface BoatSelectorProps {
  selectedBoatId?: string;
  onSelect: (boatId: string | undefined) => void;
  showQuickAdd?: boolean; // For crew scenario
  classId?: string; // Optional: Filter boats by class
}

const logger = createLogger('BoatSelector');
export function BoatSelector({
  selectedBoatId,
  onSelect,
  showQuickAdd = true,
  classId,
}: BoatSelectorProps) {
  const { user } = useAuth();
  const [boats, setBoats] = useState<SailorBoat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  useEffect(() => {
    loadBoats();
  }, [user, classId]);

  const loadBoats = async () => {
    if (!user) {
      logger.warn('No user found - cannot load boats');
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    if (!user.id) {
      logger.error('User object missing ID');
      setLoading(false);
      setError('User ID not found');
      return;
    }

    logger.debug(`Starting boat load for user: ${user.id}`);
    setLoading(true);
    setError(null);

    try {
      let loadedBoats: SailorBoat[];

      if (classId) {
        // Filter by class if provided
        logger.debug(`Loading boats for class: ${classId}`);
        loadedBoats = await sailorBoatService.listBoatsForSailorClass(
          user.id,
          classId
        );
      } else {
        // Get all boats
        logger.debug('Loading all boats');
        loadedBoats = await sailorBoatService.listBoatsForSailor(user.id);
      }

      logger.debug(`Successfully loaded ${loadedBoats.length} boats`);
      setBoats(loadedBoats);
      setError(null); // Clear any previous errors

      // Auto-select default boat if none selected
      if (!selectedBoatId && loadedBoats.length > 0) {
        const defaultBoat = loadedBoats.find((b) => b.is_primary);
        if (defaultBoat) {
          logger.debug(`Auto-selecting default boat: ${defaultBoat.id}`);
          onSelect(defaultBoat.id);
        }
      }
    } catch (err: any) {
      logger.error('Error loading boats', err);
      setError(err.message || 'Failed to load boats');
      // Don't show alert - just display error state
      logger.warn('User can still proceed without selecting a boat');
      // Still allow proceeding with empty boats list
      setBoats([]);
    } finally {
      logger.debug('Boat loading complete, setting loading=false');
      setLoading(false);
    }
  };

  const handleBoatAdded = (boatId: string) => {
    // Reload boats to include the new one
    loadBoats();
    // Auto-select the newly added boat
    onSelect(boatId);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Boat</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#0284c7" />
          <Text style={styles.loadingText}>Loading boats...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Boat</Text>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadBoats}
        >
          <Ionicons name="refresh" size={18} color="#0284c7" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <Text style={styles.helpText}>
          You can continue without selecting a boat, or try adding one below.
        </Text>
        {showQuickAdd && (
          <TouchableOpacity
            style={styles.addBoatButton}
            onPress={() => setShowQuickAddModal(true)}
          >
            <Ionicons name="add-circle" size={20} color="#0284c7" />
            <Text style={styles.addBoatButtonText}>Add a Boat</Text>
          </TouchableOpacity>
        )}
        {/* Quick Add Modal */}
        <QuickAddBoatForm
          visible={showQuickAddModal}
          onClose={() => setShowQuickAddModal(false)}
          onBoatAdded={handleBoatAdded}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Boat {boats.length > 0 && <Text style={styles.optional}>(Optional)</Text>}
      </Text>

      {boats.length === 0 ? (
        // No boats - show add boat prompt
        <View style={styles.emptyContainer}>
          <Ionicons name="boat-outline" size={32} color="#94A3B8" />
          <Text style={styles.emptyText}>No boats added yet</Text>
          {showQuickAdd && (
            <TouchableOpacity
              style={styles.addBoatButton}
              onPress={() => setShowQuickAddModal(true)}
            >
              <Ionicons name="add-circle" size={20} color="#0284c7" />
              <Text style={styles.addBoatButtonText}>Add Your First Boat</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          {/* Boat Picker */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedBoatId || ''}
              onValueChange={(value) => onSelect(value || undefined)}
              style={styles.picker}
            >
              <Picker.Item label="No boat selected" value="" />
              {boats.map((boat) => (
                <Picker.Item
                  key={boat.id}
                  label={`${boat.name}${boat.sail_number ? ` (Sail #${boat.sail_number})` : ''}${boat.is_primary ? ' ⭐' : ''}`}
                  value={boat.id}
                />
              ))}
            </Picker>
          </View>

          {/* Show default boat indicator */}
          {selectedBoatId && (
            <View style={styles.selectionInfo}>
              {boats.find((b) => b.id === selectedBoatId)?.is_primary && (
                <View style={styles.defaultBadge}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.defaultBadgeText}>Default Boat</Text>
                </View>
              )}
            </View>
          )}

          {/* Quick Add Button */}
          {showQuickAdd && (
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => setShowQuickAddModal(true)}
            >
              <Ionicons name="add-circle-outline" size={18} color="#0284c7" />
              <Text style={styles.quickAddButtonText}>
                Add another boat (crew)
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <Text style={styles.helpText}>
        {boats.length > 0
          ? 'Select the boat you\'re racing on. Leave blank if not applicable.'
          : 'Add a boat to track your racing performance by vessel.'}
      </Text>

      {/* Quick Add Modal */}
      <QuickAddBoatForm
        visible={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onBoatAdded={handleBoatAdded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  optional: {
    fontWeight: '400',
    color: '#6B7280',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 12,
  },
  addBoatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  addBoatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  selectionInfo: {
    marginTop: 8,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  quickAddButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0284c7',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 16,
  },
});
