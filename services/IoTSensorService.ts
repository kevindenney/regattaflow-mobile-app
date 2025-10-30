import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';

interface SensorData {
  timestamp: number;
  sensor_id: string;
  value: number;
  unit: string;
  quality: 'good' | 'fair' | 'poor';
}

interface BoatTelemetry {
  boat_id: string;
  timestamp: number;
  position: {
    latitude: number;
    longitude: number;
    accuracy: number; // meters
  };
  motion: {
    speed_over_ground: number; // knots
    course_over_ground: number; // degrees
    heading: number; // degrees
    heel_angle: number; // degrees
    pitch_angle: number; // degrees
    roll_rate: number; // degrees/second
  };
  wind: {
    apparent_speed: number; // knots
    apparent_angle: number; // degrees
    true_speed?: number; // knots (calculated)
    true_angle?: number; // degrees (calculated)
  };
  environment: {
    water_temperature: number; // celsius
    air_temperature: number; // celsius
    barometric_pressure: number; // hPa
    humidity: number; // percentage
  };
  boat_systems: {
    battery_voltage: number; // volts
    engine_hours?: number;
    fuel_level?: number; // percentage
    bilge_pump_status: boolean;
  };
}

interface SailTelemetry {
  main_sail: {
    sheet_load: number; // kg
    cunningham_load: number; // kg
    outhaul_load: number; // kg
    vang_load: number; // kg
    halyard_tension: number; // kg
  };
  jib: {
    sheet_load: number; // kg
    halyard_tension: number; // kg
    lead_position: number; // millimeters from datum
  };
  spinnaker?: {
    sheet_load: number; // kg
    guy_load: number; // kg
    halyard_tension: number; // kg
    pole_angle: number; // degrees
  };
  mast: {
    bend: number; // millimeters
    compression: number; // kg
    forestay_tension: number; // kg
    backstay_tension: number; // kg
  };
}

interface PerformanceMetrics {
  velocity_made_good: number; // knots
  velocity_prediction: number; // knots (theoretical optimal)
  efficiency: number; // percentage (actual vs predicted)
  leeway_angle: number; // degrees
  set_and_drift: {
    set: number; // degrees (current direction)
    drift: number; // knots (current speed)
  };
  polar_performance: {
    target_speed: number; // knots
    actual_speed: number; // knots
    target_angle: number; // degrees
    actual_angle: number; // degrees
  };
}

interface SensorConfiguration {
  sensor_id: string;
  name: string;
  type: 'NMEA2000' | 'NMEA0183' | 'Bluetooth' | 'WiFi' | 'LoRa' | 'Custom';
  location: string;
  calibration: {
    offset: number;
    multiplier: number;
    last_calibrated: string;
  };
  update_frequency: number; // Hz
  enabled: boolean;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string; // e.g., "heel_angle > 30"
  severity: 'info' | 'warning' | 'critical';
  message: string;
  actions: ('notification' | 'log' | 'coaching_alert')[];
  enabled: boolean;
}

const logger = createLogger('IoTSensorService');
export class IoTSensorService {
  private static connectedSensors: Map<string, SensorConfiguration> = new Map();
  private static sensorData: Map<string, SensorData[]> = new Map();
  private static alertRules: AlertRule[] = [];
  private static isRecording = false;
  private static currentSessionId: string | null = null;

  /**
   * Initialize sensor connections and start data collection
   */
  static async initializeSensors(boatId: string): Promise<void> {
    try {
      // Load sensor configuration from database
      const { data: sensorConfigs } = await supabase
        .from('sensor_configurations')
        .select('*')
        .eq('boat_id', boatId)
        .eq('enabled', true);

      if (sensorConfigs) {
        sensorConfigs.forEach(config => {
          this.connectedSensors.set(config.sensor_id, config);
          this.sensorData.set(config.sensor_id, []);
        });
      }

      // Load alert rules
      const { data: alertRules } = await supabase
        .from('sensor_alert_rules')
        .select('*')
        .eq('boat_id', boatId)
        .eq('enabled', true);

      if (alertRules) {
        this.alertRules = alertRules;
      }

      // Start sensor polling
      this.startSensorPolling();

      logger.debug(`Initialized ${this.connectedSensors.size} sensors for boat ${boatId}`);
    } catch (error) {
      console.error('Error initializing sensors:', error);
      throw error;
    }
  }

