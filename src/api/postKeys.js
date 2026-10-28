/**
 * TanStack Query key factory for posts, auth, and comments.
 * Provides a single source of truth for query key arrays to prevent key typos
 * and ensure seamless cache invalidation across the app.
 */
export const postKeys = {
  all: ['posts'],
  lists: () => [...postKeys.all, 'list'],
  list: (filters) => [...postKeys.lists(), { filters }],
  details: () => [...postKeys.all, 'detail'],
  detail: (id) => [...postKeys.details(), String(id)],
};

export const authKeys = {
  all: ['auth'],
  me: () => [...authKeys.all, 'me'],
  activity: () => [...authKeys.all, 'activity'],
};

export const commentKeys = {
  all: ['comments'],
  post: (postId) => [...commentKeys.all, String(postId)],
};
