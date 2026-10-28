import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsPending(true);
    try {
      await login({ email: trimmedEmail, password });
      navigate(from, { replace: true });
    } catch (err) {
      const serverDetail =
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.detail ||
        (typeof err?.response?.data === 'string' ? err.response.data : null) ||
        'Invalid email or password. Please try again.';
      setErrorMessage(serverDetail);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto py-10 sm:py-16 space-y-6 animate-fadeIn">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-slate-400">
          Enter your registered email and password to access your account.
        </p>
      </div>

      {/* ─── Error Notification ─────────────────────────────────────── */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 text-xs leading-relaxed flex items-start gap-2 animate-fadeIn shadow-2xs">
          <AlertCircleIcon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ─── Form ───────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} noValidate className="p-6 rounded-2xl bg-white dark:bg-[#1f242d] border border-neutral-200/90 dark:border-slate-700/80 shadow-2xs space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-slate-400"
          >
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            disabled={isPending}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-neutral-50/50 dark:bg-[#1a1f27] border border-neutral-200 dark:border-slate-700 text-neutral-900 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10 focus:border-neutral-900 dark:focus:border-slate-400 transition-all disabled:opacity-50"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
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
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isPending}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-neutral-50/50 dark:bg-[#1a1f27] border border-neutral-200 dark:border-slate-700 text-neutral-900 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10 focus:border-neutral-900 dark:focus:border-slate-400 transition-all disabled:opacity-50"
          />
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
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <SignInIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ─── Footer Link ────────────────────────────────────────────── */}
      <p className="text-center text-xs text-neutral-500 dark:text-slate-400">
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-neutral-900 dark:text-slate-200 hover:underline cursor-pointer"
        >
          Create one now &rarr;
        </Link>
      </p>
    </div>
  );
}

function SignInIcon(props) {
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

function SpinnerIcon(props) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
