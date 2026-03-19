jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));
jest.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

import { supabase } from '../supabase';
import {
  mockSupabaseResponse,
  mockSupabaseError,
  setupSupabaseFromMulti,
} from '../../test/helpers/supabaseMock';

const fromMock = supabase.from as jest.Mock;

// Helper: chainable builder that resolves on terminal calls
function chainBuilder(result: { data: any; error: any }) {
  const b: Record<string, any> = {};
  const chain = [
    'select', 'insert', 'update', 'delete',
    'eq', 'neq', 'in', 'order', 'limit', 'range', 'filter',
  ];
  for (const m of chain) b[m] = jest.fn().mockReturnValue(b);
  b.single = jest.fn().mockResolvedValue(result);
  b.maybeSingle = jest.fn().mockResolvedValue(result);
  // Make awaitable
  b.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
  return b;
}

describe('TimelineStepService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateStepMetadata', () => {
    it('deep merges plan metadata and extracts collaborator user_ids', async () => {
      const existingMetadata = {
        plan: {
          what_will_you_do: 'Go sailing',
          collaborators: [
            { type: 'platform', user_id: 'user-a' },
          ],
        },
        review: { notes: 'good session' },
      };

      // First call: fetch current metadata
      const fetchBuilder = chainBuilder(
        mockSupabaseResponse({ metadata: existingMetadata }),
      );
      // Second call: update with merged metadata
      const updateBuilder = chainBuilder(
        mockSupabaseResponse({
          id: 'step-1',
          metadata: {
            plan: {
              what_will_you_do: 'Go sailing',
              collaborators: [
                { type: 'platform', user_id: 'user-a' },
                { type: 'platform', user_id: 'user-b' },
              ],
            },
            review: { notes: 'good session' },
          },
        }),
      );

      let callCount = 0;
      fromMock.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? fetchBuilder : updateBuilder;
      });

      const { updateStepMetadata } = require('../TimelineStepService');

      const result = await updateStepMetadata('step-1', {
        plan: {
          collaborators: [
            { type: 'platform', user_id: 'user-a' },
            { type: 'platform', user_id: 'user-b' },
          ],
        },
      });

      // Verify the update was called with merged metadata + extracted collaborator_user_ids
      expect(updateBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          collaborator_user_ids: ['user-a', 'user-b'],
          metadata: expect.objectContaining({
            review: { notes: 'good session' },
          }),
        }),
      );
      expect(result.id).toBe('step-1');
    });

    it('replaces non-object metadata keys instead of merging', async () => {
      const fetchBuilder = chainBuilder(
        mockSupabaseResponse({ metadata: { plan: { what_will_you_do: 'Old plan' } } }),
      );
      const updateBuilder = chainBuilder(
        mockSupabaseResponse({ id: 'step-2', metadata: { plan: { what_will_you_do: 'New plan' } } }),
      );

      let callCount = 0;
      fromMock.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? fetchBuilder : updateBuilder;
      });

      const { updateStepMetadata } = require('../TimelineStepService');
      await updateStepMetadata('step-2', { plan: { what_will_you_do: 'New plan' } });

      const updateArg = updateBuilder.update.mock.calls[0][0];
      expect(updateArg.metadata.plan.what_will_you_do).toBe('New plan');
    });
  });

  describe('createStepsFromCourse', () => {
    it('batch inserts lessons with correct sort order and date spacing', async () => {
      // First call: get max sort_order
      const maxBuilder = chainBuilder(mockSupabaseResponse({ sort_order: 5 }));
      // Second call: insert batch
      const insertResult = [
        { id: 's1', sort_order: 6 },
        { id: 's2', sort_order: 7 },
      ];
      const insertBuilder = chainBuilder(mockSupabaseResponse(insertResult));

      let callCount = 0;
      fromMock.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? maxBuilder : insertBuilder;
      });

      const { createStepsFromCourse } = require('../TimelineStepService');

      const result = await createStepsFromCourse({
        userId: 'user-1',
        interestId: 'interest-1',
        resourceId: 'resource-1',
        courseTitle: 'Learn to Sail',
        lessons: [
          { id: 'l1', title: 'Knots', sort_order: 0 },
          { id: 'l2', title: 'Tacking', sort_order: 1, description: 'How to tack' },
        ],
        spacingDays: 7,
        startDate: '2026-04-01',
      });

      // Verify insert was called
      expect(insertBuilder.insert).toHaveBeenCalledTimes(1);
      const rows = insertBuilder.insert.mock.calls[0][0];
      expect(rows).toHaveLength(2);

      // Sort order starts after existing max (5)
      expect(rows[0].sort_order).toBe(6);
      expect(rows[1].sort_order).toBe(7);

      // Date spacing: 7 days apart
      const d0 = new Date(rows[0].starts_at);
      const d1 = new Date(rows[1].starts_at);
      const diffDays = (d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(7);

      // Course context metadata
      expect(rows[0].metadata.course_context.lesson_index).toBe(0);
      expect(rows[1].metadata.course_context.lesson_index).toBe(1);
      expect(rows[0].metadata.course_context.total_lessons).toBe(2);
    });
  });

  describe('adoptOrgCourse', () => {
    it('fetches templates, creates resource, and creates steps', async () => {
      const templates = [
        { id: 't1', title: 'Intro', description: 'Intro lesson', sort_order: 0, category: 'lesson', metadata: {} },
        { id: 't2', title: 'Advanced', description: 'Advanced lesson', sort_order: 1, category: 'lesson', metadata: {} },
      ];

      // Call sequence: templates → org name → insert resource → max sort → insert steps
      const builders = [
        chainBuilder(mockSupabaseResponse(templates)),                   // templates
        chainBuilder(mockSupabaseResponse({ name: 'Test Club' })),       // org name
        chainBuilder(mockSupabaseResponse({ id: 'res-1' })),             // insert resource
        chainBuilder(mockSupabaseResponse({ sort_order: 0 })),           // max sort
        chainBuilder(mockSupabaseResponse([{ id: 's1' }, { id: 's2' }])), // insert steps
      ];

      let callCount = 0;
      fromMock.mockImplementation(() => builders[callCount++]);

      const { adoptOrgCourse } = require('../TimelineStepService');

      const result = await adoptOrgCourse({
        userId: 'user-1',
        interestId: 'interest-1',
        orgId: 'org-1',
        coursePath: 'beginner-sailing',
        libraryId: 'lib-1',
      });

      expect(result.resourceId).toBe('res-1');
      expect(result.steps).toHaveLength(2);

      // Verify templates were fetched from the correct org/path
      expect(builders[0].eq).toHaveBeenCalledWith('organization_id', 'org-1');
      expect(builders[0].eq).toHaveBeenCalledWith('path_name', 'beginner-sailing');
    });
  });
});
