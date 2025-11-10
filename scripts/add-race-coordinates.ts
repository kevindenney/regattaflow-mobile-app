/**
 * Add coordinates to Port Shelter race for weather fetching
 */

import { supabase } from '../services/supabase';

async function addRaceCoordinates() {
  const raceId = '2972ea48-6893-4833-950c-ce8f78d073f0';

  // Port Shelter coordinates
  const coordinates = {
    lat: 22.275,
    lng: 114.15
  };

  console.log(`Adding coordinates to race ${raceId}...`);

  // Get current metadata
  const { data: race, error: fetchError } = await supabase
    .from('regattas')
    .select('metadata')
    .eq('id', raceId)
    .single();

  if (fetchError) {
    console.error('Error fetching race:', fetchError);
    return;
  }

  // Update with coordinates
  const { error: updateError } = await supabase
    .from('regattas')
    .update({
      metadata: {
        ...(race?.metadata || {}),
        coordinates_lat: coordinates.lat,
        coordinates_lng: coordinates.lng
      }
    })
    .eq('id', raceId);

  if (updateError) {
    console.error('Error updating race:', updateError);
  } else {
    console.log('✅ Successfully added coordinates to race!');
    console.log(`   Lat: ${coordinates.lat}, Lng: ${coordinates.lng}`);
  }
}

addRaceCoordinates();
