/**
 * MCP Resources Registration
 *
 * Resources expose data to Claude without performing computations.
 * They're designed to provide context and information.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createSupabaseClient } from '../utils/supabase.js';

/**
 * Register all resources with the MCP server
 */
export function registerResources(server: McpServer) {
  // Weather data resource
  server.resource(
    'Current Weather Data',
    'weather://current',
    async () => {
      const supabase = createSupabaseClient();

      const { data, error } = await supabase
        .from('weather_observations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return {
          contents: [{
            uri: 'weather://current',
            mimeType: 'application/json',
            text: JSON.stringify({ error: error.message }),
          }],
        };
      }

      return {
        contents: [{
          uri: 'weather://current',
          mimeType: 'application/json',
          text: JSON.stringify(data || {}),
        }],
      };
    }
  );

  // Race data resource
  server.resource(
    'Active Races',
    'races://active',
    async () => {
      const supabase = createSupabaseClient();

      const { data, error } = await supabase
        .from('races')
        .select(`
          *,
          race_courses(*),
          race_series(*)
        `)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10);

      if (error) {
        return {
          contents: [{
            uri: 'races://active',
            mimeType: 'application/json',
            text: JSON.stringify({ error: error.message }),
          }],
        };
      }

      return {
        contents: [{
          uri: 'races://active',
          mimeType: 'application/json',
          text: JSON.stringify(data || []),
        }],
      };
    }
  );

  console.error('✅ Registered resources: weather, races');
}
