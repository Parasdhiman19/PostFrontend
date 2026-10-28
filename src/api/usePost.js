import { useQuery } from '@tanstack/react-query';
import { getPostById } from './api';
import { postKeys } from './postKeys';

/**
 * Custom TanStack Query hook to fetch a single post by ID.
 * Leverages primed cache populated by useCreatePost for 0ms transitions.
 * @param {string|number} id - Post primary key
 * @param {Object} options - Optional TanStack Query configuration options
 */
export function usePost(id, options = {}) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => getPostById(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000, // 30 seconds fresh window
    ...options,
  });
}
