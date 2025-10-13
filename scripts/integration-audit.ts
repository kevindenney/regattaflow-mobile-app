#!/usr/bin/env node

/**
 * RegattaFlow Integration Audit Script
 * Comprehensive analysis of all integration points
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface AuditResults {
  databaseTables: string[];
  tablesUsedInCode: Set<string>;
  mockDataFiles: Array<{ file: string; line: number; context: string }>;
  envVariables: { required: string[]; present: string[]; missing: string[] };
  orphanedScreens: string[];
  services: string[];
  hooks: string[];
}

const results: AuditResults = {
  databaseTables: [],
  tablesUsedInCode: new Set(),
  mockDataFiles: [],
  envVariables: { required: [], present: [], missing: [] },
  orphanedScreens: [],
  services: [],
  hooks: [],
};

// Database tables from schema
const DB_TABLES = [
  'ai_analyses', 'ai_coach_analysis', 'ai_insights_summary', 'ai_usage_logs',
  'boat_classes', 'boat_crew_members', 'boat_equipment', 'boat_positions',
  'boat_tuning_settings', 'class_associations', 'class_group_members',
  'class_groups', 'club_ai_documents', 'club_class_fleets', 'club_classes',
  'club_facilities', 'club_fleets', 'club_members', 'club_onboarding_sessions',
  'club_profiles', 'club_race_calendar', 'club_services', 'club_staff',
  'club_venues', 'clubs', 'coach_availability', 'coach_profiles',
  'coach_race_analysis', 'coach_services', 'coach_specializations',
  'coaching_sessions', 'crew_members', 'cultural_profiles', 'documents',
  'equipment_alerts', 'equipment_maintenance_logs', 'equipment_manufacturers',
  'equipment_products', 'equipment_race_usage', 'external_race_results',
  'fleet_activity', 'fleet_documents', 'fleet_followers', 'fleet_members',
  'fleets', 'global_racing_events', 'me', 'profiles', 'race_analytics',
  'race_courses', 'race_events', 'race_predictions', 'race_registrations',
  'race_timer_sessions', 'racing_series', 'regatta_results', 'regattas',
  'sailing_documents', 'sailing_services', 'sailing_specialties',
  'sailing_venues', 'sailor_boats', 'sailor_classes', 'sailor_clubs',
  'sailor_coaches', 'sailor_connections', 'sailor_locations', 'sailor_profiles',
  'sailor_racing_participation', 'sailor_tuning_guides', 'saved_venues',
  'saved_venues_with_details', 'sensor_configurations', 'sensor_data_logs',
  'session_bookings', 'session_reviews', 'subscriptions', 'tuning_guides',
  'user_location_context', 'user_venue_profiles', 'users', 'venue_conditions',
  'venue_detections', 'venue_intelligence_cache', 'venue_transitions',
  'weather_conditions', 'weather_impact', 'weather_insights', 'weather_sources',
  'yacht_clubs'
];

results.databaseTables = DB_TABLES;

// Find all .from() calls in code
function findTableUsage(dir: string) {
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findTableUsage(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = readFileSync(fullPath, 'utf-8');
      const matches = content.matchAll(/\.from\(['"]([^'"]+)['"]\)/g);

      for (const match of matches) {
        results.tablesUsedInCode.add(match[1]);
      }
    }
  }
}

// Find mock data
function findMockData(dir: string) {
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findMockData(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const lowerLine = line.toLowerCase();
        if (
          lowerLine.includes('mock') ||
          lowerLine.includes('dummy') ||
          lowerLine.includes('fake') ||
          lowerLine.includes('placeholder')
        ) {
          results.mockDataFiles.push({
            file: fullPath.replace(process.cwd(), ''),
            line: index + 1,
            context: line.trim().substring(0, 80)
          });
        }
      });
    }
  }
}

// Check environment variables
function checkEnvVariables() {
  const required = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
    'ANTHROPIC_API_KEY',
    'GOOGLE_AI_API_KEY',
    'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
  ];

  results.envVariables.required = required;

  try {
    const envContent = readFileSync('.env.local', 'utf-8');
    for (const key of required) {
      if (envContent.includes(key)) {
        results.envVariables.present.push(key);
      } else {
        results.envVariables.missing.push(key);
      }
    }
  } catch (error) {
    console.error('Error reading .env.local:', error);
  }
}

// List all services and hooks
function listServicesAndHooks() {
  const servicesDir = 'src/services';
  const hooksDir = 'src/hooks';

  function getAllFiles(dir: string, fileList: string[] = []): string[] {
    const files = readdirSync(dir);
    for (const file of files) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        getAllFiles(fullPath, fileList);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        fileList.push(fullPath.replace(process.cwd() + '/', ''));
      }
    }
    return fileList;
  }

  results.services = getAllFiles(servicesDir);
  results.hooks = getAllFiles(hooksDir);
}

// Main execution
console.log('🔍 Starting RegattaFlow Integration Audit...\n');

console.log('1️⃣ Analyzing table usage...');
findTableUsage('src');

console.log('2️⃣ Finding mock data...');
findMockData('src');

console.log('3️⃣ Checking environment variables...');
checkEnvVariables();

console.log('4️⃣ Listing services and hooks...');
listServicesAndHooks();

// Generate report
console.log('\n📊 AUDIT RESULTS\n');
console.log('=' .repeat(80));

console.log('\n📋 DATABASE TABLES');
console.log('-'.repeat(80));
console.log(`Total tables in database: ${results.databaseTables.length}`);
console.log(`Total tables used in code: ${results.tablesUsedInCode.size}`);

const unusedTables = results.databaseTables.filter(t => !results.tablesUsedInCode.has(t));
const invalidTables = Array.from(results.tablesUsedInCode).filter(t => !results.databaseTables.includes(t));

if (unusedTables.length > 0) {
  console.log(`\n⚠️  Unused tables (${unusedTables.length}):`);
  unusedTables.forEach(t => console.log(`  - ${t}`));
}

if (invalidTables.length > 0) {
  console.log(`\n❌ Invalid table references (${invalidTables.length}):`);
  invalidTables.forEach(t => console.log(`  - ${t}`));
}

console.log('\n🎭 MOCK DATA LOCATIONS');
console.log('-'.repeat(80));
console.log(`Total mock data instances: ${results.mockDataFiles.length}`);
if (results.mockDataFiles.length > 0) {
  const fileGroups = results.mockDataFiles.reduce((acc, item) => {
    if (!acc[item.file]) acc[item.file] = [];
    acc[item.file].push(item);
    return acc;
  }, {} as Record<string, typeof results.mockDataFiles>);

  Object.entries(fileGroups).slice(0, 20).forEach(([file, items]) => {
    console.log(`\n${file} (${items.length} instances)`);
    items.slice(0, 3).forEach(item => {
      console.log(`  Line ${item.line}: ${item.context}`);
    });
  });
}

console.log('\n🔐 ENVIRONMENT VARIABLES');
console.log('-'.repeat(80));
console.log(`✅ Present: ${results.envVariables.present.length}/${results.envVariables.required.length}`);
if (results.envVariables.missing.length > 0) {
  console.log(`\n❌ Missing variables:`);
  results.envVariables.missing.forEach(v => console.log(`  - ${v}`));
}

console.log('\n📦 CODE STRUCTURE');
console.log('-'.repeat(80));
console.log(`Services: ${results.services.length}`);
console.log(`Hooks: ${results.hooks.length}`);

console.log('\n' + '='.repeat(80));
console.log('✅ Audit complete!\n');

// Save detailed JSON report
import { writeFileSync } from 'fs';
writeFileSync(
  'audit-results.json',
  JSON.stringify(results, (key, value) => {
    if (value instanceof Set) {
      return Array.from(value);
    }
    return value;
  }, 2)
);
console.log('📄 Detailed results saved to: audit-results.json\n');
