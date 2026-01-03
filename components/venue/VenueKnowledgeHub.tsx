/**
 * VenueKnowledgeHub - Content-first venue knowledge display
 * Tabs: Local Intel | Discussions | Documents | Q&A
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { LiveConditionsCard } from './LiveConditionsCard';
import { TideCurrentPanel } from './TideCurrentPanel';
import { WindPatternCard } from './WindPatternCard';
import { RacingIntelSection } from './RacingIntelSection';
import { FleetCommunityCard } from './FleetCommunityCard';
import { CommunityTipsCard } from './CommunityTipsCard';
import { DiscussionList } from './DiscussionList';
import { DiscussionThread } from './DiscussionThread';
import { DiscussionComposer } from './DiscussionComposer';
import { DocumentList } from './DocumentList';
import { DocumentDetail } from './DocumentDetail';
import { DocumentUploader } from './DocumentUploader';
import { RacingAreaSelector } from './RacingAreaSelector';
import { UpcomingRacesSection } from './UpcomingRacesSection';
import { VenueDiscussion } from '@/services/venue/VenueDiscussionService';
import { VenueKnowledgeDocument } from '@/services/venue/VenueDocumentService';
import { useAuth } from '@/providers/AuthProvider';

type TabKey = 'intel' | 'races' | 'discussions' | 'documents' | 'results';

interface RacingAreaSelection {
  racingAreaId: string | null;
  raceRouteId: string | null;
  name: string | null;
}

interface VenueKnowledgeHubProps {
  venueId: string;
  venueName: string;
  latitude: number;
  longitude: number;
  currentWindDirection?: number;
  currentWindSpeed?: number;
  onShowMap?: () => void;
}

export function VenueKnowledgeHub({
  venueId,
  venueName,
  latitude,
  longitude,
  currentWindDirection,
  currentWindSpeed,
  onShowMap,
}: VenueKnowledgeHubProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('intel');

  // Racing area filter state
  const [selectedRacingArea, setSelectedRacingArea] = useState<RacingAreaSelection>({
    racingAreaId: null,
    raceRouteId: null,
    name: null,
  });

  // Discussion state
  const [selectedDiscussion, setSelectedDiscussion] = useState<VenueDiscussion | null>(null);
  const [showComposer, setShowComposer] = useState(false);

  // Document state
  const [selectedDocument, setSelectedDocument] = useState<VenueKnowledgeDocument | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  const handleCreateDiscussion = () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to start a discussion');
      return;
    }
    setShowComposer(true);
  };

  const handleUploadDocument = () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to upload documents');
      return;
    }
    setShowUploader(true);
  };

  const allTabs: { key: TabKey; label: string; icon: string; requiresAuth: boolean }[] = [
    { key: 'intel', label: 'Local Intel', icon: 'bulb-outline', requiresAuth: false },
    { key: 'races', label: 'Races', icon: 'flag-outline', requiresAuth: false },
    { key: 'discussions', label: 'Discussions', icon: 'chatbubbles-outline', requiresAuth: false },
    { key: 'documents', label: 'Documents', icon: 'document-text-outline', requiresAuth: false },
    { key: 'results', label: 'My Results', icon: 'trophy-outline', requiresAuth: true },
  ];

  // Filter tabs based on auth state - hide personal tabs for non-logged-in users
  const tabs = allTabs.filter(tab => !tab.requiresAuth || user);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'intel':
        return (
          <ScrollView
            style={styles.tabContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tabContentInner}
          >
            {/* Live Conditions */}
            <LiveConditionsCard
              latitude={latitude}
              longitude={longitude}
              venueId={venueId}
              venueName={venueName}
            />

            {/* Tide & Current */}
            <TideCurrentPanel
              latitude={latitude}
              longitude={longitude}
            />

            {/* Wind Patterns */}
            <WindPatternCard
              venueId={venueId}
              venueName={venueName}
              currentWindDirection={currentWindDirection}
              currentWindSpeed={currentWindSpeed}
            />

            {/* Community Tips */}
            <CommunityTipsCard
              venueId={venueId}
              venueName={venueName}
            />

            {/* Racing Intelligence */}
            <RacingIntelSection
              venueId={venueId}
              venueName={venueName}
            />

            {/* Active Fleets */}
            <FleetCommunityCard
              venueId={venueId}
              venueName={venueName}
            />
          </ScrollView>
        );

      case 'races':
        return (
          <ScrollView
            style={styles.tabContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tabContentInner}
          >
            <UpcomingRacesSection
              venueId={venueId}
              venueName={venueName}
              limit={20}
            />
          </ScrollView>
        );

      case 'discussions':
        // If viewing a specific discussion, show the thread
        if (selectedDiscussion) {
          return (
            <DiscussionThread
              discussion={selectedDiscussion}
              venueId={venueId}
              onBack={() => setSelectedDiscussion(null)}
            />
          );
        }

        // Otherwise show the discussion list
        return (
          <DiscussionList
            venueId={venueId}
            racingAreaId={selectedRacingArea.racingAreaId}
            raceRouteId={selectedRacingArea.raceRouteId}
            onSelectDiscussion={(discussion) => setSelectedDiscussion(discussion)}
            onCreateDiscussion={handleCreateDiscussion}
          />
        );

      case 'documents':
        // If viewing a specific document, show the detail
        if (selectedDocument) {
          return (
            <DocumentDetail
              document={selectedDocument}
              venueId={venueId}
              onBack={() => setSelectedDocument(null)}
              onShowOnMap={onShowMap ? (coords, name) => {
                // Could switch to map view and highlight location
                onShowMap();
              } : undefined}
            />
          );
        }

        // Otherwise show the document list
        return (
          <DocumentList
            venueId={venueId}
            racingAreaId={selectedRacingArea.racingAreaId}
            raceRouteId={selectedRacingArea.raceRouteId}
            onSelectDocument={(document) => setSelectedDocument(document)}
            onUploadDocument={handleUploadDocument}
          />
        );

      case 'results':
        // My Results tab - only shown to logged-in users
        return (
          <ScrollView
            style={styles.tabContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tabContentInner}
          >
            <View style={styles.resultsContainer}>
              <View style={styles.resultsSummary}>
                <Ionicons name="trophy" size={48} color="#F59E0B" />
                <ThemedText style={styles.emptyTitle}>My Results at {venueName}</ThemedText>
                <ThemedText style={styles.emptyText}>
                  Track your race results, placements, and performance history at this venue.
                </ThemedText>
              </View>
              {/* Placeholder for results - will be populated from race data */}
              <View style={styles.resultsEmptyState}>
                <Ionicons name="ribbon-outline" size={32} color="#9CA3AF" />
                <ThemedText style={styles.resultsEmptyText}>
                  No race results yet at this venue.
                </ThemedText>
                <ThemedText style={styles.resultsHintText}>
                  Participate in races to see your results here.
                </ThemedText>
              </View>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Racing Area Selector */}
      <RacingAreaSelector
        venueId={venueId}
        venueName={venueName}
        selectedAreaId={selectedRacingArea.racingAreaId}
        selectedRouteId={selectedRacingArea.raceRouteId}
        onSelect={setSelectedRacingArea}
      />

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? '#2563EB' : '#6B7280'}
            />
            <ThemedText
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Show Map Button */}
      {onShowMap && activeTab === 'intel' && (
        <TouchableOpacity style={styles.showMapButton} onPress={onShowMap}>
          <Ionicons name="map-outline" size={18} color="#2563EB" />
          <ThemedText style={styles.showMapText}>Show Map</ThemedText>
        </TouchableOpacity>
      )}

      {/* Discussion Composer Modal */}
      <DiscussionComposer
        venueId={venueId}
        venueName={venueName}
        visible={showComposer}
        onClose={() => setShowComposer(false)}
        onSuccess={() => {
          // Optionally switch to discussions tab if not already there
          setActiveTab('discussions');
        }}
        defaultRacingAreaId={selectedRacingArea.racingAreaId}
        defaultRaceRouteId={selectedRacingArea.raceRouteId}
      />

      {/* Document Uploader Modal */}
      <DocumentUploader
        venueId={venueId}
        venueName={venueName}
        visible={showUploader}
        onClose={() => setShowUploader(false)}
        onSuccess={() => {
          // Optionally switch to documents tab if not already there
          setActiveTab('documents');
        }}
        defaultRacingAreaId={selectedRacingArea.racingAreaId}
        defaultRaceRouteId={selectedRacingArea.raceRouteId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563EB',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabLabelActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  tabContentInner: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 300,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  signInPrompt: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  signInText: {
    color: '#6B7280',
    fontSize: 14,
  },
  showMapButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  showMapText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  // Results tab styles
  resultsContainer: {
    gap: 20,
  },
  resultsSummary: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    gap: 8,
  },
  resultsEmptyState: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 32,
    gap: 12,
  },
  resultsEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  resultsHintText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
