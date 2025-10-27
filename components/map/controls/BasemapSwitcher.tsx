/**
 * Basemap Switcher Component
 *
 * React Native universal component for switching between basemap types.
 * Works on iOS, Android, and Web with consistent UI/UX.
 *
 * Inspired by OnX Maps' basemap switcher with one-tap switching.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView
} from 'react-native';
import { basemapService, type BasemapType } from '@/services/BasemapService';

export interface BasemapSwitcherProps {
  currentBasemap: BasemapType;
  onBasemapChange: (basemap: BasemapType) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  compact?: boolean;
}

export function BasemapSwitcher({
  currentBasemap,
  onBasemapChange,
  position = 'top-right',
  compact = false
}: BasemapSwitcherProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const basemaps = basemapService.getAvailableBasemaps();

  const handleBasemapSelect = (type: BasemapType) => {
    onBasemapChange(type);
    basemapService.savePreference(type);
    setIsExpanded(false);
  };

  const currentBasemapData = basemaps.find(b => b.id === currentBasemap);

  // Compact mode: Just show current basemap icon/name with quick toggle
  if (compact) {
    return (
      <View style={[styles.container, getPositionStyle(position)]}>
        <TouchableOpacity
          style={styles.compactButton}
          onPress={() => {
            const next = basemapService.getNextBasemap();
            handleBasemapSelect(next);
          }}
          accessibilityLabel="Switch basemap"
          accessibilityHint={`Current: ${currentBasemapData?.name}, tap to cycle`}
        >
          <Text style={styles.compactIcon}>{currentBasemapData?.icon}</Text>
          <Text style={styles.compactLabel}>{currentBasemapData?.name}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Full mode: Show expandable picker
  return (
    <View style={[styles.container, getPositionStyle(position)]}>
      {/* Current basemap button */}
      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => setIsExpanded(!isExpanded)}
        accessibilityLabel="Basemap selector"
        accessibilityHint="Open basemap options"
      >
        <Text style={styles.mainIcon}>{currentBasemapData?.icon}</Text>
        <Text style={styles.mainLabel}>{currentBasemapData?.name}</Text>
        <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Expanded basemap options */}
      {isExpanded && (
        <Modal
          visible={isExpanded}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsExpanded(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setIsExpanded(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Basemap</Text>

              <ScrollView style={styles.basemapList}>
                {basemaps.map((basemap) => (
                  <TouchableOpacity
                    key={basemap.id}
                    style={[
                      styles.basemapOption,
                      currentBasemap === basemap.id && styles.basemapOptionActive
                    ]}
                    onPress={() => handleBasemapSelect(basemap.id)}
                    accessibilityLabel={basemap.name}
                    accessibilityHint={basemap.description}
                  >
                    <Text style={styles.basemapIcon}>{basemap.icon}</Text>
                    <View style={styles.basemapInfo}>
                      <Text style={styles.basemapName}>{basemap.name}</Text>
                      <Text style={styles.basemapDescription}>
                        {basemap.description}
                      </Text>
                    </View>
                    {currentBasemap === basemap.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsExpanded(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

// ==================== POSITION UTILITIES ====================

function getPositionStyle(position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') {
  const positions = {
    'top-right': { top: 16, right: 16 },
    'top-left': { top: 16, left: 16 },
    'bottom-right': { bottom: 16, right: 16 },
    'bottom-left': { bottom: 16, left: 16 }
  };
  return positions[position];
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000
  },

  // Compact mode styles
  compactButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  compactIcon: {
    fontSize: 20,
    marginRight: 8
  },
  compactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a'
  },

  // Full mode styles
  mainButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 160
  },
  mainIcon: {
    fontSize: 22,
    marginRight: 10
  },
  mainLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1
  },
  chevron: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },

  // Basemap list
  basemapList: {
    maxHeight: 400
  },
  basemapOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  basemapOptionActive: {
    backgroundColor: '#f0f7ff'
  },
  basemapIcon: {
    fontSize: 28,
    marginRight: 16,
    width: 36,
    textAlign: 'center'
  },
  basemapInfo: {
    flex: 1
  },
  basemapName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4
  },
  basemapDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18
  },
  checkmark: {
    fontSize: 20,
    color: '#007AFF',
    marginLeft: 12
  },

  // Close button
  closeButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF'
  }
});

// ==================== HOOK ====================

/**
 * Custom hook for basemap management
 */
export function useBasemapSwitcher() {
  const [currentBasemap, setCurrentBasemap] = useState<BasemapType>(
    basemapService.loadPreference()
  );

  const changeBasemap = (type: BasemapType) => {
    setCurrentBasemap(type);
    basemapService.setCurrentBasemap(type);
    basemapService.savePreference(type);
  };

  const cycleBasemap = () => {
    const next = basemapService.getNextBasemap();
    changeBasemap(next);
  };

  return {
    currentBasemap,
    changeBasemap,
    cycleBasemap,
    basemaps: basemapService.getAvailableBasemaps()
  };
}
