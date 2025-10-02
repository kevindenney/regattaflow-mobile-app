/**
 * Tuning Settings Component
 * Rig and sail tuning configurations with performance tracking
 */

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface TuningSetting {
  id: string;
  name: string;
  description?: string;
  windMin?: number;
  windMax?: number;
  waveConditions?: string[];
  venueName?: string;
  rigSettings: Record<string, string>;
  sailSettings: Record<string, string>;
  timesUsed: number;
  avgFinishPosition?: number;
  bestFinish?: number;
  isFavorite: boolean;
  validated: boolean;
  validatedBy?: string;
}

interface TuningSettingsProps {
  boatId: string;
  classId: string;
}

export function TuningSettings({ boatId, classId }: TuningSettingsProps) {
  const [settings, setSettings] = useState<TuningSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTuningSettings();
  }, [boatId]);

  const loadTuningSettings = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from Supabase
      setSettings([
        {
          id: '1',
          name: 'Heavy Air Setup',
          description: 'High wind configuration for 18-25 knots',
          windMin: 18,
          windMax: 25,
          waveConditions: ['chop', 'swell'],
          rigSettings: {
            'mast_rake': '28',
            'shroud_tension': '350 lbs',
            'forestay': 'very tight',
            'backstay': 'max',
          },
          sailSettings: {
            'outhaul': 'maximum',
            'cunningham': 'heavy',
            'vang': 'tight',
            'traveler': 'down 6 inches',
          },
          timesUsed: 12,
          avgFinishPosition: 3.2,
          bestFinish: 1,
          isFavorite: true,
          validated: true,
          validatedBy: 'North Sails Hong Kong',
        },
        {
          id: '2',
          name: 'Light Wind Hong Kong',
          description: 'Optimized for light air and flat water',
          windMin: 6,
          windMax: 12,
          waveConditions: ['flat'],
          venueName: 'Royal Hong Kong Yacht Club',
          rigSettings: {
            'mast_rake': '26',
            'shroud_tension': '250 lbs',
            'forestay': 'medium',
            'backstay': 'off',
          },
          sailSettings: {
            'outhaul': 'ease 2 inches',
            'cunningham': 'off',
            'vang': 'light',
            'traveler': 'centerline',
          },
          timesUsed: 18,
          avgFinishPosition: 2.8,
          bestFinish: 1,
          isFavorite: true,
          validated: true,
          validatedBy: 'Coach Mike',
        },
        {
          id: '3',
          name: 'Medium Air All-Purpose',
          description: 'General racing setup for 12-18 knots',
          windMin: 12,
          windMax: 18,
          rigSettings: {
            'mast_rake': '27',
            'shroud_tension': '300 lbs',
            'forestay': 'tight',
            'backstay': 'medium',
          },
          sailSettings: {
            'outhaul': 'ease 1 inch',
            'cunningham': 'light',
            'vang': 'medium',
            'traveler': 'centerline',
          },
          timesUsed: 24,
          avgFinishPosition: 4.1,
          bestFinish: 2,
          isFavorite: false,
          validated: true,
          validatedBy: 'Self',
        },
      ]);
    } catch (error) {
      console.error('Error loading tuning settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading tuning settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tuning Configurations</Text>
      </View>

      {settings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="settings-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Tuning Settings</Text>
          <Text style={styles.emptyText}>
            Tap the blue + button to create your first tuning setup
          </Text>
        </View>
      ) : (
        <View style={styles.settingsList}>
          {settings.map((setting) => (
            <TouchableOpacity key={setting.id} style={styles.settingCard}>
              <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                  {setting.isFavorite && (
                    <Ionicons name="star" size={16} color="#FBBF24" />
                  )}
                  <Text style={styles.settingName}>{setting.name}</Text>
                </View>
                {setting.validated && (
                  <View style={styles.validatedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.validatedText}>Validated</Text>
                  </View>
                )}
              </View>

              {setting.description && (
                <Text style={styles.description}>{setting.description}</Text>
              )}

              {/* Wind Range */}
              {(setting.windMin || setting.windMax) && (
                <View style={styles.conditionsRow}>
                  <MaterialCommunityIcons name="weather-windy" size={16} color="#3B82F6" />
                  <Text style={styles.conditionText}>
                    {setting.windMin}-{setting.windMax} knots
                  </Text>
                  {setting.waveConditions && setting.waveConditions.length > 0 && (
                    <>
                      <View style={styles.conditionDivider} />
                      <MaterialCommunityIcons name="waves" size={16} color="#3B82F6" />
                      <Text style={styles.conditionText}>
                        {setting.waveConditions.join(', ')}
                      </Text>
                    </>
                  )}
                </View>
              )}

              {/* Venue */}
              {setting.venueName && (
                <View style={styles.venueRow}>
                  <Ionicons name="location" size={14} color="#64748B" />
                  <Text style={styles.venueText}>{setting.venueName}</Text>
                </View>
              )}

              {/* Settings Preview */}
              <View style={styles.settingsPreview}>
                <View style={styles.settingCategory}>
                  <Text style={styles.categoryLabel}>RIG</Text>
                  <View style={styles.settingItems}>
                    {Object.entries(setting.rigSettings).slice(0, 2).map(([key, value]) => (
                      <View key={key} style={styles.settingItem}>
                        <Text style={styles.settingKey}>{key.replace('_', ' ')}</Text>
                        <Text style={styles.settingValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.settingCategory}>
                  <Text style={styles.categoryLabel}>SAILS</Text>
                  <View style={styles.settingItems}>
                    {Object.entries(setting.sailSettings).slice(0, 2).map(([key, value]) => (
                      <View key={key} style={styles.settingItem}>
                        <Text style={styles.settingKey}>{key.replace('_', ' ')}</Text>
                        <Text style={styles.settingValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Performance Stats */}
              {setting.timesUsed > 0 && (
                <View style={styles.performanceStats}>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="chart-line" size={16} color="#64748B" />
                    <Text style={styles.statLabel}>Used {setting.timesUsed}x</Text>
                  </View>
                  {setting.avgFinishPosition && (
                    <View style={styles.stat}>
                      <MaterialCommunityIcons name="target" size={16} color="#64748B" />
                      <Text style={styles.statLabel}>
                        Avg {setting.avgFinishPosition.toFixed(1)}
                      </Text>
                    </View>
                  )}
                  {setting.bestFinish && (
                    <View style={styles.stat}>
                      <MaterialCommunityIcons name="trophy" size={16} color="#FBBF24" />
                      <Text style={styles.statLabel}>Best {setting.bestFinish}</Text>
                    </View>
                  )}
                </View>
              )}

              {setting.validatedBy && (
                <View style={styles.validatedBy}>
                  <Ionicons name="person-circle-outline" size={14} color="#64748B" />
                  <Text style={styles.validatedByText}>Validated by {setting.validatedBy}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  settingsList: {
    gap: 16,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0px 2px',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  validatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  validatedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  description: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 18,
  },
  conditionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  conditionText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  conditionDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  venueText: {
    fontSize: 12,
    color: '#64748B',
  },
  settingsPreview: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginVertical: 12,
  },
  settingCategory: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  settingItems: {
    gap: 6,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  settingKey: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  settingValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
  },
  performanceStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  validatedBy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  validatedByText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});