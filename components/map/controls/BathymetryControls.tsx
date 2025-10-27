/**
 * Bathymetry Controls Component
 *
 * React Native universal component for controlling bathymetric visualization.
 * Works on iOS, Android, and Web with consistent UI/UX.
 *
 * Features:
 * - Toggle hillshade, color gradient, contours, labels
 * - Adjust exaggeration and opacity
 * - Preset selection (racing, navigation, analysis, minimal)
 * - 3D terrain toggle
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
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BathymetryPreset = 'racing' | 'navigation' | 'analysis' | 'minimal' | 'custom';

interface BathymetryConfig {
  showHillshade: boolean;
  hillshadeExaggeration: number;
  showColorGradient: boolean;
  colorGradientOpacity: number;
  showContours: boolean;
  showDepthLabels: boolean;
  terrainExaggeration: number;
  enable3DTerrain: boolean;
}

interface BathymetryControlsProps {
  /** Current bathymetry configuration */
  config: BathymetryConfig;

  /** Callback when configuration changes */
  onChange: (config: BathymetryConfig) => void;

  /** Optional: Custom style for the container */
  style?: any;

  /** Optional: Hide preset buttons */
  hidePresets?: boolean;
}

const DEFAULT_CONFIG: BathymetryConfig = {
  showHillshade: true,
  hillshadeExaggeration: 1.5,
  showColorGradient: true,
  colorGradientOpacity: 0.6,
  showContours: true,
  showDepthLabels: true,
  terrainExaggeration: 2.0,
  enable3DTerrain: true
};

