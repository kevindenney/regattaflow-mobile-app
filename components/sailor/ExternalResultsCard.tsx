/**
 * External Results Card for Sailor Dashboard
 * Displays sailor's external race results with performance insights
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';

interface ExternalResult {
  id: string;
  regattaName: string;
  venue: string;
  raceNumber: number;
  position: number;
  points: number;
  raceDate: string;
  boatClass: string;
  source: string;
}

interface PerformanceStats {
  totalRaces: number;
  averagePosition: number;
  bestPosition: number;
  podiumFinishes: number;
  topTenFinishes: number;
}

interface ExternalResultsCardProps {
  sailorId: string;
  compact?: boolean;
  style?: any;
}

export const ExternalResultsCard: React.FC<ExternalResultsCardProps> = ({
  sailorId,
  compact = false,
  style,
}) => {
  const { user } = useAuth();
  const [results, setResults] = useState<ExternalResult[]>([]);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);

  useEffect(() => {
    loadExternalResults();
  }, [sailorId]);

  const loadExternalResults = async () => {
    if (!user || !sailorId) return;

    try {
      // Simulate loading external results
      // In production, this would call the search API
      const simulatedResults: ExternalResult[] = [
        {
          id: '1',
          regattaName: 'Dragon Gold Cup 2024',
          venue: 'San Francisco Bay',
          raceNumber: 1,
          position: 3,
          points: 3,
          raceDate: '2024-09-20',
          boatClass: 'Dragon',
          source: 'Sailwave',
        },
        {
          id: '2',
          regattaName: 'Dragon Gold Cup 2024',
          venue: 'San Francisco Bay',
          raceNumber: 2,
          position: 5,
          points: 5,
          raceDate: '2024-09-20',
          boatClass: 'Dragon',
          source: 'Sailwave',
        },
        {
          id: '3',
          regattaName: 'Pacific Coast Championship',
          venue: 'Monterey Bay',
          raceNumber: 1,
          position: 2,
          points: 2,
          raceDate: '2024-09-15',
          boatClass: 'Dragon',
          source: 'Regatta Network',
        },
      ];

      const simulatedStats: PerformanceStats = {
        totalRaces: simulatedResults.length,
        averagePosition: simulatedResults.reduce((sum, r) => sum + r.position, 0) / simulatedResults.length,
        bestPosition: Math.min(...simulatedResults.map(r => r.position)),
        podiumFinishes: simulatedResults.filter(r => r.position <= 3).length,
        topTenFinishes: simulatedResults.filter(r => r.position <= 10).length,
      };

      setResults(simulatedResults);
      setStats(simulatedStats);
    } catch (error) {
      console.error('Error loading external results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionColor = (position: number): string => {
    if (position === 1) return '#FFD700';
    if (position === 2) return '#C0C0C0';
    if (position === 3) return '#CD7F32';
    if (position <= 10) return '#00AA33';
    return '#666666';
  };

  const renderCompactView = () => (
    <TouchableOpacity
      style={[styles.compactCard, style]}
      onPress={() => setExpanded(true)}
      {...(Platform.OS === 'web' && {
        onMouseEnter: (e: any) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        },
        onMouseLeave: (e: any) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.1)';
        },
      })}
    >
      <View style={styles.compactHeader}>
        <View style={styles.compactIcon}>
          <Ionicons name="trophy" size={20} color="#0066CC" />
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle}>External Results</Text>
          <Text style={styles.compactSubtitle}>
            {results.length} races • Best: P{stats?.bestPosition}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  const renderExpandedView = () => (
    <View style={[styles.expandedCard, style]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>🏆 External Results</Text>
          <Text style={styles.subtitle}>
            Automatically imported from major sailing platforms
          </Text>
        </View>
        {compact && (
          <TouchableOpacity onPress={() => setExpanded(false)}>
            <Ionicons name="chevron-up" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalRaces}</Text>
            <Text style={styles.statLabel}>Total Races</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.averagePosition.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Position</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FFD700' }]}>{stats.bestPosition}</Text>
            <Text style={styles.statLabel}>Best Position</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#CD7F32' }]}>{stats.podiumFinishes}</Text>
            <Text style={styles.statLabel}>Podiums</Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {results.map((result) => (
          <View key={result.id} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultRegatta}>{result.regattaName}</Text>
              <View style={[
                styles.positionBadge,
                { backgroundColor: getPositionColor(result.position) }
              ]}>
                <Text style={styles.positionText}>P{result.position}</Text>
              </View>
            </View>

            <Text style={styles.resultDetails}>
              Race {result.raceNumber} • {result.venue}
            </Text>

            <View style={styles.resultFooter}>
              <Text style={styles.resultDate}>
                {new Date(result.raceDate).toLocaleDateString()}
              </Text>
              <Text style={styles.resultSource}>{result.source}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.viewAllButton}>
        <Text style={styles.viewAllButtonText}>View All Results</Text>
        <Ionicons name="arrow-forward" size={16} color="#0066CC" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingCard, style]}>
        <ActivityIndicator size="small" color="#0066CC" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={[styles.emptyCard, style]}>
        <Ionicons name="trophy-outline" size={32} color="#CCC" />
        <Text style={styles.emptyText}>No external results found</Text>
        <Text style={styles.emptySubtext}>
          Results will appear here automatically when they're published
        </Text>
      </View>
    );
  }

  return compact && !expanded ? renderCompactView() : renderExpandedView();
};

const styles = StyleSheet.create({
  compactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 1px',
    elevation: 2,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific CSS properties
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      cursor: 'pointer',
    }),
  } as any,
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  compactSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  expandedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px',
    elevation: 4,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific CSS properties
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    }),
  } as any,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  resultsContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  resultItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultRegatta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  positionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resultDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultDate: {
    fontSize: 12,
    color: '#999',
  },
  resultSource: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default ExternalResultsCard;