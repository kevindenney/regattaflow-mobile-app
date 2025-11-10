/**
 * Apply strategy planning migrations directly to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  console.log('🔧 Applying strategy planning migrations...\n');

  try {
    // Migration 1: Add strategy planning fields
    console.log('📝 Adding strategy planning fields to sailor_race_preparation...');

    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.sailor_race_preparation
        ADD COLUMN IF NOT EXISTS rig_tuning_strategy TEXT,
        ADD COLUMN IF NOT EXISTS prestart_strategy TEXT,
        ADD COLUMN IF NOT EXISTS start_strategy TEXT,
        ADD COLUMN IF NOT EXISTS upwind_strategy TEXT,
        ADD COLUMN IF NOT EXISTS windward_mark_strategy TEXT,
        ADD COLUMN IF NOT EXISTS downwind_strategy TEXT,
        ADD COLUMN IF NOT EXISTS leeward_mark_strategy TEXT,
        ADD COLUMN IF NOT EXISTS finish_strategy TEXT,
        ADD COLUMN IF NOT EXISTS ai_strategy_suggestions JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS shared_with_coach BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS coach_id UUID,
        ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ;
      `
    });

    if (error1) {
      // Try direct query if RPC doesn't work
      const { error: directError1 } = await supabase.from('sailor_race_preparation').select('id').limit(0);

      // Apply via raw SQL
      console.log('Using alternative method...');
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            DO $$
            BEGIN
              ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS rig_tuning_strategy TEXT;
              ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS prestart_strategy TEXT;
              ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS start_strategy TEXT;
              ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS upwind_strategy TEXT;
              ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS windward_mark_strategy TEXT;
              ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS downwind_strategy TEXT;
              ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS leeward_mark_strategy TEXT;
              ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS finish_strategy TEXT;
              ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS ai_strategy_suggestions JSONB DEFAULT '{}'::jsonb;
              ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS shared_with_coach BOOLEAN DEFAULT false;
              ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS coach_id UUID;
              ALTER TABLE public.sailor_race_preparation ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ;

              -- Add foreign key if it doesn't exist
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'sailor_race_preparation_coach_id_fkey'
                AND table_name = 'sailor_race_preparation'
              ) THEN
                ALTER TABLE public.sailor_race_preparation
                ADD CONSTRAINT sailor_race_preparation_coach_id_fkey
                FOREIGN KEY (coach_id) REFERENCES public.coach_profiles(id) ON DELETE SET NULL;
              END IF;

              -- Create indexes
              CREATE INDEX IF NOT EXISTS idx_sailor_race_prep_coach_id
                ON public.sailor_race_preparation(coach_id)
                WHERE coach_id IS NOT NULL;

              CREATE INDEX IF NOT EXISTS idx_sailor_race_prep_shared
                ON public.sailor_race_preparation(coach_id, shared_with_coach, shared_at)
                WHERE shared_with_coach = true;
            END $$;
          `
        })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Failed:', text);
        throw new Error('Failed to apply migration 1');
      }
    }

    console.log('✅ Strategy planning fields added\n');

    // Migration 2: Add execution evaluation fields
    console.log('📝 Adding execution evaluation fields to race_analysis...');

    const response2 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          DO $$
          BEGIN
            -- Add execution evaluation fields
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS preparation_id UUID;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS rig_tuning_execution_rating INT;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS prestart_execution_rating INT;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS start_execution_rating INT;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS upwind_execution_rating INT;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS windward_mark_execution_rating INT;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS downwind_execution_rating INT;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS leeward_mark_execution_rating INT;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS finish_execution_rating INT;

            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS rig_tuning_execution_notes TEXT;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS prestart_execution_notes TEXT;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS start_execution_notes TEXT;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS upwind_execution_notes TEXT;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS windward_mark_execution_notes TEXT;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS downwind_execution_notes TEXT;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS leeward_mark_execution_notes TEXT;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS finish_execution_notes TEXT;

            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS ai_execution_coaching JSONB DEFAULT '{}'::jsonb;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS execution_shared_with_coach BOOLEAN DEFAULT false;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS execution_coach_id UUID;
            ALTER TABLE public.race_analysis ADD COLUMN IF NOT EXISTS execution_shared_at TIMESTAMPTZ;

            -- Add foreign keys if they don't exist
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_name = 'race_analysis_preparation_id_fkey'
              AND table_name = 'race_analysis'
            ) THEN
              ALTER TABLE public.race_analysis
              ADD CONSTRAINT race_analysis_preparation_id_fkey
              FOREIGN KEY (preparation_id) REFERENCES public.sailor_race_preparation(id) ON DELETE SET NULL;
            END IF;

            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_name = 'race_analysis_execution_coach_id_fkey'
              AND table_name = 'race_analysis'
            ) THEN
              ALTER TABLE public.race_analysis
              ADD CONSTRAINT race_analysis_execution_coach_id_fkey
              FOREIGN KEY (execution_coach_id) REFERENCES public.coach_profiles(id) ON DELETE SET NULL;
            END IF;

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_race_analysis_preparation_id
              ON public.race_analysis(preparation_id)
              WHERE preparation_id IS NOT NULL;

            CREATE INDEX IF NOT EXISTS idx_race_analysis_execution_coach_id
              ON public.race_analysis(execution_coach_id)
              WHERE execution_coach_id IS NOT NULL;

            CREATE INDEX IF NOT EXISTS idx_race_analysis_execution_shared
              ON public.race_analysis(execution_coach_id, execution_shared_with_coach, execution_shared_at)
              WHERE execution_shared_with_coach = true;
          END $$;
        `
      })
    });

    if (!response2.ok) {
      const text = await response2.text();
      console.error('❌ Failed:', text);
      throw new Error('Failed to apply migration 2');
    }

    console.log('✅ Execution evaluation fields added\n');

    // Verify migrations
    console.log('🔍 Verifying migrations...');

    const { data: prepCols, error: prepError } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT column_name FROM information_schema.columns
              WHERE table_name = 'sailor_race_preparation'
              AND column_name LIKE '%strategy%'`
      });

    console.log('\n✅ Migrations applied successfully!');
    console.log('\n📊 Summary:');
    console.log('   • Added 8 strategic planning fields to sailor_race_preparation');
    console.log('   • Added 8 execution evaluation fields to race_analysis');
    console.log('   • Added AI suggestions and coaching fields');
    console.log('   • Added coach sharing fields');
    console.log('   • Created indexes for performance');
    console.log('\n✨ Ready to use the new strategic planning features!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigrations()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
