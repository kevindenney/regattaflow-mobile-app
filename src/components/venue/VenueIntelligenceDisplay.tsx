/**
 * Venue Intelligence Display Component
 * Showcases the "OnX Maps for Sailing" global venue intelligence system
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useVenueIntelligence } from '@/src/hooks/useVenueIntelligence';
import type { RegionalIntelligenceData } from '@/src/services/venue/RegionalIntelligenceService';

interface VenueIntelligenceDisplayProps {
  style?: any;
}

export function VenueIntelligenceDisplay({ style }: VenueIntelligenceDisplayProps) {
  const {
    currentVenue,
    isDetecting,
    intelligence,
    isLoadingIntelligence,
    locationStatus,
    lastTransition,
    adaptationRequired,
    initializeDetection,
    refreshIntelligence,
  } = useVenueIntelligence();


  const [selectedTab, setSelectedTab] = useState<'weather' | 'tactical' | 'cultural' | 'logistics'>('weather');

  useEffect(() => {
    // Initialize venue detection when component mounts
    const initialize = async () => {
      const success = await initializeDetection();
      if (!success) {
        Alert.alert('Location Error', 'Could not initialize venue detection. Please check location permissions.');
      }
    };

    initialize();
  }, []);

  if (isDetecting) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>🌍 Detecting your sailing venue...</ThemedText>
          <ThemedText style={styles.subText}>Initializing Global Venue Intelligence</ThemedText>
        </View>
      </View>
    );
  }

  if (!currentVenue) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.noVenueContainer}>
          <ThemedText style={styles.noVenueTitle}>🗺️ No Sailing Venue Detected</ThemedText>
          <ThemedText style={styles.noVenueText}>
            Move to a sailing venue or enable location services to experience RegattaFlow's global intelligence
          </ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={initializeDetection}>
            <ThemedText style={styles.retryButtonText}>🔍 Try Again</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Venue Header */}
      <View style={styles.venueHeader}>
        <ThemedText style={styles.venueName}>{currentVenue.name}</ThemedText>
        <ThemedText style={styles.venueLocation}>{currentVenue.country} • {currentVenue.venueType}</ThemedText>

        {/* Location Status */}
        {locationStatus && (
          <View style={styles.locationStatus}>
            <ThemedText style={styles.locationText}>
              📍 {locationStatus.confidence > 0.8 ? 'High' : 'Moderate'} confidence • GPS: {locationStatus.detectionMethod}
            </ThemedText>
          </View>
        )}

        {/* Adaptation Required Alert */}
        {adaptationRequired && lastTransition && (
          <View style={styles.adaptationAlert}>
            <ThemedText style={styles.adaptationTitle}>🔄 Venue Adaptation Required</ThemedText>
            {lastTransition.adaptationRequired.slice(0, 2).map((adaptation, index) => (
              <ThemedText key={index} style={styles.adaptationText}>
                • {adaptation.description}
              </ThemedText>
            ))}
          </View>
        )}
      </View>

      {/* Intelligence Tabs */}
      <View style={styles.tabContainer}>
        {(['weather', 'tactical', 'cultural', 'logistics'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <ThemedText style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
              {tab === 'weather' && '🌤️ Weather'}
              {tab === 'tactical' && '🎯 Tactics'}
              {tab === 'cultural' && '🌍 Culture'}
              {tab === 'logistics' && '📋 Logistics'}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {isLoadingIntelligence ? (
          <View style={styles.loadingContent}>
            <ThemedText style={styles.loadingText}>Loading venue intelligence...</ThemedText>
          </View>
        ) : intelligence ? (
          <IntelligenceContent intelligence={intelligence} selectedTab={selectedTab} />
        ) : (
          <View style={styles.noIntelligence}>
            <ThemedText style={styles.noIntelligenceText}>No intelligence available for this venue</ThemedText>
            <TouchableOpacity style={styles.refreshButton} onPress={refreshIntelligence}>
              <ThemedText style={styles.refreshButtonText}>🔄 Refresh</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface IntelligenceContentProps {
  intelligence: RegionalIntelligenceData;
  selectedTab: 'weather' | 'tactical' | 'cultural' | 'logistics';
}

function IntelligenceContent({ intelligence, selectedTab }: IntelligenceContentProps) {
  switch (selectedTab) {
    case 'weather':
      return <WeatherIntelligence weather={intelligence.weatherIntelligence} />;
    case 'tactical':
      return <TacticalIntelligence tactical={intelligence.tacticalIntelligence} />;
    case 'cultural':
      return <CulturalIntelligence cultural={intelligence.culturalIntelligence} />;
    case 'logistics':
      return <LogisticsIntelligence logistics={intelligence.logisticalIntelligence} />;
    default:
      return null;
  }
}

function WeatherIntelligence({ weather }: { weather: any }) {
  const current = weather.currentConditions;
  const forecast = weather.forecast.slice(0, 8); // Next 24 hours

  return (
    <View style={styles.intelligenceSection}>
      {/* Current Conditions */}
      <View style={styles.currentConditions}>
        <ThemedText style={styles.sectionTitle}>Current Conditions</ThemedText>
        <View style={styles.conditionsGrid}>
          <View style={styles.conditionItem}>
            <ThemedText style={styles.conditionValue}>{current.windSpeed}kt</ThemedText>
            <ThemedText style={styles.conditionLabel}>Wind Speed</ThemedText>
          </View>
          <View style={styles.conditionItem}>
            <ThemedText style={styles.conditionValue}>{current.windDirection}°</ThemedText>
            <ThemedText style={styles.conditionLabel}>Direction</ThemedText>
          </View>
          <View style={styles.conditionItem}>
            <ThemedText style={styles.conditionValue}>{current.gusts}kt</ThemedText>
            <ThemedText style={styles.conditionLabel}>Gusts</ThemedText>
          </View>
          <View style={styles.conditionItem}>
            <ThemedText style={styles.conditionValue}>{current.temperature}°C</ThemedText>
            <ThemedText style={styles.conditionLabel}>Air Temp</ThemedText>
          </View>
        </View>
      </View>

      {/* Racing Recommendations */}
      <View style={styles.recommendationsSection}>
        <ThemedText style={styles.sectionTitle}>Racing Recommendations</ThemedText>
        {weather.racingRecommendations.map((rec: string, index: number) => (
          <View key={index} style={styles.recommendationItem}>
            <ThemedText style={styles.recommendationText}>• {rec}</ThemedText>
          </View>
        ))}
      </View>

      {/* Local Patterns */}
      <View style={styles.patternsSection}>
        <ThemedText style={styles.sectionTitle}>Local Weather Patterns</ThemedText>
        {weather.localPatterns.map((pattern: any, index: number) => (
          <View key={index} style={styles.patternItem}>
            <ThemedText style={styles.patternName}>{pattern.name}</ThemedText>
            <ThemedText style={styles.patternDescription}>{pattern.description}</ThemedText>
            <ThemedText style={styles.patternImplications}>{pattern.racingImplications}</ThemedText>
          </View>
        ))}
      </View>

      {/* Forecast */}
      <View style={styles.forecastSection}>
        <ThemedText style={styles.sectionTitle}>24-Hour Forecast</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {forecast.map((f: any, index: number) => (
            <View key={index} style={styles.forecastItem}>
              <ThemedText style={styles.forecastTime}>
                {new Date(f.time).getHours().toString().padStart(2, '0')}:00
              </ThemedText>
              <ThemedText style={styles.forecastWind}>{f.windSpeed}kt</ThemedText>
              <View style={[styles.conditionsBadge, styles[`conditions${f.racingConditions}`]]}>
                <ThemedText style={styles.conditionsBadgeText}>{f.racingConditions}</ThemedText>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function TacticalIntelligence({ tactical }: { tactical: any }) {
  return (
    <View style={styles.intelligenceSection}>
      {/* Local Tactics */}
      <View style={styles.tacticsSection}>
        <ThemedText style={styles.sectionTitle}>Local Racing Tactics</ThemedText>
        {tactical.localTactics.map((tactic: any, index: number) => (
          <View key={index} style={styles.tacticItem}>
            <ThemedText style={styles.tacticSituation}>{tactic.situation}</ThemedText>
            <ThemedText style={styles.tacticRecommendation}>{tactic.recommendation}</ThemedText>
            <View style={styles.tacticMeta}>
              <ThemedText style={styles.confidenceBadge}>
                {tactic.confidence} confidence
              </ThemedText>
              <ThemedText style={styles.sourceBadge}>
                {tactic.source}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      {/* Equipment Recommendations */}
      <View style={styles.equipmentSection}>
        <ThemedText style={styles.sectionTitle}>Equipment Recommendations</ThemedText>
        {tactical.equipmentRecommendations.map((eq: any, index: number) => (
          <View key={index} style={styles.equipmentItem}>
            <ThemedText style={styles.equipmentName}>{eq.item}</ThemedText>
            <ThemedText style={styles.equipmentReasoning}>{eq.reasoning}</ThemedText>
            <View style={styles.equipmentMeta}>
              <ThemedText style={[styles.priorityBadge, styles[`priority${eq.priority}`]]}>
                {eq.priority}
              </ThemedText>
              <ThemedText style={styles.availabilityBadge}>
                {eq.localAvailability.replace(/_/g, ' ')}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      {/* Performance Factors */}
      <View style={styles.performanceSection}>
        <ThemedText style={styles.sectionTitle}>Key Performance Factors</ThemedText>
        {tactical.performanceFactors.map((factor: any, index: number) => (
          <View key={index} style={styles.performanceItem}>
            <View style={styles.performanceHeader}>
              <ThemedText style={styles.performanceFactor}>{factor.factor}</ThemedText>
              <View style={[styles.impactBadge, styles[`impact${factor.impact}`]]}>
                <ThemedText style={styles.impactText}>{factor.impact} impact</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.performanceDescription}>{factor.description}</ThemedText>
            <ThemedText style={styles.performanceOptimization}>💡 {factor.optimization}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

function CulturalIntelligence({ cultural }: { cultural: any }) {
  return (
    <View style={styles.intelligenceSection}>
      {/* Protocol Reminders */}
      <View style={styles.protocolSection}>
        <ThemedText style={styles.sectionTitle}>Cultural Protocols</ThemedText>
        {cultural.protocolReminders.map((protocol: any, index: number) => (
          <View key={index} style={styles.protocolItem}>
            <ThemedText style={styles.protocolSituation}>{protocol.situation}</ThemedText>
            <ThemedText style={styles.protocolText}>{protocol.protocol}</ThemedText>
            <View style={styles.protocolMeta}>
              <ThemedText style={[styles.importanceBadge, styles[`importance${protocol.importance}`]]}>
                {protocol.importance}
              </ThemedText>
              <ThemedText style={styles.timingBadge}>{protocol.timing.replace(/_/g, ' ')}</ThemedText>
            </View>
          </View>
        ))}
      </View>

      {/* Networking Opportunities */}
      <View style={styles.networkingSection}>
        <ThemedText style={styles.sectionTitle}>Networking Opportunities</ThemedText>
        {cultural.networkingOpportunities.map((opp: any, index: number) => (
          <View key={index} style={styles.networkingItem}>
            <ThemedText style={styles.networkingName}>{opp.name}</ThemedText>
            <ThemedText style={styles.networkingDescription}>{opp.description}</ThemedText>
            <View style={styles.networkingMeta}>
              <ThemedText style={[styles.valueBadge, styles[`value${opp.value}`]]}>
                {opp.value} value
              </ThemedText>
              <ThemedText style={styles.attendanceBadge}>{opp.attendance}</ThemedText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function LogisticsIntelligence({ logistics }: { logistics: any }) {
  return (
    <View style={styles.intelligenceSection}>
      {/* Transportation */}
      <View style={styles.transportSection}>
        <ThemedText style={styles.sectionTitle}>Transportation</ThemedText>
        <ThemedText style={styles.airport}>✈️ {logistics.transportation.airport}</ThemedText>

        <ThemedText style={styles.subSectionTitle}>Transfer Options</ThemedText>
        {logistics.transportation.transferOptions.map((option: any, index: number) => (
          <View key={index} style={styles.transferItem}>
            <ThemedText style={styles.transferMethod}>{option.method}</ThemedText>
            <ThemedText style={styles.transferDetails}>
              {option.duration} • ${option.cost} • {option.convenience} convenience
            </ThemedText>
            {option.notes && (
              <ThemedText style={styles.transferNotes}>{option.notes}</ThemedText>
            )}
          </View>
        ))}
      </View>

      {/* Sailing Services */}
      {logistics.sailingServices && (
        <View style={styles.sailingServicesSection}>
          <ThemedText style={styles.sectionTitle}>Sailing Services</ThemedText>

          {/* Yacht Clubs */}
          {logistics.sailingServices.yachtClubs?.length > 0 && (
            <View style={styles.serviceCategory}>
              <ThemedText style={styles.serviceCategoryTitle}>🏆 Yacht Clubs</ThemedText>
              {logistics.sailingServices.yachtClubs.map((club: any, index: number) => (
                <View key={index} style={styles.serviceItem}>
                  <View style={styles.serviceHeader}>
                    <ThemedText style={styles.serviceName}>{club.name}</ThemedText>
                    <ThemedText style={[styles.reputationBadge, styles[`reputation${club.reputation}`]]}>
                      {club.reputation}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.serviceSpecialty}>{club.specialty}</ThemedText>
                  <ThemedText style={styles.serviceContact}>{club.contact}</ThemedText>
                  <ThemedText style={styles.serviceLocation}>📍 {club.location}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Sailmakers */}
          {logistics.sailingServices.sailmakers?.length > 0 && (
            <View style={styles.serviceCategory}>
              <ThemedText style={styles.serviceCategoryTitle}>⛵ Sailmakers</ThemedText>
              {logistics.sailingServices.sailmakers.map((sailmaker: any, index: number) => (
                <View key={index} style={styles.serviceItem}>
                  <View style={styles.serviceHeader}>
                    <ThemedText style={styles.serviceName}>{sailmaker.name}</ThemedText>
                    <ThemedText style={[styles.pricingBadge, styles[`pricing${sailmaker.pricing}`]]}>
                      {sailmaker.pricing}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.serviceSpecialty}>{sailmaker.specialty}</ThemedText>
                  <ThemedText style={styles.serviceContact}>{sailmaker.contact}</ThemedText>
                  <ThemedText style={styles.serviceLanguages}>🗣️ {sailmaker.languages.join(', ')}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Chandleries */}
          {logistics.sailingServices.chandleries?.length > 0 && (
            <View style={styles.serviceCategory}>
              <ThemedText style={styles.serviceCategoryTitle}>🔧 Chandleries</ThemedText>
              {logistics.sailingServices.chandleries.map((chandlery: any, index: number) => (
                <View key={index} style={styles.serviceItem}>
                  <View style={styles.serviceHeader}>
                    <ThemedText style={styles.serviceName}>{chandlery.name}</ThemedText>
                    <ThemedText style={[styles.pricingBadge, styles[`pricing${chandlery.pricing}`]]}>
                      {chandlery.pricing}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.serviceSpecialty}>{chandlery.specialty}</ThemedText>
                  <ThemedText style={styles.serviceContact}>{chandlery.contact}</ThemedText>
                  <ThemedText style={styles.serviceLocation}>📍 {chandlery.location}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Foul Weather Gear Stores */}
          {logistics.sailingServices.foulWeatherGear?.length > 0 && (
            <View style={styles.serviceCategory}>
              <ThemedText style={styles.serviceCategoryTitle}>🧥 Foul Weather Gear</ThemedText>
              {logistics.sailingServices.foulWeatherGear.map((store: any, index: number) => (
                <View key={index} style={styles.serviceItem}>
                  <View style={styles.serviceHeader}>
                    <ThemedText style={styles.serviceName}>{store.name}</ThemedText>
                    <ThemedText style={[styles.pricingBadge, styles[`pricing${store.pricing}`]]}>
                      {store.pricing}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.serviceSpecialty}>{store.specialty}</ThemedText>
                  <ThemedText style={styles.serviceContact}>{store.contact}</ThemedText>
                  <ThemedText style={styles.serviceLanguages}>🗣️ {store.languages.join(', ')}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Rigging Services */}
          {logistics.sailingServices.riggingServices?.length > 0 && (
            <View style={styles.serviceCategory}>
              <ThemedText style={styles.serviceCategoryTitle}>🔗 Rigging Services</ThemedText>
              {logistics.sailingServices.riggingServices.map((rigging: any, index: number) => (
                <View key={index} style={styles.serviceItem}>
                  <View style={styles.serviceHeader}>
                    <ThemedText style={styles.serviceName}>{rigging.name}</ThemedText>
                    <ThemedText style={[styles.pricingBadge, styles[`pricing${rigging.pricing}`]]}>
                      {rigging.pricing}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.serviceSpecialty}>{rigging.specialty}</ThemedText>
                  <ThemedText style={styles.serviceContact}>{rigging.contact}</ThemedText>
                  <ThemedText style={styles.serviceLanguages}>🗣️ {rigging.languages.join(', ')}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Cost Estimates */}
      <View style={styles.costSection}>
        <ThemedText style={styles.sectionTitle}>Cost Estimates</ThemedText>
        {logistics.costEstimates.map((cost: any, index: number) => (
          <View key={index} style={styles.costItem}>
            <View style={styles.costHeader}>
              <ThemedText style={styles.costName}>{cost.item}</ThemedText>
              <ThemedText style={styles.costAmount}>${cost.estimatedCost} {cost.currency}</ThemedText>
            </View>
            <ThemedText style={styles.costCategory}>{cost.category}</ThemedText>
          </View>
        ))}
      </View>

      {/* Timeline */}
      <View style={styles.timelineSection}>
        <ThemedText style={styles.sectionTitle}>Preparation Timeline</ThemedText>
        {logistics.timeline.map((item: any, index: number) => (
          <View key={index} style={styles.timelineItem}>
            <ThemedText style={styles.timelineTask}>{item.task}</ThemedText>
            <ThemedText style={styles.timelineTiming}>{item.recommendedTiming}</ThemedText>
            <ThemedText style={[styles.timelineImportance, styles[`importance${item.importance}`]]}>
              {item.importance}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  noVenueContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noVenueTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  noVenueText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  venueHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  venueName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  venueLocation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  adaptationAlert: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    marginTop: 8,
  },
  adaptationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  adaptationText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContent: {
    padding: 20,
    alignItems: 'center',
  },
  noIntelligence: {
    padding: 20,
    alignItems: 'center',
  },
  noIntelligenceText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  intelligenceSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  currentConditions: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  conditionItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 12,
  },
  conditionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  conditionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  recommendationsSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  recommendationItem: {
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  patternsSection: {
    marginBottom: 16,
  },
  patternItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  patternName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  patternDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  patternImplications: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  forecastSection: {
    marginBottom: 16,
  },
  forecastItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  forecastTime: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  forecastWind: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 6,
  },
  conditionsBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  conditionsBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  conditionsexcellent: { backgroundColor: '#28a745' },
  conditionsgood: { backgroundColor: '#ffc107' },
  conditionschallenging: { backgroundColor: '#fd7e14' },
  conditionsdifficult: { backgroundColor: '#dc3545' },

  // Tactical Styles
  tacticsSection: {
    marginBottom: 16,
  },
  tacticItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  tacticSituation: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tacticRecommendation: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  tacticMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  confidenceBadge: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  sourceBadge: {
    fontSize: 12,
    color: '#6c757d',
  },
  equipmentSection: {
    marginBottom: 16,
  },
  equipmentItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  equipmentReasoning: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  equipmentMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#fff',
  },
  priorityessential: { backgroundColor: '#dc3545' },
  priorityrecommended: { backgroundColor: '#ffc107' },
  priorityoptional: { backgroundColor: '#6c757d' },
  availabilityBadge: {
    fontSize: 12,
    color: '#007AFF',
  },
  performanceSection: {
    marginBottom: 16,
  },
  performanceItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceFactor: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  impactText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  impacthigh: { backgroundColor: '#dc3545' },
  impactmoderate: { backgroundColor: '#ffc107' },
  impactlow: { backgroundColor: '#28a745' },
  performanceDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  performanceOptimization: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },

  // Cultural Styles
  protocolSection: {
    marginBottom: 16,
  },
  protocolItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  protocolSituation: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  protocolText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  protocolMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  importanceBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#fff',
  },
  importancecritical: { backgroundColor: '#dc3545' },
  importanceimportant: { backgroundColor: '#ffc107' },
  importancehelpful: { backgroundColor: '#28a745' },
  timingBadge: {
    fontSize: 12,
    color: '#6c757d',
  },
  networkingSection: {
    marginBottom: 16,
  },
  networkingItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  networkingName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  networkingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  networkingMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  valueBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#fff',
  },
  valuehigh: { backgroundColor: '#28a745' },
  valuemoderate: { backgroundColor: '#ffc107' },
  valuelow: { backgroundColor: '#6c757d' },
  attendanceBadge: {
    fontSize: 12,
    color: '#007AFF',
  },

  // Logistics Styles
  transportSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  airport: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  transferItem: {
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e1e5e9',
  },
  transferMethod: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  transferDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transferNotes: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  costSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  costItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  costHeader: {
    flex: 1,
  },
  costName: {
    fontSize: 14,
    fontWeight: '600',
  },
  costCategory: {
    fontSize: 12,
    color: '#666',
  },
  costAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  timelineSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  timelineItem: {
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  timelineTask: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  timelineTiming: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  timelineImportance: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Sailing Services Styles
  sailingServicesSection: {
    marginBottom: 16,
  },
  serviceCategory: {
    marginBottom: 20,
  },
  serviceCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  serviceItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  serviceSpecialty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  serviceContact: {
    fontSize: 13,
    color: '#007AFF',
    marginBottom: 4,
  },
  serviceLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  serviceLanguages: {
    fontSize: 12,
    color: '#666',
  },
  reputationBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: '#fff',
  },
  reputationexcellent: { backgroundColor: '#28a745' },
  reputationhigh: { backgroundColor: '#007AFF' },
  reputationgood: { backgroundColor: '#ffc107', color: '#000' },
  pricingBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: '#fff',
  },
  pricingpremium: { backgroundColor: '#dc3545' },
  pricingmoderate: { backgroundColor: '#ffc107', color: '#000' },
  pricingcompetitive: { backgroundColor: '#28a745' },
  pricingaffordable: { backgroundColor: '#17a2b8' },
});