import type {
  ProgramParticipantRecord,
  ProgramRecord,
  ProgramSessionRecord,
} from '@/services/ProgramService';

const CSV_HEADER = ['name', 'email', 'role', 'status', 'program', 'session', 'created_at'] as const;

function escapeCsvCell(value: unknown): string {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildProgramAssignmentsCsv(
  assignments: readonly ProgramParticipantRecord[],
  programById: ReadonlyMap<string, ProgramRecord>,
  sessionById: ReadonlyMap<string, ProgramSessionRecord>
): string {
  const rows: string[][] = [
    [...CSV_HEADER],
    ...assignments.map((row) => {
      const program = programById.get(row.program_id);
      const session = row.session_id ? sessionById.get(row.session_id) : null;
      return [
        row.display_name || '',
        row.email || '',
        row.role || '',
        row.status || '',
        program?.title || '',
        session?.title || '',
        row.created_at || '',
      ];
    }),
  ];

  return rows.map((line) => line.map(escapeCsvCell).join(',')).join('\n');
}

export function buildProgramAssignmentsCsvFilename(now: Date = new Date()): string {
  const dateTag = now.toISOString().slice(0, 10);
  return `program-assignments-${dateTag}.csv`;
}
