/**
 * LocationSelector Component
 * Dropdown/button for switching between user's sailing locations
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { LocationSummary } from '@/services/SailingNetworkService';
import { getCountryFlag } from '@/constants/sailing-icons';

interface LocationSelectorProps {
  currentLocation: { name: string; region: string } | null;
  myLocations: LocationSummary[];
  onLocationChange: (location: LocationSummary) => void;
  isGPSDetected?: boolean;
}

export function LocationSelector({
  currentLocation,
  myLocations,
  onLocationChange,
  isGPSDetected = false,
}: LocationSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelectLocation = (location: LocationSummary) => {
    onLocationChange(location);
    setModalVisible(false);
  };

  const getRegionFlag = (region: string) => {
    const flags: Record<string, string> = {
      'north-america': '🌎',
      'europe': '🇪🇺',
      'asia-pacific': '🌏',
      'oceania': '🇦🇺',
      'south-america': '🌎',
      'middle-east': '🌍',
      'africa': '🌍',
    };
    return flags[region] || '🌍';
  };

  return (
    <>
      {/* Location Selector Button */}
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.locationInfo}>
          <View style={styles.locationHeader}>
            {isGPSDetected && (
              <Ionicons name="navigate" size={14} color="#007AFF" style={styles.gpsIcon} />
            )}
            <ThemedText style={styles.locationLabel}>
              📍 {currentLocation?.name || 'All Locations'}
            </ThemedText>
          </View>
          {currentLocation && (
            <ThemedText style={styles.locationSubtext}>
              {getRegionFlag(currentLocation.region)} {currentLocation.region.replace('-', ' ')}
            </ThemedText>
          )}
        </View>
        <Ionicons name="chevron-down" size={18} color="#666" />
      </TouchableOpacity>

      {/* Location Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Location</ThemedText>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Locations List */}
            <ScrollView style={styles.locationsList}>
              {myLocations.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="location-outline" size={48} color="#ccc" />
                  <ThemedText style={styles.emptyText}>
                    No saved locations yet
                  </ThemedText>
                  <ThemedText style={styles.emptySubtext}>
                    Save places to your sailing network to see them here
                  </ThemedText>
                </View>
              ) : (
                myLocations.map((location) => (
                  <TouchableOpacity
                    key={`${location.name}-${location.region}`}
                    style={[
                      styles.locationCard,
                      currentLocation?.name === location.name && styles.locationCardActive,
                    ]}
                    onPress={() => handleSelectLocation(location)}
                  >
                    <View style={styles.locationCardContent}>
                      <View style={styles.locationIcon}>
                        <ThemedText style={styles.locationIconText}>
                          {getRegionFlag(location.region)}
                        </ThemedText>
                      </View>
                      <View style={styles.locationDetails}>
                        <ThemedText
                          style={[
                            styles.locationName,
                            currentLocation?.name === location.name && styles.locationNameActive,
                          ]}
                        >
                          {location.name}
                        </ThemedText>
                        <View style={styles.locationMeta}>
                          <ThemedText style={styles.locationRegion}>
                            {location.region.replace('-', ' ')}
                          </ThemedText>
                          <View style={styles.locationBadge}>
                            <ThemedText style={styles.locationBadgeText}>
                              {location.savedCount} saved
                            </ThemedText>
                          </View>
                          {location.hasHomeVenue && (
                            <View style={styles.homeBadge}>
                              <Ionicons name="home" size={12} color="#007AFF" />
                              <ThemedText style={styles.homeBadgeText}>Home</ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                      {currentLocation?.name === location.name && (
                        <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Selector Button
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }
      : { elevation: 3 }),
  },
  locationInfo: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gpsIcon: {
    marginRight: 4,
  },
  locationLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  locationSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textTransform: 'capitalize',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },

  // Locations List
  locationsList: {
    flex: 1,
    paddingTop: 16,
  },
  locationCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  locationCardActive: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#007AFF05',
  },
  locationCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIconText: {
    fontSize: 22,
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  locationNameActive: {
    color: '#007AFF',
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  locationRegion: {
    fontSize: 13,
    color: '#666',
    textTransform: 'capitalize',
  },
  locationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#f1f3f4',
  },
  locationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  homeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#007AFF15',
  },
  homeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