export function BathymetryControls({
  config = DEFAULT_CONFIG,
  onChange,
  style,
  hidePresets = false
}: BathymetryControlsProps) {
  const [expanded, setExpanded] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<BathymetryPreset>('custom');

  // Load saved preferences
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem('@bathymetry_config');
      if (saved) {
        const savedConfig = JSON.parse(saved);
        onChange(savedConfig);
      }
    } catch (error) {
      console.error('Failed to load bathymetry preferences:', error);
    }
  };

  const savePreferences = async (newConfig: BathymetryConfig) => {
    try {
      await AsyncStorage.setItem('@bathymetry_config', JSON.stringify(newConfig));
    } catch (error) {
      console.error('Failed to save bathymetry preferences:', error);
    }
  };

  const updateConfig = (updates: Partial<BathymetryConfig>) => {
    const newConfig = { ...config, ...updates };
    onChange(newConfig);
    savePreferences(newConfig);
    setCurrentPreset('custom');
  };

  const applyPreset = (preset: BathymetryPreset) => {
    let presetConfig: BathymetryConfig;

    switch (preset) {
      case 'racing':
        presetConfig = {
          showHillshade: true,
          hillshadeExaggeration: 2.0,
          showColorGradient: true,
          colorGradientOpacity: 0.7,
          showContours: true,
          showDepthLabels: true,
          terrainExaggeration: 3.0,
          enable3DTerrain: true
        };
        break;

      case 'navigation':
        presetConfig = {
          showHillshade: true,
          hillshadeExaggeration: 1.0,
          showColorGradient: true,
          colorGradientOpacity: 0.8,
          showContours: true,
          showDepthLabels: true,
          terrainExaggeration: 1.5,
          enable3DTerrain: true
        };
        break;

      case 'analysis':
        presetConfig = {
          showHillshade: true,
          hillshadeExaggeration: 2.5,
          showColorGradient: true,
          colorGradientOpacity: 0.5,
          showContours: true,
          showDepthLabels: true,
          terrainExaggeration: 3.0,
          enable3DTerrain: true
        };
        break;

      case 'minimal':
        presetConfig = {
          showHillshade: false,
          hillshadeExaggeration: 0,
          showColorGradient: true,
          colorGradientOpacity: 0.3,
          showContours: true,
          showDepthLabels: false,
          terrainExaggeration: 0,
          enable3DTerrain: false
        };
        break;

      default:
        return;
    }

    onChange(presetConfig);
    savePreferences(presetConfig);
    setCurrentPreset(preset);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Compact Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>🌊</Text>
          <Text style={styles.headerTitle}>Bathymetry</Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '−' : '+'}</Text>
      </TouchableOpacity>

      {/* Expanded Controls */}
      {expanded && (
        <ScrollView style={styles.expandedContent}>
          {/* Presets */}
          {!hidePresets && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Presets</Text>
              <View style={styles.presetButtons}>
                <PresetButton
                  label="Racing"
                  active={currentPreset === 'racing'}
                  onPress={() => applyPreset('racing')}
                />
                <PresetButton
                  label="Navigation"
                  active={currentPreset === 'navigation'}
                  onPress={() => applyPreset('navigation')}
                />
                <PresetButton
                  label="Analysis"
                  active={currentPreset === 'analysis'}
                  onPress={() => applyPreset('analysis')}
                />
                <PresetButton
                  label="Minimal"
                  active={currentPreset === 'minimal'}
                  onPress={() => applyPreset('minimal')}
                />
              </View>
            </View>
          )}

          {/* 3D Terrain Toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>3D Terrain</Text>
            <Switch
              value={config.enable3DTerrain}
              onValueChange={(value) => updateConfig({ enable3DTerrain: value })}
              trackColor={{ false: '#767577', true: '#3E95CD' }}
              thumbColor={config.enable3DTerrain ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Hillshade */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Hillshade (3D Depth)</Text>
              <Switch
                value={config.showHillshade}
                onValueChange={(value) => updateConfig({ showHillshade: value })}
                trackColor={{ false: '#767577', true: '#3E95CD' }}
                thumbColor={config.showHillshade ? '#fff' : '#f4f3f4'}
              />
            </View>

            {config.showHillshade && (
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>
                  Exaggeration: {config.hillshadeExaggeration.toFixed(1)}x
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={3}
                  step={0.1}
                  value={config.hillshadeExaggeration}
                  onValueChange={(value) => updateConfig({ hillshadeExaggeration: value })}
                  minimumTrackTintColor="#3E95CD"
                  maximumTrackTintColor="#d3d3d3"
                  thumbTintColor="#3E95CD"
                />
              </View>
            )}
          </View>

          {/* Color Gradient */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Color Gradient</Text>
              <Switch
                value={config.showColorGradient}
                onValueChange={(value) => updateConfig({ showColorGradient: value })}
                trackColor={{ false: '#767577', true: '#3E95CD' }}
                thumbColor={config.showColorGradient ? '#fff' : '#f4f3f4'}
              />
            </View>

            {config.showColorGradient && (
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>
                  Opacity: {Math.round(config.colorGradientOpacity * 100)}%
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  step={0.05}
                  value={config.colorGradientOpacity}
                  onValueChange={(value) => updateConfig({ colorGradientOpacity: value })}
                  minimumTrackTintColor="#3E95CD"
                  maximumTrackTintColor="#d3d3d3"
                  thumbTintColor="#3E95CD"
                />
              </View>
            )}
          </View>

          {/* Contours */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Depth Contours</Text>
            <Switch
              value={config.showContours}
              onValueChange={(value) => updateConfig({ showContours: value })}
              trackColor={{ false: '#767577', true: '#3E95CD' }}
              thumbColor={config.showContours ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Depth Labels */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Depth Labels</Text>
            <Switch
              value={config.showDepthLabels}
              onValueChange={(value) => updateConfig({ showDepthLabels: value })}
              trackColor={{ false: '#767577', true: '#3E95CD' }}
              thumbColor={config.showDepthLabels ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Terrain Exaggeration */}
          {config.enable3DTerrain && (
            <View style={styles.section}>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>
                  3D Terrain Exaggeration: {config.terrainExaggeration.toFixed(1)}x
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={5}
                  step={0.1}
                  value={config.terrainExaggeration}
                  onValueChange={(value) => updateConfig({ terrainExaggeration: value })}
                  minimumTrackTintColor="#3E95CD"
                  maximumTrackTintColor="#d3d3d3"
                  thumbTintColor="#3E95CD"
                />
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function PresetButton({
  label,
  active,
  onPress
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.presetButton, active && styles.presetButtonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.presetButtonText, active && styles.presetButtonTextActive]}>
        {label}
      </Text>
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
    alignItems: 'center'
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  expandIcon: {
    fontSize: 20,
    color: '#3E95CD',
    fontWeight: 'bold'
  },
  expandedContent: {
    maxHeight: 400,
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
    flexWrap: 'wrap',
    gap: 8
  },
  presetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#d0d0d0'
  },
  presetButtonActive: {
    backgroundColor: '#3E95CD',
    borderColor: '#3E95CD'
  },
  presetButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500'
  },
  presetButtonTextActive: {
    color: '#fff'
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  toggleLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  sliderContainer: {
    marginTop: 8,
    paddingLeft: 12
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  slider: {
    width: '100%',
    height: 40
  }
});
