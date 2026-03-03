import { buildAssignmentList } from '../assignmentList';

describe('buildAssignmentList', () => {
  const participants = [
    {
      id: 'p1',
      display_name: 'Zoe',
      email: 'zoe@example.com',
      role: 'Faculty',
      status: 'active',
      created_at: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 'p2',
      display_name: 'Alex',
      email: 'alex@example.com',
      role: 'Learner',
      status: 'invited',
      created_at: '2026-03-02T10:00:00.000Z',
    },
    {
      id: 'p3',
      display_name: 'Brooke',
      email: 'brooke@example.com',
      role: 'Faculty',
      status: 'completed',
      created_at: '2026-03-03T10:00:00.000Z',
    },
  ] as any;

  it('filters by role/status/search and sorts', () => {
    const result = buildAssignmentList(participants, {
      role: 'Faculty',
      status: 'all',
      searchText: 'o',
      sortMode: 'oldest',
      visibleCount: 10,
    });

    expect(result.filteredAssignments.map((row) => row.id)).toEqual(['p1', 'p3']);
    expect(result.pagedAssignments.map((row) => row.id)).toEqual(['p1', 'p3']);
  });

  it('returns paged slice based on visibleCount', () => {
    const result = buildAssignmentList(participants, {
      role: 'all',
      status: 'all',
      searchText: '',
      sortMode: 'newest',
      visibleCount: 2,
    });

    expect(result.filteredAssignments.map((row) => row.id)).toEqual(['p3', 'p2', 'p1']);
    expect(result.pagedAssignments.map((row) => row.id)).toEqual(['p3', 'p2']);
  });
});
