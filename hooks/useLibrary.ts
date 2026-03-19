/**
 * useLibrary — React Query hooks for library and resource CRUD.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import {
  getUserLibrary,
  getResources,
  addResource,
  updateResource,
  deleteResource,
  markLessonCompleted,
  unmarkLessonCompleted,
} from '@/services/LibraryService';
import type {
  LibraryRecord,
  LibraryResourceRecord,
  CreateLibraryResourceInput,
  UpdateLibraryResourceInput,
} from '@/types/library';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const KEYS = {
  library: (interestId: string) => ['library', interestId] as const,
  resources: (libraryId: string) => ['library-resources', libraryId] as const,
};

// ---------------------------------------------------------------------------
// 1. Get user's library for current interest
// ---------------------------------------------------------------------------

export function useLibrary(interestId: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<LibraryRecord, Error>({
    queryKey: KEYS.library(interestId ?? ''),
    queryFn: () => getUserLibrary(userId!, interestId!),
    enabled: Boolean(userId) && Boolean(interestId),
  });
}

// ---------------------------------------------------------------------------
// 2. Get resources for a library
// ---------------------------------------------------------------------------

export function useLibraryResources(libraryId: string | undefined) {
  return useQuery<LibraryResourceRecord[], Error>({
    queryKey: KEYS.resources(libraryId ?? ''),
    queryFn: () => getResources(libraryId!),
    enabled: Boolean(libraryId),
  });
}

// ---------------------------------------------------------------------------
// 3. Add resource mutation
// ---------------------------------------------------------------------------

export function useAddResource() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    LibraryResourceRecord,
    Error,
    CreateLibraryResourceInput
  >({
    mutationFn: (input) => {
      if (!user?.id) throw new Error('Must be logged in');
      return addResource(user.id, input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.resources(variables.library_id) });
    },
  });
}

// ---------------------------------------------------------------------------
// 4. Update resource mutation
// ---------------------------------------------------------------------------

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation<
    LibraryResourceRecord,
    Error,
    { resourceId: string; input: UpdateLibraryResourceInput; libraryId: string }
  >({
    mutationFn: ({ resourceId, input }) => updateResource(resourceId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.resources(variables.libraryId) });
    },
  });
}

// ---------------------------------------------------------------------------
// 5. Delete resource mutation
// ---------------------------------------------------------------------------

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { resourceId: string; libraryId: string }
  >({
    mutationFn: ({ resourceId }) => deleteResource(resourceId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.resources(variables.libraryId) });
    },
  });
}

// ---------------------------------------------------------------------------
// 6. Mark course lesson completed
// ---------------------------------------------------------------------------

export function useMarkLessonCompleted() {
  const queryClient = useQueryClient();

  return useMutation<
    LibraryResourceRecord,
    Error,
    { resourceId: string; lessonId: string; libraryId: string }
  >({
    mutationFn: ({ resourceId, lessonId }) => markLessonCompleted(resourceId, lessonId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.resources(variables.libraryId) });
    },
  });
}

// ---------------------------------------------------------------------------
// 7. Unmark course lesson
// ---------------------------------------------------------------------------

export function useUnmarkLessonCompleted() {
  const queryClient = useQueryClient();

  return useMutation<
    LibraryResourceRecord,
    Error,
    { resourceId: string; lessonId: string; libraryId: string }
  >({
    mutationFn: ({ resourceId, lessonId }) => unmarkLessonCompleted(resourceId, lessonId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.resources(variables.libraryId) });
    },
  });
}
