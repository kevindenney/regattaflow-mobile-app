// Run this in the browser console to check venue data
(async function() {
  console.log('=== Venue Data Debug ===');

  // Get Supabase client
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

  const supabaseUrl = localStorage.getItem('sb-vwxkhkbtjqhpikwjjomk-auth-token')
    ? JSON.parse(localStorage.getItem('sb-vwxkhkbtjqhpikwjjomk-auth-token')).url
    : 'https://vwxkhkbtjqhpikwjjomk.supabase.co';

  console.log('Supabase URL:', supabaseUrl);

  // Fetch venues
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/sailing_venues?select=id,name,coordinates_lat,coordinates_lng&order=name.asc&limit=10`, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eGtoa2J0anFocGlrd2pqb21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgwMTU1OTYsImV4cCI6MjA0MzU5MTU5Nn0.VjboJ3aVQTVMEBYtpNkEJK6qw5kLOF0HGLSwWtpLrJY',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eGtoa2J0anFocGlrd2pqb21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgwMTU1OTYsImV4cCI6MjA0MzU5MTU5Nn0.VjboJ3aVQTVMEBYtpNkEJK6qw5kLOF0HGLSwWtpLrJY`
      }
    });

    const venues = await response.json();

    console.log('✅ Venues fetched:', venues.length);
    console.log('Sample venues:', venues.slice(0, 3));

    // Check coordinates
    const validCoords = venues.filter(v =>
      typeof v.coordinates_lat === 'number' &&
      typeof v.coordinates_lng === 'number' &&
      !isNaN(v.coordinates_lat) &&
      !isNaN(v.coordinates_lng)
    );

    console.log(`✅ ${validCoords.length}/${venues.length} venues have valid coordinates`);

    if (validCoords.length > 0) {
      console.log('Example coordinate:', {
        name: validCoords[0].name,
        lat: validCoords[0].coordinates_lat,
        lng: validCoords[0].coordinates_lng
      });
    }

  } catch (error) {
    console.error('❌ Error fetching venues:', error);
  }
})();
