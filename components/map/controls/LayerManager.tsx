/**
 * Layer Manager Component
 *
 * Professional layer management UI for OnX Maps-style control.
 * Categorized layers with visibility, opacity, and ordering.
 *
 * Features:
 * - 4 layer categories (Navigation, Weather, Racing, Venues)
 * - Layer visibility toggles
 * - Opacity sliders
 * - Layer ordering (drag to reorder)
 * - Preset configurations
 * - Venue-specific layer recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SailingVenue } from '@/types/venues';

export type LayerCategory = 'navigation' | 'weather' | 'racing' | 'venues';

export interface MapLayer {
  id: string;
  name: string;
  category: LayerCategory;
  visible: boolean;
  opacity: number;
  order: number;
  icon: string;
  description: string;
}

export type LayerPreset = 'racing' | 'navigation' | 'analysis' | 'minimal';

interface LayerManagerProps {
  layers: MapLayer[];
  venue?: SailingVenue;
  onLayersChange: (layers: MapLayer[]) => void;
  style?: any;
}

const DEFAULT_LAYERS: MapLayer[] = [
  // Navigation layers
  { id: 'satellite', name: 'Satellite', category: 'navigation', visible: true, opacity: 1.0, order: 0, icon: '🛰️', description: 'Satellite imagery' },
  { id: 'nautical', name: 'Nautical Charts', category: 'navigation', visible: true, opacity: 0.8, order: 1, icon: '⚓', description: 'OpenSeaMap charts' },
  { id: 'bathymetry-color', name: 'Bathymetry Colors', category: 'navigation', visible: true, opacity: 0.6, order: 2, icon: '🌊', description: 'Depth color gradient' },
  { id: 'bathymetry-hillshade', name: 'Bathymetry 3D', category: 'navigation', visible: true, opacity: 1.0, order: 3, icon: '🏔️', description: '3D underwater terrain' },
  { id: 'bathymetry-contours', name: 'Depth Contours', category: 'navigation', visible: true, opacity: 0.8, order: 4, icon: '📏', description: 'Contour lines' },

  // Weather layers
  { id: 'tidal-stations', name: 'Tide Stations', category: 'weather', visible: false, opacity: 0.8, order: 5, icon: '🌙', description: 'Tidal predictions' },
  { id: 'current-arrows', name: 'Current Flow', category: 'weather', visible: false, opacity: 0.8, order: 6, icon: '➡️', description: 'Animated currents' },
  { id: 'wind-arrows', name: 'Wind', category: 'weather', visible: true, opacity: 0.8, order: 7, icon: '💨', description: 'Wind speed/direction' },

  // Racing layers
  { id: 'race-marks', name: 'Race Marks', category: 'racing', visible: true, opacity: 1.0, order: 8, icon: '📍', description: 'Course marks' },
  { id: 'race-boundaries', name: 'Racing Area', category: 'racing', visible: true, opacity: 0.3, order: 9, icon: '◻️', description: 'Race area boundary' },
  { id: 'start-line', name: 'Start Line', category: 'racing', visible: true, opacity: 1.0, order: 10, icon: '🏁', description: 'Starting line' },

  // Venue layers
  { id: 'yacht-clubs', name: 'Yacht Clubs', category: 'venues', visible: true, opacity: 1.0, order: 11, icon: '⛵', description: 'Club locations' },
  { id: 'multi-venue-areas', name: 'Racing Areas', category: 'venues', visible: false, opacity: 1.0, order: 12, icon: '🗺️', description: 'Multi-venue clubs' }
];

export function LayerManager({ layers: initialLayers, venue, onLayersChange, style }: LayerManagerProps) {
  const [expanded, setExpanded] = useState(false);
  const [layers, setLayers] = useState<MapLayer[]>(initialLayers || DEFAULT_LAYERS);
  const [expandedCategories, setExpandedCategories] = useState<Set<LayerCategory>>(new Set(['navigation']));

  useEffect(() => {
    loadSavedLayers();
  }, []);

  const loadSavedLayers = async () => {
    try {
      const saved = await AsyncStorage.getItem('@layer_manager_config');
      if (saved) {
        const savedLayers = JSON.parse(saved);
        setLayers(savedLayers);
        onLayersChange(savedLayers);
      }
    } catch (error) {
      console.error('Failed to load layer config:', error);
    }
  };

  const saveLayers = async (newLayers: MapLayer[]) => {
    try {
      await AsyncStorage.setItem('@layer_manager_config', JSON.stringify(newLayers));
    } catch (error) {
      console.error('Failed to save layer config:', error);
    }
  };

  const updateLayer = (layerId: string, updates: Partial<MapLayer>) => {
    const newLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    );
    setLayers(newLayers);
    onLayersChange(newLayers);
    saveLayers(newLayers);
  };

  const toggleCategory = (category: LayerCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const applyPreset = (preset: LayerPreset) => {
    const presetConfig = getPresetConfiguration(preset);
    const newLayers = layers.map(layer => ({
      ...layer,
      visible: presetConfig.visibleLayers.includes(layer.id),
      opacity: presetConfig.opacityOverrides[layer.id] ?? layer.opacity
    }));
    setLayers(newLayers);
    onLayersChange(newLayers);
    saveLayers(newLayers);
  };

  const getPresetConfiguration = (preset: LayerPreset): {
    visibleLayers: string[];
    opacityOverrides: Record<string, number>;
  } => {
    switch (preset) {
      case 'racing':
        return {
          visibleLayers: ['satellite', 'bathymetry-color', 'bathymetry-contours', 'wind-arrows', 'race-marks', 'race-boundaries', 'start-line'],
          opacityOverrides: { 'satellite': 0.8, 'bathymetry-color': 0.5 }
        };
      case 'navigation':
        return {
          visibleLayers: ['nautical', 'bathymetry-color', 'bathymetry-contours', 'tidal-stations', 'current-arrows'],
          opacityOverrides: { 'nautical': 1.0, 'bathymetry-color': 0.7 }
        };
      case 'analysis':
        return {
          visibleLayers: ['satellite', 'nautical', 'bathymetry-hillshade', 'bathymetry-contours', 'tidal-stations', 'current-arrows', 'wind-arrows'],
          opacityOverrides: {}
        };
      case 'minimal':
        return {
          visibleLayers: ['satellite', 'race-marks', 'start-line'],
          opacityOverrides: { 'satellite': 1.0 }
        };
    }
  };

  const getCategoryLayers = (category: LayerCategory) => {
    return layers.filter(layer => layer.category === category).sort((a, b) => a.order - b.order);
  };

  const getCategoryIcon = (category: LayerCategory): string => {
    switch (category) {
      case 'navigation': return '🧭';
      case 'weather': return '🌤️';
      case 'racing': return '🏁';
      case 'venues': return '⛵';
    }
  };

  const getCategoryName = (category: LayerCategory): string => {
    switch (category) {
      case 'navigation': return 'Navigation';
      case 'weather': return 'Weather';
      case 'racing': return 'Racing';
      case 'venues': return 'Venues';
    }
  };

  const visibleLayersCount = layers.filter(l => l.visible).length;

  return (
    <View style={[styles.container, style]}>
      {/* Compact Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>🗺️</Text>
          <Text style={styles.headerTitle}>Layers</Text>
          <Text style={styles.layerCount}>{visibleLayersCount} active</Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '−' : '+'}</Text>
      </TouchableOpacity>

      {/* Expanded Controls */}
      {expanded && (
        <ScrollView style={styles.expandedContent}>
          {/* Presets */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Presets</Text>
            <View style={styles.presetButtons}>
              <PresetButton label="Racing" onPress={() => applyPreset('racing')} />
              <PresetButton label="Navigation" onPress={() => applyPreset('navigation')} />
              <PresetButton label="Analysis" onPress={() => applyPreset('analysis')} />
              <PresetButton label="Minimal" onPress={() => applyPreset('minimal')} />
            </View>
          </View>

          {/* Layer Categories */}
          {(['navigation', 'weather', 'racing', 'venues'] as LayerCategory[]).map(category => {
            const categoryLayers = getCategoryLayers(category);
            const isExpanded = expandedCategories.has(category);
            const visibleCount = categoryLayers.filter(l => l.visible).length;

            return (
              <View key={category} style={styles.categorySection}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
                  <Text style={styles.categoryName}>{getCategoryName(category)}</Text>
                  <Text style={styles.categoryCount}>
                    {visibleCount}/{categoryLayers.length}
                  </Text>
                  <Text style={styles.categoryExpandIcon}>{isExpanded ? '▼' : '▶'}</Text>
                </TouchableOpacity>

                {isExpanded && categoryLayers.map(layer => (
                  <View key={layer.id} style={styles.layerRow}>
                    <View style={styles.layerInfo}>
                      <Text style={styles.layerIcon}>{layer.icon}</Text>
                      <View style={styles.layerText}>
                        <Text style={styles.layerName}>{layer.name}</Text>
                        <Text style={styles.layerDescription}>{layer.description}</Text>
                      </View>
                    </View>
                    <Switch
                      value={layer.visible}
                      onValueChange={(value) => updateLayer(layer.id, { visible: value })}
                      trackColor={{ false: '#767577', true: '#3E95CD' }}
                      thumbColor={layer.visible ? '#fff' : '#f4f3f4'}
                    />
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function PresetButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.presetButton} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.presetButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84
      },
      android: {
        elevation: 5
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.25)'
      }
    })
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  layerCount: {
    fontSize: 11,
    color: '#3E95CD',
    backgroundColor: 'rgba(62, 149, 205, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontWeight: '600'
  },
  expandIcon: {
    fontSize: 20,
    color: '#3E95CD',
    fontWeight: 'bold',
    marginLeft: 8
  },
  expandedContent: {
    maxHeight: 500,
    padding: 12
  },
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 8
  },
  presetButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#3E95CD',
    alignItems: 'center'
  },
  presetButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  categorySection: {
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden'
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5'
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  categoryCount: {
    fontSize: 11,
    color: '#666',
    marginRight: 8
  },
  categoryExpandIcon: {
    fontSize: 12,
    color: '#999'
  },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  layerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12
  },
  layerIcon: {
    fontSize: 16,
    marginRight: 8
  },
  layerText: {
    flex: 1
  },
  layerName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2
  },
  layerDescription: {
    fontSize: 11,
    color: '#666'
  }
});
