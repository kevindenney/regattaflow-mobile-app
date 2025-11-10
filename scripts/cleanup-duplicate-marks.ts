#!/usr/bin/env tsx
/**
 * Cleanup script for duplicate race marks
 *
 * This script identifies races with duplicate marks and keeps only the most recent
 * complete set of marks for each race, deleting all older duplicates.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface RaceMarkDuplicate {
  race_id: string;
  race_name: string;
  total_marks: number;
  unique_mark_types: number;
}

async function findRacesWithDuplicates(): Promise<RaceMarkDuplicate[]> {
  console.log('🔍 Finding races with duplicate marks...\n');

  const { data: races, error } = await supabase
    .from('race_events')
    .select('id, name');

  if (error || !races) {
    console.error('Failed to fetch races:', error);
    return [];
  }

  const duplicates: RaceMarkDuplicate[] = [];

  for (const race of races) {
    const { data: marks } = await supabase
      .from('race_marks')
      .select('name, mark_type')
      .eq('race_id', race.id);

    if (!marks || marks.length === 0) continue;

    // Count unique mark types
    const uniqueMarkTypes = new Set(
      marks.map(m => `${m.name}:${m.mark_type}`)
    ).size;

    // If we have more marks than unique types, we have duplicates
    if (marks.length > uniqueMarkTypes) {
      duplicates.push({
        race_id: race.id,
        race_name: race.name,
        total_marks: marks.length,
        unique_mark_types: uniqueMarkTypes,
      });
    }
  }

  return duplicates;
}

async function cleanupRaceMarks(raceId: string, raceName: string, dryRun: boolean = true) {
  console.log(`\n📍 Processing: ${raceName} (${raceId})`);

  // Get all marks for this race, ordered by creation time (newest first)
  const { data: marks } = await supabase
    .from('race_marks')
    .select('id, name, mark_type, latitude, longitude, created_at')
    .eq('race_id', raceId)
    .order('created_at', { ascending: false });

  if (!marks) {
    console.log('  ⚠️  No marks found');
    return;
  }

  // Keep track of which mark types we've seen (keep first/newest of each)
  const seenMarkTypes = new Set<string>();
  const marksToKeep: string[] = [];
  const marksToDelete: string[] = [];

  for (const mark of marks) {
    const markKey = `${mark.name}:${mark.mark_type}`;

    if (!seenMarkTypes.has(markKey)) {
      // First time seeing this mark type - keep it
      seenMarkTypes.add(markKey);
      marksToKeep.push(mark.id);
    } else {
      // Duplicate - mark for deletion
      marksToDelete.push(mark.id);
    }
  }

  console.log(`  📊 Total marks: ${marks.length}`);
  console.log(`  ✅ Keeping: ${marksToKeep.length} (most recent of each type)`);
  console.log(`  🗑️  Deleting: ${marksToDelete.length} duplicates`);

  if (!dryRun && marksToDelete.length > 0) {
    // Delete in batches to avoid hitting size limits
    const batchSize = 100;
    for (let i = 0; i < marksToDelete.length; i += batchSize) {
      const batch = marksToDelete.slice(i, i + batchSize);
      const { error } = await supabase
        .from('race_marks')
        .delete()
        .in('id', batch);

      if (error) {
        console.error(`  ❌ Error deleting batch: ${error.message}`);
      } else {
        console.log(`  ✓ Deleted batch ${Math.floor(i / batchSize) + 1}`);
      }
    }
    console.log('  ✅ Cleanup complete!');
  } else if (dryRun) {
    console.log('  ℹ️  DRY RUN - No changes made');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  console.log('🧹 Race Marks Cleanup Script');
  console.log('============================\n');

  if (dryRun) {
    console.log('🔍 Running in DRY RUN mode (no changes will be made)');
    console.log('   Use --execute flag to actually delete duplicates\n');
  } else {
    console.log('⚠️  EXECUTING - Duplicates will be deleted!\n');
  }

  const duplicates = await findRacesWithDuplicates();

  if (duplicates.length === 0) {
    console.log('✅ No races with duplicate marks found!');
    return;
  }

  console.log(`Found ${duplicates.length} race(s) with duplicates:\n`);

  for (const dup of duplicates) {
    console.log(`• ${dup.race_name}`);
    console.log(`  Race ID: ${dup.race_id}`);
    console.log(`  Total marks: ${dup.total_marks} (${dup.unique_mark_types} unique types)`);
    console.log(`  Duplicates: ${dup.total_marks - dup.unique_mark_types}`);
  }

  console.log('\n' + '='.repeat(50));

  // Clean up each race
  for (const dup of duplicates) {
    await cleanupRaceMarks(dup.race_id, dup.race_name, dryRun);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Script complete!');

  if (dryRun) {
    console.log('\n💡 To actually delete the duplicates, run:');
    console.log('   npx tsx scripts/cleanup-duplicate-marks.ts --execute');
  }
}

main().catch(console.error);
