/**
 * RaceDetailCards Component
 *
 * Beautiful card-based layout for race details
 * Replaces the old RaceDetailsView with Apple Weather-inspired design
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Direct imports to avoid circular dependency
import { RaceMapCard } from '@/components/race-detail/map/RaceMapCard';
import { RaceOverviewCard } from '@/components/race-detail/RaceOverviewCard';
import { StartStrategyCard } from '@/components/race-detail/StartStrategyCard';
import { TimingCard } from '@/components/race-detail/TimingCard';
import { WeatherCard } from '@/components/race-detail/WeatherCard';
import { TideCard } from '@/components/race-detail/TideCard';
import { CourseCard } from '@/components/race-detail/CourseCard';
import { CommunicationsCard } from '@/components/race-detail/CommunicationsCard';
import { CompactWindCard } from '@/components/race-detail/CompactWindCard';
import { CompactTideCard } from '@/components/race-detail/CompactTideCard';
import { CompactWaveCard } from '@/components/race-detail/CompactWaveCard';
import { CompactRaceInfoCard } from '@/components/race-detail/CompactRaceInfoCard';
import { CompactCourseCard } from '@/components/race-detail/CompactCourseCard';
import { CompactCommsCard } from '@/components/race-detail/CompactCommsCard';
import { Card } from '@/components/race-ui/Card';
import { CardHeader } from '@/components/race-ui/CardHeader';
import { InfoGrid } from '@/components/race-ui/InfoGrid';
import { colors, Spacing } from '@/constants/designSystem';
import { PreRaceReminderCard } from '@/components/races/RaceLearningInsights';
import { useAuth } from '@/providers/AuthProvider';

interface RaceDetailCardsProps {
  raceData: any;
  onEdit?: () => void;
}

// Helper function to convert degrees to compass direction
const degreesToCompass = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

export const RaceDetailCards: React.FC<RaceDetailCardsProps> = ({ raceData }) => {
  const { user } = useAuth();

  // Prepare map region from venue data
  const mapRegion = raceData.venue
    ? {
        latitude: raceData.venue.coordinates_lat || 22.3193,
        longitude: raceData.venue.coordinates_lng || 114.1694,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 22.3193,
        longitude: 114.1694,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  // Prepare wind conditions
  const windConditions = {
    speed: raceData.wind_speed || 16,
    direction: raceData.wind_direction_deg || 180,
    gusts: raceData.wind_gusts || raceData.wind_speed ? raceData.wind_speed + 2 : 18,
    beaufortScale: raceData.beaufort_scale || 5,
    description: raceData.wind_description || 'Fresh breeze',
  };

  // Prepare current conditions
  const currentConditions = {
    speed: raceData.current_speed || 0.5,
    direction: raceData.current_direction_deg || 225,
    strength: (raceData.current_strength || 'slack') as 'slack' | 'moderate' | 'strong',
  };

  // Prepare tide data
  const tideData = {
    highTide: {
      time: raceData.high_tide_time || '14:00',
      height: raceData.high_tide_height || '3.3m',
    },
    lowTide: {
      time: raceData.low_tide_time || '08:00',
      height: raceData.low_tide_height || '0.4m',
    },
    range: raceData.tide_range || '4.9m',
  };

  const racingAreaPolygon = (() => {
    const polygonCoords = raceData?.racing_area_polygon?.coordinates?.[0];
    if (!Array.isArray(polygonCoords) || polygonCoords.length < 3) {
      return undefined;
    }
    const base = polygonCoords.map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }));
    if (base.length >= 2) {
      const first = base[0];
      const last = base[base.length - 1];
      if (first.lat === last.lat && first.lng === last.lng) {
        base.pop();
      }
    }
    return base;
  })();

  // Format date and time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Prepare start sequence from critical_details
  const startSequence = React.useMemo(() => {
    const details = raceData.critical_details;
    if (!details) return [];

    const sequence = [];

    if (details.warning_signal_time) {
      sequence.push({
        time: details.warning_signal_time,
        label: 'Warning Signal',
        type: 'warning' as const,
      });
    }

    if (details.preparatory_signal_time) {
      sequence.push({
        time: details.preparatory_signal_time,
        label: 'Prep Signal',
        type: 'prep' as const,
      });
    }

    if (raceData.start_time) {
      sequence.push({
        time: formatTime(raceData.start_time),
        label: 'Start',
        type: 'start' as const,
      });
    }

    return sequence;
  }, [raceData]);

  // Prepare signals
  const signals = React.useMemo(() => {
    const sigs = [];
    const details = raceData.critical_details;

    if (details?.flag_code) sigs.push(details.flag_code);
    if (details?.black_flag_rule) sigs.push('Black Flag');
    if (details?.start_line_rule) sigs.push(details.start_line_rule);

    return sigs;
  }, [raceData]);

  // Prepare contacts
  const contacts = React.useMemo(() => {
    const contactsList = [];

    if (raceData.race_officer) {
      contactsList.push({
        id: '1',
        name: raceData.race_officer,
        role: 'Principal Race Officer',
        phone: raceData.race_officer_phone || '',
      });
    }

    if (raceData.safety_officer) {
      contactsList.push({
        id: '2',
        name: raceData.safety_officer,
        role: 'Safety Officer',
        phone: raceData.safety_officer_phone || '',
      });
    }

    return contactsList;
  }, [raceData]);

  return (
    <View style={styles.container}>
      {/* Map Card */}
      <RaceMapCard
        mapRegion={mapRegion}
        course={raceData.course}
        windConditions={windConditions}
        currentConditions={currentConditions}
      />

      {/* Pre-Race AI Learning Reminder */}
      {user?.id && <PreRaceReminderCard userId={user.id} />}

      {/* Compact Race Info & Details Grid - Mac Weather style */}
      <View style={styles.metricsGrid}>
        <CompactRaceInfoCard
          raceName={raceData.name || 'Unknown Race'}
          startDate={raceData.date ? formatDate(raceData.date) : formatDate(raceData.start_time)}
          startTime={raceData.start_time ? formatTime(raceData.start_time) : ''}
          boatClass={raceData.class || raceData.boat_class}
          venue={raceData.venue?.name || raceData.location}
        />
        <CompactCourseCard
          courseName={raceData.course_name || raceData.course || 'Race Course'}
          startBoatName={raceData.start_boat_name || raceData.critical_details?.start_boat_name}
          pinLength={raceData.pin_length || raceData.critical_details?.pin_length}
          marks={3}
        />
        <CompactCommsCard
          vhfChannel={raceData.vhf_channel || raceData.critical_details?.vhf_channel || '72'}
          workingChannel={raceData.working_channel || '16'}
          raceOfficer={raceData.race_officer}
        />
      </View>

      {/* Timing & Start Sequence */}
      {startSequence.length > 0 && (
        <TimingCard startSequence={startSequence} signals={signals} />
      )}

      {/* AI-Powered Start Strategy */}
      <StartStrategyCard
        raceId={raceData.id}
        raceName={raceData.name || 'Unknown Race'}
        raceStartTime={raceData.start_time}
        venueId={raceData.venue?.id}
        venueName={raceData.venue?.name}
        venueCoordinates={raceData.venue ? {
          lat: raceData.venue.coordinates_lat || 0,
          lng: raceData.venue.coordinates_lng || 0
        } : undefined}
        racingAreaPolygon={racingAreaPolygon}
        weather={{
          wind: {
            speed: (windConditions.speed + windConditions.gusts) / 2,
            direction: degreesToCompass(windConditions.direction),
            speedMin: windConditions.speed,
            speedMax: windConditions.gusts
          },
          current: {
            speed: currentConditions.speed,
            direction: currentConditions.direction
          }
        }}
      />

      {/* Compact Weather Metrics Grid - Mac Weather style */}
      <View style={styles.metricsGrid}>
        <CompactWindCard
          speed={windConditions.speed}
          direction={windConditions.direction}
          gusts={windConditions.gusts}
        />
        <CompactTideCard
          currentSpeed={currentConditions.speed}
          currentDirection={currentConditions.direction}
          strength={currentConditions.strength}
          highTide={tideData.highTide}
          lowTide={tideData.lowTide}
        />
        <CompactWaveCard
          height={raceData.wave_height || 0.8}
          period={raceData.wave_period || 5}
          direction={raceData.wave_direction_deg || windConditions.direction}
        />
      </View>

      {/* Additional Information Card */}
      {(raceData.start_area_notice ||
        raceData.postponement_signal ||
        raceData.abandonment_signal) && (
        <Card>
          <CardHeader icon="alert-circle-outline" title="Important Notices" />

          {raceData.start_area_notice && (
            <View style={styles.noticeSection}>
              <Text style={styles.noticeLabel}>START AREA NOTICE</Text>
              <Text style={styles.noticeText}>{raceData.start_area_notice}</Text>
            </View>
          )}

          {raceData.postponement_signal && (
            <View style={styles.noticeSection}>
              <Text style={styles.noticeLabel}>POSTPONEMENT SIGNAL</Text>
              <Text style={styles.noticeText}>{raceData.postponement_signal}</Text>
            </View>
          )}

          {raceData.abandonment_signal && (
            <View style={styles.noticeSection}>
              <Text style={styles.noticeLabel}>ABANDONMENT SIGNAL</Text>
              <Text style={styles.noticeText}>{raceData.abandonment_signal}</Text>
            </View>
          )}
        </Card>
      )}

      {/* Race Officials Card */}
      {(raceData.race_officer ||
        raceData.safety_officer ||
        raceData.jury_chair ||
        raceData.umpires) && (
        <Card>
          <CardHeader icon="people-outline" title="Race Officials" />

          <InfoGrid>
            {raceData.race_officer && (
              <View style={styles.officialRow}>
                <Text style={styles.officialLabel}>Race Officer</Text>
                <Text style={styles.officialName}>{raceData.race_officer}</Text>
              </View>
            )}

            {raceData.safety_officer && (
              <View style={styles.officialRow}>
                <Text style={styles.officialLabel}>Safety Officer</Text>
                <Text style={styles.officialName}>{raceData.safety_officer}</Text>
              </View>
            )}

            {raceData.jury_chair && (
              <View style={styles.officialRow}>
                <Text style={styles.officialLabel}>Jury Chair</Text>
                <Text style={styles.officialName}>{raceData.jury_chair}</Text>
              </View>
            )}

            {raceData.umpires && (
              <View style={styles.officialRow}>
                <Text style={styles.officialLabel}>Umpires</Text>
                <Text style={styles.officialName}>{raceData.umpires}</Text>
              </View>
            )}
          </InfoGrid>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  noticeSection: {
    marginBottom: Spacing.md,
  },
  noticeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  noticeText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  officialRow: {
    marginBottom: Spacing.sm,
  },
  officialLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  officialName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
});
