import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reactToPost } from './api';
import { postKeys } from './postKeys';

/**
 * Custom TanStack Query mutation hook for liking / disliking posts.
 * Includes safe optimistic updates and instant rollback on failure.
 */
export function usePostReaction(postId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reactionType) => reactToPost(postId, reactionType),

    onMutate: async (reactionType) => {
      const detailKey = postKeys.detail(postId);

      // Cancel ongoing queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: detailKey });

      // Snapshot previous value for rollback
      const previousPost = queryClient.getQueryData(detailKey);

      if (previousPost) {
        let nextLikes = previousPost.likes_count || 0;
        let nextDislikes = previousPost.dislikes_count || 0;
        let nextReaction;

        const currentReaction = previousPost.user_reaction;


        if (currentReaction === reactionType) {
          // Toggling off
          nextReaction = null;
          if (reactionType === 'like') nextLikes = Math.max(0, nextLikes - 1);
          if (reactionType === 'dislike') nextDislikes = Math.max(0, nextDislikes - 1);
        } else if (!currentReaction) {
          // Adding new reaction
          nextReaction = reactionType;
          if (reactionType === 'like') nextLikes += 1;
          if (reactionType === 'dislike') nextDislikes += 1;
        } else {
          // Switching reaction
          nextReaction = reactionType;
          if (reactionType === 'like') {
            nextLikes += 1;
            nextDislikes = Math.max(0, nextDislikes - 1);
          } else {
            nextDislikes += 1;
            nextLikes = Math.max(0, nextLikes - 1);
          }
        }

        queryClient.setQueryData(detailKey, {
          ...previousPost,
          likes_count: nextLikes,
          dislikes_count: nextDislikes,
          user_reaction: nextReaction,
        });
      }

      return { previousPost };
    },

    onError: (err, reactionType, context) => {
      // Rollback on network or server error
      if (context?.previousPost) {
        queryClient.setQueryData(postKeys.detail(postId), context.previousPost);
      }
    },

    onSuccess: (data) => {
      const detailKey = postKeys.detail(postId);
      queryClient.setQueryData(detailKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          likes_count: data.likes_count,
          dislikes_count: data.dislikes_count,
          user_reaction: data.user_reaction,
        };
      });

      // Synchronize list queries
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}
