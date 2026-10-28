import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { authKeys } from '../api/postKeys';
import { getUserActivity, updateUserProfile } from '../api/api';
import { formatTimeAgo } from '../utils/formatTime';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

const POSTS_PAGE_SIZE = 5;
const COMMENTS_PAGE_SIZE = 5;

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, updateLocalUser } = useAuth();
  const [now] = useState(() => Date.now());

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'posts' | 'comments'
  const [postsPage, setPostsPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);
  const [username, setUsername] = useState(user?.username || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLogoutPending, setIsLogoutPending] = useState(false);

  // Fetch user activity (posts & comments)
  const { data: activity, isLoading: isActivityLoading, refetch: refetchActivity } = useQuery({
    queryKey: authKeys.activity(),
    queryFn: getUserActivity,
  });

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);

    const trimmed = username.trim();
    if (!trimmed) {
      setSaveError('Username cannot be empty.');
      return;
    }
    if (trimmed.length < 3) {
      setSaveError('Username must be at least 3 characters.');
      return;
    }
    if (trimmed.toLowerCase() === user?.username.toLowerCase()) {
      return; // No change
    }

    setIsSaving(true);
    try {
      const updated = await updateUserProfile({ username: trimmed });
      updateLocalUser(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      refetchActivity();
    } catch (err) {
      const msg =
        err?.response?.data?.username?.[0] ||
        err?.response?.data?.detail ||
        'Unable to update username. It may already be taken.';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLogoutPending(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setIsLogoutPending(false);
      setIsLogoutModalOpen(false);
    }
  };

  const userPosts = activity?.posts || [];
  const userComments = activity?.comments || [];

  const totalPostsPages = Math.ceil(userPosts.length / POSTS_PAGE_SIZE) || 1;
  const safePostsPage = Math.min(Math.max(1, postsPage), totalPostsPages);
  const paginatedUserPosts = userPosts.slice(
    (safePostsPage - 1) * POSTS_PAGE_SIZE,
    safePostsPage * POSTS_PAGE_SIZE
  );

  const totalCommentsPages = Math.ceil(userComments.length / COMMENTS_PAGE_SIZE) || 1;
  const safeCommentsPage = Math.min(Math.max(1, commentsPage), totalCommentsPages);
  const paginatedUserComments = userComments.slice(
    (safeCommentsPage - 1) * COMMENTS_PAGE_SIZE,
    safeCommentsPage * COMMENTS_PAGE_SIZE
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fadeIn">

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start sm:items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
            Account & Settings
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-slate-400 mt-1.5 font-normal">
            Manage your personal profile, review authored posts, and monitor comment activity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-[#1f242d] hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-700 dark:text-slate-300 hover:text-neutral-950 dark:hover:text-white cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 shrink-0 shadow-2xs"
        >
          <LogoutIcon className="w-3.5 h-3.5 text-neutral-400 dark:text-slate-400" />
          <span>Log out</span>
        </button>
      </div>

      {/* ─── Tabs ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-neutral-200/70 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer shrink-0 whitespace-nowrap transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 ${
            activeTab === 'profile'
              ? 'bg-neutral-900 dark:bg-slate-200 text-white dark:text-slate-900 font-semibold shadow-2xs'
              : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-100 hover:bg-neutral-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Profile Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('posts')}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer shrink-0 whitespace-nowrap transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 ${
            activeTab === 'posts'
              ? 'bg-neutral-900 dark:bg-slate-200 text-white dark:text-slate-900 font-semibold shadow-2xs'
              : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-100 hover:bg-neutral-100 dark:hover:bg-slate-800'
          }`}
        >
          <DocumentIcon className="w-3.5 h-3.5" />
          <span>My Articles ({userPosts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comments')}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer shrink-0 whitespace-nowrap transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 ${
            activeTab === 'comments'
              ? 'bg-neutral-900 dark:bg-slate-200 text-white dark:text-slate-900 font-semibold shadow-2xs'
              : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-100 hover:bg-neutral-100 dark:hover:bg-slate-800'
          }`}
        >
          <ChatIcon className="w-3.5 h-3.5" />
          <span>My Comments ({userComments.length})</span>
        </button>
      </div>

      {/* ─── Profile Tab ────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn shadow-2xs">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Username successfully updated.</span>
            </div>
          )}

          {saveError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 animate-fadeIn shadow-2xs">
              <AlertCircleIcon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="p-6 rounded-2xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700/80 shadow-2xs space-y-6">
            {/* Identity badge */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-neutral-900 dark:bg-slate-700 text-white dark:text-slate-100 flex items-center justify-center font-bold text-xl uppercase border border-neutral-300 dark:border-slate-600 shadow-2xs">
                {(user?.username || 'U').charAt(0)}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-neutral-950 dark:text-slate-100">
                    @{user?.username}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 border border-neutral-200 dark:border-slate-700">
                    Member
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-slate-400">
                  Joined {user?.date_joined ? new Date(user.date_joined).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'recently'}
                </p>
              </div>
            </div>

            <div className="h-px bg-neutral-100 dark:bg-slate-800" />

            {/* Edit Username Form */}
            <form onSubmit={handleUpdateUsername} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="profile-username"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-slate-400"
                >
                  Change Username
                </label>
                <div className="flex gap-2">
                  <input
                    id="profile-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="New username"
                    maxLength={30}
                    disabled={isSaving}
                    className="flex-1 px-3.5 py-2 rounded-lg text-sm bg-neutral-50/50 dark:bg-[#1a1f27] border border-neutral-200 dark:border-slate-700 text-neutral-900 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10 focus:border-neutral-900 dark:focus:border-slate-400 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isSaving || username.trim() === user?.username}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs shrink-0"
                  >
                    {isSaving ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <CheckIcon className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 dark:text-slate-400">
                  Usernames must be unique and contain at least 3 characters.
                </p>
              </div>
            </form>

            <div className="h-px bg-neutral-100 dark:bg-slate-800" />

            {/* Email Address (Private display only) */}
            <div className="space-y-1">
              <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-slate-400">
                Registered Email
              </span>
              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-[#1a1f27] border border-neutral-200/80 dark:border-slate-800 text-xs">
                <span className="font-mono text-neutral-800 dark:text-slate-200">{user?.email}</span>
                <span className="text-[10px] text-neutral-400 dark:text-slate-400 font-medium">
                  Private (Never exposed)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── My Articles Tab ────────────────────────────────────────── */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {isActivityLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-neutral-100 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          ) : userPosts.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-slate-800 bg-neutral-50/50 dark:bg-[#1f242d]/40 space-y-2">
              <p className="text-xs text-neutral-500 dark:text-slate-400">You haven&apos;t written any posts yet.</p>
              <Link
                to="/create"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-slate-200 hover:underline cursor-pointer"
              >
                <WriteIcon className="w-3.5 h-3.5" />
                <span>Draft your first article &rarr;</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="divide-y divide-neutral-200/70 dark:divide-slate-800">
                {paginatedUserPosts.map((post) => (
                  <article key={post.id} className="py-4 space-y-1.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/details/${post.id}`}
                        className="text-sm font-semibold text-neutral-900 dark:text-slate-100 hover:text-neutral-600 dark:hover:text-slate-300 transition-colors line-clamp-1 cursor-pointer"
                      >
                        {post.title}
                      </Link>
                      {post.is_anonymous && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-slate-800 text-neutral-500 dark:text-slate-400 border border-neutral-200 dark:border-slate-700 shrink-0">
                          Posted Anonymously
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-slate-400 line-clamp-1">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-400 dark:text-slate-400 pt-0.5">
                      <span>{formatTimeAgo(Math.max(0, Math.floor((now - new Date(post.created_at).getTime()) / 1000)))}</span>
                      <span>•</span>
                      <span>{post.likes_count || 0} likes</span>
                      <span>•</span>
                      <span>{post.comments_count || 0} comments</span>
                    </div>
                  </article>
                ))}
              </div>

              {/* Articles Pagination */}
              <Pagination
                currentPage={safePostsPage}
                totalPages={totalPostsPages}
                onPageChange={(p) => setPostsPage(p)}
                totalItems={userPosts.length}
                pageSize={POSTS_PAGE_SIZE}
                itemName="authored articles"
              />
            </div>
          )}
        </div>
      )}

      {/* ─── My Comments Tab ───────────────────────────────────────── */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          {isActivityLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-neutral-100 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          ) : userComments.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-slate-800 bg-neutral-50/50 dark:bg-[#1f242d]/40 space-y-2">
              <p className="text-xs text-neutral-500 dark:text-slate-400">You haven&apos;t commented on any posts yet.</p>
              <Link
                to="/"
                className="inline-flex text-xs font-semibold text-neutral-900 dark:text-slate-200 hover:underline cursor-pointer"
              >
                Browse community discussions &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="divide-y divide-neutral-200/70 dark:divide-slate-800">
                {paginatedUserComments.map((comment) => (
                  <div key={comment.id} className="py-3.5 space-y-1 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/details/${comment.post}`}
                        className="text-xs font-medium text-neutral-800 dark:text-slate-200 hover:underline line-clamp-1 cursor-pointer"
                      >
                        On post #{comment.post} &rarr;
                      </Link>
                      {comment.is_anonymous && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-slate-800 text-neutral-500 dark:text-slate-400 border border-neutral-200 dark:border-slate-700">
                          Anonymous
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-slate-300 leading-relaxed">
                      &ldquo;{comment.content}&rdquo;
                    </p>
                    <span className="text-[10px] text-neutral-400 dark:text-slate-400 block pt-0.5">
                      {formatTimeAgo(Math.max(0, Math.floor((now - new Date(comment.created_at).getTime()) / 1000)))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Comments Pagination */}
              <Pagination
                currentPage={safeCommentsPage}
                totalPages={totalCommentsPages}
                onPageChange={(p) => setCommentsPage(p)}
                totalItems={userComments.length}
                pageSize={COMMENTS_PAGE_SIZE}
                itemName="comments"
              />
            </div>
          )}
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out"
        message="Are you sure you want to log out of your BlogSpace account on this device?"
        confirmLabel="Sign Out"
        isDestructive={false}
        isPending={isLogoutPending}
      />
    </div>
  );
}


function UserIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function DocumentIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function ChatIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.502 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v5.269Z" />
    </svg>
  );
}

function LogoutIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  );
}

function AlertCircleIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  );
}

function CheckCircleIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function CheckIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function WriteIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}
