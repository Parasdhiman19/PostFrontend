import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from './api';
import { postKeys } from './postKeys';

/**
 * Custom TanStack Query mutation hook for creating posts.
 * Automatically invalidates post lists and primes individual post cache for instant navigation.
 */
export function useCreatePost(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, onSettled, ...restOptions } = options;

  return useMutation({
    ...restOptions,
    mutationFn: (newPostData) => createPost(newPostData),
    onSuccess: (data, variables, context) => {
      // Invalidate the post list queries so the feed reflects the new post immediately
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });

      // Prime the specific post cache using server returned data (0ms latency on detail page)
      if (data?.id) {
        queryClient.setQueryData(postKeys.detail(data.id), data);
      }

      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      if (onError) {
        onError(error, variables, context);
      }
    },
    onSettled: (data, error, variables, context) => {
      if (onSettled) {
        onSettled(data, error, variables, context);
      }
    },
  });
}
