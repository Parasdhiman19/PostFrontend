import { Outlet, Link, NavLink } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

/**
 * Computes compact initials for mobile navigation (e.g., "Paras Dhiman" -> "PD").
 */
function getUserInitials(user) {
  if (!user) return 'Sign In';

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  if (fullName) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }

  const username = user.username || '';
  if (!username) return 'Me';

  if (username.includes(' ')) {
    const parts = username.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
  }

  if (username.includes('_') || username.includes('-')) {
    const parts = username.split(/[-_]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
  }

  const upperLetters = username.match(/[A-Z]/g);
  if (upperLetters && upperLetters.length >= 2) {
    return (upperLetters[0] + upperLetters[1]).toUpperCase();
  }

  return username.slice(0, 2).toUpperCase();
}

export default function MainLayout() {
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();

  // Desktop Link Style: Grounded bottom underline with spring physics
  const desktopNavLinkStyle = ({ isActive }) =>
    `relative inline-flex items-center gap-1.5 text-xs tracking-tight px-3 py-2 font-medium select-none whitespace-nowrap cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 active:scale-y-80 active:translate-y-0.5 ${
      isActive
        ? "text-neutral-950 dark:text-slate-100 font-semibold after:absolute after:bottom-0 after:left-2.5 after:right-2.5 after:h-[2px] after:bg-neutral-950 dark:after:bg-slate-200 after:rounded-full"
        : "text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-slate-200"
    }`;

  // Mobile Bottom Tab Style: Clean typographic contrast with non-distorting spring physics
  const mobileTabStyle = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-2 px-0.5 sm:px-1 select-none cursor-pointer transition-all duration-150 active:scale-95 ${
      isActive
        ? "text-neutral-950 dark:text-slate-100 font-semibold"
        : "text-neutral-400 dark:text-slate-400 hover:text-neutral-700 dark:hover:text-slate-200 font-medium"
    }`;

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#161b22] text-neutral-900 dark:text-slate-200 font-sans antialiased selection:bg-neutral-900 selection:text-white dark:selection:bg-slate-200 dark:selection:text-slate-900 flex flex-col justify-between transition-colors duration-200">
      
      {/* ─── Sticky Header (Subtle Frosted Glass) ──────────────────── */}
      <header className="sticky top-0 z-40 bg-[#FAFAFA]/90 dark:bg-[#161b22]/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-15 flex items-center justify-between gap-3">

          
          {/* Left: Brandmark (Always visible on all pages) */}
          <div className="flex items-center shrink-0">
            <Link 
              to="/" 
              className="group flex items-center gap-2 cursor-pointer transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95"
            >
              <div className="w-6 h-6 rounded-md bg-neutral-900 dark:bg-slate-700 border border-transparent dark:border-slate-600 flex items-center justify-center text-white dark:text-slate-100 shrink-0 shadow-2xs">
                <LogoGlyph className="w-3.5 h-3.5" />
              </div>

              <div className="flex items-center leading-none">
                <span className="text-sm font-semibold tracking-tight text-neutral-950 dark:text-slate-100">
                  BlogSpace
                </span>
                <span className="text-xs font-serif italic text-neutral-400 dark:text-slate-400 ml-0.5">.</span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation Bar (Hidden on Mobile) */}
          <nav className="hidden md:flex items-center gap-1 py-1">
            <NavLink to="/" end className={desktopNavLinkStyle}>
              <FeedIcon className="w-3.5 h-3.5 opacity-80" />
              <span>Feed</span>
            </NavLink>

            <NavLink to="/saved" className={desktopNavLinkStyle}>
              <BookmarkIcon className="w-3.5 h-3.5 opacity-80" />
              <span>Saved</span>
            </NavLink>

            {user?.is_staff && (
              <NavLink to="/insight" className={desktopNavLinkStyle}>
                <ChartIcon className="w-3.5 h-3.5 opacity-80" />
                <span>Insights</span>
              </NavLink>
            )}


            <NavLink to="/cache" className={desktopNavLinkStyle}>
              <DatabaseIcon className="w-3.5 h-3.5 opacity-80" />
              <span>Cache</span>
            </NavLink>
          </nav>

          {/* Right: Theme Toggle & Auth / Write Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              className="p-1.5 sm:p-2 rounded-lg cursor-pointer text-neutral-500 hover:text-neutral-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-neutral-200/60 dark:hover:bg-slate-800 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-85"
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? (
                <SunIcon className="w-4 h-4 text-slate-300 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <MoonIcon className="w-4 h-4 text-neutral-600 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {isAuthenticated ? (
              <>
                {/* Settings / Profile Link */}
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg select-none cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 ${
                      isActive
                        ? "bg-neutral-100 dark:bg-slate-800 text-neutral-950 dark:text-slate-100 font-semibold border border-neutral-300 dark:border-slate-700"
                        : "text-neutral-600 dark:text-slate-300 hover:text-neutral-950 dark:hover:text-slate-100 hover:bg-neutral-100 dark:hover:bg-slate-800/60"
                    }`
                  }
                  title={`Signed in as @${user?.username}`}
                >
                  <UserNavIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">@{user?.username}</span>
                </NavLink>

                {/* Write Action Button */}
                <NavLink
                  to="/create"
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg select-none cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 active:scale-y-80 active:translate-y-0.5 shadow-2xs ${
                      isActive
                        ? "bg-neutral-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                        : "border border-neutral-300 dark:border-slate-700 bg-white dark:bg-[#1f242d] hover:bg-neutral-100 dark:hover:bg-[#282f3a] text-neutral-800 dark:text-slate-200"
                    }`
                  }
                >
                  <WriteIcon className="w-3.5 h-3.5" />
                  <span>Write</span>
                </NavLink>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-neutral-600 dark:text-slate-300 hover:text-neutral-950 dark:hover:text-slate-100 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 shadow-2xs cursor-pointer"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

        </div>

      </header>

      {/* ─── Main Content Canvas ──────────────────────────────────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 pb-24 md:pb-12">
        <Outlet />
      </main>

      {/* ─── Mobile Bottom Navigation Dock (Subtle Frosted Glass) ─── */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAFAFA]/90 dark:bg-[#161b22]/90 backdrop-blur-md border-t border-neutral-200/80 dark:border-slate-800 px-1.5 py-1 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          <NavLink to="/" end className={mobileTabStyle}>
            <FeedIcon className="w-4 h-4 shrink-0" />
            <span className="text-[10px] sm:text-[11px] tracking-tight whitespace-nowrap truncate w-full text-center">Feed</span>
          </NavLink>

          <NavLink to="/saved" className={mobileTabStyle}>
            <BookmarkIcon className="w-4 h-4 shrink-0" />
            <span className="text-[10px] sm:text-[11px] tracking-tight whitespace-nowrap truncate w-full text-center">Saved</span>
          </NavLink>

          {user?.is_staff && (
            <NavLink to="/insight" className={mobileTabStyle}>
              <ChartIcon className="w-4 h-4 shrink-0" />
              <span className="text-[10px] sm:text-[11px] tracking-tight whitespace-nowrap truncate w-full text-center">Insights</span>
            </NavLink>
          )}

          <NavLink to="/cache" className={mobileTabStyle}>
            <DatabaseIcon className="w-4 h-4 shrink-0" />
            <span className="text-[10px] sm:text-[11px] tracking-tight whitespace-nowrap truncate w-full text-center">Cache</span>
          </NavLink>

          <NavLink to={isAuthenticated ? "/settings" : "/login"} className={mobileTabStyle}>
            <UserNavIcon className="w-4 h-4 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight whitespace-nowrap truncate w-full text-center">
              {isAuthenticated ? getUserInitials(user) : "Sign In"}
            </span>
          </NavLink>
        </div>
      </nav>

      {/* ─── Desktop Only Footer (Hidden on Mobile) ───────────────── */}
      <footer className="hidden md:block border-t border-neutral-200/60 dark:border-slate-800/80 bg-[#FAFAFA] dark:bg-[#161b22] py-8 text-xs text-neutral-400 dark:text-slate-400 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} BlogSpace. Designed with restraint.</p>
          <div className="flex items-center gap-5">
            <Link to="/" className="cursor-pointer hover:text-neutral-800 dark:hover:text-slate-200 transition-colors">Feed</Link>
            <Link to="/saved" className="cursor-pointer hover:text-neutral-800 dark:hover:text-slate-200 transition-colors">Saved</Link>
            {user?.is_staff && (
              <Link to="/insight" className="cursor-pointer hover:text-neutral-800 dark:hover:text-slate-200 transition-colors">Insights</Link>
            )}
            <Link to="/cache" className="cursor-pointer hover:text-neutral-800 dark:hover:text-slate-200 transition-colors">Cache</Link>

            {isAuthenticated ? (
              <Link to="/settings" className="cursor-pointer hover:text-neutral-800 dark:hover:text-slate-200 transition-colors">Settings</Link>
            ) : (
              <Link to="/login" className="cursor-pointer hover:text-neutral-800 dark:hover:text-slate-200 transition-colors">Sign In</Link>
            )}
            <Link to="/create" className="cursor-pointer hover:text-neutral-800 dark:hover:text-slate-200 transition-colors">New Post</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ─── Inline SVGs ──────────────────────────────────────────────────────
function LogoGlyph(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function FeedIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    </svg>
  );
}

function BookmarkIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  );
}

function ChartIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function DatabaseIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
}

function SunIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}

function UserNavIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
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