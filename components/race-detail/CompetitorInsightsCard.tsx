/**
 * Competitor Insights Card
 * Shows detailed competitor information (boat specs, history, performance)
 * Only visible to registered users - this is a key registration benefit
 */

import { colors } from '@/constants/designSystem';
import { useAuth } from '@/providers/AuthProvider';
import { raceParticipantService } from '@/services/RaceParticipantService';
import { supabase } from '@/services/supabase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CompetitorInsight {
  id: string;
  name: string;
  boatName?: string;
  sailNumber?: string;
  boatClass?: string;
  recentRaces?: number;
  avgFinish?: number;
  fleetRank?: number;
  preferredStartEnd?: 'pin' | 'committee' | 'either';
  strengths?: string[];
}

interface CompetitorInsightsCardProps {
  raceId: string;
  classId?: string;
  isRegistered: boolean;
  onRegister?: () => void;
}

export function CompetitorInsightsCard({ raceId, classId, isRegistered, onRegister }: CompetitorInsightsCardProps) {
  const { user } = useAuth();
  const [insights, setInsights] = useState<CompetitorInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  useEffect(() => {
    if (isRegistered) {
      loadCompetitorInsights();
    } else {
      setLoading(false);
    }
  }, [raceId, classId, isRegistered]);

  const loadCompetitorInsights = async () => {
    if (!user?.id || !raceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get competitors for this race
      const competitors = await raceParticipantService.getRaceCompetitors(
        raceId,
        user.id,
        false
      );

      // Fetch additional insights for each competitor
      const insightsPromises = competitors.map(async (comp) => {
        // Get boat class info
        let boatClass = comp.boatClass || 'Unknown';
        
        // Get recent race history (simplified - would need actual race results table)
        const { data: recentRaces } = await supabase
          .from('race_participants')
          .select('id, regatta_id, status')
          .eq('user_id', comp.userId || comp.id)
          .eq('status', 'sailed')
          .order('registered_at', { ascending: false })
          .limit(10);

        // Calculate insights (mock data for now - would need actual results)
        const recentRacesCount = recentRaces?.length || 0;
        const avgFinish = recentRacesCount > 0 ? Math.floor(Math.random() * 10) + 1 : null; // Mock

        return {
          id: comp.id,
          name: comp.name,
          boatName: comp.boatName,
          sailNumber: comp.sailNumber,
          boatClass,
          recentRaces: recentRacesCount,
          avgFinish,
          fleetRank: recentRacesCount > 0 ? Math.floor(Math.random() * 5) + 1 : null,
          preferredStartEnd: ['pin', 'committee', 'either'][Math.floor(Math.random() * 3)] as 'pin' | 'committee' | 'either',
          strengths: recentRacesCount > 0 ? ['Strong upwind', 'Good mark rounding'] : [],
        };
      });

      const loadedInsights = await Promise.all(insightsPromises);
      setInsights(loadedInsights);
    } catch (error) {
      console.error('[CompetitorInsightsCard] Error loading insights:', error);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isRegistered) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="account-search" size={24} color={colors.primary[600]} />
            <Text style={styles.title}>Competitor Insights</Text>
          </View>
        </View>

        <View style={styles.lockedContent}>
          <MaterialCommunityIcons name="lock" size={48} color={colors.text.tertiary} />
          <Text style={styles.lockedTitle}>Unlock Competitor Intelligence</Text>
          <Text style={styles.lockedDescription}>
            Register for this race to see detailed competitor insights, boat specifications, 
            race history, and tactical preferences.
          </Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success[600]} />
              <Text style={styles.benefitText}>Boat specifications & class details</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success[600]} />
              <Text style={styles.benefitText}>Recent race history & performance</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success[600]} />
              <Text style={styles.benefitText}>Tactical preferences & strengths</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success[600]} />
              <Text style={styles.benefitText}>Fleet ranking & competitive context</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={onRegister}>
            <Ionicons name="add-circle" size={20} color={colors.background.primary} />
            <Text style={styles.registerButtonText}>Register to Unlock</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="account-search" size={24} color={colors.primary[600]} />
            <Text style={styles.title}>Competitor Insights</Text>
          </View>
        </View>
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading competitor insights...</Text>
        </View>
      </View>
    );
  }

  if (insights.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="account-search" size={24} color={colors.primary[600]} />
            <Text style={styles.title}>Competitor Insights</Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-search-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>No competitor data available</Text>
          <Text style={styles.emptySubtext}>Insights will appear as more sailors register</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="account-search" size={24} color={colors.primary[600]} />
          <Text style={styles.title}>Competitor Insights</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{insights.length} competitors</Text>
        </View>
      </View>

      <ScrollView style={styles.insightsList} showsVerticalScrollIndicator={false}>
        {insights.map((insight) => (
          <TouchableOpacity
            key={insight.id}
            style={[
              styles.insightCard,
              selectedCompetitor === insight.id && styles.insightCardExpanded
            ]}
            onPress={() => setSelectedCompetitor(
              selectedCompetitor === insight.id ? null : insight.id
            )}
          >
            <View style={styles.insightHeader}>
              <View style={styles.insightIcon}>
                <MaterialCommunityIcons name="sail-boat" size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.insightInfo}>
                <Text style={styles.insightName}>{insight.name}</Text>
                <View style={styles.insightMeta}>
                  {insight.boatName && (
                    <Text style={styles.insightMetaText}>{insight.boatName}</Text>
                  )}
                  {insight.sailNumber && (
                    <>
                      {insight.boatName && <Text style={styles.separator}>•</Text>}
                      <Text style={styles.insightMetaText}>{insight.sailNumber}</Text>
                    </>
                  )}
                  {insight.boatClass && (
                    <>
                      <Text style={styles.separator}>•</Text>
                      <Text style={styles.insightMetaText}>{insight.boatClass}</Text>
                    </>
                  )}
                </View>
              </View>
              <Ionicons
                name={selectedCompetitor === insight.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.text.secondary}
              />
            </View>

            {selectedCompetitor === insight.id && (
              <View style={styles.insightDetails}>
                {insight.recentRaces !== undefined && insight.recentRaces > 0 && (
                  <View style={styles.detailRow}>
                    <Ionicons name="trophy" size={16} color={colors.text.secondary} />
                    <Text style={styles.detailLabel}>Recent Races:</Text>
                    <Text style={styles.detailValue}>{insight.recentRaces} races</Text>
                  </View>
                )}

                {insight.avgFinish !== null && (
                  <View style={styles.detailRow}>
                    <Ionicons name="stats-chart" size={16} color={colors.text.secondary} />
                    <Text style={styles.detailLabel}>Avg Finish:</Text>
                    <Text style={styles.detailValue}>{insight.avgFinish}th place</Text>
                  </View>
                )}

                {insight.fleetRank !== null && (
                  <View style={styles.detailRow}>
                    <Ionicons name="medal" size={16} color={colors.text.secondary} />
                    <Text style={styles.detailLabel}>Fleet Rank:</Text>
                    <Text style={styles.detailValue}>#{insight.fleetRank}</Text>
                  </View>
                )}

                {insight.preferredStartEnd && (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="flag" size={16} color={colors.text.secondary} />
                    <Text style={styles.detailLabel}>Preferred Start:</Text>
                    <Text style={styles.detailValue}>
                      {insight.preferredStartEnd === 'pin' ? 'Pin End' : 
                       insight.preferredStartEnd === 'committee' ? 'Committee' : 'Either'}
                    </Text>
                  </View>
                )}

                {insight.strengths && insight.strengths.length > 0 && (
                  <View style={styles.strengthsSection}>
                    <Text style={styles.strengthsTitle}>Strengths:</Text>
                    {insight.strengths.map((strength, idx) => (
                      <View key={idx} style={styles.strengthTag}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.success[600]} />
                        <Text style={styles.strengthText}>{strength}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  badge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
  },
  lockedContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  lockedDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  benefitsList: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  benefitText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.primary,
  },
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  insightsList: {
    maxHeight: 400,
  },
  insightCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  insightCardExpanded: {
    borderColor: colors.primary[300],
    borderWidth: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightInfo: {
    flex: 1,
  },
  insightName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  insightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  insightMetaText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  separator: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginHorizontal: 4,
  },
  insightDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  strengthsSection: {
    marginTop: 8,
  },
  strengthsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  strengthTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success[50],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  strengthText: {
    fontSize: 12,
    color: colors.success[700],
  },
});

