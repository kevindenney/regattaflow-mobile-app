/**
 * Environmental Layers Controls Component
 *
 * React Native universal component for controlling environmental data layers.
 * Unified interface for Tidal, Current, and Wind visualizations.
 *
 * Features:
 * - Toggle tidal, current, and wind layers
 * - Individual layer configuration
 * - Preset configurations for racing/navigation
 * - Real-time data updates
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

interface TidalConfig {
  enabled: boolean;
  showStations: boolean;
  showLabels: boolean;
  colorScheme: 'default' | 'racing' | 'navigation';
  opacity: number;
}

interface CurrentConfig {
  enabled: boolean;
  showArrows: boolean;
  animate: boolean;
  animationSpeed: number;
  colorScheme: 'speed' | 'direction' | 'type';
  opacity: number;
  minSpeed: number;
}

interface WindConfig {
  enabled: boolean;
  style: 'barbs' | 'arrows';
  showSpeed: boolean;
  showGusts: boolean;
  colorScheme: 'beaufort' | 'racing' | 'gradient';
  opacity: number;
  minSpeed: number;
}

interface EnvironmentalLayersConfig {
  tidal: TidalConfig;
  current: CurrentConfig;
  wind: WindConfig;
}

interface EnvironmentalLayersControlsProps {
  /** Current configuration */
  config: EnvironmentalLayersConfig;

  /** Callback when configuration changes */
  onChange: (config: EnvironmentalLayersConfig) => void;

  /** Optional: Custom style for the container */
  style?: any;

  /** Optional: Disable specific layers */
  disabledLayers?: ('tidal' | 'current' | 'wind')[];
}

const DEFAULT_CONFIG: EnvironmentalLayersConfig = {
  tidal: {
    enabled: false,
    showStations: true,
    showLabels: true,
    colorScheme: 'default',
    opacity: 0.8
  },
  current: {
    enabled: false,
    showArrows: true,
    animate: true,
    animationSpeed: 5,
    colorScheme: 'speed',
    opacity: 0.8,
    minSpeed: 0.2
  },
  wind: {
    enabled: true,
    style: 'arrows',
    showSpeed: true,
    showGusts: true,
    colorScheme: 'racing',
    opacity: 0.8,
    minSpeed: 2
  }
};

