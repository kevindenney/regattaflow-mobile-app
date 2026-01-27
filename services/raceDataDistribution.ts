// @ts-nocheck

/**
 * Race Data Distribution Service
 * Marine-grade automated race data delivery system
 * Core differentiator: Automatic race course and strategy data distribution to sailors
 */

import { supabase } from '@/services/supabase';
import { Platform } from 'react-native';

interface RaceDataPackage {
  race_id: string;
  race_name: string;
  club_name: string;
  race_course: {
    type: string;
    marks: Array<{
      id: string;
      name: string;
      lat: number;
      lng: number;
      type: string;
    }>;
    instructions: string;
    safety_notes: string[];
  };
  start_date: string;
  wind_conditions: {
    min_wind: number;
    max_wind: number;
    direction_range: string;
  };
  venue_intelligence?: {
    local_knowledge: string[];
    weather_patterns: string[];
    tactical_notes: string[];
  };
  equipment_recommendations?: {
    sail_selection: string[];
    boat_setup: string[];
  };
  distributed_at: string;
  expires_at: string;
}

interface DistributionResult {
  success: boolean;
  sailors_reached: number;
  failed_deliveries: string[];
  package_size: number;
  distribution_time: number;
}

/**
 * Race Data Distribution Service
 * Automatically delivers race courses and strategic data to registered sailors
 */
export class RaceDataDistributionService {
  private static instance: RaceDataDistributionService;

  static getInstance(): RaceDataDistributionService {
    if (!RaceDataDistributionService.instance) {
      RaceDataDistributionService.instance = new RaceDataDistributionService();
    }
    return RaceDataDistributionService.instance;
  }