  /**
   * Start recording sensor data for a coaching session
   */
  static startRecording(sessionId: string): void {
    this.isRecording = true;
    this.currentSessionId = sessionId;
    logger.debug(`Started recording sensor data for session ${sessionId}`);
  }

  /**
   * Stop recording and save session data
   */
  static async stopRecording(): Promise<void> {
    if (!this.isRecording || !this.currentSessionId) return;

    try {
      // Save all collected sensor data to database
      const allData: any[] = [];

      this.sensorData.forEach((dataPoints, sensorId) => {
        dataPoints.forEach(dataPoint => {
          allData.push({
            session_id: this.currentSessionId,
            sensor_id: sensorId,
            timestamp: dataPoint.timestamp,
            value: dataPoint.value,
            unit: dataPoint.unit,
            quality: dataPoint.quality,
          });
        });
      });

      if (allData.length > 0) {
        const { error } = await supabase
          .from('sensor_data_logs')
          .insert(allData);

        if (error) throw error;
      }

      // Clear data for next session
      this.sensorData.forEach((_, sensorId) => {
        this.sensorData.set(sensorId, []);
      });

      this.isRecording = false;
      this.currentSessionId = null;

      logger.debug(`Saved ${allData.length} sensor data points`);
    } catch (error) {
      console.error('Error saving sensor data:', error);
      throw error;
    }
  }

  /**
   * Get current boat telemetry
   */
  static getCurrentTelemetry(): BoatTelemetry | null {
    try {
      if (this.sensorData.size === 0) {
        return this.generateSimulatedTelemetry();
      }

      const now = Date.now();
      const telemetry: Partial<BoatTelemetry> = {
        boat_id: 'current-boat',
        timestamp: now,
      };

      // Aggregate sensor data into telemetry structure
      // This would integrate with actual sensor readings
      // For demo, we'll return simulated data
      return this.generateSimulatedTelemetry();
    } catch (error) {
      console.error('Error getting telemetry:', error);
      return null;
    }
  }

  /**
   * Get current sail telemetry
   */
  static getCurrentSailTelemetry(): SailTelemetry | null {
    try {
      // In production, this would read from load cells and position sensors
      return this.generateSimulatedSailTelemetry();
    } catch (error) {
      console.error('Error getting sail telemetry:', error);
      return null;
    }
  }

