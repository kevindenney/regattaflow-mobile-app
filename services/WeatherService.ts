/**
 * Weather Dashboard Service
 * Live conditions tracking for race management
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export type StationType = 'manual' | 'boat_mounted' | 'shore_station' | 'buoy' | 'api';
export type PressureTrend = 'rising' | 'steady' | 'falling';
export type Precipitation = 'none' | 'light' | 'moderate' | 'heavy';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface WeatherStation {
  id: string;
  club_id?: string;
  name: string;
  station_type: StationType;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  elevation_meters?: number;
  api_provider?: string;
  api_station_id?: string;
  is_active: boolean;
  last_reading_at?: string;
}

export interface WeatherReading {
  id: string;
  regatta_id: string;
  station_id?: string;
  recorded_at: string;
  
  // Wind
  wind_direction_degrees?: number;
  wind_speed_knots?: number;
  wind_gust_knots?: number;
  wind_direction_avg?: number;
  wind_direction_std?: number;
  wind_speed_avg?: number;
  wind_speed_min?: number;
  wind_speed_max?: number;
  
  // Atmospheric
  temperature_celsius?: number;
  humidity_percent?: number;
  pressure_hpa?: number;
  pressure_trend?: PressureTrend;
  
  // Sea state
  wave_height_meters?: number;
  wave_period_seconds?: number;
  current_direction_degrees?: number;
  current_speed_knots?: number;
  
  // Visibility
  visibility_nm?: number;
  cloud_cover_percent?: number;
  precipitation?: Precipitation;
  
  // Meta
  source: 'manual' | 'sensor' | 'api';
  recorded_by?: string;
  notes?: string;
}

export interface LatestWeather extends WeatherReading {
  station_name?: string;
  station_type?: StationType;
  wind_direction_name: string;
}

export interface WindStats {
  avg_direction: number;
  direction_std: number;
  avg_speed: number;
  min_speed: number;
  max_speed: number;
  avg_gust: number;
  reading_count: number;
}

export interface WindShift {
  shift_detected: boolean;
  previous_direction: number;
  current_direction: number;
  shift_amount: number;
  shift_direction: 'veered' | 'backed' | 'steady';
}

export interface WindHistoryPoint {
  regatta_id: string;
  time_bucket: string;
  avg_direction: number;
  avg_speed: number;
  max_gust: number;
  reading_count: number;
}

export interface WeatherAlert {
  id: string;
  club_id?: string;
  name: string;
  alert_type: string;
  threshold_value?: number;
  threshold_unit?: string;
  comparison?: string;
  shift_degrees?: number;
  shift_minutes?: number;
  severity: AlertSeverity;
  auto_log: boolean;
  sound_alert: boolean;
  is_active: boolean;
}

export interface AlertEvent {
  id: string;
  regatta_id: string;
  alert_id?: string;
  reading_id?: string;
  alert_type: string;
  severity: AlertSeverity;
  message: string;
  current_value?: number;
  threshold_value?: number;
  triggered_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
}

export interface WeatherReadingInput {
  regatta_id: string;
  station_id?: string;
  wind_direction_degrees?: number;
  wind_speed_knots?: number;
  wind_gust_knots?: number;
  temperature_celsius?: number;
  humidity_percent?: number;
  pressure_hpa?: number;
  visibility_nm?: number;
  wave_height_meters?: number;
  notes?: string;
}

// ============================================================================
// WEATHER SERVICE CLASS
// ============================================================================

class WeatherService {

  // -------------------------------------------------------------------------
  // READINGS
  // -------------------------------------------------------------------------

  /**
   * Record a new weather reading
   */
  async recordReading(input: WeatherReadingInput): Promise<WeatherReading> {
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('weather_readings')
      .insert({
        ...input,
        recorded_at: new Date().toISOString(),
        source: 'manual',
        recorded_by: user.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Check for alerts
    await this.checkAlerts(input.regatta_id, data);

    return data;
  }

  /**
   * Get latest weather for a regatta
   */
  async getLatestWeather(regattaId: string): Promise<LatestWeather | null> {
    const { data, error } = await supabase
      .from('latest_weather')
      .select('*')
      .eq('regatta_id', regattaId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get weather readings for a regatta
   */
  async getReadings(
    regattaId: string,
    limit: number = 50
  ): Promise<WeatherReading[]> {
    const { data, error } = await supabase
      .from('weather_readings')
      .select('*')
      .eq('regatta_id', regattaId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get wind history for charts
   */
  async getWindHistory(regattaId: string): Promise<WindHistoryPoint[]> {
    const { data, error } = await supabase
      .from('wind_history')
      .select('*')
      .eq('regatta_id', regattaId)
      .order('time_bucket', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // -------------------------------------------------------------------------
  // STATISTICS
  // -------------------------------------------------------------------------

  /**
   * Get wind statistics for a period
   */
  async getWindStats(regattaId: string, minutes: number = 10): Promise<WindStats | null> {
    const { data, error } = await supabase.rpc('calculate_wind_stats', {
      p_regatta_id: regattaId,
      p_minutes: minutes,
    });

    if (error) throw error;
    return data?.[0] || null;
  }

  /**
   * Detect wind shift
   */
  async detectWindShift(
    regattaId: string,
    thresholdDegrees: number = 15,
    minutes: number = 10
  ): Promise<WindShift | null> {
    const { data, error } = await supabase.rpc('detect_wind_shift', {
      p_regatta_id: regattaId,
      p_threshold_degrees: thresholdDegrees,
      p_minutes: minutes,
    });

    if (error) throw error;
    return data?.[0] || null;
  }

  /**
   * Calculate true wind from apparent (for boat-mounted sensors)
   */
  calculateTrueWind(
    apparentDirection: number,
    apparentSpeed: number,
    boatSpeed: number,
    boatHeading: number
  ): { trueDirection: number; trueSpeed: number } {
    // Convert to radians
    const apparentAngle = ((apparentDirection - boatHeading + 360) % 360) * Math.PI / 180;
    
    // Calculate true wind speed
    const trueSpeed = Math.sqrt(
      Math.pow(apparentSpeed * Math.cos(apparentAngle) - boatSpeed, 2) +
      Math.pow(apparentSpeed * Math.sin(apparentAngle), 2)
    );
    
    // Calculate true wind angle
    const trueAngle = Math.atan2(
      apparentSpeed * Math.sin(apparentAngle),
      apparentSpeed * Math.cos(apparentAngle) - boatSpeed
    );
    
    // Convert back to compass direction
    const trueDirection = ((trueAngle * 180 / Math.PI) + boatHeading + 360) % 360;
    
    return {
      trueDirection: Math.round(trueDirection),
      trueSpeed: Math.round(trueSpeed * 10) / 10,
    };
  }

  // -------------------------------------------------------------------------
  // ALERTS
  // -------------------------------------------------------------------------

  /**
   * Get active alerts for a club
   */
  async getAlerts(clubId?: string): Promise<WeatherAlert[]> {
    let query = supabase
      .from('weather_alerts')
      .select('*')
      .eq('is_active', true);

    if (clubId) {
      query = query.or(`club_id.eq.${clubId},club_id.is.null`);
    } else {
      query = query.is('club_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get alert events for a regatta
   */
  async getAlertEvents(
    regattaId: string,
    unacknowledgedOnly: boolean = false
  ): Promise<AlertEvent[]> {
    let query = supabase
      .from('weather_alert_events')
      .select('*')
      .eq('regatta_id', regattaId)
      .order('triggered_at', { ascending: false });

    if (unacknowledgedOnly) {
      query = query.is('acknowledged_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertEventId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('weather_alert_events')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user.user?.id,
      })
      .eq('id', alertEventId);

    if (error) throw error;
  }

  /**
   * Check alerts for a new reading
   */
  private async checkAlerts(regattaId: string, reading: WeatherReading): Promise<void> {
    const alerts = await this.getAlerts();
    const events: Partial<AlertEvent>[] = [];

    for (const alert of alerts) {
      let triggered = false;
      let message = '';
      let currentValue: number | undefined;

      switch (alert.alert_type) {
        case 'high_wind':
          if (reading.wind_speed_knots && alert.threshold_value) {
            currentValue = reading.wind_speed_knots;
            triggered = currentValue >= alert.threshold_value;
            message = `High wind: ${currentValue} knots (threshold: ${alert.threshold_value})`;
          }
          break;

        case 'low_wind':
          if (reading.wind_speed_knots !== undefined && alert.threshold_value) {
            currentValue = reading.wind_speed_knots;
            triggered = currentValue <= alert.threshold_value;
            message = `Low wind: ${currentValue} knots (threshold: ${alert.threshold_value})`;
          }
          break;

        case 'gusts':
          if (reading.wind_gust_knots && alert.threshold_value) {
            currentValue = reading.wind_gust_knots;
            triggered = currentValue >= alert.threshold_value;
            message = `Strong gusts: ${currentValue} knots (threshold: ${alert.threshold_value})`;
          }
          break;

        case 'visibility':
          if (reading.visibility_nm !== undefined && alert.threshold_value) {
            currentValue = reading.visibility_nm;
            triggered = currentValue <= alert.threshold_value;
            message = `Poor visibility: ${currentValue} nm (threshold: ${alert.threshold_value})`;
          }
          break;

        case 'wind_shift':
          if (alert.shift_degrees) {
            const shift = await this.detectWindShift(
              regattaId,
              alert.shift_degrees,
              alert.shift_minutes || 10
            );
            if (shift?.shift_detected) {
              triggered = true;
              currentValue = Math.abs(shift.shift_amount);
              message = `Wind shift: ${shift.shift_direction} ${Math.abs(shift.shift_amount)}° (from ${shift.previous_direction}° to ${shift.current_direction}°)`;
            }
          }
          break;
      }

      if (triggered) {
        events.push({
          regatta_id: regattaId,
          alert_id: alert.id,
          reading_id: reading.id,
          alert_type: alert.alert_type,
          severity: alert.severity,
          message,
          current_value: currentValue,
          threshold_value: alert.threshold_value,
        });
      }
    }

    // Insert alert events
    if (events.length > 0) {
      await supabase.from('weather_alert_events').insert(events);
    }
  }

  // -------------------------------------------------------------------------
  // STATIONS
  // -------------------------------------------------------------------------

  /**
   * Get weather stations for a club
   */
  async getStations(clubId?: string): Promise<WeatherStation[]> {
    let query = supabase
      .from('weather_stations')
      .select('*')
      .eq('is_active', true);

    if (clubId) {
      query = query.eq('club_id', clubId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Create a weather station
   */
  async createStation(station: Partial<WeatherStation>): Promise<WeatherStation> {
    const { data, error } = await supabase
      .from('weather_stations')
      .insert(station)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------

  /**
   * Convert degrees to cardinal direction
   */
  getDirectionName(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  /**
   * Get short direction name (8 points)
   */
  getShortDirectionName(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }

  /**
   * Format wind for display
   */
  formatWind(direction: number | undefined, speed: number | undefined, gust?: number): string {
    if (direction === undefined || speed === undefined) return 'No data';
    
    const dir = this.getShortDirectionName(direction);
    let result = `${dir} ${speed.toFixed(1)} kts`;
    
    if (gust && gust > speed) {
      result += ` G${gust.toFixed(0)}`;
    }
    
    return result;
  }

  /**
   * Get Beaufort scale
   */
  getBeaufortScale(speedKnots: number): {
    force: number;
    description: string;
    seaState: string;
  } {
    const scales = [
      { force: 0, max: 1, description: 'Calm', seaState: 'Flat' },
      { force: 1, max: 3, description: 'Light air', seaState: 'Ripples' },
      { force: 2, max: 6, description: 'Light breeze', seaState: 'Small wavelets' },
      { force: 3, max: 10, description: 'Gentle breeze', seaState: 'Large wavelets' },
      { force: 4, max: 16, description: 'Moderate breeze', seaState: 'Small waves' },
      { force: 5, max: 21, description: 'Fresh breeze', seaState: 'Moderate waves' },
      { force: 6, max: 27, description: 'Strong breeze', seaState: 'Large waves' },
      { force: 7, max: 33, description: 'Near gale', seaState: 'Sea heaps up' },
      { force: 8, max: 40, description: 'Gale', seaState: 'Moderately high waves' },
      { force: 9, max: 47, description: 'Strong gale', seaState: 'High waves' },
      { force: 10, max: 55, description: 'Storm', seaState: 'Very high waves' },
      { force: 11, max: 63, description: 'Violent storm', seaState: 'Exceptionally high waves' },
      { force: 12, max: Infinity, description: 'Hurricane', seaState: 'Huge waves' },
    ];

    const scale = scales.find(s => speedKnots <= s.max) || scales[12];
    return {
      force: scale.force,
      description: scale.description,
      seaState: scale.seaState,
    };
  }

  /**
   * Get severity color
   */
  getSeverityColor(severity: AlertSeverity): { color: string; bg: string } {
    const colors: Record<AlertSeverity, { color: string; bg: string }> = {
      info: { color: '#0EA5E9', bg: '#E0F2FE' },
      warning: { color: '#D97706', bg: '#FEF3C7' },
      critical: { color: '#DC2626', bg: '#FEE2E2' },
    };
    return colors[severity];
  }

  /**
   * Calculate optimal course angle based on wind
   */
  calculateCourseAngles(windDirection: number): {
    beatPort: number;
    beatStarboard: number;
    runPort: number;
    runStarboard: number;
    reachPort: number;
    reachStarboard: number;
  } {
    // Typical sailing angles
    const beatAngle = 45;
    const runAngle = 170;
    const reachAngle = 90;

    return {
      beatPort: (windDirection - beatAngle + 360) % 360,
      beatStarboard: (windDirection + beatAngle) % 360,
      runPort: (windDirection - runAngle + 360) % 360,
      runStarboard: (windDirection + runAngle) % 360,
      reachPort: (windDirection - reachAngle + 360) % 360,
      reachStarboard: (windDirection + reachAngle) % 360,
    };
  }
}

// Export singleton
export const weatherService = new WeatherService();
export default WeatherService;

