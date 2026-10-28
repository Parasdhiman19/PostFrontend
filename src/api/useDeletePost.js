import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePost } from './api';
import { postKeys } from './postKeys';

/**
 * Custom TanStack Query mutation hook for deleting posts.
 * Invalidates lists, removes the post detail from cache, and cleans up local bookmarks.
 */
export function useDeletePost(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, onSettled, ...restOptions } = options;

  return useMutation({
    ...restOptions,
    mutationFn: (id) => deletePost(id),
    onSuccess: (data, id, context) => {
      // 1. Invalidate lists so the feed updates
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });

      // 2. Remove detail query from memory cache
      queryClient.removeQueries({ queryKey: postKeys.detail(id) });

      // 3. Clean up saved posts bookmark in localStorage if present
      try {
        const raw = localStorage.getItem('blogspace_saved_posts');
        if (raw) {
          const ids = JSON.parse(raw);
          const filtered = ids.filter((savedId) => String(savedId) !== String(id));
          localStorage.setItem('blogspace_saved_posts', JSON.stringify(filtered));
          window.dispatchEvent(new Event('blogspace_saved_changed'));
        }
      } catch {
        // Ignore storage error
      }

      if (onSuccess) {
        onSuccess(data, id, context);
      }
    },
    onError: (error, id, context) => {
      if (onError) {
        onError(error, id, context);
      }
    },
    onSettled: (data, error, id, context) => {
      if (onSettled) {
        onSettled(data, error, id, context);
      }
    },
  });
}
