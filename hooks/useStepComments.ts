/**
 * useStepComments — React Query hooks for step discussion comments.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StepCommentService } from '@/services/StepCommentService';
import { useAuth } from '@/providers/AuthProvider';

export function useStepComments(stepId: string | undefined) {
  return useQuery({
    queryKey: ['step-comments', stepId],
    queryFn: () => StepCommentService.getComments(stepId!),
    enabled: Boolean(stepId),
    refetchInterval: 10_000, // Poll every 10s for new comments
  });
}

export function useAddStepComment(stepId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string | null }) =>
      StepCommentService.addComment(stepId, user!.id, content, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['step-comments', stepId] });
    },
  });
}

export function useDeleteStepComment(stepId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => StepCommentService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['step-comments', stepId] });
    },
  });
}
