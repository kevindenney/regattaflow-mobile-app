/**
 * Venue Intelligence Tab
 * Showcases RegattaFlow's "OnX Maps for Sailing" global venue intelligence system
 */

import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';
import { VenueIntelligenceDisplay } from '@/src/components/venue/VenueIntelligenceDisplay';
import { VenueIntelligenceMapView } from '@/src/components/venue/VenueIntelligenceMapView';

type ViewMode = 'map' | 'data';

export default function VenueScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const { width } = Dimensions.get('window');
  const isTablet = width > 768;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.titleSection}>
          <ThemedText type="title">🌍 Global Venue Intelligence</ThemedText>
          <ThemedText style={styles.subtitle}>
            OnX Maps for Sailing - Globally intelligent, locally expert
          </ThemedText>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              styles.toggleButtonLeft,
              viewMode === 'map' && styles.toggleButtonActive
            ]}
            onPress={() => setViewMode('map')}
          >
            <ThemedText style={[
              styles.toggleButtonText,
              viewMode === 'map' && styles.toggleButtonTextActive
            ]}>
              🗺️ Map
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              styles.toggleButtonRight,
              viewMode === 'data' && styles.toggleButtonActive
            ]}
            onPress={() => setViewMode('data')}
          >
            <ThemedText style={[
              styles.toggleButtonText,
              viewMode === 'data' && styles.toggleButtonTextActive
            ]}>
              📊 Data
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header - only show on non-tablet or when in data mode */}
      {(!isTablet || viewMode === 'data') && renderHeader()}

      {/* Main Content */}
      {viewMode === 'map' ? (
        <VenueIntelligenceMapView style={styles.mapView} />
      ) : (
        <VenueIntelligenceDisplay style={styles.intelligence} />
      )}

      {/* Floating Header for Map Mode on Tablet */}
      {isTablet && viewMode === 'map' && (
        <View style={styles.floatingHeader}>
          <ThemedText style={styles.floatingTitle}>🌍 Global Venue Intelligence</ThemedText>
          <ThemedText style={styles.floatingSubtitle}>OnX Maps for Sailing</ThemedText>

          <View style={styles.floatingToggle}>
            <TouchableOpacity
              style={styles.floatingToggleButton}
              onPress={() => setViewMode('data')}
            >
              <ThemedText style={styles.floatingToggleText}>📊 Switch to Data View</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    backgroundColor: '#fff',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  titleSection: {
    flex: 1,
    minWidth: 200,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  toggleButtonLeft: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  toggleButtonRight: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  mapView: {
    flex: 1,
  },
  intelligence: {
    flex: 1,
  },

  // Floating header for tablet map mode
  floatingHeader: {
    position: 'absolute',
    top: 120,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px',
    elevation: 5,
    zIndex: 300,
    maxWidth: 320,
  },
  floatingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  floatingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  floatingToggle: {
    alignItems: 'flex-start',
  },
  floatingToggleButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  floatingToggleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});