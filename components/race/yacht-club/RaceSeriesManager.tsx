import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { showAlert, showConfirm } from '@/lib/utils/crossPlatformAlert';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { OfficialRaceCourse } from './YachtClubRaceBuilder';

interface RaceSeriesManagerProps {
  courses: OfficialRaceCourse[];
}

interface RaceSeries {
  id: string;
  name: string;
  type: 'championship' | 'weekly_series' | 'regatta' | 'trophy_series';
  status: 'planning' | 'open' | 'racing' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  courses: string[]; // Course IDs
  divisions: SeriesDivision[];
  scoringSystem: 'low_point' | 'high_point' | 'bonus_point';
  discards: number;
  entries: number;
  maxEntries?: number;
  entryFee?: number;
  prizePool?: number;
  sponsors?: string[];
}

interface SeriesDivision {
  id: string;
  name: string;
  fleet: string;
  handicapSystem: 'IRC' | 'HKPN' | 'ORC' | 'Portsmouth' | 'One Design';
  entries: number;
  prizeStructure: {
    position: number;
    prize: string;
  }[];
}

interface SeriesEvent {
  id: string;
  seriesId: string;
  courseId: string;
  raceNumber: number;
  scheduledDate: Date;
  actualDate?: Date;
  status: 'scheduled' | 'racing' | 'completed' | 'abandoned' | 'postponed';
  conditions?: {
    windSpeed: number;
    windDirection: number;
    temperature: number;
  };
  results?: {
    divisionId: string;
    entries: number;
    completed: number;
  }[];
}

