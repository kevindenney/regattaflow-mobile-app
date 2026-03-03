import { formatDistanceToNow } from 'date-fns';
import type { ProgramRecord, ProgramSessionRecord } from '@/services/ProgramService';

export type InstitutionUpcomingItem = {
  id: string;
  name: string;
  start: string;
  track: string;
  learners: number;
  status: 'Ready' | 'Pending' | 'Setup Required';
};

export type InstitutionActiveItem = {
  id: string;
  name: string;
  elapsed: string;
  unit: string;
  checkIn: number;
};

export type InstitutionCompletedItem = {
  id: string;
  name: string;
  finished: string;
  lead: string;
  learners: number;
};

export type InstitutionProgramItems = {
  upcoming: InstitutionUpcomingItem[];
  active: InstitutionActiveItem[];
  completed: InstitutionCompletedItem[];
};

type BuildInstitutionProgramItemsInput = {
  programs: ProgramRecord[];
  sessions: ProgramSessionRecord[];
  participantCounts: Record<string, number>;
};

function toTitle(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildInstitutionProgramItems({
  programs,
  sessions,
  participantCounts,
}: BuildInstitutionProgramItemsInput): InstitutionProgramItems {
  const sessionByProgram = new Map<string, ProgramSessionRecord>();
  for (const session of sessions) {
    if (!sessionByProgram.has(session.program_id)) {
      sessionByProgram.set(session.program_id, session);
    }
  }

  const upcoming: InstitutionUpcomingItem[] = [];
  const active: InstitutionActiveItem[] = [];
  const completed: InstitutionCompletedItem[] = [];

  const sorted = [...programs].sort((a, b) => {
    const aTime = a.start_at ? new Date(a.start_at).getTime() : 0;
    const bTime = b.start_at ? new Date(b.start_at).getTime() : 0;
    return aTime - bTime;
  });

  for (const program of sorted) {
    const session = sessionByProgram.get(program.id);
    const learners = participantCounts[program.id] || 0;
    const start = program.start_at || new Date().toISOString();
    const track =
      typeof program.metadata?.unit === 'string'
        ? String(program.metadata.unit)
        : toTitle(program.type || 'Program');
    const lead =
      typeof program.metadata?.lead === 'string'
        ? String(program.metadata.lead)
        : 'Program Lead';

    if (program.status === 'active') {
      active.push({
        id: program.id,
        name: program.title,
        elapsed: session?.starts_at ? formatDistanceToNow(new Date(session.starts_at)) : 'In progress',
        unit: session?.location || track,
        checkIn: learners,
      });
      continue;
    }

    if (program.status === 'completed' || program.status === 'archived' || program.status === 'cancelled') {
      completed.push({
        id: program.id,
        name: program.title,
        finished: program.end_at || start,
        lead,
        learners,
      });
      continue;
    }

    const status: InstitutionUpcomingItem['status'] =
      program.status === 'planned'
        ? 'Ready'
        : program.status === 'draft'
          ? 'Setup Required'
          : 'Pending';
    upcoming.push({
      id: program.id,
      name: program.title,
      start,
      track,
      learners,
      status,
    });
  }

  return { upcoming, active, completed };
}
