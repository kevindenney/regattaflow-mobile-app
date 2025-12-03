/**
 * Weather Dashboard Component
 * Live conditions display with wind rose and trends
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Text } from '@/components/ui/text';
import {
  Wind,
  Compass,
  Thermometer,
  Droplets,
  Eye,
  AlertTriangle,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Bell,
  ChevronRight,
  Navigation,
  Waves,
} from 'lucide-react-native';
import {
  weatherService,
  LatestWeather,
  WeatherReading,
  WindStats,
  WindShift,
  AlertEvent,
  WindHistoryPoint,
} from '@/services/WeatherService';

interface WeatherDashboardProps {
  regattaId: string;
  compact?: boolean;
  onAlertTrigger?: (alert: AlertEvent) => void;
}

export function WeatherDashboard({
  regattaId,
  compact = false,
  onAlertTrigger,
}: WeatherDashboardProps) {
  // State
  const [latestWeather, setLatestWeather] = useState<LatestWeather | null>(null);
  const [windStats, setWindStats] = useState<WindStats | null>(null);
  const [windShift, setWindShift] = useState<WindShift | null>(null);
  const [history, setHistory] = useState<WindHistoryPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [showAddReading, setShowAddReading] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  // Form state
  const [windDirection, setWindDirection] = useState('');
  const [windSpeed, setWindSpeed] = useState('');
  const [windGust, setWindGust] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-refresh
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    refreshInterval.current = setInterval(loadData, 30000);
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [regattaId]);

  const loadData = async () => {
    try {
      const [weather, stats, shift, historyData, alertsData] = await Promise.all([
        weatherService.getLatestWeather(regattaId),
        weatherService.getWindStats(regattaId, 10),
        weatherService.detectWindShift(regattaId, 15, 10),
        weatherService.getWindHistory(regattaId),
        weatherService.getAlertEvents(regattaId, true),
      ]);

      setLatestWeather(weather);
      setWindStats(stats);
      setWindShift(shift);
      setHistory(historyData);
      setAlerts(alertsData);

      // Trigger callback for new alerts
      if (alertsData.length > 0 && onAlertTrigger) {
        onAlertTrigger(alertsData[0]);
      }
    } catch (error) {
      console.error('Error loading weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddReading = async () => {
    if (!windDirection || !windSpeed) {
      Alert.alert('Required', 'Please enter wind direction and speed');
      return;
    }

    setSubmitting(true);
    try {
      await weatherService.recordReading({
        regatta_id: regattaId,
        wind_direction_degrees: parseInt(windDirection),
        wind_speed_knots: parseFloat(windSpeed),
        wind_gust_knots: windGust ? parseFloat(windGust) : undefined,
        temperature_celsius: temperature ? parseFloat(temperature) : undefined,
        notes: notes || undefined,
      });

      setShowAddReading(false);
      setWindDirection('');
      setWindSpeed('');
      setWindGust('');
      setTemperature('');
      setNotes('');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to record reading');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await weatherService.acknowledgeAlert(alertId);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to acknowledge alert');
    }
  };

  // Get wind arrow rotation
  const getWindArrowRotation = (degrees: number) => {
    return { transform: [{ rotate: `${degrees}deg` }] };
  };

  // Get Beaufort info
  const beaufort = latestWeather?.wind_speed_knots
    ? weatherService.getBeaufortScale(latestWeather.wind_speed_knots)
    : null;

  // Compact view
  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={onRefresh}>
        <View style={styles.compactWind}>
          <Wind size={16} color="#0EA5E9" />
          {latestWeather ? (
            <>
              <Text style={styles.compactDirection}>
                {latestWeather.wind_direction_name}
              </Text>
              <Text style={styles.compactSpeed}>
                {latestWeather.wind_speed_knots?.toFixed(0)} kts
              </Text>
              {latestWeather.wind_gust_knots && (
                <Text style={styles.compactGust}>
                  G{latestWeather.wind_gust_knots?.toFixed(0)}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.compactNoData}>No data</Text>
          )}
        </View>
        {windShift?.shift_detected && (
          <View style={styles.compactShift}>
            <TrendingUp size={14} color="#D97706" />
            <Text style={styles.compactShiftText}>
              {windShift.shift_direction} {Math.abs(windShift.shift_amount)}°
            </Text>
          </View>
        )}
        {alerts.length > 0 && (
          <View style={styles.compactAlert}>
            <AlertTriangle size={14} color="#DC2626" />
            <Text style={styles.compactAlertText}>{alerts.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Full dashboard
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with alerts */}
      {alerts.length > 0 && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => setShowAlerts(true)}
        >
          <AlertTriangle size={18} color="#DC2626" />
          <Text style={styles.alertBannerText}>
            {alerts.length} weather alert{alerts.length > 1 ? 's' : ''}
          </Text>
          <ChevronRight size={18} color="#DC2626" />
        </TouchableOpacity>
      )}

      {/* Main wind display */}
      <View style={styles.mainCard}>
        <View style={styles.windRose}>
          {/* Compass points */}
          <Text style={[styles.compassPoint, styles.compassN]}>N</Text>
          <Text style={[styles.compassPoint, styles.compassE]}>E</Text>
          <Text style={[styles.compassPoint, styles.compassS]}>S</Text>
          <Text style={[styles.compassPoint, styles.compassW]}>W</Text>
          
          {/* Wind arrow */}
          {latestWeather?.wind_direction_degrees !== undefined && (
            <View
              style={[
                styles.windArrow,
                getWindArrowRotation(latestWeather.wind_direction_degrees + 180),
              ]}
            >
              <Navigation size={48} color="#0EA5E9" />
            </View>
          )}
          
          {/* Center display */}
          <View style={styles.windCenter}>
            <Text style={styles.windDirectionBig}>
              {latestWeather?.wind_direction_name || '--'}
            </Text>
            <Text style={styles.windDegrees}>
              {latestWeather?.wind_direction_degrees ?? '--'}°
            </Text>
          </View>
        </View>

        {/* Speed display */}
        <View style={styles.speedSection}>
          <View style={styles.speedMain}>
            <Text style={styles.speedValue}>
              {latestWeather?.wind_speed_knots?.toFixed(1) ?? '--'}
            </Text>
            <Text style={styles.speedUnit}>knots</Text>
          </View>
          
          {latestWeather?.wind_gust_knots && (
            <View style={styles.gustBadge}>
              <Text style={styles.gustLabel}>GUST</Text>
              <Text style={styles.gustValue}>
                {latestWeather.wind_gust_knots.toFixed(0)}
              </Text>
            </View>
          )}
        </View>

        {/* Beaufort scale */}
        {beaufort && (
          <View style={styles.beaufortBadge}>
            <Text style={styles.beaufortForce}>Force {beaufort.force}</Text>
            <Text style={styles.beaufortDesc}>{beaufort.description}</Text>
          </View>
        )}

        {/* Wind shift indicator */}
        {windShift?.shift_detected && (
          <View style={styles.shiftIndicator}>
            {windShift.shift_direction === 'veered' ? (
              <TrendingUp size={18} color="#D97706" />
            ) : (
              <TrendingDown size={18} color="#D97706" />
            )}
            <Text style={styles.shiftText}>
              Wind {windShift.shift_direction} {Math.abs(windShift.shift_amount)}°
            </Text>
            <Text style={styles.shiftDetail}>
              {windShift.previous_direction}° → {windShift.current_direction}°
            </Text>
          </View>
        )}
      </View>

      {/* Statistics cards */}
      {windStats && windStats.reading_count > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>AVG</Text>
            <Text style={styles.statValue}>
              {windStats.avg_speed?.toFixed(1)} kts
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>MIN</Text>
            <Text style={styles.statValue}>
              {windStats.min_speed?.toFixed(1)} kts
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>MAX</Text>
            <Text style={styles.statValue}>
              {windStats.max_speed?.toFixed(1)} kts
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>STD</Text>
            <Text style={styles.statValue}>
              ±{windStats.direction_std?.toFixed(0)}°
            </Text>
          </View>
        </View>
      )}

      {/* Additional conditions */}
      <View style={styles.conditionsGrid}>
        {latestWeather?.temperature_celsius !== undefined && (
          <View style={styles.conditionCard}>
            <Thermometer size={20} color="#EF4444" />
            <Text style={styles.conditionValue}>
              {latestWeather.temperature_celsius}°C
            </Text>
            <Text style={styles.conditionLabel}>Temperature</Text>
          </View>
        )}
        
        {latestWeather?.humidity_percent !== undefined && (
          <View style={styles.conditionCard}>
            <Droplets size={20} color="#0EA5E9" />
            <Text style={styles.conditionValue}>
              {latestWeather.humidity_percent}%
            </Text>
            <Text style={styles.conditionLabel}>Humidity</Text>
          </View>
        )}
        
        {latestWeather?.visibility_nm !== undefined && (
          <View style={styles.conditionCard}>
            <Eye size={20} color="#6B7280" />
            <Text style={styles.conditionValue}>
              {latestWeather.visibility_nm} nm
            </Text>
            <Text style={styles.conditionLabel}>Visibility</Text>
          </View>
        )}
        
        {latestWeather?.wave_height_meters !== undefined && (
          <View style={styles.conditionCard}>
            <Waves size={20} color="#0EA5E9" />
            <Text style={styles.conditionValue}>
              {latestWeather.wave_height_meters}m
            </Text>
            <Text style={styles.conditionLabel}>Waves</Text>
          </View>
        )}
      </View>

      {/* Wind history chart (simplified) */}
      {history.length > 0 && (
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Wind Trend (Last Hour)</Text>
          <View style={styles.historyChart}>
            {history.slice(-12).map((point, index) => {
              const maxSpeed = Math.max(...history.map(h => h.avg_speed || 0));
              const height = maxSpeed > 0 ? (point.avg_speed / maxSpeed) * 60 : 0;
              return (
                <View key={index} style={styles.historyBar}>
                  <View
                    style={[
                      styles.historyBarFill,
                      { height: Math.max(4, height) },
                    ]}
                  />
                  <Text style={styles.historyBarLabel}>
                    {new Date(point.time_bucket).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).split(':')[1]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Last updated */}
      {latestWeather && (
        <Text style={styles.lastUpdated}>
          Updated {new Date(latestWeather.recorded_at).toLocaleTimeString()}
        </Text>
      )}

      {/* Add reading button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddReading(true)}
      >
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Record Weather</Text>
      </TouchableOpacity>

      {/* Add Reading Modal */}
      <Modal
        visible={showAddReading}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddReading(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Weather</Text>
              <TouchableOpacity onPress={() => setShowAddReading(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Direction (°) *</Text>
                  <TextInput
                    style={styles.input}
                    value={windDirection}
                    onChangeText={setWindDirection}
                    placeholder="180"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Speed (kts) *</Text>
                  <TextInput
                    style={styles.input}
                    value={windSpeed}
                    onChangeText={setWindSpeed}
                    placeholder="12"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Gusts (kts)</Text>
                  <TextInput
                    style={styles.input}
                    value={windGust}
                    onChangeText={setWindGust}
                    placeholder="18"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Temp (°C)</Text>
                  <TextInput
                    style={styles.input}
                    value={temperature}
                    onChangeText={setTemperature}
                    placeholder="22"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Sea breeze building..."
                placeholderTextColor="#9CA3AF"
                multiline
              />

              {/* Quick direction buttons */}
              <Text style={styles.inputLabel}>Quick Direction</Text>
              <View style={styles.quickDirections}>
                {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map((dir, i) => (
                  <TouchableOpacity
                    key={dir}
                    style={styles.quickDirButton}
                    onPress={() => setWindDirection(String(i * 45))}
                  >
                    <Text style={styles.quickDirText}>{dir}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleAddReading}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Recording...' : 'Record Reading'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Alerts Modal */}
      <Modal
        visible={showAlerts}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAlerts(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Weather Alerts</Text>
              <TouchableOpacity onPress={() => setShowAlerts(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {alerts.map(alert => {
                const colors = weatherService.getSeverityColor(alert.severity);
                return (
                  <View
                    key={alert.id}
                    style={[styles.alertCard, { backgroundColor: colors.bg }]}
                  >
                    <AlertTriangle size={20} color={colors.color} />
                    <View style={styles.alertInfo}>
                      <Text style={[styles.alertMessage, { color: colors.color }]}>
                        {alert.message}
                      </Text>
                      <Text style={styles.alertTime}>
                        {new Date(alert.triggered_at).toLocaleTimeString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.alertAck}
                      onPress={() => handleAcknowledgeAlert(alert.id)}
                    >
                      <Text style={styles.alertAckText}>ACK</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
              
              {alerts.length === 0 && (
                <Text style={styles.noAlerts}>No active alerts</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // Alert banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    margin: 16,
    marginBottom: 0,
    borderRadius: 10,
    gap: 8,
  },
  alertBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  // Main wind card
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    alignItems: 'center',
  },
  windRose: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  compassPoint: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  compassN: { top: 8 },
  compassS: { bottom: 8 },
  compassE: { right: 8 },
  compassW: { left: 8 },
  windArrow: {
    position: 'absolute',
  },
  windCenter: {
    alignItems: 'center',
  },
  windDirectionBig: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  windDegrees: {
    fontSize: 16,
    color: '#6B7280',
  },
  speedSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  speedMain: {
    alignItems: 'center',
  },
  speedValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#0EA5E9',
  },
  speedUnit: {
    fontSize: 16,
    color: '#6B7280',
  },
  gustBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  gustLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },
  gustValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D97706',
  },
  beaufortBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  beaufortForce: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  beaufortDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  shiftIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  shiftText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  shiftDetail: {
    fontSize: 12,
    color: '#92400E',
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  // Conditions grid
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  conditionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  conditionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  conditionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  // History chart
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 16,
    padding: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  historyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: 4,
  },
  historyBar: {
    flex: 1,
    alignItems: 'center',
  },
  historyBarFill: {
    width: '80%',
    backgroundColor: '#0EA5E9',
    borderRadius: 2,
  },
  historyBarLabel: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 4,
  },
  // Last updated
  lastUpdated: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0EA5E9',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  compactWind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  compactDirection: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  compactSpeed: {
    fontSize: 14,
    color: '#374151',
  },
  compactGust: {
    fontSize: 12,
    color: '#D97706',
  },
  compactNoData: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  compactShift: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  compactShiftText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  compactAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  compactAlertText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  quickDirections: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  quickDirButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDirText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#0EA5E9',
    margin: 16,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Alert card
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  alertAck: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  alertAckText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  noAlerts: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    padding: 24,
  },
});

export default WeatherDashboard;

