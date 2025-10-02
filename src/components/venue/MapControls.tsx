/**
 * MapControls Component
 * Apple Maps-style control bar for upper-right map controls
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { ThemedText } from '@/src/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

export interface MapLayers {
  yachtClubs: boolean;
  sailmakers: boolean;
  riggers: boolean;
  coaches: boolean;
  chandlery: boolean;
  clothing: boolean;
  marinas: boolean;
  repair: boolean;
  engines: boolean;
}

interface MapControlsProps {
  onToggle3D?: () => void;
  onToggleLayers?: () => void;
  onSearchNearby?: () => void;
  onSettings?: () => void;
  onToggleSavedVenues?: () => void;
  is3DEnabled?: boolean;
  areLayersVisible?: boolean;
  showOnlySavedVenues?: boolean;
  savedVenuesCount?: number;
  layers?: MapLayers;
  onLayersChange?: (layers: MapLayers) => void;
}

export function MapControls({
  onToggle3D,
  onToggleLayers,
  onSearchNearby,
  onSettings,
  onToggleSavedVenues,
  is3DEnabled = false,
  areLayersVisible = true,
  showOnlySavedVenues = false,
  savedVenuesCount = 0,
  layers: externalLayers,
  onLayersChange,
}: MapControlsProps) {
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);

  // Individual layer toggles - use external state if provided
  const [internalLayers, setInternalLayers] = useState<MapLayers>({
    yachtClubs: true,
    sailmakers: false,
    riggers: false,
    coaches: false,
    chandlery: false,
    clothing: false,
    marinas: false,
    repair: false,
    engines: false,
  });

  const layers = externalLayers || internalLayers;

  const toggleLayer = (layerKey: keyof MapLayers) => {
    const newLayers = {
      ...layers,
      [layerKey]: !layers[layerKey],
    };

    if (onLayersChange) {
      onLayersChange(newLayers);
    } else {
      setInternalLayers(newLayers);
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Control Bar */}
      <View style={styles.controlBar}>
        {/* 3D/2D Toggle */}
        {onToggle3D && (
          <TouchableOpacity
            style={[styles.controlButton, is3DEnabled && styles.controlButtonActive]}
            onPress={onToggle3D}
          >
            <Ionicons
              name="cube-outline"
              size={20}
              color={is3DEnabled ? '#007AFF' : '#333'}
            />
            <ThemedText style={[styles.buttonText, is3DEnabled && styles.buttonTextActive]}>
              3D
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Layers Toggle */}
        {onToggleLayers && (
          <TouchableOpacity
            style={[styles.controlButton, areLayersVisible && styles.controlButtonActive]}
            onPress={() => {
              setLayerMenuOpen(!layerMenuOpen);
              onToggleLayers();
            }}
          >
            <Ionicons
              name="layers-outline"
              size={20}
              color={areLayersVisible ? '#007AFF' : '#333'}
            />
            <ThemedText style={[styles.buttonText, areLayersVisible && styles.buttonTextActive]}>
              Layers
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Saved Venues Toggle */}
        {onToggleSavedVenues && (
          <TouchableOpacity
            style={[styles.controlButton, showOnlySavedVenues && styles.controlButtonActive]}
            onPress={onToggleSavedVenues}
          >
            <Ionicons
              name={showOnlySavedVenues ? "bookmark" : "bookmark-outline"}
              size={20}
              color={showOnlySavedVenues ? '#007AFF' : '#333'}
            />
            <ThemedText style={[styles.buttonText, showOnlySavedVenues && styles.buttonTextActive]}>
              Saved{savedVenuesCount > 0 ? ` (${savedVenuesCount})` : ''}
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Search Nearby */}
        {onSearchNearby && (
          <TouchableOpacity style={styles.controlButton} onPress={onSearchNearby}>
            <Ionicons name="navigate-outline" size={20} color="#333" />
            <ThemedText style={styles.buttonText}>Nearby</ThemedText>
          </TouchableOpacity>
        )}

        {/* Settings */}
        {onSettings && (
          <TouchableOpacity style={styles.controlButton} onPress={onSettings}>
            <Ionicons name="settings-outline" size={20} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      {/* Layer Menu Dropdown */}
      {layerMenuOpen && (
        <View style={styles.layerMenu}>
          <ThemedText style={styles.layerMenuTitle}>Map Layers</ThemedText>

          <TouchableOpacity style={styles.layerMenuItem} onPress={() => toggleLayer('yachtClubs')}>
            <View style={styles.layerItemLeft}>
              <Ionicons name="business" size={18} color="#007AFF" />
              <ThemedText style={styles.layerItemText}>Yacht Clubs</ThemedText>
            </View>
            {layers.yachtClubs && <Ionicons name="checkmark" size={20} color="#007AFF" />}
          </TouchableOpacity>

          <View style={styles.layerMenuDivider} />

          <TouchableOpacity style={styles.layerMenuItem} onPress={() => toggleLayer('sailmakers')}>
            <View style={styles.layerItemLeft}>
              <Ionicons name="triangle-outline" size={18} color="#ff9500" />
              <ThemedText style={styles.layerItemText}>Sailmakers</ThemedText>
            </View>
            {layers.sailmakers && <Ionicons name="checkmark" size={20} color="#ff9500" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.layerMenuItem} onPress={() => toggleLayer('riggers')}>
            <View style={styles.layerItemLeft}>
              <Ionicons name="git-network-outline" size={18} color="#5856d6" />
              <ThemedText style={styles.layerItemText}>Riggers</ThemedText>
            </View>
            {layers.riggers && <Ionicons name="checkmark" size={20} color="#5856d6" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.layerMenuItem} onPress={() => toggleLayer('coaches')}>
            <View style={styles.layerItemLeft}>
              <Ionicons name="person-outline" size={18} color="#34c759" />
              <ThemedText style={styles.layerItemText}>Coaches</ThemedText>
            </View>
            {layers.coaches && <Ionicons name="checkmark" size={20} color="#34c759" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.layerMenuItem} onPress={() => toggleLayer('chandlery')}>
            <View style={styles.layerItemLeft}>
              <Ionicons name="cart-outline" size={18} color="#ff3b30" />
              <ThemedText style={styles.layerItemText}>Chandlery</ThemedText>
            </View>
            {layers.chandlery && <Ionicons name="checkmark" size={20} color="#ff3b30" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.layerMenuItem} onPress={() => toggleLayer('clothing')}>
            <View style={styles.layerItemLeft}>
              <Ionicons name="shirt-outline" size={18} color="#ff2d55" />
              <ThemedText style={styles.layerItemText}>Foul Weather Gear</ThemedText>
            </View>
            {layers.clothing && <Ionicons name="checkmark" size={20} color="#ff2d55" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.layerMenuItem} onPress={() => toggleLayer('marinas')}>
            <View style={styles.layerItemLeft}>
              <Ionicons name="boat-outline" size={18} color="#00c7be" />
              <ThemedText style={styles.layerItemText}>Marinas</ThemedText>
            </View>
            {layers.marinas && <Ionicons name="checkmark" size={20} color="#00c7be" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.layerMenuItem} onPress={() => toggleLayer('repair')}>
            <View style={styles.layerItemLeft}>
              <Ionicons name="construct" size={18} color="#ff9500" />
              <ThemedText style={styles.layerItemText}>Repair Services</ThemedText>
            </View>
            {layers.repair && <Ionicons name="checkmark" size={20} color="#ff9500" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.layerMenuItem} onPress={() => toggleLayer('engines')}>
            <View style={styles.layerItemLeft}>
              <Ionicons name="cog-outline" size={18} color="#8e8e93" />
              <ThemedText style={styles.layerItemText}>Engine Services</ThemedText>
            </View>
            {layers.engines && <Ionicons name="checkmark" size={20} color="#8e8e93" />}
          </TouchableOpacity>
        </View>
      )}

      {/* Additional Quick Actions Below */}
      <View style={styles.quickActions}>
        {/* Zoom In */}
        <TouchableOpacity style={styles.zoomButton}>
          <Ionicons name="add" size={22} color="#333" />
        </TouchableOpacity>

        {/* Zoom Out */}
        <TouchableOpacity style={[styles.zoomButton, styles.zoomButtonBottom]}>
          <Ionicons name="remove" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Compass/Location Button */}
      <TouchableOpacity style={styles.compassButton}>
        <Ionicons name="compass" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 60,
    right: 20,
    zIndex: 150,
    gap: 12,
  },

  // Main Control Bar
  controlBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 12,
    padding: 6,
    gap: 4,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(20px)',
        }
      : {
          elevation: 5,
        }),
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  controlButtonActive: {
    backgroundColor: '#007AFF10',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  buttonTextActive: {
    color: '#007AFF',
  },

  // Layer Menu Dropdown
  layerMenu: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 12,
    padding: 12,
    minWidth: 240,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(20px)',
        }
      : {
          elevation: 8,
        }),
  },
  layerMenuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  layerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  layerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  layerItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  layerMenuDivider: {
    height: 1,
    backgroundColor: '#e1e5e9',
    marginVertical: 8,
  },

  // Quick Actions (Zoom Controls)
  quickActions: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(20px)',
        }
      : {
          elevation: 5,
        }),
  },
  zoomButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonBottom: {
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },

  // Compass/Location Button
  compassButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(20px)',
        }
      : {
          elevation: 5,
        }),
  },
});
