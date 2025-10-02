/**
 * Role-Specific Dashboard - Unified Dashboard with User Type Adaptation
 * Supports Sailors (venue intelligence & strategy), Coaches (client management),
 * and Clubs (operations & events) with dynamic tab-based navigation
 */

import { useAuth } from '@/src/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Role-specific Overview Components (tabs removed, only showing overview)
import { SailorOverviewEnhanced } from '@/src/components/dashboard/sailor';
import { CoachOverview } from '@/src/components/dashboard/coach';
import { ClubOverview } from '@/src/components/dashboard/club';

// Role-specific Hooks
import {
    useClubDashboardData,
    useCoachDashboardData,
    useSailorDashboardData,
} from '@/src/hooks';

export default function DashboardScreen() {
  const { user, signedIn, ready, loading: authLoading, userType } = useAuth();

  // Auth Guard: Redirect to landing page if not authenticated
  useEffect(() => {
    if (ready && !signedIn && !authLoading) {
      if (Platform.OS === 'web') {
        window.location.href = '/';
      } else {
        router.replace('/');
      }
    }
  }, [ready, signedIn, authLoading]);

  // State for refreshing
  const [refreshing, setRefreshing] = useState(false);

  // Role-specific data hooks - must call all hooks (React rules)
  const sailorData = useSailorDashboardData();
  const coachData = useCoachDashboardData();
  const clubData = useClubDashboardData();

  // Get appropriate data based on user type
  const getCurrentData = () => {
    switch (userType) {
      case 'coach':
        return coachData;
      case 'club':
        return clubData;
      case 'sailor':
      default:
        return sailorData;
    }
  };

  const currentData = getCurrentData();

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // Data will refresh automatically via the hooks
    setTimeout(() => setRefreshing(false), 1000);
  };


  // Show loading for auth or initial data load
  if (authLoading || !ready || currentData.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>
          {userType === 'sailor' && '🌍 Initializing Global Sailing Intelligence...'}
          {userType === 'coach' && '💼 Loading Coach Dashboard...'}
          {userType === 'club' && '🏢 Loading Club Management...'}
        </Text>
        <Text style={styles.loadingSubtext}>
          {userType === 'sailor' && 'Loading venue detection and strategy tools'}
          {userType === 'coach' && 'Loading client data and marketplace information'}
          {userType === 'club' && 'Loading events, members, and facilities'}
        </Text>
      </View>
    );
  }

  // Error state
  if (currentData.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load dashboard data</Text>
        <Text style={styles.errorMessage}>{currentData.error}</Text>
      </View>
    );
  }

  // Render role-specific tab content
  const renderTabContent = () => {
    switch (userType) {
      case 'sailor':
        return renderSailorContent();
      case 'coach':
        return renderCoachContent();
      case 'club':
        return renderClubContent();
      default:
        return renderSailorContent();
    }
  };

  const renderSailorContent = () => {
    const data = sailorData;
    // Always show overview - no tabs
    return (
      <SailorOverviewEnhanced
        upcomingRaces={data.races?.map(race => ({
          id: race.id,
          title: race.name,
          venue: race.venue,
          country: 'USA', // This should come from venue data
          startDate: race.startDate,
          daysUntil: Math.ceil((new Date(race.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          strategyStatus: race.hasStrategy ? 'ready' : 'pending',
          weatherConfidence: race.weatherConfidence || 0,
          hasDocuments: race.documentsReady,
          hasTuningGuides: race.tuningGuideReady,
          hasCrewAssigned: race.crewAssigned,
          classId: race.classId
        })) || []}
        stats={{
          totalRegattas: data.performance?.seasonStats?.totalRaces || 0,
          venuesVisited: data.performance?.venueComparison?.length || 0,
          avgPosition: data.performance?.seasonStats?.averagePosition || 0,
          globalRanking: 0, // This would come from a global ranking system
          recentRaces: data.performance?.recentResults?.length || 0,
          strategyWinRate: 0 // This would be calculated from strategy outcomes
        }}
        currentVenue={data.venues.currentVenue ? {
          name: data.venues.currentVenue.name,
          country: data.venues.currentVenue.country,
          confidence: data.venues.currentVenue.confidence,
        } : undefined}
        classes={data.classes || []}
        activeClassId={data.activeClassId}
        sailorId={user?.id}
        onRacePress={(raceId) => console.log('Race pressed:', raceId)}
        onPlanStrategy={(raceId) => console.log('Plan strategy:', raceId)}
        onUploadDocuments={() => console.log('Upload documents')}
        onCheckWeather={() => console.log('Check weather')}
        onViewVenues={() => console.log('View venues')}
        onClassChange={(classId) => sailorData.setActiveClassId(classId)}
        onAddBoat={() => console.log('Add boat')}
        fleetOverview={data.primaryFleetOverview}
        fleetActivity={data.primaryFleetActivity}
        onOpenFleet={() => router.push('/(tabs)/fleet')}
      />
    );
  };

  const renderCoachContent_OLD = () => {
    const data = coachData;
    // Removed old tab logic - this function is not used anymore
    return null;
  };

  const renderSailorContent_OLD_TABS = () => {
    const data = sailorData;
    // Old tab-based code preserved for reference
    switch ('removed') {
      case 'strategy':
        return (
          <RaceStrategyTab
            activeStrategy={data.strategies?.[0] ? {
              id: data.strategies[0].id,
              raceTitle: data.strategies[0].raceName,
              venue: 'Venue TBD', // This would come from race data
              startDate: new Date().toISOString(),
              confidence: data.strategies[0].confidence,
              status: 'ready' as const,
              aiRecommendations: [
                'Start on port tack in light conditions',
                'Watch for wind shifts at 2pm',
                'Conservative starts recommended'
              ],
              weatherConditions: {
                windSpeed: '10-15 knots',
                windDirection: 'SW',
                confidence: 85
              },
              equipment: {
                sail: 'Medium jib',
                setup: 'Standard rake',
                recommendation: 'Consider flattening sail in gusts'
              },
              tactical: {
                startStrategy: 'Port tack, pin end favored',
                upwindStrategy: 'Play the shifts, favor right side',
                downwindStrategy: 'Gybe early to inside track'
              }
            } : undefined}
            strategyLibrary={data.strategies?.map(strategy => ({
              id: strategy.id,
              raceTitle: strategy.raceName,
              venue: 'Venue TBD',
              startDate: new Date().toISOString(),
              confidence: strategy.confidence,
              status: 'ready' as const,
              aiRecommendations: [],
              weatherConditions: {
                windSpeed: '10-15 knots',
                windDirection: 'SW',
                confidence: 85
              },
              equipment: {
                sail: 'Medium jib',
                setup: 'Standard rake',
                recommendation: 'Standard setup'
              },
              tactical: {
                startStrategy: 'TBD',
                upwindStrategy: 'TBD',
                downwindStrategy: 'TBD'
              }
            })) || []}
            onGenerateStrategy={(raceId) => console.log('Generate strategy:', raceId)}
            onViewStrategy={(strategyId) => console.log('View strategy:', strategyId)}
            onUploadDocuments={() => setActiveTab('documents')}
          />
        );
      case 'venues':
        return (
          <VenueIntelligenceTab
            currentVenue={sailorData.venues.currentVenue}
            nearbyVenues={sailorData.venues.nearbyVenues}
            isDetecting={sailorData.venues.isDetecting}
            onVenueSelect={(venueId) => console.log('Venue selected:', venueId)}
            onForceDetection={() => console.log('Force venue detection')}
            onViewVenueDetails={(venueId) => console.log('View venue details:', venueId)}
          />
        );
      case 'documents':
        return (
          <DocumentsTab
            documents={data.documents}
            onDocumentPress={(documentId) => console.log('Document pressed:', documentId)}
            onUploadDocument={() => console.log('Upload document')}
            onProcessDocument={(documentId) => console.log('Process document:', documentId)}
          />
        );
      case 'analytics':
        return (
          <AnalyticsTab
            performanceData={{
              raceResults: data.performance?.recentResults?.map((result, index) => ({
                id: `race-${index}`,
                event: result.raceName,
                venue: result.venue,
                date: result.date,
                position: result.position,
                fleet: result.fleet,
                conditions: 'Moderate'
              })) || [],
              stats: {
                totalRaces: data.performance?.seasonStats?.totalRaces || 0,
                avgPosition: data.performance?.seasonStats?.averagePosition || 0,
                bestPosition: Math.min(...(data.performance?.recentResults?.map(r => r.position) || [99])),
                topThreeFinishes: data.performance?.seasonStats?.podiumFinishes || 0,
                improvementTrend: data.performance?.seasonStats?.improvement || 0,
                consistencyScore: 75
              },
              venuePerformance: data.performance?.venueComparison || [],
              conditionsAnalysis: [
                { conditions: 'Light Wind', races: 5, avgPosition: 3.2, strength: 'strong' },
                { conditions: 'Medium Wind', races: 8, avgPosition: 5.5, strength: 'average' },
                { conditions: 'Heavy Wind', races: 3, avgPosition: 8.0, strength: 'weak' }
              ],
              equipmentCorrelation: [
                { setup: 'Light Air Setup', races: 5, avgPosition: 3.2, effectiveness: 85 },
                { setup: 'Standard Setup', races: 8, avgPosition: 5.5, effectiveness: 70 },
                { setup: 'Heavy Air Setup', races: 3, avgPosition: 8.0, effectiveness: 60 }
              ]
            }}
            onViewRaceDetails={(raceId) => console.log('View race details:', raceId)}
            onViewVenueAnalysis={(venue) => console.log('View venue analysis:', venue)}
          />
        );
      default:
        return renderSailorContent();
    }
  };

  const renderCoachContent = () => {
    const data = coachData;
    // Always show overview - no tabs
    return (
      <CoachOverview
        stats={{
          activeClients: data.clients?.length ?? 0,
          totalSessions: data.sessions?.length ?? 0,
          monthlyEarnings: data.earnings?.monthly?.current ?? 0,
          clientRetention: 0,
          averageRating: 0,
          marketplaceViews: 0,
        }}
        clients={data.clients ?? []}
        upcomingSessions={data.sessions ?? []}
        leads={data.leads ?? []}
        earnings={data.earnings}
        onClientPress={(clientId) => console.log('Client pressed:', clientId)}
        onSessionPress={(sessionId) => console.log('Session pressed:', sessionId)}
        onLeadPress={(leadId) => console.log('Lead pressed:', leadId)}
        onViewAllClients={() => console.log('View all clients')}
        onViewSchedule={() => console.log('View schedule')}
        onViewEarnings={() => console.log('View earnings')}
      />
    );
  };

  const renderCoachContent_OLD_TABS = () => {
    const data = coachData;
    switch ('removed') {
      case 'clients':
        return (
          <ClientsTab
            clients={data.clients}
            onClientPress={(clientId) => console.log('Client pressed:', clientId)}
            onAddClient={() => console.log('Add new client')}
            onScheduleSession={(clientId) => setActiveTab('schedule')}
            onViewProgress={(clientId) => console.log('View progress:', clientId)}
          />
        );
      case 'schedule':
        return (
          <ScheduleTab
            events={data.sessions}
            onEventPress={(eventId) => console.log('Event pressed:', eventId)}
            onAddAvailability={() => console.log('Add availability')}
            onBlockTime={() => console.log('Block time')}
          />
        );
      case 'earnings':
        return (
          <EarningsTab
            earningsData={data.earnings}
            onViewTransaction={(transactionId) => console.log('Transaction pressed:', transactionId)}
            onRequestPayout={() => console.log('Request payout')}
            onViewTaxInfo={() => console.log('View tax info')}
          />
        );
      case 'resources':
        return (
          <ResourcesTab
            resources={data.resources}
            onResourcePress={(resourceId) => console.log('Resource pressed:', resourceId)}
            onCreateTemplate={() => console.log('Create template')}
            onUploadResource={() => console.log('Upload resource')}
          />
        );
      default:
        return renderCoachContent();
    }
  };

  const renderClubContent = () => {
    const data = clubData;
    // Always show overview - no tabs
    return (
      <ClubOverview
        stats={data.stats}
        events={data.events}
        facilities={data.facilities}
        recentActivity={data.recentActivity}
        onEventPress={(eventId) => console.log('Event pressed:', eventId)}
        onMemberPress={(memberId) => console.log('Member pressed:', memberId)}
        onFacilityPress={(facilityId) => console.log('Facility pressed:', facilityId)}
        onViewAllEvents={() => console.log('View all events')}
        onViewAllMembers={() => console.log('View all members')}
        onCreateEvent={() => console.log('Create event')}
      />
    );
  };

  const renderClubContent_OLD_TABS = () => {
    const data = clubData;
    switch ('removed') {
      case 'events':
        return (
          <EventsTab
            events={data.events}
            volunteers={data.volunteers}
            onEventPress={(eventId) => console.log('Event pressed:', eventId)}
            onCreateEvent={() => console.log('Create new event')}
            onManageRegistrations={(eventId) => console.log('Manage registrations:', eventId)}
            onScheduleVolunteers={(eventId) => console.log('Schedule volunteers:', eventId)}
          />
        );
      case 'members':
        return (
          <MembersTab
            members={data.members}
            onMemberPress={(memberId) => console.log('Member pressed:', memberId)}
            onAddMember={() => console.log('Add new member')}
            onSendMessage={(memberId) => console.log('Send message to:', memberId)}
            onUpdateMembership={(memberId) => console.log('Update membership:', memberId)}
          />
        );
      case 'facilities':
        return (
          <FacilitiesTab
            facilities={data.facilities}
            onFacilityPress={(facilityId) => console.log('Facility pressed:', facilityId)}
            onScheduleMaintenance={(facilityId) => console.log('Schedule maintenance:', facilityId)}
            onUpdateStatus={(facilityId, status) => console.log('Update status:', facilityId, status)}
            onReserveFacility={(facilityId) => console.log('Reserve facility:', facilityId)}
          />
        );
      case 'operations':
        return (
          <OperationsTab
            financials={data.financials}
            volunteers={data.volunteers}
            onViewFinancials={() => console.log('View detailed financials')}
            onManageVolunteers={() => console.log('Manage volunteers')}
            onGenerateReport={() => console.log('Generate operations report')}
            onContactMember={(memberId) => console.log('Contact member:', memberId)}
          />
        );
      default:
        return renderClubContent();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Dynamic Content Based on Role and Tab */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }
      : {
          boxShadow: '0px 4px',
          elevation: 3,
        }
    ),
  },
  headerContent: {
    gap: 4,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
  },
  quickActionsButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 10px 20px rgba(29,78,216,0.25)' }
      : {
          boxShadow: '0px 10px',
          elevation: 6,
        }
    ),
  },
  quickActionsText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
});
