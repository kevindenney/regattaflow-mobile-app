/**
 * Universal Map Interface for All User Types
 * Provides role-based 3D mapping features across sailor, coach, and club dashboards
 * OnX Maps for Sailing - Complete venue intelligence and tactical visualization
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProfessionalMapScreen } from '@/components/map/ProfessionalMapScreen';
import { WebMapView } from '@/components/map/WebMapView';
import { useAuth } from '@/providers/AuthProvider';

interface UniversalMapInterfaceProps {
  userType: 'sailor' | 'coach' | 'club';
  venue?: string;
  compactMode?: boolean;
  showMapButton?: boolean;
  initialWeather?: any;
  style?: any;
}

export const UniversalMapInterface: React.FC<UniversalMapInterfaceProps> = ({
  userType,
  venue = 'san-francisco-bay',
  compactMode = false,
  showMapButton = true,
  initialWeather,
  style,
}) => {
  const { user } = useAuth();
  const [showFullMap, setShowFullMap] = useState(false);
  const [mapMode, setMapMode] = useState<'tactical' | 'venue' | 'race'>('venue');
  const [userPreferences, setUserPreferences] = useState({
    show3D: true,
    showWeather: true,
    showBathymetry: true,
    professionalMode: userType === 'coach',
  });

  useEffect(() => {
    // Adjust defaults based on user type
    switch (userType) {
      case 'sailor':
        setMapMode('tactical');
        setUserPreferences(prev => ({
          ...prev,
          show3D: true,
          showWeather: true,
          professionalMode: false,
        }));
        break;
      case 'coach':
        setMapMode('tactical');
        setUserPreferences(prev => ({
          ...prev,
          show3D: true,
          showWeather: true,
          professionalMode: true,
        }));
        break;
      case 'club':
        setMapMode('race');
        setUserPreferences(prev => ({
          ...prev,
          show3D: true,
          showWeather: false,
          professionalMode: false,
        }));
        break;
    }
  }, [userType]);

  const getMapTitle = () => {
    switch (userType) {
      case 'sailor':
        return '🗺️ Tactical Map';
      case 'coach':
        return '🎯 Professional Analysis';
      case 'club':
        return '🏁 Race Operations';
      default:
        return '🗺️ Venue Map';
    }
  };

  const getMapDescription = () => {
    switch (userType) {
      case 'sailor':
        return 'Venue intelligence & race strategy';
      case 'coach':
        return 'Advanced analysis & coaching tools';
      case 'club':
        return 'Course management & race operations';
      default:
        return 'Interactive 3D sailing map';
    }
  };

  const getMapFeatures = () => {
    const baseFeatures = [
      '3D venue visualization',
      'Real-time weather',
      'Bathymetry & currents',
    ];

    switch (userType) {
      case 'sailor':
        return [
          ...baseFeatures,
          'Tactical wind analysis',
          'Race strategy tools',
          'Performance tracking',
        ];
      case 'coach':
        return [
          ...baseFeatures,
          'Advanced analytics',
          'Client performance data',
          'Teaching tools',
          'Session planning',
        ];
      case 'club':
        return [
          ...baseFeatures,
          'Course designer',
          'Race management',
          'Fleet tracking',
          'Safety coordination',
        ];
      default:
        return baseFeatures;
    }
  };

  const renderCompactMap = () => (
    <View style={[styles.compactContainer, style]}>
      <TouchableOpacity
        style={styles.compactMapCard}
        onPress={() => setShowFullMap(true)}
      >
        <View style={styles.compactMapPreview}>
          <WebMapView
            venue={venue}
            style={{ height: '100%', width: '100%' }}
            interactive={false}
          />
          <View style={styles.compactOverlay}>
            <View style={styles.compactHeader}>
              <Ionicons name="map" size={20} color="#FFFFFF" />
              <ThemedText style={styles.compactTitle}>
                {getMapTitle()}
              </ThemedText>
            </View>
            <ThemedText style={styles.compactSubtitle}>
              {getMapDescription()}
            </ThemedText>
            <View style={styles.compactAction}>
              <Ionicons name="expand-outline" size={16} color="#0066CC" />
              <ThemedText style={styles.compactActionText}>
                Open Full Map
              </ThemedText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderMapButton = () => (
    <TouchableOpacity
      style={[styles.mapButton, styles[`${userType}Button`]]}
      onPress={() => setShowFullMap(true)}
    >
      <Ionicons name="map" size={24} color="#FFFFFF" />
      <ThemedText style={styles.mapButtonText}>
        {getMapTitle()}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderFullMapModal = () => (
    <Modal
      visible={showFullMap}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setShowFullMap(false)}
    >
      <View style={styles.fullMapContainer}>
        {/* Map Header */}
        <View style={styles.mapHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFullMap(false)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.mapHeaderContent}>
            <ThemedText style={styles.mapHeaderTitle}>
              {getMapTitle()}
            </ThemedText>
            <ThemedText style={styles.mapHeaderSubtitle}>
              {venue.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </ThemedText>
          </View>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {/* TODO: Open map settings */}}
          >
            <Ionicons name="settings" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Professional Map */}
        <ProfessionalMapScreen
          venue={venue}
          marks={[]} // Would load actual race marks
          initialWeather={initialWeather}
          professionalMode={userPreferences.professionalMode}
        />

        {/* User Type Specific Overlay */}
        {userType === 'sailor' && renderSailorMapOverlay()}
        {userType === 'coach' && renderCoachMapOverlay()}
        {userType === 'club' && renderClubMapOverlay()}
      </View>
    </Modal>
  );

  const renderSailorMapOverlay = () => (
    <View style={styles.userOverlay}>
      <View style={styles.sailorQuickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="navigate" size={20} color="#0066CC" />
          <ThemedText style={styles.quickActionText}>Strategy</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="analytics" size={20} color="#0066CC" />
          <ThemedText style={styles.quickActionText}>Performance</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="location" size={20} color="#0066CC" />
          <ThemedText style={styles.quickActionText}>Track Race</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCoachMapOverlay = () => (
    <View style={styles.userOverlay}>
      <View style={styles.coachQuickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="school" size={20} color="#00AA33" />
          <ThemedText style={styles.quickActionText}>Teaching</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="people" size={20} color="#00AA33" />
          <ThemedText style={styles.quickActionText}>Clients</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="stats-chart" size={20} color="#00AA33" />
          <ThemedText style={styles.quickActionText}>Analysis</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderClubMapOverlay = () => (
    <View style={styles.userOverlay}>
      <View style={styles.clubQuickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="flag" size={20} color="#FF6B35" />
          <ThemedText style={styles.quickActionText}>Course</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="timer" size={20} color="#FF6B35" />
          <ThemedText style={styles.quickActionText}>Race Control</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Ionicons name="shield-checkmark" size={20} color="#FF6B35" />
          <ThemedText style={styles.quickActionText}>Safety</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFeaturesList = () => (
    <View style={styles.featuresContainer}>
      <ThemedText style={styles.featuresTitle}>Map Features</ThemedText>
      {getMapFeatures().map((feature, index) => (
        <View key={index} style={styles.featureItem}>
          <Ionicons name="checkmark-circle" size={16} color="#00AA33" />
          <ThemedText style={styles.featureText}>{feature}</ThemedText>
        </View>
      ))}
    </View>
  );

  // Render based on mode
  if (compactMode) {
    return (
      <>
        {renderCompactMap()}
        {renderFullMapModal()}
      </>
    );
  }

  if (showMapButton) {
    return (
      <>
        {renderMapButton()}
        {renderFullMapModal()}
      </>
    );
  }

  // Full integration mode
  return (
    <View style={[styles.fullIntegrationContainer, style]}>
      <View style={styles.integrationHeader}>
        <ThemedText style={styles.integrationTitle}>
          {getMapTitle()}
        </ThemedText>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setShowFullMap(true)}
        >
          <Ionicons name="expand" size={20} color="#0066CC" />
        </TouchableOpacity>
      </View>

      <View style={styles.integrationMapContainer}>
        <WebMapView
          venue={venue}
          style={{ height: 200, width: '100%' }}
        />
      </View>

      {renderFeaturesList()}
      {renderFullMapModal()}
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Compact mode styles
  compactContainer: {
    margin: 16,
  },
  compactMapCard: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    elevation: 4,
    boxShadow: '0px 2px',
  },
  compactMapPreview: {
    flex: 1,
    position: 'relative',
  },
  compactOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  compactSubtitle: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 8,
  },
  compactAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactActionText: {
    color: '#0066CC',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Map button styles
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    margin: 16,
    elevation: 4,
    boxShadow: '0px 2px',
  },
  sailorButton: {
    backgroundColor: '#0066CC',
  },
  coachButton: {
    backgroundColor: '#00AA33',
  },
  clubButton: {
    backgroundColor: '#FF6B35',
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Full map modal styles
  fullMapContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  closeButton: {
    padding: 8,
  },
  mapHeaderContent: {
    flex: 1,
    marginLeft: 16,
  },
  mapHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mapHeaderSubtitle: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  settingsButton: {
    padding: 8,
  },

  // User type overlays
  userOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  sailorQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 102, 204, 0.9)',
    borderRadius: 25,
    paddingVertical: 12,
  },
  coachQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 170, 51, 0.9)',
    borderRadius: 25,
    paddingVertical: 12,
  },
  clubQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 107, 53, 0.9)',
    borderRadius: 25,
    paddingVertical: 12,
  },
  quickAction: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  // Full integration styles
  fullIntegrationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    overflow: 'hidden',
    elevation: 2,
    boxShadow: '0px 1px',
  },
  integrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  integrationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  expandButton: {
    padding: 4,
  },
  integrationMapContainer: {
    height: 200,
  },

  // Features list styles
  featuresContainer: {
    padding: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});

export default UniversalMapInterface;