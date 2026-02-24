import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase, testSupabaseConnection, isLockError, recoverFromLockError } from '../lib/supabase';
import { useAuth } from '../lib/auth';

// ── Sign-in helpers ───────────────────────────────────────────────────────

/** True for auth errors that should NOT trigger a retry (bad credentials, etc.). */
function isCredentialError(msg: string): boolean {
  const l = msg.toLowerCase();
  return (
    l.includes('invalid login credentials') ||
    l.includes('email not confirmed') ||
    l.includes('email rate limit') ||
    l.includes('user not found') ||
    l.includes('signup is disabled')
  );
}

export default function AdminCmsLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, isAdmin } = useAuth();

  // Redirect target: return to the page that sent us here, or /admin
  const redirectTo = (location.state as any)?.from?.pathname || '/admin';
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedEmail, setDeniedEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [envWarning, setEnvWarning] = useState('');
  const [connStatus, setConnStatus] = useState<'checking' | 'connected' | 'error' | ''>('');

  // ── Connection health check (fire-and-forget, no auth lock contention) ──
  const healthChecked = useRef(false);
  useEffect(() => {
    if (healthChecked.current) return;
    healthChecked.current = true;
    setConnStatus('checking');
    testSupabaseConnection().then((result) => {
      if (result.ok) {
        setConnStatus('connected');
      } else {
        setConnStatus('error');
        setEnvWarning([result.error, result.hint].filter(Boolean).join(' '));
        console.warn('[AdminLogin] Preflight:', result.status, result.error);
      }
    });
  }, []);

  // ── React to auth context — replaces all duplicate session checking ──
  // AuthProvider already handles getSession / getUser / refreshSession / profile.
  // We just read the result here — no concurrent LockManager contention.
  useEffect(() => {
    if (authLoading) return; // still hydrating — wait

    if (isAdmin) {
      navigate(redirectTo, { replace: true });
      return;
    }

    if (user && !isAdmin) {
      // Logged in but not admin
      setDeniedEmail(user.email || '');
      setAccessDenied(true);
      return;
    }

    // user is null, authLoading is false → no session → show login form
    // (accessDenied stays false, so the login form renders)
  }, [user, authLoading, isAdmin, navigate, redirectTo]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const friendlyAuthError = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes('invalid login credentials'))
      return 'Invalid email or password.';
    if (lower.includes('email not confirmed'))
      return 'Your email has not been confirmed. Check your inbox.';
    if (lower.includes('email rate limit'))
      return 'Too many attempts. Please wait a moment.';
    return msg;
  };

  const handleSignOut = async () => {
    try { await supabase.auth.signOut(); } catch {}
    setAccessDenied(false);
    setDeniedEmail('');
    setError('');
  };

  // ── Form submit ───────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMsg('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    // Log resolved config for diagnostics (safe — no secrets)
    console.log('[AdminLogin] Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('[AdminLogin] Anon key prefix:', (import.meta.env.VITE_SUPABASE_ANON_KEY || '').substring(0, 12) + '…');

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setError('Supabase environment variables are missing.\n\nSet VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file and restart the dev server.');
      setIsSubmitting(false);
      return;
    }

    try {
      // ── Step 1: Quick connectivity preflight ──
      setStatusMsg('Connecting to Supabase…');
      console.log('[AdminLogin] Running connectivity preflight…');

      const preflight = await testSupabaseConnection();

      if (!preflight.ok) {
        const detail = [preflight.error, preflight.hint].filter(Boolean).join('\n');
        console.error('[AdminLogin] Health check failed:', preflight.status, detail);
        setConnStatus('error');
        setError(detail);
        return; // early exit — no point trying to sign in
      }

      setConnStatus('connected');
      console.log('[AdminLogin] Preflight passed, calling signInWithPassword…');

      // ── Step 2: Authenticate (NO timeout wrapper — surface real errors) ──
      setStatusMsg('Authenticating…');

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      console.log('[AdminLogin] signInWithPassword result:', {
        hasSession: !!data.session,
        userId: data.user?.id ?? null,
        error: signInError?.message ?? null,
        status: (signInError as any)?.status ?? null,
      });

      if (signInError) {
        console.error('[AdminLogin] Sign-in error:', signInError.message);
        if (isCredentialError(signInError.message)) {
          setError(friendlyAuthError(signInError.message));
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (!data.user) {
        setError('Login failed — no user returned. Please try again.');
        return;
      }

      // ── Step 3: Verify session persisted ──
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Session was not persisted after login. Please try again.');
        return;
      }

      // ── Step 4: Check admin role ──
      setStatusMsg('Verifying admin role…');
      console.log('[AdminLogin] Session verified, fetching profile for:', data.user.id);

      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // Auto-create profile if missing (PGRST116 = no rows from .single())
      if (profileError?.code === 'PGRST116') {
        console.log('[AdminLogin] No profile found, creating default profile…');
        await supabase
          .from('profiles')
          .insert({ id: data.user.id, name: data.user.email?.split('@')[0] || '', role: 'student' });

        const refetch = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        profile = refetch.data;
        profileError = refetch.error;
      }

      console.log('[AdminLogin] Profile result:', {
        role: profile?.role ?? null,
        error: profileError?.message ?? null,
        code: profileError?.code ?? null,
      });

      if (profileError || !profile) {
        try { await supabase.auth.signOut(); } catch {}
        setError(`Could not verify your role: ${profileError?.message || 'profile not found'}`);
        return;
      }

      const role = (profile.role || '').toLowerCase().trim();
      if (role !== 'admin') {
        setDeniedEmail(data.user.email || '');
        setAccessDenied(true);
        return;
      }

      // ── Step 5: Admin verified → navigate ──
      setStatusMsg('Redirecting…');
      console.log('[AdminLogin] Admin verified → navigating to', redirectTo);
      navigate(redirectTo, { replace: true });

    } catch (err: unknown) {
      // ── LockManager error → clear state and reload once ──
      if (isLockError(err)) {
        console.error('[AdminLogin] LockManager conflict detected:', (err as Error).message);
        recoverFromLockError(); // clears keys & reloads (once)
        return;
      }
      // ── Any other unexpected error → show to user ──
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      console.error('[AdminLogin] Unexpected error:', msg);
      setError(msg);
    } finally {
      setStatusMsg('');
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // Loading state while AuthProvider is hydrating the session
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fafbfc' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse"
            style={{ background: 'linear-gradient(135deg, #ED3B91, #08B8FB)' }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <p className="text-sm text-slate-400">Checking session…</p>
        </div>
      </div>
    );
  }

  // Access denied — signed in but not admin
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: '#fafbfc' }}>
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/help" className="inline-flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #ED3B91, #08B8FB)',
                  boxShadow: '0 2px 8px rgba(237, 59, 145, 0.15)',
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
            <p className="text-sm text-slate-500 mb-1">
              Only admin accounts can access the CMS.
            </p>
            {deniedEmail && (
              <p className="text-xs text-slate-400 mb-6">
                Signed in as: {deniedEmail}
              </p>
            )}
            <button
              onClick={handleSignOut}
              className="w-full py-3 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Sign Out &amp; Try Another Account
            </button>
            <div className="mt-4">
              <Link to="/help" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                Back to Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: '#fafbfc' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8">
          <Link to="/help" className="inline-flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #ED3B91, #08B8FB)',
                boxShadow: '0 2px 8px rgba(237, 59, 145, 0.15)',
              }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">CMS Admin</h1>
            <p className="text-sm text-slate-500">Sign in with your admin account to manage the Help Center.</p>
          </div>

          {envWarning && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <div>
                  <p className="font-medium mb-0.5">Supabase Connection Issue</p>
                  <p>{envWarning}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 whitespace-pre-line">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input
                  type="email"
                  className="w-full pl-11 pr-4 py-3.5 text-sm rounded-xl border border-slate-200 bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-100 outline-none transition-all"
                  placeholder="admin@string.education"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-11 pr-12 py-3.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-100 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Connection status */}
            {connStatus && !isSubmitting && (
              <p className={`text-xs text-center mt-1 ${
                connStatus === 'connected' ? 'text-green-600' :
                connStatus === 'checking' ? 'text-slate-400' :
                'text-red-500'
              }`}>
                {connStatus === 'checking' && 'Checking connection…'}
                {connStatus === 'connected' && 'Connected to Supabase'}
                {connStatus === 'error' && 'Cannot reach server'}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #ff4da6 0%, #ED3B91 100%)' }}
            >
              {isSubmitting ? (statusMsg || 'Signing in…') : 'Sign In to CMS'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/help" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
              Back to Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
