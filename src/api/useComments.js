import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getComments, createComment, updateComment, deleteComment } from './api';
import { commentKeys, postKeys, authKeys } from './postKeys';

/**
 * Fetch top-level comments and nested replies tree for a post.
 */
export function useComments(postId) {
  return useQuery({
    queryKey: commentKeys.post(postId),
    queryFn: () => getComments(postId),
    enabled: Boolean(postId),
    staleTime: 0,
  });
}

/**
 * Helper to recursively add a child reply into a comments tree
 */
function addReplyToTree(comments, parentId, newReply) {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      const existing = comment.replies || [];
      if (existing.some((r) => r.id === newReply.id)) return comment;
      return {
        ...comment,
        replies: [...existing, newReply],
      };
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: addReplyToTree(comment.replies, parentId, newReply),
      };
    }
    return comment;
  });
}

/**
 * Helper to recursively update a comment in a tree
 */
function updateCommentInTree(comments, targetId, updatedComment) {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return { ...comment, ...updatedComment };
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentInTree(comment.replies, targetId, updatedComment),
      };
    }
    return comment;
  });
}

/**
 * Helper to recursively remove a comment from a tree
 */
function removeCommentFromTree(comments, targetId) {
  return comments
    .filter((comment) => comment.id !== targetId)
    .map((comment) => ({
      ...comment,
      replies: comment.replies ? removeCommentFromTree(comment.replies, targetId) : [],
    }));
}

/**
 * Mutation to add a new comment or nested reply.
 */
export function useCreateComment(postId, options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, onSettled, ...restOptions } = options;

  return useMutation({
    ...restOptions,
    mutationFn: ({ content, parent = null, is_anonymous = false }) =>
      createComment({ post: postId, content, parent, is_anonymous }),
    onSuccess: async (data, variables, context) => {
      // 1. Optimistically update local query cache for instantaneous UI response
      queryClient.setQueryData(commentKeys.post(postId), (old = []) => {
        const oldArray = Array.isArray(old) ? old : [];
        if (variables.parent) {
          // It's a reply: insert into parent's replies
          return addReplyToTree(oldArray, variables.parent, data);
        }
        // Top-level comment: prepend to top of list
        if (oldArray.some((c) => c.id === data.id)) return oldArray;
        return [data, ...oldArray];
      });

      // 2. Actively invalidate and refetch all comments for this post
      await queryClient.invalidateQueries({ queryKey: commentKeys.all });
      await queryClient.refetchQueries({ queryKey: commentKeys.post(postId) });

      // 3. Invalidate post details and post list to update comments count
      await queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      await queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: authKeys.activity() });

      // 4. Run consumer callback if provided
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },
    onError: (err, variables, context) => {
      if (onError) onError(err, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      if (onSettled) onSettled(data, error, variables, context);
    },
  });
}

/**
 * Mutation to edit an existing comment.
 */
export function useUpdateComment(postId, options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, onSettled, ...restOptions } = options;

  return useMutation({
    ...restOptions,
    mutationFn: ({ id, content }) => updateComment(id, { content }),
    onSuccess: async (data, variables, context) => {
      // Optimistically update comment in cache
      queryClient.setQueryData(commentKeys.post(postId), (old = []) => {
        const oldArray = Array.isArray(old) ? old : [];
        return updateCommentInTree(oldArray, variables.id, data);
      });

      await queryClient.invalidateQueries({ queryKey: commentKeys.all });
      await queryClient.refetchQueries({ queryKey: commentKeys.post(postId) });

      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },
    onError: (err, variables, context) => {
      if (onError) onError(err, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      if (onSettled) onSettled(data, error, variables, context);
    },
  });
}

/**
 * Mutation to delete a comment.
 */
export function useDeleteComment(postId, options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, onSettled, ...restOptions } = options;

  return useMutation({
    ...restOptions,
    mutationFn: (id) => deleteComment(id),
    onSuccess: async (data, variables, context) => {
      // Optimistically delete comment from cache
      queryClient.setQueryData(commentKeys.post(postId), (old = []) => {
        const oldArray = Array.isArray(old) ? old : [];
        return removeCommentFromTree(oldArray, variables);
      });

      await queryClient.invalidateQueries({ queryKey: commentKeys.all });
      await queryClient.refetchQueries({ queryKey: commentKeys.post(postId) });
      await queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      await queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: authKeys.activity() });

      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },
    onError: (err, variables, context) => {
      if (onError) onError(err, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      if (onSettled) onSettled(data, error, variables, context);
    },
  });
}
