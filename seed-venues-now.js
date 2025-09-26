#!/usr/bin/env node

/**
 * Direct script to seed Caribbean venues into Supabase
 * Run with: node seed-venues-now.js
 */

console.log('🌍 Starting Caribbean venue seeding process...');

// Import and run the seeding function
import('./src/scripts/seed-venues.js').then(async (module) => {
  try {
    await module.seedVenueDatabase();
    console.log('✅ Caribbean venue seeding completed successfully!');
    console.log('🏝️ St. Thomas USVI and BVI venues are now available in Supabase!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Failed to load seeding module:', error);
  process.exit(1);
});