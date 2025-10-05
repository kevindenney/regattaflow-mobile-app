/**
 * Race Reminder Service
 * Sends automated race reminders 24 hours before race starts
 *
 * USAGE: This should be called by a scheduled task/cron job that runs daily
 * Example: Supabase Edge Function scheduled with pg_cron or Vercel Cron Job
 */

import { supabase } from './supabase';
import { emailService } from './EmailService';

export class RaceReminderService {
  /**
   * Send race reminders for all races starting in approximately 24 hours
   * Should be called by a daily cron job
   */
  async sendDailyReminders(): Promise<{ success: boolean; sent: number; errors: number }> {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowPlus2Hours = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000); // 2-hour window

      console.log(`📧 Checking for races between ${tomorrow.toISOString()} and ${tomorrowPlus2Hours.toISOString()}`);

      // Get all confirmed race entries for races starting tomorrow
      const { data: entries, error } = await supabase
        .from('race_entries')
        .select(`
          *,
          regattas (
            id,
            event_name,
            start_date,
            sailing_venues (
              id,
              name,
              latitude,
              longitude
            )
          ),
          users!sailor_id (
            id,
            name,
            email
          )
        `)
        .eq('status', 'confirmed')
        .gte('regattas.start_date', tomorrow.toISOString())
        .lte('regattas.start_date', tomorrowPlus2Hours.toISOString());

      if (error) {
        console.error('Failed to fetch race entries:', error);
        return { success: false, sent: 0, errors: 1 };
      }

      if (!entries || entries.length === 0) {
        console.log('No races found for tomorrow');
        return { success: true, sent: 0, errors: 0 };
      }

      console.log(`Found ${entries.length} race entries for tomorrow`);

      let sent = 0;
      let errors = 0;

      // Send reminder for each entry
      for (const entry of entries) {
        try {
          if (!entry.users?.email || !entry.regattas) {
            console.warn(`Skipping entry ${entry.id} - missing email or regatta data`);
            errors++;
            continue;
          }

          // Fetch weather forecast for the venue (if available)
          let weatherForecast = undefined;
          if (entry.regattas.sailing_venues?.latitude && entry.regattas.sailing_venues?.longitude) {
            weatherForecast = await this.getWeatherForecast(
              entry.regattas.sailing_venues.latitude,
              entry.regattas.sailing_venues.longitude
            );
          }

          // Send reminder email
          const result = await emailService.sendRaceReminder({
            sailor_name: entry.users.name || 'Sailor',
            sailor_email: entry.users.email,
            regatta_name: entry.regattas.event_name || 'Regatta',
            start_date: entry.regattas.start_date,
            venue_name: entry.regattas.sailing_venues?.name || 'Venue',
            entry_number: entry.entry_number || 'TBD',
            weather_forecast: weatherForecast,
            course_info: 'Check sailing instructions for latest course layout',
          });

          if (result.success) {
            sent++;
            console.log(`✅ Sent reminder to ${entry.users.email} for ${entry.regattas.event_name}`);
          } else {
            errors++;
            console.error(`❌ Failed to send reminder to ${entry.users.email}:`, result.error);
          }
        } catch (entryError: any) {
          errors++;
          console.error(`Error processing entry ${entry.id}:`, entryError);
        }
      }

      console.log(`📊 Race reminders complete: ${sent} sent, ${errors} errors`);

      return {
        success: true,
        sent,
        errors,
      };
    } catch (error: any) {
      console.error('Failed to send race reminders:', error);
      return {
        success: false,
        sent: 0,
        errors: 1,
      };
    }
  }

  /**
   * Get weather forecast for a location
   * TODO: Integrate with actual weather API (Open-Meteo, Weather API, etc.)
   */
  private async getWeatherForecast(
    latitude: number,
    longitude: number
  ): Promise<{ wind_speed: number; wind_direction: string; conditions: string } | undefined> {
    try {
      // Placeholder: In production, integrate with weather API
      // Example: OpenWeather, Open-Meteo, or regional weather services

      // For now, return undefined to skip weather in emails
      // When weather API is integrated, uncomment and implement:
      /*
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );
      const data = await response.json();

      return {
        wind_speed: data.current_weather?.windspeed || 0,
        wind_direction: this.degreesToCardinal(data.current_weather?.winddirection || 0),
        conditions: data.current_weather?.weathercode ? this.weatherCodeToDescription(data.current_weather.weathercode) : 'Clear'
      };
      */

      return undefined;
    } catch (error) {
      console.error('Weather fetch failed:', error);
      return undefined;
    }
  }

  /**
   * Convert degrees to cardinal direction
   */
  private degreesToCardinal(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  /**
   * Send single race reminder (for testing or manual triggers)
   */
  async sendSingleReminder(entryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: entry, error } = await supabase
        .from('race_entries')
        .select(`
          *,
          regattas (
            event_name,
            start_date,
            sailing_venues (
              name,
              latitude,
              longitude
            )
          ),
          users!sailor_id (
            name,
            email
          )
        `)
        .eq('id', entryId)
        .single();

      if (error) throw error;
      if (!entry || !entry.users?.email) {
        return { success: false, error: 'Entry or user email not found' };
      }

      // Fetch weather forecast
      let weatherForecast = undefined;
      if (entry.regattas?.sailing_venues?.latitude && entry.regattas.sailing_venues.longitude) {
        weatherForecast = await this.getWeatherForecast(
          entry.regattas.sailing_venues.latitude,
          entry.regattas.sailing_venues.longitude
        );
      }

      return await emailService.sendRaceReminder({
        sailor_name: entry.users.name || 'Sailor',
        sailor_email: entry.users.email,
        regatta_name: entry.regattas?.event_name || 'Regatta',
        start_date: entry.regattas?.start_date || new Date().toISOString(),
        venue_name: entry.regattas?.sailing_venues?.name || 'Venue',
        entry_number: entry.entry_number || 'TBD',
        weather_forecast: weatherForecast,
      });
    } catch (error: any) {
      console.error('Failed to send single reminder:', error);
      return { success: false, error: error.message };
    }
  }
}

export const raceReminderService = new RaceReminderService();
