import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePost } from './api';
import { postKeys } from './postKeys';

/**
 * Custom TanStack Query mutation hook for updating posts with Optimistic UI updates.
 * Immediately applies changes to the local cache and rolls back cleanly if the server rejects.
 */
export function useUpdatePost(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, onSettled, ...restOptions } = options;

  return useMutation({
    ...restOptions,
    mutationFn: ({ id, ...payload }) => updatePost(id, payload),

    onMutate: async ({ id, ...payload }) => {
      // 1. Cancel any outgoing queries so they don't overwrite optimistic data
      await queryClient.cancelQueries({ queryKey: postKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: postKeys.lists() });

      // 2. Snapshot the previous cache states for rollback
      const previousPost = queryClient.getQueryData(postKeys.detail(id));
      const previousLists = queryClient.getQueryData(postKeys.lists());

      // 3. Optimistically update single post detail query
      if (previousPost) {
        queryClient.setQueryData(postKeys.detail(id), {
          ...previousPost,
          ...payload,
          updated_at: new Date().toISOString(),
        });
      }

      // 4. Optimistically update post list query if it exists
      if (previousLists && Array.isArray(previousLists)) {
        queryClient.setQueryData(
          postKeys.lists(),
          previousLists.map((item) =>
            item.id === id
              ? { ...item, ...payload, updated_at: new Date().toISOString() }
              : item
          )
        );
      }

      return { previousPost, previousLists, id };
    },

    onSuccess: (data, variables, context) => {
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },

    onError: (err, variables, context) => {
      // Rollback to snapshots on error
      if (context?.previousPost) {
        queryClient.setQueryData(postKeys.detail(context.id), context.previousPost);
      }
      if (context?.previousLists) {
        queryClient.setQueryData(postKeys.lists(), context.previousLists);
      }
      if (onError) {
        onError(err, variables, context);
      }
    },

    onSettled: (data, error, variables, context) => {
      // Invalidate to ensure complete sync with server state
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: postKeys.detail(variables.id) });
      }
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });

      if (onSettled) {
        onSettled(data, error, variables, context);
      }
    },
  });
}
