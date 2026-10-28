import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    const clientErrors = {};
    if (!trimmedUsername) {
      clientErrors.username = 'Please enter a username.';
    } else if (trimmedUsername.length < 3) {
      clientErrors.username = 'Username must be at least 3 characters.';
    }

    if (!trimmedEmail) {
      clientErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      clientErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      clientErrors.password = 'Please enter a password.';
    } else if (password.length < 8) {
      clientErrors.password = 'Password must be at least 8 characters.';
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setIsPending(true);
    try {
      await register({ username: trimmedUsername, email: trimmedEmail, password });
      navigate('/', { replace: true });
    } catch (err) {
      if (err?.response?.data && typeof err.response.data === 'object') {
        const serverErrors = {};
        for (const [key, val] of Object.entries(err.response.data)) {
          serverErrors[key] = Array.isArray(val) ? val.join(' ') : String(val);
        }
        setErrors(serverErrors);
      } else {
        setErrors({ general: 'Registration failed. Please check your network and try again.' });
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto py-10 sm:py-16 space-y-6 animate-fadeIn">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
          Create an account
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-slate-400">
          Join BlogSpace to publish, participate in discussions, and react.
        </p>
      </div>

      {/* ─── General Error Notification ─────────────────────────────── */}
      {errors.general && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 text-xs leading-relaxed flex items-start gap-2 animate-fadeIn shadow-2xs">
          <AlertCircleIcon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* ─── Form ───────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} noValidate className="p-6 rounded-2xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700/80 shadow-2xs space-y-4">
        {/* Username Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-username"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-slate-400"
          >
            Username
          </label>
          <input
            id="reg-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. alexrivera"
            autoComplete="username"
            autoFocus
            disabled={isPending}
            className={`w-full px-3.5 py-2.5 rounded-lg text-sm bg-neutral-50/50 dark:bg-[#1a1f27] border text-neutral-900 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
              errors.username
                ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-neutral-200 dark:border-slate-700 focus:border-neutral-900 dark:focus:border-slate-400 focus:ring-neutral-900/10 dark:focus:ring-white/10'
            }`}
          />
          {errors.username && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{errors.username}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-email"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-slate-400"
          >
            Email Address
          </label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isPending}
            className={`w-full px-3.5 py-2.5 rounded-lg text-sm bg-neutral-50/50 dark:bg-[#1a1f27] border text-neutral-900 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
              errors.email
                ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-neutral-200 dark:border-slate-700 focus:border-neutral-900 dark:focus:border-slate-400 focus:ring-neutral-900/10 dark:focus:ring-white/10'
            }`}
          />
          {errors.email && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="reg-password"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-slate-400"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            autoComplete="new-password"
            disabled={isPending}
            className={`w-full px-3.5 py-2.5 rounded-lg text-sm bg-neutral-50/50 dark:bg-[#1a1f27] border text-neutral-900 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
              errors.password
                ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-neutral-200 dark:border-slate-700 focus:border-neutral-900 dark:focus:border-slate-400 focus:ring-neutral-900/10 dark:focus:ring-white/10'
            }`}
          />
          {errors.password && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{errors.password}</p>
          )}
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 disabled:opacity-50 shadow-2xs"
          >
            {isPending ? (
              <>
                <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <UserPlusIcon className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ─── Footer Link ────────────────────────────────────────────── */}
      <p className="text-center text-xs text-neutral-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-neutral-900 dark:text-slate-200 hover:underline cursor-pointer"
        >
          Sign in instead &rarr;
        </Link>
      </p>
    </div>
  );
}

function UserPlusIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.765Z" />
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

function SpinnerIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
