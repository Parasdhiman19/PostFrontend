import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'blogspace_token';

/**
 * Pre-configured Axios HTTP client.
 * Connects to the Django REST Framework backend via the Vite development proxy (/api)
 * or a configured environment variable VITE_API_URL.
 */
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: dynamically inject Auth Token if stored
apiClient.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
  } catch {
    // Local storage access error fallback
  }
  return config;
});

// Response interceptor: handle token expiration or unauthorized requests
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If 401 is received on an authenticated endpoint (not during login/register), clear token
      const url = error.config?.url || '';
      if (!url.includes('/auth/login/') && !url.includes('/auth/register/')) {
        try {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        } catch {
          // Fallback
        }
        window.dispatchEvent(new CustomEvent('blogspace:auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

/* ─── Authentication APIs ────────────────────────────────────────────── */

export async function registerUser({ username, email, password }) {
  const response = await apiClient.post('/auth/register/', { username, email, password });
  return response.data;
}

export async function loginUser({ email, password }) {
  const response = await apiClient.post('/auth/login/', { email, password });
  return response.data;
}

export async function logoutUser() {
  const response = await apiClient.post('/auth/logout/');
  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get('/auth/me/');
  return response.data;
}

export async function updateUserProfile({ username }) {
  const response = await apiClient.patch('/auth/profile/', { username });
  return response.data;
}

export async function getUserActivity() {
  const response = await apiClient.get('/auth/user-activity/');
  return response.data;
}

/* ─── Posts APIs ─────────────────────────────────────────────────────── */

export async function getPosts(params = {}) {
  const response = await apiClient.get('/posts/', { params });
  return response.data;
}

export async function getInsights() {
  const response = await apiClient.get('/insights/');
  return response.data;
}

export async function getPostById(id) {
  const response = await apiClient.get(`/posts/${id}/`);
  return response.data;
}

export async function createPost(data) {
  const response = await apiClient.post('/posts/', data);
  return response.data;
}

export async function updatePost(id, data) {
  const response = await apiClient.put(`/posts/${id}/`, data);
  return response.data;
}

export async function deletePost(id) {
  const response = await apiClient.delete(`/posts/${id}/`);
  return response.data;
}

export async function reactToPost(postId, reactionType) {
  const response = await apiClient.post(`/posts/${postId}/react/`, {
    reaction_type: reactionType,
  });
  return response.data;
}

/* ─── Comments APIs ──────────────────────────────────────────────────── */

export async function getComments(postId) {
  const response = await apiClient.get('/comments/', {
    params: { post: postId, top_level: 'true' },
  });
  return response.data;
}

export async function createComment({ post, content, parent = null, is_anonymous = false }) {
  const response = await apiClient.post('/comments/', {
    post,
    content,
    parent,
    is_anonymous,
  });
  return response.data;
}

export async function updateComment(id, { content }) {
  const response = await apiClient.patch(`/comments/${id}/`, { content });
  return response.data;
}

export async function deleteComment(id) {
  const response = await apiClient.delete(`/comments/${id}/`);
  return response.data;
}