export function RaceSeriesManager({ courses }: RaceSeriesManagerProps) {
  const [selectedTab, setSelectedTab] = useState<'series' | 'championships' | 'calendar' | 'results'>('series');
  const [raceSeries, setRaceSeries] = useState<RaceSeries[]>([
    {
      id: 'dragon-championship-2025',
      name: 'Hong Kong Dragon Championship 2025',
      type: 'championship',
      status: 'open',
      startDate: new Date('2025-03-15'),
      endDate: new Date('2025-03-17'),
      courses: [courses[0]?.id || 'course-1'],
      divisions: [
        {
          id: 'dragon-open',
          name: 'Dragon Open',
          fleet: 'Dragon Class',
          handicapSystem: 'One Design',
          entries: 24,
          prizeStructure: [
            { position: 1, prize: 'Hong Kong Dragon Championship Trophy' },
            { position: 2, prize: 'Silver Medal + HK$5,000' },
            { position: 3, prize: 'Bronze Medal + HK$3,000' }
          ]
        }
      ],
      scoringSystem: 'low_point',
      discards: 1,
      entries: 24,
      maxEntries: 30,
      entryFee: 1200,
      prizePool: 25000,
      sponsors: ['Rolex', 'North Sails', 'Harken']
    },
    {
      id: 'weekly-keelboat-2025',
      name: 'Weekly Keelboat Series 2025',
      type: 'weekly_series',
      status: 'racing',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-12-15'),
      courses: courses.map(c => c.id).slice(0, 3),
      divisions: [
        {
          id: 'irc-1',
          name: 'IRC Division 1',
          fleet: 'IRC',
          handicapSystem: 'IRC',
          entries: 18,
          prizeStructure: [
            { position: 1, prize: 'Division 1 Trophy' },
            { position: 2, prize: 'Silver Trophy' },
            { position: 3, prize: 'Bronze Trophy' }
          ]
        },
        {
          id: 'irc-2',
          name: 'IRC Division 2',
          fleet: 'IRC',
          handicapSystem: 'IRC',
          entries: 22,
          prizeStructure: [
            { position: 1, prize: 'Division 2 Trophy' },
            { position: 2, prize: 'Silver Trophy' }
          ]
        }
      ],
      scoringSystem: 'low_point',
      discards: 3,
      entries: 40,
      entryFee: 800
    }
  ]);

  const [seriesEvents, setSeriesEvents] = useState<SeriesEvent[]>([
    {
      id: 'event-1',
      seriesId: 'dragon-championship-2025',
      courseId: courses[0]?.id || 'course-1',
      raceNumber: 1,
      scheduledDate: new Date('2025-03-15T10:00:00'),
      status: 'scheduled',
      conditions: {
        windSpeed: 12,
        windDirection: 220,
        temperature: 24
      }
    },
    {
      id: 'event-2',
      seriesId: 'dragon-championship-2025',
      courseId: courses[0]?.id || 'course-1',
      raceNumber: 2,
      scheduledDate: new Date('2025-03-15T14:00:00'),
      status: 'scheduled'
    },
    {
      id: 'event-3',
      seriesId: 'weekly-keelboat-2025',
      courseId: courses[1]?.id || 'course-2',
      raceNumber: 8,
      scheduledDate: new Date('2025-02-23T14:00:00'),
      status: 'completed',
      actualDate: new Date('2025-02-23T14:15:00'),
      results: [
        { divisionId: 'irc-1', entries: 18, completed: 16 },
        { divisionId: 'irc-2', entries: 22, completed: 20 }
      ]
    }
  ]);

  const createDraftSeries = (): RaceSeries => {
    const now = new Date();
    const fallbackCourseId = courses[0]?.id ?? 'course-draft';
    return {
      id: `series-${Date.now()}`,
      name: `New Series ${raceSeries.length + 1}`,
      type: 'regatta',
      status: 'planning',
      startDate: now,
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      courses: [fallbackCourseId],
      divisions: [
        {
          id: `division-${Date.now()}`,
          name: 'Open Fleet',
          fleet: 'Open',
          handicapSystem: 'One Design',
          entries: 0,
          prizeStructure: [{ position: 1, prize: 'Series Winner' }],
        },
      ],
      scoringSystem: 'low_point',
      discards: 0,
      entries: 0,
    };
  };

  const handleCreateSeries = () => {
    showConfirm(
      'Create New Series',
      'This will start the series creation wizard.',
      () => {
            const draftSeries = createDraftSeries();
            setRaceSeries((prev) => [draftSeries, ...prev]);
            setSeriesEvents((prev) => [
              {
                id: `event-${Date.now()}`,
                seriesId: draftSeries.id,
                courseId: draftSeries.courses[0] || 'course-draft',
                raceNumber: 1,
                scheduledDate: draftSeries.startDate,
                status: 'scheduled',
              },
              ...prev,
            ]);
            setSelectedTab('series');
            showAlert('Series Created', `"${draftSeries.name}" was added in planning status.`);
          }
    );
  };

  const handleEditSeries = (series: RaceSeries) => {
    showConfirm(
      'Edit Series',
      `Modify settings for "${series.name}"?`,
      () => {
        setRaceSeries((prev) =>
          prev.map((entry) =>
            entry.id === series.id
              ? {
                  ...entry,
                  status: entry.status === 'planning' ? 'open' : entry.status,
                  name: entry.name.endsWith('(Edited)')
                    ? entry.name
                    : `${entry.name} (Edited)`,
                }
              : entry
          )
        );
        showAlert('Series Updated', `"${series.name}" settings were updated.`);
      }
    );
  };

  const handlePublishResults = (series: RaceSeries) => {
    showConfirm(
      'Publish Results',
      `Publish final results for "${series.name}" to all participants?`,
      () => {
        setRaceSeries(prev => prev.map(s =>
          s.id === series.id ? { ...s, status: 'completed' as const } : s
        ));
        showAlert('Results Published', 'Final results have been distributed to all participants.');
      }
    );
  };

  const getSeriesStatusIcon = (status: RaceSeries['status']) => {
    switch (status) {
      case 'planning': return '📋';
      case 'open': return '🔓';
      case 'racing': return '⛵';
      case 'completed': return '🏆';
      case 'cancelled': return '❌';
      default: return '📊';
    }
  };

  const getSeriesStatusColor = (status: RaceSeries['status']) => {
    switch (status) {
      case 'planning': return '#6B7280';
      case 'open': return '#3B82F6';
      case 'racing': return '#10B981';
      case 'completed': return '#059669';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getSeriesTypeLabel = (type: RaceSeries['type']) => {
    switch (type) {
      case 'championship': return '🏆 Championship';
      case 'weekly_series': return '📅 Weekly Series';
      case 'regatta': return '⛵ Regatta';
      case 'trophy_series': return '🥇 Trophy Series';
      default: return '📊 Series';
    }
  };

  const TabButton = ({ id, label, active }: { id: typeof selectedTab; label: string; active: boolean }) => (
    <Button
      variant={active ? "default" : "outline"}
      onPress={() => setSelectedTab(id)}
      style={styles.tabButton}
    >
      <ThemedText style={{ color: active ? '#fff' : '#0066CC' }}>{label}</ThemedText>
    </Button>
  );

  const renderSeriesCard = (series: RaceSeries) => {
    const eventsForSeries = seriesEvents.filter(e => e.seriesId === series.id);
    const completedEvents = eventsForSeries.filter(e => e.status === 'completed').length;

    return (
      <View key={series.id} style={styles.seriesCard}>
        <View style={styles.seriesHeader}>
          <View style={styles.seriesInfo}>
            <ThemedText type="defaultSemiBold" style={styles.seriesName}>
              {getSeriesStatusIcon(series.status)} {series.name}
            </ThemedText>
            <ThemedText style={styles.seriesType}>
              {getSeriesTypeLabel(series.type)}
            </ThemedText>
            <ThemedText style={[styles.seriesStatus, { color: getSeriesStatusColor(series.status) }]}>
              {series.status.replace('_', ' ').toUpperCase()}
            </ThemedText>
          </View>
        </View>

        <View style={styles.seriesDetails}>
          <View style={styles.seriesMetric}>
            <ThemedText style={styles.metricLabel}>Duration:</ThemedText>
            <ThemedText style={styles.metricValue}>
              {series.startDate.toLocaleDateString()} - {series.endDate.toLocaleDateString()}
            </ThemedText>
          </View>

          <View style={styles.seriesMetric}>
            <ThemedText style={styles.metricLabel}>Progress:</ThemedText>
            <ThemedText style={styles.metricValue}>
              {completedEvents} / {seriesEvents.length} races completed
            </ThemedText>
          </View>

          <View style={styles.seriesMetric}>
            <ThemedText style={styles.metricLabel}>Entries:</ThemedText>
            <ThemedText style={styles.metricValue}>
              {series.entries}{series.maxEntries ? ` / ${series.maxEntries}` : ''} boats
            </ThemedText>
          </View>

          <View style={styles.seriesMetric}>
            <ThemedText style={styles.metricLabel}>Divisions:</ThemedText>
            <ThemedText style={styles.metricValue}>
              {series.divisions.length} divisions
            </ThemedText>
          </View>

          {series.entryFee && (
            <View style={styles.seriesMetric}>
              <ThemedText style={styles.metricLabel}>Entry Fee:</ThemedText>
              <ThemedText style={styles.metricValue}>
                HK${series.entryFee.toLocaleString()}
              </ThemedText>
            </View>
          )}

          {series.prizePool && (
            <View style={styles.seriesMetric}>
              <ThemedText style={styles.metricLabel}>Prize Pool:</ThemedText>
              <ThemedText style={styles.metricValue}>
                HK${series.prizePool.toLocaleString()}
              </ThemedText>
            </View>
          )}
        </View>

        {series.sponsors && series.sponsors.length > 0 && (
          <View style={styles.sponsorsContainer}>
            <ThemedText style={styles.sponsorsLabel}>Sponsors:</ThemedText>
            <ThemedText style={styles.sponsorsText}>
              {series.sponsors.join(', ')}
            </ThemedText>
          </View>
        )}

        <View style={styles.seriesActions}>
          <Button
            variant="outline"
            onPress={() => handleEditSeries(series)}
            style={styles.actionButton}
          >
            <ThemedText style={styles.outlineButtonText}>✏️ Edit</ThemedText>
          </Button>

          {series.status === 'racing' && (
            <Button
              variant="default"
              onPress={() => handlePublishResults(series)}
              style={styles.actionButton}
            >
              <ThemedText style={styles.actionButtonText}>📊 Publish Results</ThemedText>
            </Button>
          )}

          <Button
            variant="outline"
            style={styles.actionButton}
          >
            <ThemedText style={styles.outlineButtonText}>📋 Manage</ThemedText>
          </Button>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText type="title">🏆 Series Management</ThemedText>
          <ThemedText type="subtitle">
            Manage championships, series, and multi-race events
          </ThemedText>
        </View>

        <Button
          variant="default"
          onPress={handleCreateSeries}
          style={styles.createButton}
        >
          <ThemedText style={styles.createButtonText}>➕ New Series</ThemedText>
        </Button>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TabButton id="series" label="🏆 Active Series" active={selectedTab === 'series'} />
        <TabButton id="championships" label="🥇 Championships" active={selectedTab === 'championships'} />
        <TabButton id="calendar" label="📅 Calendar" active={selectedTab === 'calendar'} />
        <TabButton id="results" label="📊 Results" active={selectedTab === 'results'} />
      </View>

      <ScrollView style={styles.content}>
        {/* Series Tab */}
        {selectedTab === 'series' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">All Series</ThemedText>
              <ThemedText style={styles.sectionSubtext}>
                {raceSeries.length} total • {raceSeries.filter(s => s.status === 'racing').length} active
              </ThemedText>
            </View>

            {raceSeries.map(renderSeriesCard)}
          </View>
        )}

        {/* Championships Tab */}
        {selectedTab === 'championships' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Championships</ThemedText>
              <ThemedText style={styles.sectionSubtext}>
                Major championship events and trophies
              </ThemedText>
            </View>

            {raceSeries
              .filter(s => s.type === 'championship')
              .map(renderSeriesCard)
            }

            {raceSeries.filter(s => s.type === 'championship').length === 0 && (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyStateTitle}>
                  🏆 No Championships Scheduled
                </ThemedText>
                <ThemedText style={styles.emptyStateSubtext}>
                  Create championship events to manage major competitions.
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Calendar Tab */}
        {selectedTab === 'calendar' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Race Calendar</ThemedText>
              <ThemedText style={styles.sectionSubtext}>
                Upcoming races and events schedule
              </ThemedText>
            </View>

            <View style={styles.calendarContainer}>
              <ThemedText style={styles.calendarTitle}>📅 Calendar Integration</ThemedText>
              <ThemedText style={styles.calendarDescription}>
                Synchronize race schedules with club calendars, Google Calendar, and sailor apps for seamless scheduling.
              </ThemedText>

              <View style={styles.calendarActions}>
                <Button variant="outline" style={styles.calendarButton}>
                  <ThemedText style={styles.outlineButtonText}>📅 Sync Calendar</ThemedText>
                </Button>
                <Button variant="outline" style={styles.calendarButton}>
                  <ThemedText style={styles.outlineButtonText}>📤 Export Events</ThemedText>
                </Button>
                <Button variant="default" style={styles.calendarButton}>
                  <ThemedText style={styles.actionButtonText}>🔧 Configure</ThemedText>
                </Button>
              </View>
            </View>
          </View>
        )}

        {/* Results Tab */}
        {selectedTab === 'results' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Series Results</ThemedText>
              <ThemedText style={styles.sectionSubtext}>
                Scoring and final results management
              </ThemedText>
            </View>

            <View style={styles.resultsContainer}>
              <ThemedText style={styles.resultsTitle}>📊 Results Management</ThemedText>
              <ThemedText style={styles.resultsDescription}>
                Integrate with SailWave, Regatta Network, and other scoring systems for comprehensive results management and publication.
              </ThemedText>

              <View style={styles.resultsActions}>
                <Button variant="outline" style={styles.resultsButton}>
                  <ThemedText style={styles.outlineButtonText}>📥 Import Results</ThemedText>
                </Button>
                <Button variant="outline" style={styles.resultsButton}>
                  <ThemedText style={styles.outlineButtonText}>📊 Generate Reports</ThemedText>
                </Button>
                <Button variant="default" style={styles.resultsButton}>
                  <ThemedText style={styles.actionButtonText}>🔧 Configure</ThemedText>
                </Button>
              </View>
            </View>
          </View>
        )}

        {/* Empty State */}
        {raceSeries.length === 0 && (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateTitle}>
              🏆 No Series Created
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              Create race series and championships to organize multi-race events.
            </ThemedText>
            <Button
              variant="default"
              onPress={handleCreateSeries}
              style={styles.emptyStateButton}
            >
              <ThemedText style={styles.actionButtonText}>➕ Create Series</ThemedText>
            </Button>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createButtonText: {
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  seriesCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    boxShadow: '0px 1px',
  },
  seriesHeader: {
    marginBottom: 12,
  },
  seriesInfo: {
    marginBottom: 8,
  },
  seriesName: {
    marginBottom: 4,
  },
  seriesType: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  seriesStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  seriesDetails: {
    marginBottom: 12,
  },
  seriesMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  sponsorsContainer: {
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sponsorsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 4,
  },
  sponsorsText: {
    fontSize: 12,
    color: '#374151',
  },
  seriesActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  outlineButtonText: {
    color: '#0066CC',
    fontSize: 12,
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    boxShadow: '0px 1px',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  calendarDescription: {
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  calendarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  calendarButton: {
    flex: 1,
    paddingVertical: 10,
  },
  resultsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    boxShadow: '0px 1px',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultsDescription: {
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resultsButton: {
    flex: 1,
    paddingVertical: 10,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyStateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});