  /**
   * Distribute race data to all registered sailors
   */
  async distributeRaceData(raceId: string): Promise<DistributionResult> {
    const startTime = Date.now();

    try {

      // Get race event details with enhanced data
      const raceData = await this.buildRaceDataPackage(raceId);
      if (!raceData) {
        throw new Error('Failed to build race data package');
      }

      // Get registered sailors
      const sailors = await this.getRegisteredSailors(raceId);
      if (sailors.length === 0) {

        return {
          success: true,
          sailors_reached: 0,
          failed_deliveries: [],
          package_size: JSON.stringify(raceData).length,
          distribution_time: Date.now() - startTime,
        };
      }

      // Distribute data to each sailor
      const distributionResults = await Promise.allSettled(
        sailors.map(sailor => this.deliverToSailor(sailor, raceData))
      );

      // Analyze results
      const failedDeliveries: string[] = [];
      let successCount = 0;

      distributionResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          successCount++;
        } else {
          failedDeliveries.push(sailors[index].user_id);
        }
      });

      // Log distribution summary
      await this.logDistribution(raceId, {
        total_sailors: sailors.length,
        successful_deliveries: successCount,
        failed_deliveries: failedDeliveries.length,
        package_size: JSON.stringify(raceData).length,
        distribution_time: Date.now() - startTime,
      });

      return {
        success: failedDeliveries.length < sailors.length / 2, // Success if less than 50% failed
        sailors_reached: successCount,
        failed_deliveries: failedDeliveries,
        package_size: JSON.stringify(raceData).length,
        distribution_time: Date.now() - startTime,
      };

    } catch (error) {

      return {
        success: false,
        sailors_reached: 0,
        failed_deliveries: [],
        package_size: 0,
        distribution_time: Date.now() - startTime,
      };
    }
  }

  /**
   * Build comprehensive race data package with venue intelligence
   */
  private async buildRaceDataPackage(raceId: string): Promise<RaceDataPackage | null> {
    try {
      // Get race event with club data
      const { data: raceEvent, error: raceError } = await supabase
        .from('race_events')
        .select(`
          *,
          clubs (
            name,
            sailing_area,
            location
          )
        `)
        .eq('id', raceId)
        .single();

      if (raceError || !raceEvent) {

        return null;
      }

      // Get venue intelligence if available
      const venueIntelligence = await this.getVenueIntelligence(raceEvent.clubs.location);

      // Get equipment recommendations based on conditions
      const equipmentRecommendations = await this.getEquipmentRecommendations(
        raceEvent.wind_conditions,
        raceEvent.sailing_class
      );

      // Build comprehensive data package
      const dataPackage: RaceDataPackage = {
        race_id: raceId,
        race_name: raceEvent.name,
        club_name: raceEvent.clubs.name,
        race_course: raceEvent.race_course,
        start_date: raceEvent.start_date,
        wind_conditions: raceEvent.wind_conditions,
        venue_intelligence: venueIntelligence,
        equipment_recommendations: equipmentRecommendations,
        distributed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      };

      return dataPackage;

    } catch (error) {

      return null;
    }
  }

  /**
   * Get venue intelligence for location
   */
  private async getVenueIntelligence(location: any): Promise<RaceDataPackage['venue_intelligence']> {
    try {
      // This would query the global venue intelligence system
      // For now, return basic local knowledge
      return {
        local_knowledge: [
          'Check local tide charts for optimal racing times',
          'Monitor wind patterns specific to this venue',
          'Be aware of local traffic and commercial vessels',
        ],
        weather_patterns: [
          'Morning winds typically lighter, building through day',
          'Afternoon thermal effects may create wind shifts',
          'Check for local weather station updates',
        ],
        tactical_notes: [
          'Favored end of start line varies with wind direction',
          'Current effects significant near shoreline',
          'Local knowledge of wind holes and pressure areas',
        ],
      };
    } catch (error) {

      return undefined;
    }
  }

  /**
   * Get equipment recommendations based on conditions
   */
  private async getEquipmentRecommendations(
    windConditions: any,
    sailingClass: string
  ): Promise<RaceDataPackage['equipment_recommendations']> {
    try {
      // AI-powered equipment optimization based on conditions
      const recommendations = {
        sail_selection: [],
        boat_setup: [],
      };

      // Wind-based sail recommendations
      if (windConditions.max_wind < 12) {
        recommendations.sail_selection.push('Light air headsail', 'Full main with minimal reef');
        recommendations.boat_setup.push('Loose rig tension', 'Forward crew weight positioning');
      } else if (windConditions.max_wind > 20) {
        recommendations.sail_selection.push('Heavy air jib', 'Reefed main sail');
        recommendations.boat_setup.push('Increased rig tension', 'Aft crew weight for control');
      } else {
        recommendations.sail_selection.push('Medium air jib', 'Full main sail');
        recommendations.boat_setup.push('Standard rig tension', 'Balanced crew positioning');
      }

      // Class-specific recommendations
      if (sailingClass.toLowerCase().includes('laser') || sailingClass.toLowerCase().includes('ilca')) {
        recommendations.boat_setup.push('Adjust vang and outhaul for conditions', 'Consider hiking strap adjustments');
      }

      return recommendations;

    } catch (error) {

      return undefined;
    }
  }

  /**
   * Get registered sailors for race
   */
  private async getRegisteredSailors(raceId: string): Promise<Array<{
    user_id: string;
    email: string;
    full_name: string;
    push_token?: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('race_registrations')
        .select(`
          user_id,
          users (
            id,
            email,
            full_name,
            push_token
          )
        `)
        .eq('race_id', raceId)
        .eq('status', 'confirmed');

      if (error) {

        return [];
      }

      return data.map(reg => ({
        user_id: reg.user_id,
        email: reg.users.email,
        full_name: reg.users.full_name,
        push_token: reg.users.push_token,
      }));

    } catch (error) {

      return [];
    }
  }

  /**
   * Deliver race data package to individual sailor
   */
  private async deliverToSailor(
    sailor: { user_id: string; email: string; full_name: string; push_token?: string },
    raceData: RaceDataPackage
  ): Promise<boolean> {
    try {
      // 1. Store data in sailor's personal race data table
      await this.storeSailorRaceData(sailor.user_id, raceData);

      // 2. Cache data locally for offline access
      await this.cacheDataLocally(sailor.user_id, raceData);

      // 3. Send push notification
      if (sailor.push_token) {
        await this.sendRaceDataNotification(sailor, raceData);
      }

      // 4. Send email backup (optional)
      // await this.sendEmailNotification(sailor, raceData);

      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * Store race data in sailor's personal database
   */
  private async storeSailorRaceData(userId: string, raceData: RaceDataPackage): Promise<void> {
    const { error } = await supabase
      .from('sailor_race_data')
      .upsert({
        user_id: userId,
        race_id: raceData.race_id,
        race_data: raceData,
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to store race data: ${error.message}`);
    }
  }

  /**
   * Cache race data locally for offline access
   */
  private async cacheDataLocally(userId: string, raceData: RaceDataPackage): Promise<void> {
    if (Platform.OS === 'web') {
      // Web: Use localStorage
      const cacheKey = `race_data_${raceData.race_id}`;
      localStorage.setItem(cacheKey, JSON.stringify(raceData));
    } else {
      // Mobile: Use file system (dynamic import to avoid NativeEventEmitter on web)
      const FileSystem = await import('expo-file-system/legacy');
      const cacheDir = `${FileSystem.documentDirectory}race_cache/`;
      const cacheFile = `${cacheDir}${raceData.race_id}.json`;

      // Ensure cache directory exists
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });

      // Write race data to file
      await FileSystem.writeAsStringAsync(cacheFile, JSON.stringify(raceData));
    }
  }

  /**
   * Send push notification about new race data
   */
  private async sendRaceDataNotification(
    sailor: { full_name: string; push_token: string },
    raceData: RaceDataPackage
  ): Promise<void> {
    // Skip notifications on web (no push notification support)
    if (Platform.OS === 'web') {
      return;
    }

    try {
      // Dynamic import to avoid NativeEventEmitter error on web
      const Notifications = await import('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌊 Race Data Ready',
          body: `${raceData.race_name} course and strategy data is now available`,
          data: {
            type: 'race_data',
            race_id: raceData.race_id,
            race_name: raceData.race_name,
          },
          sound: 'default',
        },
        trigger: null, // Send immediately
      });

    } catch (error) {

    }
  }

  /**
   * Log distribution metrics for analytics
   */
  private async logDistribution(raceId: string, metrics: any): Promise<void> {
    try {
      await supabase
        .from('race_distribution_logs')
        .insert({
          race_id: raceId,
          distributed_at: new Date().toISOString(),
          metrics: metrics,
        });
    } catch (error) {

    }
  }

  /**
   * Get distribution status for a race
   */
  async getDistributionStatus(raceId: string): Promise<{
    is_distributed: boolean;
    distribution_time?: string;
    sailors_reached?: number;
    total_registered?: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('race_distribution_logs')
        .select('*')
        .eq('race_id', raceId)
        .order('distributed_at', { ascending: false })
        .limit(1);

      if (error || !data.length) {
        return { is_distributed: false };
      }

      const log = data[0];
      return {
        is_distributed: true,
        distribution_time: log.distributed_at,
        sailors_reached: log.metrics?.successful_deliveries || 0,
        total_registered: log.metrics?.total_sailors || 0,
      };

    } catch (error) {

      return { is_distributed: false };
    }
  }

  /**
   * Retry failed distributions
   */
  async retryFailedDistributions(raceId: string): Promise<DistributionResult> {
    try {
      // Get failed deliveries from last distribution
      const { data: lastLog } = await supabase
        .from('race_distribution_logs')
        .select('metrics')
        .eq('race_id', raceId)
        .order('distributed_at', { ascending: false })
        .limit(1);

      if (!lastLog?.length || !lastLog[0].metrics?.failed_deliveries?.length) {
        return {
          success: true,
          sailors_reached: 0,
          failed_deliveries: [],
          package_size: 0,
          distribution_time: 0,
        };
      }

      // Retry distribution for failed sailors only
      // Implementation would filter sailors by failed_deliveries list
      return await this.distributeRaceData(raceId);

    } catch (error) {

      throw error;
    }
  }
}

// Export singleton instance
export const raceDataDistribution = RaceDataDistributionService.getInstance();

export default raceDataDistribution;