  /**
   * Calculate performance metrics from current data
   */
  static calculatePerformanceMetrics(
    telemetry: BoatTelemetry,
    polarData: any
  ): PerformanceMetrics {
    try {
      // Calculate VMG
      const vmg = this.calculateVMG(
        telemetry.motion.speed_over_ground,
        telemetry.motion.course_over_ground,
        telemetry.wind.true_angle || telemetry.wind.apparent_angle
      );

      // Get target performance from polars
      const targetSpeed = this.getTargetSpeed(
        telemetry.wind.true_speed || telemetry.wind.apparent_speed,
        telemetry.wind.true_angle || telemetry.wind.apparent_angle,
        polarData
      );

      return {
        velocity_made_good: vmg,
        velocity_prediction: targetSpeed,
        efficiency: (telemetry.motion.speed_over_ground / targetSpeed) * 100,
        leeway_angle: this.calculateLeeway(telemetry),
        set_and_drift: this.calculateSetAndDrift(telemetry),
        polar_performance: {
          target_speed: targetSpeed,
          actual_speed: telemetry.motion.speed_over_ground,
          target_angle: this.getTargetAngle(
            telemetry.wind.true_speed || telemetry.wind.apparent_speed,
            polarData
          ),
          actual_angle: telemetry.wind.true_angle || telemetry.wind.apparent_angle,
        },
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return this.generateFallbackMetrics();
    }
  }

  /**
   * Check sensor data against alert rules
   */
  static checkAlertRules(telemetry: BoatTelemetry): void {
    this.alertRules.forEach(rule => {
      if (this.evaluateAlertCondition(rule.condition, telemetry)) {
        this.triggerAlert(rule, telemetry);
      }
    });
  }

  /**
   * Get sensor health status
   */
  static getSensorHealth(): {
    overall_status: 'good' | 'degraded' | 'critical';
    sensor_statuses: { sensor_id: string; status: string; last_update: number }[];
    issues: string[];
  } {
    const statuses: any[] = [];
    const issues: string[] = [];
    const now = Date.now();

    this.connectedSensors.forEach((config, sensorId) => {
      const recentData = this.sensorData.get(sensorId) || [];
      const lastUpdate = recentData.length > 0 ? recentData[recentData.length - 1].timestamp : 0;
      const timeSinceUpdate = now - lastUpdate;

      let status = 'good';
      if (timeSinceUpdate > 30000) { // 30 seconds
        status = 'stale';
        issues.push(`${config.name} data is stale`);
      } else if (timeSinceUpdate > 10000) { // 10 seconds
        status = 'warning';
      }

      statuses.push({
        sensor_id: sensorId,
        status,
        last_update: lastUpdate,
      });
    });

    const overallStatus = issues.length > 0 ? 'degraded' : 'good';

    return {
      overall_status: overallStatus,
      sensor_statuses: statuses,
      issues,
    };
  }

  /**
   * Configure new sensor
   */
  static async configureSensor(config: SensorConfiguration): Promise<void> {
    try {
      const { error } = await supabase
        .from('sensor_configurations')
        .upsert(config);

      if (error) throw error;

      this.connectedSensors.set(config.sensor_id, config);
      this.sensorData.set(config.sensor_id, []);

      logger.debug(`Configured sensor: ${config.name}`);
    } catch (error) {
      console.error('Error configuring sensor:', error);
      throw error;
    }
  }

  /**
   * Calibrate sensor
   */
  static async calibrateSensor(
    sensorId: string,
    referenceValue: number,
    measuredValue: number
  ): Promise<void> {
    try {
      const config = this.connectedSensors.get(sensorId);
      if (!config) throw new Error('Sensor not found');

      // Calculate calibration values
      const offset = referenceValue - measuredValue;
      const multiplier = referenceValue / measuredValue;

      config.calibration = {
        offset,
        multiplier,
        last_calibrated: new Date().toISOString(),
      };

      await this.configureSensor(config);

      logger.debug(`Calibrated sensor ${sensorId}: offset=${offset}, multiplier=${multiplier}`);
    } catch (error) {
      console.error('Error calibrating sensor:', error);
      throw error;
    }
  }

  // Private methods

  private static startSensorPolling(): void {
    // Simulate sensor data polling
    setInterval(() => {
      this.connectedSensors.forEach((config, sensorId) => {
        const dataPoint = this.generateSensorDataPoint(config);
        const sensorDataArray = this.sensorData.get(sensorId) || [];

        sensorDataArray.push(dataPoint);

        // Keep only last 1000 data points per sensor
        if (sensorDataArray.length > 1000) {
          sensorDataArray.shift();
        }

        this.sensorData.set(sensorId, sensorDataArray);
      });
    }, 1000); // 1 Hz polling
  }

  private static generateSensorDataPoint(config: SensorConfiguration): SensorData {
    // Generate realistic sensor data based on sensor type
    let value = 0;
    let unit = '';

    switch (config.name) {
      case 'wind_speed':
        value = 8 + Math.random() * 8; // 8-16 knots
        unit = 'knots';
        break;
      case 'wind_angle':
        value = 30 + (Math.random() - 0.5) * 20; // 20-40 degrees
        unit = 'degrees';
        break;
      case 'boat_speed':
        value = 5 + Math.random() * 3; // 5-8 knots
        unit = 'knots';
        break;
      case 'heel_angle':
        value = 15 + (Math.random() - 0.5) * 10; // 10-20 degrees
        unit = 'degrees';
        break;
      default:
        value = Math.random() * 100;
        unit = 'units';
    }

    return {
      timestamp: Date.now(),
      sensor_id: config.sensor_id,
      value: value * config.calibration.multiplier + config.calibration.offset,
      unit,
      quality: Math.random() > 0.1 ? 'good' : 'fair',
    };
  }

  private static generateSimulatedTelemetry(): BoatTelemetry {
    return {
      boat_id: 'demo-boat',
      timestamp: Date.now(),
      position: {
        latitude: 37.8044 + (Math.random() - 0.5) * 0.001,
        longitude: -122.4692 + (Math.random() - 0.5) * 0.001,
        accuracy: 3,
      },
      motion: {
        speed_over_ground: 6.2 + (Math.random() - 0.5) * 1.0,
        course_over_ground: 45 + (Math.random() - 0.5) * 10,
        heading: 42 + (Math.random() - 0.5) * 5,
        heel_angle: 18 + (Math.random() - 0.5) * 6,
        pitch_angle: 2 + (Math.random() - 0.5) * 2,
        roll_rate: (Math.random() - 0.5) * 5,
      },
      wind: {
        apparent_speed: 12 + (Math.random() - 0.5) * 4,
        apparent_angle: 35 + (Math.random() - 0.5) * 10,
        true_speed: 14 + (Math.random() - 0.5) * 4,
        true_angle: 40 + (Math.random() - 0.5) * 10,
      },
      environment: {
        water_temperature: 18 + (Math.random() - 0.5) * 2,
        air_temperature: 22 + (Math.random() - 0.5) * 2,
        barometric_pressure: 1013 + (Math.random() - 0.5) * 10,
        humidity: 65 + (Math.random() - 0.5) * 10,
      },
      boat_systems: {
        battery_voltage: 12.4 + (Math.random() - 0.5) * 0.4,
        bilge_pump_status: false,
      },
    };
  }

  private static generateSimulatedSailTelemetry(): SailTelemetry {
    return {
      main_sail: {
        sheet_load: 150 + Math.random() * 50,
        cunningham_load: 25 + Math.random() * 10,
        outhaul_load: 40 + Math.random() * 15,
        vang_load: 80 + Math.random() * 30,
        halyard_tension: 200 + Math.random() * 50,
      },
      jib: {
        sheet_load: 120 + Math.random() * 40,
        halyard_tension: 180 + Math.random() * 40,
        lead_position: 1200 + Math.random() * 100,
      },
      mast: {
        bend: 15 + Math.random() * 10,
        compression: 500 + Math.random() * 100,
        forestay_tension: 800 + Math.random() * 200,
        backstay_tension: 300 + Math.random() * 100,
      },
    };
  }

  private static calculateVMG(speed: number, course: number, windAngle: number): number {
    const relativeAngle = Math.abs(course - windAngle);
    return speed * Math.cos(relativeAngle * Math.PI / 180);
  }

  private static getTargetSpeed(windSpeed: number, windAngle: number, polarData: any): number {
    // Simplified polar lookup - in production would interpolate from actual polar data
    const baseSpeed = windSpeed * 0.6; // Rough approximation
    const angleEfficiency = Math.sin(windAngle * Math.PI / 180);
    return baseSpeed * angleEfficiency;
  }

  private static getTargetAngle(windSpeed: number, polarData: any): number {
    // Simplified target angle calculation
    if (windSpeed < 8) return 35;
    if (windSpeed < 15) return 30;
    return 25;
  }

  private static calculateLeeway(telemetry: BoatTelemetry): number {
    // Simplified leeway calculation
    const heelEffect = telemetry.motion.heel_angle * 0.1;
    const speedEffect = (8 - telemetry.motion.speed_over_ground) * 0.2;
    return Math.max(0, heelEffect + speedEffect);
  }

  private static calculateSetAndDrift(telemetry: BoatTelemetry): { set: number; drift: number } {
    // Simplified current calculation
    return {
      set: 180 + (Math.random() - 0.5) * 60,
      drift: 0.3 + Math.random() * 0.4,
    };
  }

  private static evaluateAlertCondition(condition: string, telemetry: BoatTelemetry): boolean {
    // Simple condition evaluation - in production would use proper expression parser
    try {
      if (condition.includes('heel_angle > 30')) {
        return telemetry.motion.heel_angle > 30;
      }
      if (condition.includes('battery_voltage < 12')) {
        return telemetry.boat_systems.battery_voltage < 12;
      }
      return false;
    } catch {
      return false;
    }
  }

  private static triggerAlert(rule: AlertRule, telemetry: BoatTelemetry): void {
    logger.debug(`ALERT [${rule.severity}]: ${rule.message}`);

    // In production, would send notifications, log to database, etc.
    if (rule.actions.includes('coaching_alert')) {
      // Could trigger coaching assistant alert
    }
  }

  private static generateFallbackMetrics(): PerformanceMetrics {
    return {
      velocity_made_good: 5.2,
      velocity_prediction: 6.1,
      efficiency: 85,
      leeway_angle: 3.5,
      set_and_drift: { set: 190, drift: 0.4 },
      polar_performance: {
        target_speed: 6.1,
        actual_speed: 5.8,
        target_angle: 32,
        actual_angle: 35,
      },
    };
  }
}

export default IoTSensorService;