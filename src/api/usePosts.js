import { useQuery } from '@tanstack/react-query';
import { getPosts } from './api';
import { postKeys } from './postKeys';

/**
 * Custom TanStack Query hook to fetch all posts.
 * Automatically invalidated and refreshed upon post creation.
 * @param {Object} options - Optional TanStack Query configuration options
 */
export function usePosts(params = {}, options = {}) {
  // If first argument has TanStack Query options keys (like select, enabled, staleTime), handle overloading
  const isParams = params && !('enabled' in params) && !('select' in params) && !('staleTime' in params);
  const actualParams = isParams ? params : {};
  const actualOptions = isParams ? options : params;

  return useQuery({
    queryKey: [...postKeys.lists(), actualParams],
    queryFn: () => getPosts(actualParams),
    staleTime: 30 * 1000,
    ...actualOptions,
  });
}