export function EnvironmentalLayersControls({
  config = DEFAULT_CONFIG,
  onChange,
  style,
  disabledLayers = []
}: EnvironmentalLayersControlsProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedLayer, setExpandedLayer] = useState<'tidal' | 'current' | 'wind' | null>(null);

  // Load saved preferences
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem('@environmental_layers_config');
      if (saved) {
        const savedConfig = JSON.parse(saved);
        onChange(savedConfig);
      }
    } catch (error) {
      console.error('Failed to load environmental layers preferences:', error);
    }
  };

  const savePreferences = async (newConfig: EnvironmentalLayersConfig) => {
    try {
      await AsyncStorage.setItem('@environmental_layers_config', JSON.stringify(newConfig));
    } catch (error) {
      console.error('Failed to save environmental layers preferences:', error);
    }
  };

  const updateConfig = (updates: Partial<EnvironmentalLayersConfig>) => {
    const newConfig = { ...config, ...updates };
    onChange(newConfig);
    savePreferences(newConfig);
  };

  const updateLayerConfig = <T extends keyof EnvironmentalLayersConfig>(
    layer: T,
    updates: Partial<EnvironmentalLayersConfig[T]>
  ) => {
    const newConfig = {
      ...config,
      [layer]: { ...config[layer], ...updates }
    };
    onChange(newConfig);
    savePreferences(newConfig);
  };

  const applyPreset = (preset: 'racing' | 'navigation' | 'analysis') => {
    let presetConfig: EnvironmentalLayersConfig;

    switch (preset) {
      case 'racing':
        presetConfig = {
          tidal: {
            enabled: true,
            showStations: true,
            showLabels: false,
            colorScheme: 'racing',
            opacity: 0.7
          },
          current: {
            enabled: true,
            showArrows: true,
            animate: true,
            animationSpeed: 7,
            colorScheme: 'speed',
            opacity: 0.8,
            minSpeed: 0.3
          },
          wind: {
            enabled: true,
            style: 'arrows',
            showSpeed: true,
            showGusts: true,
            colorScheme: 'racing',
            opacity: 0.8,
            minSpeed: 3
          }
        };
        break;

      case 'navigation':
        presetConfig = {
          tidal: {
            enabled: true,
            showStations: true,
            showLabels: true,
            colorScheme: 'navigation',
            opacity: 0.8
          },
          current: {
            enabled: true,
            showArrows: true,
            animate: false,
            animationSpeed: 5,
            colorScheme: 'speed',
            opacity: 0.7,
            minSpeed: 0.2
          },
          wind: {
            enabled: true,
            style: 'barbs',
            showSpeed: true,
            showGusts: true,
            colorScheme: 'beaufort',
            opacity: 0.8,
            minSpeed: 2
          }
        };
        break;

      case 'analysis':
        presetConfig = {
          tidal: {
            enabled: true,
            showStations: true,
            showLabels: true,
            colorScheme: 'default',
            opacity: 0.9
          },
          current: {
            enabled: true,
            showArrows: true,
            animate: true,
            animationSpeed: 5,
            colorScheme: 'direction',
            opacity: 0.9,
            minSpeed: 0.1
          },
          wind: {
            enabled: true,
            style: 'barbs',
            showSpeed: true,
            showGusts: true,
            colorScheme: 'beaufort',
            opacity: 0.9,
            minSpeed: 0
          }
        };
        break;
    }

    onChange(presetConfig);
    savePreferences(presetConfig);
  };

  const isLayerDisabled = (layer: 'tidal' | 'current' | 'wind') => {
    return disabledLayers.includes(layer);
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
          <Text style={styles.headerTitle}>Environmental Layers</Text>
          <View style={styles.activeIndicators}>
            {config.tidal.enabled && <Text style={styles.activeIndicator}>T</Text>}
            {config.current.enabled && <Text style={styles.activeIndicator}>C</Text>}
            {config.wind.enabled && <Text style={styles.activeIndicator}>W</Text>}
          </View>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '−' : '+'}</Text>
      </TouchableOpacity>

      {/* Expanded Controls */}
      {expanded && (
        <ScrollView style={styles.expandedContent}>
          {/* Presets */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Presets</Text>
            <View style={styles.presetButtons}>
              <PresetButton label="Racing" onPress={() => applyPreset('racing')} />
              <PresetButton label="Navigation" onPress={() => applyPreset('navigation')} />
              <PresetButton label="Analysis" onPress={() => applyPreset('analysis')} />
            </View>
          </View>

          {/* Tidal Layers */}
          {!isLayerDisabled('tidal') && (
            <LayerSection
              title="Tidal"
              icon="🌙"
              enabled={config.tidal.enabled}
              onToggle={(value) => updateLayerConfig('tidal', { enabled: value })}
              expanded={expandedLayer === 'tidal'}
              onExpand={() => setExpandedLayer(expandedLayer === 'tidal' ? null : 'tidal')}
            >
              <View style={styles.layerControls}>
                <ToggleRow
                  label="Show Stations"
                  value={config.tidal.showStations}
                  onChange={(value) => updateLayerConfig('tidal', { showStations: value })}
                />
                <ToggleRow
                  label="Show Labels"
                  value={config.tidal.showLabels}
                  onChange={(value) => updateLayerConfig('tidal', { showLabels: value })}
                />
                <Text style={styles.controlLabel}>Opacity: {Math.round(config.tidal.opacity * 100)}%</Text>
              </View>
            </LayerSection>
          )}

          {/* Current Layers */}
          {!isLayerDisabled('current') && (
            <LayerSection
              title="Currents"
              icon="➡️"
              enabled={config.current.enabled}
              onToggle={(value) => updateLayerConfig('current', { enabled: value })}
              expanded={expandedLayer === 'current'}
              onExpand={() => setExpandedLayer(expandedLayer === 'current' ? null : 'current')}
            >
              <View style={styles.layerControls}>
                <ToggleRow
                  label="Show Arrows"
                  value={config.current.showArrows}
                  onChange={(value) => updateLayerConfig('current', { showArrows: value })}
                />
                <ToggleRow
                  label="Animate"
                  value={config.current.animate}
                  onChange={(value) => updateLayerConfig('current', { animate: value })}
                />
                {config.current.animate && (
                  <Text style={styles.controlLabel}>
                    Animation Speed: {config.current.animationSpeed}
                  </Text>
                )}
                <Text style={styles.controlLabel}>
                  Min Speed: {config.current.minSpeed} kt
                </Text>
              </View>
            </LayerSection>
          )}

          {/* Wind Layers */}
          {!isLayerDisabled('wind') && (
            <LayerSection
              title="Wind"
              icon="💨"
              enabled={config.wind.enabled}
              onToggle={(value) => updateLayerConfig('wind', { enabled: value })}
              expanded={expandedLayer === 'wind'}
              onExpand={() => setExpandedLayer(expandedLayer === 'wind' ? null : 'wind')}
            >
              <View style={styles.layerControls}>
                <View style={styles.styleToggle}>
                  <Text style={styles.controlLabel}>Style:</Text>
                  <View style={styles.styleButtons}>
                    <StyleButton
                      label="Arrows"
                      active={config.wind.style === 'arrows'}
                      onPress={() => updateLayerConfig('wind', { style: 'arrows' })}
                    />
                    <StyleButton
                      label="Barbs"
                      active={config.wind.style === 'barbs'}
                      onPress={() => updateLayerConfig('wind', { style: 'barbs' })}
                    />
                  </View>
                </View>
                <ToggleRow
                  label="Show Speed"
                  value={config.wind.showSpeed}
                  onChange={(value) => updateLayerConfig('wind', { showSpeed: value })}
                />
                <ToggleRow
                  label="Show Gusts"
                  value={config.wind.showGusts}
                  onChange={(value) => updateLayerConfig('wind', { showGusts: value })}
                />
                <Text style={styles.controlLabel}>
                  Min Speed: {config.wind.minSpeed} kt
                </Text>
              </View>
            </LayerSection>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// Helper Components

function LayerSection({
  title,
  icon,
  enabled,
  onToggle,
  expanded,
  onExpand,
  children
}: {
  title: string;
  icon: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  expanded: boolean;
  onExpand: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.layerSection}>
      <View style={styles.layerHeader}>
        <TouchableOpacity
          style={styles.layerTitleContainer}
          onPress={onExpand}
          activeOpacity={0.7}
        >
          <Text style={styles.layerIcon}>{icon}</Text>
          <Text style={styles.layerTitle}>{title}</Text>
          {expanded && <Text style={styles.expandIcon}>▼</Text>}
          {!expanded && <Text style={styles.expandIcon}>▶</Text>}
        </TouchableOpacity>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#767577', true: '#3E95CD' }}
          thumbColor={enabled ? '#fff' : '#f4f3f4'}
        />
      </View>
      {expanded && enabled && children}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#767577', true: '#3E95CD' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
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

function StyleButton({
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
      style={[styles.styleButton, active && styles.styleButtonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.styleButtonText, active && styles.styleButtonTextActive]}>
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
  activeIndicators: {
    flexDirection: 'row',
    gap: 4
  },
  activeIndicator: {
    backgroundColor: '#3E95CD',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  expandIcon: {
    fontSize: 16,
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
  layerSection: {
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden'
  },
  layerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f5f5f5'
  },
  layerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  layerIcon: {
    fontSize: 18,
    marginRight: 8
  },
  layerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  layerControls: {
    padding: 12,
    gap: 8
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  toggleLabel: {
    fontSize: 13,
    color: '#555'
  },
  controlLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  styleToggle: {
    marginBottom: 8
  },
  styleButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  styleButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0d0d0'
  },
  styleButtonActive: {
    backgroundColor: '#3E95CD',
    borderColor: '#3E95CD'
  },
  styleButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500'
  },
  styleButtonTextActive: {
    color: '#fff'
  }
});
