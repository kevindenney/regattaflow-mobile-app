/**
 * Boat Performance Data Seeding Script
 * Seeds test data for boat detail enhancements including:
 * - Regattas and regatta_results for performance stats
 * - Boat crew members
 * - Boat equipment (sails)
 * - Maintenance records
 */

import { supabase } from '@/services/supabase';

// Configuration - update these IDs based on your database
const SAILOR_ID = '76069517-bf07-485a-b470-4baa9b9c87a7'; // User s17
const BOAT_CLASS_ID = 'd990c19d-dfb9-4896-b041-92705f8a6c0c'; // Etchells
const BOAT_CLASS_NAME = 'Etchells';
const SAIL_NUMBER = 'USA-1234';

interface SeedResult {
  boatId: string;
  regattaIds: string[];
  resultCount: number;
  crewCount: number;
  equipmentCount: number;
  maintenanceCount: number;
}

export async function seedBoatData(): Promise<SeedResult> {
  console.log('Starting boat data seeding...');

  try {
    // Step 1: Create or update a test boat
    console.log('Creating test boat...');
    const { data: boat, error: boatError } = await supabase
      .from('sailor_boats')
      .upsert({
        sailor_id: SAILOR_ID,
        class_id: BOAT_CLASS_ID,
        sail_number: SAIL_NUMBER,
        name: `${BOAT_CLASS_NAME} ${SAIL_NUMBER}`,
        hull_number: 'HULL-5678',
        manufacturer: 'Etchells Builder',
        year_built: 2018,
        hull_material: 'Fiberglass',
        status: 'active',
        ownership_type: 'owned',
        storage_location: 'Newport Harbor YC',
        purchase_date: '2018-06-15',
        purchase_price: 45000,
        is_owner: true,
        is_primary: true,
        notes: 'Excellent race boat, well maintained',
      })
      .select()
      .single();

    if (boatError) throw boatError;
    console.log(`Boat created: ${boat.id}`);

    // Step 2: Create test regattas
    console.log('Creating test regattas...');
    const regattaIds: string[] = [];
    const regattaNames = [
      'Spring Championship Series',
      'Summer Regatta Week',
      'Fall Classic',
      'Winter Series - Week 1',
      'Winter Series - Week 2',
      'Memorial Day Regatta',
      'Labor Day Challenge',
      'Halloween Howler',
    ];

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6); // Start 6 months ago

    for (let i = 0; i < regattaNames.length; i++) {
      const raceDate = new Date(startDate);
      raceDate.setDate(raceDate.getDate() + i * 21); // Every 3 weeks

      const { data: regatta, error: regattaError } = await supabase
        .from('regattas')
        .insert({
          name: regattaNames[i],
          description: `Test regatta for boat performance tracking`,
          start_date: raceDate.toISOString(),
          end_date: raceDate.toISOString(),
          status: 'completed',
          created_by: SAILOR_ID,
          class_id: BOAT_CLASS_ID,
          boat_id: boat.id,
          number_of_races: 3,
          metadata: {
            seeded: true,
            test_data: true,
          },
        })
        .select()
        .single();

      if (regattaError) {
        console.warn(`Failed to create regatta ${regattaNames[i]}:`, regattaError);
        continue;
      }

      regattaIds.push(regatta.id);
    }

    console.log(`Created ${regattaIds.length} regattas`);

    // Step 3: Create regatta results with varied performance
    console.log('Creating regatta results...');
    const results = [];

    // Performance pattern: start okay, improve over time, then have a mix
    const finishPositions = [
      // Early races - mid-pack
      [5, 4, 6], // Spring Championship
      [3, 2, 4], // Summer Regatta (improving)
      [1, 1, 2], // Fall Classic (great performance!)
      [2, 3, 1], // Winter 1 (consistent)
      [4, 5, 3], // Winter 2 (slight dip)
      [1, 2, 1], // Memorial Day (winning!)
      [2, 1, 3], // Labor Day (podium finishes)
      [1, 1, 1], // Halloween (swept the series!)
    ];

    let resultCount = 0;

    for (let regIdx = 0; regIdx < regattaIds.length; regIdx++) {
      const regattaId = regattaIds[regIdx];
      const positions = finishPositions[regIdx];

      for (let raceNum = 0; raceNum < positions.length; raceNum++) {
        const position = positions[raceNum];
        const totalBoats = 15 + Math.floor(Math.random() * 5); // 15-20 boats
        const raceDate = new Date(startDate);
        raceDate.setDate(raceDate.getDate() + regIdx * 21 + raceNum);

        results.push({
          regatta_id: regattaId,
          sailor_id: SAILOR_ID,
          boat_name: boat.name,
          sail_number: SAIL_NUMBER,
          boat_class: BOAT_CLASS_NAME,
          finish_position: position,
          total_boats: totalBoats,
          points: position, // Simple low-point scoring
          race_number: raceNum + 1,
          race_date: raceDate.toISOString().split('T')[0],
          disqualified: false,
          dnf: false,
          dns: false,
          handicap_rating: 1.0,
        });

        resultCount++;
      }
    }

    const { error: resultsError } = await supabase
      .from('regatta_results')
      .insert(results);

    if (resultsError) {
      console.warn('Some regatta results failed to insert:', resultsError);
    } else {
      console.log(`Created ${resultCount} regatta results`);
    }

    // Step 4: Create boat crew members
    console.log('Creating crew members...');
    const crewMembers = [
      {
        sailor_id: SAILOR_ID,
        boat_id: boat.id,
        crew_name: 'Sarah Johnson',
        crew_email: 'sarah.j@example.com',
        position: 'Main Trimmer',
        is_regular: true,
      },
      {
        sailor_id: SAILOR_ID,
        boat_id: boat.id,
        crew_name: 'Mike Chen',
        crew_email: 'mike.chen@example.com',
        position: 'Jib Trimmer',
        is_regular: true,
      },
      {
        sailor_id: SAILOR_ID,
        boat_id: boat.id,
        crew_name: 'Alex Rodriguez',
        crew_email: 'alex.r@example.com',
        position: 'Pit / Tactician',
        is_regular: false,
      },
      {
        sailor_id: SAILOR_ID,
        boat_id: boat.id,
        crew_name: 'Emma Davis',
        crew_email: 'emma.davis@example.com',
        position: 'Bow',
        is_regular: true,
      },
    ];

    const { error: crewError } = await supabase
      .from('boat_crew_members')
      .insert(crewMembers);

    if (crewError) {
      console.warn('Failed to create crew members:', crewError);
    } else {
      console.log(`Created ${crewMembers.length} crew members`);
    }

    // Step 5: Create boat equipment (sails)
    console.log('Creating boat equipment (sails)...');
    const equipment = [
      {
        sailor_id: SAILOR_ID,
        class_id: BOAT_CLASS_ID,
        boat_id: boat.id,
        custom_name: 'Main - North Sails M-3',
        category: 'sail',
        subcategory: 'mainsail',
        serial_number: 'NS-M3-2023-1234',
        purchase_date: '2023-03-15',
        purchase_price: 4500,
        purchase_location: 'North Sails Newport',
        status: 'active',
        condition: 'excellent',
        total_races_used: 24,
        last_used_date: new Date().toISOString().split('T')[0],
        specifications: {
          material: 'Dacron',
          weight: 'Medium',
          cut: 'Cross-cut',
          reef_points: 2,
        },
        notes: 'Primary race main, excellent shape retention',
      },
      {
        sailor_id: SAILOR_ID,
        class_id: BOAT_CLASS_ID,
        boat_id: boat.id,
        custom_name: 'Jib #1 - Quantum Racing',
        category: 'sail',
        subcategory: 'jib',
        serial_number: 'QR-J1-2023-5678',
        purchase_date: '2023-04-20',
        purchase_price: 3200,
        purchase_location: 'Quantum Sails',
        status: 'active',
        condition: 'good',
        total_races_used: 22,
        last_used_date: new Date().toISOString().split('T')[0],
        specifications: {
          material: 'Mylar',
          weight: 'Light-Medium',
          cut: 'Tri-radial',
        },
        notes: 'All-purpose jib for 6-16 knots',
      },
      {
        sailor_id: SAILOR_ID,
        class_id: BOAT_CLASS_ID,
        boat_id: boat.id,
        custom_name: 'Spinnaker - UK Sailmakers',
        category: 'sail',
        subcategory: 'spinnaker',
        serial_number: 'UK-SPI-2022-9012',
        purchase_date: '2022-05-10',
        purchase_price: 2800,
        purchase_location: 'UK Sailmakers',
        status: 'active',
        condition: 'good',
        total_races_used: 45,
        last_used_date: new Date().toISOString().split('T')[0],
        specifications: {
          material: 'Nylon',
          area_sqft: 650,
          cut: 'Tri-radial',
        },
        notes: 'Reliable all-around kite',
      },
      {
        sailor_id: SAILOR_ID,
        class_id: BOAT_CLASS_ID,
        boat_id: boat.id,
        custom_name: 'Old Main - Practice',
        category: 'sail',
        subcategory: 'mainsail',
        serial_number: 'NS-M2-2018-3344',
        purchase_date: '2018-06-15',
        purchase_price: 3800,
        purchase_location: 'North Sails',
        status: 'backup',
        condition: 'fair',
        total_races_used: 156,
        last_used_date: '2023-12-01',
        specifications: {
          material: 'Dacron',
          weight: 'Heavy',
          cut: 'Cross-cut',
          reef_points: 2,
        },
        notes: 'Retired race sail, now used for practice',
      },
    ];

    const { error: equipmentError } = await supabase
      .from('boat_equipment')
      .insert(equipment);

    if (equipmentError) {
      console.warn('Failed to create equipment:', equipmentError);
    } else {
      console.log(`Created ${equipment.length} equipment items`);
    }

    // Step 6: First check if maintenance_records table exists, if not use equipment_maintenance_logs
    console.log('Creating maintenance records...');

    // Try to create maintenance_records first (as referenced in the code)
    let maintenanceCount = 0;

    try {
      // Get one equipment ID for linking
      const { data: equipData } = await supabase
        .from('boat_equipment')
        .select('id')
        .eq('boat_id', boat.id)
        .limit(1)
        .single();

      if (equipData) {
        const maintenanceRecords = [
          {
            boat_id: boat.id,
            sailor_id: SAILOR_ID,
            maintenance_type: 'Inspection',
            description: 'Pre-season rigging inspection',
            maintenance_date: '2024-03-15',
            performed_by: 'Newport Rigging Services',
            cost: 350,
            notes: 'All standing rigging checked, replaced 2 cotter pins',
          },
          {
            boat_id: boat.id,
            sailor_id: SAILOR_ID,
            maintenance_type: 'Repair',
            description: 'Bottom paint touch-up',
            maintenance_date: '2024-05-20',
            performed_by: 'Self',
            cost: 125,
            notes: 'Touched up minor scratches from dock contact',
          },
          {
            boat_id: boat.id,
            sailor_id: SAILOR_ID,
            maintenance_type: 'Service',
            description: 'Winch service',
            maintenance_date: '2024-07-10',
            performed_by: 'Harken Service Center',
            cost: 450,
            notes: 'All winches serviced, replaced bearings on #3 jib winch',
          },
          {
            boat_id: boat.id,
            sailor_id: SAILOR_ID,
            maintenance_type: 'Replacement',
            description: 'New jib sheets',
            maintenance_date: '2024-08-05',
            performed_by: 'Self',
            cost: 180,
            notes: 'Replaced worn jib sheets with New England Ropes',
          },
          {
            boat_id: boat.id,
            sailor_id: SAILOR_ID,
            maintenance_type: 'Inspection',
            description: 'Hull inspection and survey',
            maintenance_date: '2024-09-12',
            performed_by: 'Marine Surveyor Inc',
            cost: 500,
            notes: 'Annual insurance survey - hull in excellent condition',
          },
        ];

        const { error: maintenanceError } = await supabase
          .from('maintenance_records')
          .insert(maintenanceRecords);

        if (maintenanceError) {
          throw maintenanceError;
        }

        maintenanceCount = maintenanceRecords.length;
        console.log(`Created ${maintenanceCount} maintenance records`);
      }
    } catch (maintenanceErr: any) {
      if (maintenanceErr.message?.includes('relation "maintenance_records" does not exist')) {
        console.log('maintenance_records table does not exist, creating it...');

        // Create the maintenance_records table
        await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS maintenance_records (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              boat_id UUID NOT NULL REFERENCES sailor_boats(id) ON DELETE CASCADE,
              sailor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              maintenance_date DATE NOT NULL,
              maintenance_type TEXT NOT NULL,
              description TEXT NOT NULL,
              performed_by TEXT,
              location TEXT,
              cost NUMERIC,
              notes TEXT,
              next_service_due DATE,
              receipts JSONB,
              photos JSONB,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_maintenance_records_boat_id ON maintenance_records(boat_id);
            CREATE INDEX IF NOT EXISTS idx_maintenance_records_sailor_id ON maintenance_records(sailor_id);
          `
        });

        console.log('Retrying maintenance records insert...');

        const maintenanceRecords = [
          {
            boat_id: boat.id,
            sailor_id: SAILOR_ID,
            maintenance_type: 'Inspection',
            description: 'Pre-season rigging inspection',
            maintenance_date: '2024-03-15',
            performed_by: 'Newport Rigging Services',
            cost: 350,
            notes: 'All standing rigging checked, replaced 2 cotter pins',
          },
          {
            boat_id: boat.id,
            sailor_id: SAILOR_ID,
            maintenance_type: 'Repair',
            description: 'Bottom paint touch-up',
            maintenance_date: '2024-05-20',
            performed_by: 'Self',
            cost: 125,
            notes: 'Touched up minor scratches from dock contact',
          },
          {
            boat_id: boat.id,
            sailor_id: SAILOR_ID,
            maintenance_type: 'Service',
            description: 'Winch service',
            maintenance_date: '2024-07-10',
            performed_by: 'Harken Service Center',
            cost: 450,
            notes: 'All winches serviced, replaced bearings on #3 jib winch',
          },
          {
            boat_id: boat.id,
            sailor_id: SAILOR_ID,
            maintenance_type: 'Replacement',
            description: 'New jib sheets',
            maintenance_date: '2024-08-05',
            performed_by: 'Self',
            cost: 180,
            notes: 'Replaced worn jib sheets with New England Ropes',
          },
          {
            boat_id: boat.id,
            sailor_id: SAILOR_ID,
            maintenance_type: 'Inspection',
            description: 'Hull inspection and survey',
            maintenance_date: '2024-09-12',
            performed_by: 'Marine Surveyor Inc',
            cost: 500,
            notes: 'Annual insurance survey - hull in excellent condition',
          },
        ];

        const { error: retryError } = await supabase
          .from('maintenance_records')
          .insert(maintenanceRecords);

        if (retryError) {
          console.warn('Failed to create maintenance records:', retryError);
        } else {
          maintenanceCount = maintenanceRecords.length;
          console.log(`Created ${maintenanceCount} maintenance records`);
        }
      } else {
        console.warn('Failed to create maintenance records:', maintenanceErr);
      }
    }

    console.log('\n=== Seeding Complete ===');
    console.log(`Boat ID: ${boat.id}`);
    console.log(`Regattas: ${regattaIds.length}`);
    console.log(`Results: ${resultCount}`);
    console.log(`Crew: ${crewMembers.length}`);
    console.log(`Equipment: ${equipment.length}`);
    console.log(`Maintenance: ${maintenanceCount}`);
    console.log('\nYou can now view this boat at:');
    console.log(`/boat/${boat.id}`);

    return {
      boatId: boat.id,
      regattaIds,
      resultCount,
      crewCount: crewMembers.length,
      equipmentCount: equipment.length,
      maintenanceCount,
    };
  } catch (error: any) {
    console.error('Seeding failed:', error);
    throw new Error(`Seeding failed: ${error.message}`);
  }
}

// Run if called directly
if (require.main === module) {
  seedBoatData()
    .then((result) => {
      console.log('\nSeed completed successfully!', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export default seedBoatData;
