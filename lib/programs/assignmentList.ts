import type { ParticipantStatus, ProgramParticipantRecord } from '@/services/ProgramService';

export type AssignmentSortMode = 'newest' | 'oldest' | 'name' | 'role' | 'status';

export type AssignmentListFilters = {
  role: string;
  status: ParticipantStatus | 'all';
  searchText: string;
  sortMode: AssignmentSortMode;
  visibleCount: number;
};

export type AssignmentListResult = {
  filteredAssignments: ProgramParticipantRecord[];
  pagedAssignments: ProgramParticipantRecord[];
};

export function buildAssignmentList(
  participants: readonly ProgramParticipantRecord[],
  filters: AssignmentListFilters
): AssignmentListResult {
  const needle = filters.searchText.trim().toLowerCase();
  const base = participants.filter((row) => {
    if (filters.role !== 'all' && row.role !== filters.role) return false;
    if (filters.status !== 'all' && row.status !== filters.status) return false;
    if (!needle) return true;
    const haystack = `${row.display_name || ''} ${row.email || ''} ${row.role || ''}`.toLowerCase();
    return haystack.includes(needle);
  });

  const sorted = [...base];
  sorted.sort((a, b) => {
    if (filters.sortMode === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (filters.sortMode === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (filters.sortMode === 'name') {
      const aName = String(a.display_name || a.email || '').toLowerCase();
      const bName = String(b.display_name || b.email || '').toLowerCase();
      return aName.localeCompare(bName);
    }
    if (filters.sortMode === 'role') return String(a.role || '').localeCompare(String(b.role || ''));
    if (filters.sortMode === 'status') return String(a.status || '').localeCompare(String(b.status || ''));
    return 0;
  });

  return {
    filteredAssignments: sorted,
    pagedAssignments: sorted.slice(0, Math.max(0, filters.visibleCount)),
  };
}
