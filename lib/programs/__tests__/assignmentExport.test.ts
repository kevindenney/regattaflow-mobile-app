import {
  buildProgramAssignmentsCsv,
  buildProgramAssignmentsCsvFilename,
} from '../assignmentExport';

describe('assignmentExport', () => {
  it('builds CSV with escaped cells and expected header order', () => {
    const programById = new Map([
      ['p1', { id: 'p1', title: 'Cohort A' }],
    ]) as any;
    const sessionById = new Map([
      ['s1', { id: 's1', title: 'Sim "Blue", North' }],
    ]) as any;

    const csv = buildProgramAssignmentsCsv(
      [
        {
          id: 'pp1',
          program_id: 'p1',
          session_id: 's1',
          display_name: 'Alex, RN',
          email: 'alex@example.com',
          role: 'Faculty',
          status: 'active',
          created_at: '2026-03-03T10:11:12.000Z',
        },
      ] as any,
      programById,
      sessionById
    );

    const lines = csv.split('\n');
    expect(lines[0]).toBe('name,email,role,status,program,session,created_at');
    expect(lines[1]).toContain('"Alex, RN"');
    expect(lines[1]).toContain('"Sim ""Blue"", North"');
  });

  it('builds deterministic export filename from date', () => {
    const fileName = buildProgramAssignmentsCsvFilename(new Date('2026-03-03T12:00:00.000Z'));
    expect(fileName).toBe('program-assignments-2026-03-03.csv');
  });
});
