import { buildInstitutionProgramItems } from '../dashboardSections';
import type { ProgramRecord, ProgramSessionRecord } from '@/services/ProgramService';

const baseProgram = (overrides: Partial<ProgramRecord>): ProgramRecord => ({
  id: 'program-1',
  organization_id: 'org-1',
  domain: 'nursing',
  title: 'Program',
  description: null,
  type: 'clinical_rotation',
  status: 'draft',
  start_at: '2026-03-01T08:00:00.000Z',
  end_at: null,
  metadata: {},
  created_by: null,
  created_at: '2026-03-01T00:00:00.000Z',
  updated_at: '2026-03-01T00:00:00.000Z',
  ...overrides,
});

const baseSession = (overrides: Partial<ProgramSessionRecord>): ProgramSessionRecord => ({
  id: 'session-1',
  program_id: 'program-1',
  organization_id: 'org-1',
  title: 'Session',
  description: null,
  session_type: 'session',
  status: 'planned',
  starts_at: '2026-03-01T09:00:00.000Z',
  ends_at: null,
  location: null,
  metadata: {},
  created_by: null,
  created_at: '2026-03-01T00:00:00.000Z',
  updated_at: '2026-03-01T00:00:00.000Z',
  ...overrides,
});

describe('buildInstitutionProgramItems', () => {
  it('classifies program rows by status into upcoming/active/completed', () => {
    const programs = [
      baseProgram({ id: 'upcoming-1', title: 'Upcoming', status: 'planned' }),
      baseProgram({ id: 'active-1', title: 'Active', status: 'active' }),
      baseProgram({ id: 'completed-1', title: 'Completed', status: 'completed', end_at: '2026-03-05T12:00:00.000Z' }),
    ];
    const sessions = [
      baseSession({ program_id: 'active-1', location: 'JHH Unit 5' }),
    ];

    const result = buildInstitutionProgramItems({
      programs,
      sessions,
      participantCounts: { 'upcoming-1': 7, 'active-1': 9, 'completed-1': 6 },
    });

    expect(result.upcoming).toHaveLength(1);
    expect(result.active).toHaveLength(1);
    expect(result.completed).toHaveLength(1);
    expect(result.upcoming[0].status).toBe('Ready');
    expect(result.active[0].unit).toBe('JHH Unit 5');
    expect(result.completed[0].finished).toBe('2026-03-05T12:00:00.000Z');
  });

  it('uses metadata/unit and metadata/lead fallbacks for display fields', () => {
    const programs = [
      baseProgram({
        id: 'draft-1',
        status: 'draft',
        metadata: { unit: 'Simulation Lab A', lead: 'Prof. Carter' },
      }),
      baseProgram({
        id: 'archived-1',
        status: 'archived',
        metadata: { lead: 'Dr. Akers' },
      }),
    ];

    const result = buildInstitutionProgramItems({
      programs,
      sessions: [],
      participantCounts: {},
    });

    expect(result.upcoming[0].track).toBe('Simulation Lab A');
    expect(result.upcoming[0].status).toBe('Setup Required');
    expect(result.completed[0].lead).toBe('Dr. Akers');
  });
});
