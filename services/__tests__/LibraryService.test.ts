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
import { mockSupabaseResponse, mockSupabaseError } from '../../test/helpers/supabaseMock';

const fromMock = supabase.from as jest.Mock;

function chainBuilder(result: { data: any; error: any }) {
  const b: Record<string, any> = {};
  const chain = [
    'select', 'insert', 'update', 'delete',
    'eq', 'neq', 'in', 'order', 'limit', 'range', 'filter',
  ];
  for (const m of chain) b[m] = jest.fn().mockReturnValue(b);
  b.single = jest.fn().mockResolvedValue(result);
  b.maybeSingle = jest.fn().mockResolvedValue(result);
  b.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
  return b;
}

describe('LibraryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserLibrary', () => {
    it('returns existing library if found', async () => {
      const existing = { id: 'lib-1', user_id: 'u1', interest_id: 'i1', name: 'My Library' };
      const builder = chainBuilder(mockSupabaseResponse(existing));
      fromMock.mockReturnValue(builder);

      const { getUserLibrary } = require('../LibraryService');
      const result = await getUserLibrary('u1', 'i1');

      expect(result).toEqual(existing);
      // Should not have called insert (auto-create path)
      expect(builder.insert).not.toHaveBeenCalled();
    });

    it('auto-creates library when none exists', async () => {
      // First call: maybeSingle returns null
      const findBuilder = chainBuilder(mockSupabaseResponse(null));
      // Second call: insert + single returns new library
      const created = { id: 'lib-new', user_id: 'u1', interest_id: 'i1', name: 'My Library' };
      const createBuilder = chainBuilder(mockSupabaseResponse(created));

      let callCount = 0;
      fromMock.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? findBuilder : createBuilder;
      });

      const { getUserLibrary } = require('../LibraryService');
      const result = await getUserLibrary('u1', 'i1');

      expect(result).toEqual(created);
      expect(createBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'u1', interest_id: 'i1', name: 'My Library' }),
      );
    });
  });

  describe('markLessonCompleted', () => {
    it('appends lesson ID and sets last_completed_at', async () => {
      const existingMeta = {
        progress: { completed_lesson_ids: ['lesson-1'] },
        course_structure: { modules: [] },
      };

      // Fetch current metadata
      const fetchBuilder = chainBuilder(mockSupabaseResponse({ metadata: existingMeta }));
      // Update with merged metadata
      const updatedResource = {
        id: 'res-1',
        metadata: {
          ...existingMeta,
          progress: {
            completed_lesson_ids: ['lesson-1', 'lesson-2'],
            last_completed_at: expect.any(String),
          },
        },
      };
      const updateBuilder = chainBuilder(mockSupabaseResponse(updatedResource));

      let callCount = 0;
      fromMock.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? fetchBuilder : updateBuilder;
      });

      const { markLessonCompleted } = require('../LibraryService');
      await markLessonCompleted('res-1', 'lesson-2');

      const updateArg = updateBuilder.update.mock.calls[0][0];
      expect(updateArg.metadata.progress.completed_lesson_ids).toContain('lesson-1');
      expect(updateArg.metadata.progress.completed_lesson_ids).toContain('lesson-2');
      expect(updateArg.metadata.progress.last_completed_at).toBeDefined();
    });

    it('prevents duplicate lesson IDs', async () => {
      const existingMeta = {
        progress: { completed_lesson_ids: ['lesson-1'] },
      };

      const fetchBuilder = chainBuilder(mockSupabaseResponse({ metadata: existingMeta }));
      const updateBuilder = chainBuilder(mockSupabaseResponse({ id: 'res-1' }));

      let callCount = 0;
      fromMock.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? fetchBuilder : updateBuilder;
      });

      const { markLessonCompleted } = require('../LibraryService');
      await markLessonCompleted('res-1', 'lesson-1');

      const updateArg = updateBuilder.update.mock.calls[0][0];
      const ids = updateArg.metadata.progress.completed_lesson_ids;
      expect(ids.filter((id: string) => id === 'lesson-1')).toHaveLength(1);
    });
  });

  describe('getResources', () => {
    it('returns all resources when no filter is given', async () => {
      const resources = [{ id: 'r1' }, { id: 'r2' }];
      const builder = chainBuilder(mockSupabaseResponse(resources));
      fromMock.mockReturnValue(builder);

      const { getResources } = require('../LibraryService');
      const result = await getResources('lib-1');

      expect(result).toEqual(resources);
      expect(builder.eq).toHaveBeenCalledWith('library_id', 'lib-1');
    });

    it('applies resource_type filter when provided', async () => {
      const resources = [{ id: 'r1', resource_type: 'book' }];
      const builder = chainBuilder(mockSupabaseResponse(resources));
      fromMock.mockReturnValue(builder);

      const { getResources } = require('../LibraryService');
      await getResources('lib-1', { resourceType: 'book' });

      // eq should be called for library_id AND resource_type
      const eqCalls = builder.eq.mock.calls;
      expect(eqCalls).toContainEqual(['library_id', 'lib-1']);
      expect(eqCalls).toContainEqual(['resource_type', 'book']);
    });
  });
});
