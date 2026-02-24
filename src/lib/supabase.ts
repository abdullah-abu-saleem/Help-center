import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Normalize: strip trailing slashes to prevent double-slash in endpoint URLs
const supabaseUrl = rawUrl?.replace(/\/+$/, '');

// ── Validate environment variables ──────────────────────────────────────────

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.\n' +
    'Then restart the dev server (Vite only reads .env on startup).',
  );
}

if (
  supabaseUrl.includes('your-project-id') ||
  supabaseKey.includes('your-anon-key')
) {
  throw new Error(
    'Supabase credentials are still set to placeholder values.\n' +
    'Replace them in .env with your real project URL and publishable key from:\n' +
    'https://supabase.com/dashboard → Project Settings → API',
  );
}

if (!supabaseUrl.startsWith('https://')) {
  throw new Error(
    `VITE_SUPABASE_URL must start with https://. Got: "${supabaseUrl}"`,
  );
}

// ── DEV-only: log connection info (never log full key) ──────────────────────

if (import.meta.env.DEV) {
  try {
    const host = new URL(supabaseUrl).host;
    console.log(`[Supabase] Project : ${host}`);
    console.log(`[Supabase] Key     : ${supabaseKey.substring(0, 12)}… (${supabaseKey.length} chars)`);
  } catch {
    console.warn('[Supabase] ⚠ Could not parse VITE_SUPABASE_URL');
  }
}

// ── Clear stale Supabase auth keys ──────────────────────────────────────────
// Old sb-* keys from previous sessions cause LockManager conflicts.
// Runs ONCE per tab session (guarded by sessionStorage flag).

const STORAGE_KEY = 'string-supabase-auth';
const OLD_STORAGE_KEY = 'string-auth';
const CLEANUP_FLAG = 'string-sb-cleaned';

function clearStaleSupabaseKeys() {
  try {
    if (sessionStorage.getItem(CLEANUP_FLAG)) return; // already cleaned this tab session
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) {
        keysToRemove.push(key);
      }
    }
    // Also clear orphaned session from old storageKey
    if (localStorage.getItem(OLD_STORAGE_KEY)) {
      keysToRemove.push(OLD_STORAGE_KEY);
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
      if (import.meta.env.DEV) console.log('[Supabase] Cleared stale key:', key);
    }
    sessionStorage.setItem(CLEANUP_FLAG, '1');
  } catch {
    // localStorage/sessionStorage unavailable (SSR / privacy mode)
  }
}

clearStaleSupabaseKeys();

// ── Singleton guard (prevents HMR duplicate clients in Vite) ────────────────
// Use globalThis so it survives Vite HMR module re-execution.

const GLOBAL_KEY = '__string_supabase' as const;

function getOrCreateClient(): SupabaseClient {
  const existing = (globalThis as any)[GLOBAL_KEY] as SupabaseClient | undefined;
  if (existing) {
    if (import.meta.env.DEV) console.log('[Supabase] Reusing singleton (HMR)');
    return existing;
  }

  const client = createClient(supabaseUrl!, supabaseKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: STORAGE_KEY,
    },
  });

  (globalThis as any)[GLOBAL_KEY] = client;
  if (import.meta.env.DEV) console.log('[Supabase] Created new client singleton');
  return client;
}

export const supabase = getOrCreateClient();

// ── Connection health check (used by login pages) ──────────────────────────

export type ConnCheckStatus =
  | 'connected'
  | 'timeout'
  | 'cors'
  | 'network'
  | 'key_rejected'
  | 'server_error'
  | 'offline';

export interface ConnCheckResult {
  ok: boolean;
  error?: string;
  hint?: string;
  status: ConnCheckStatus;
}

/**
 * Pings Supabase `/auth/v1/settings` to verify reachability + API key.
 *
 * Uses raw fetch (not the supabase client) so it never triggers session
 * hydration or Navigator LockManager operations.
 *
 * - 10-second timeout (fast-fail for quick diagnostics).
 * - Distinguishes CORS from DNS/network via a no-cors fallback.
 * - Returns a `status` field for programmatic classification.
 */
export async function testSupabaseConnection(): Promise<ConnCheckResult> {
  // Quick offline check
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      ok: false,
      status: 'offline',
      error: 'You appear to be offline.',
      hint: 'Check your internet connection and try again.',
    };
  }

  if (import.meta.env.DEV) {
    console.log('[Supabase] Health check → ' + supabaseUrl + '/auth/v1/settings');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseKey! },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        status: 'key_rejected',
        error: `Supabase API key rejected (HTTP ${res.status}).`,
        hint:
          'VITE_SUPABASE_ANON_KEY may be incorrect. ' +
          'Copy the anon/public key from Supabase Dashboard → Settings → API.',
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: 'server_error',
        error: `Supabase returned HTTP ${res.status}.`,
        hint: 'The project may be paused or waking up. Open Supabase Dashboard to confirm it is active.',
      };
    }

    if (import.meta.env.DEV) {
      console.log('[Supabase] Health check passed');
    }

    return { ok: true, status: 'connected' };
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      return {
        ok: false,
        status: 'timeout',
        error: 'Supabase connection timed out (10s).',
        hint:
          'The project may be sleeping (free tier). Open your Supabase Dashboard to wake it up, ' +
          'wait ~30 seconds, then try again.',
      };
    }

    // TypeError + "fetch" = DNS / network / CORS failure
    if (err instanceof TypeError && /fetch/i.test(err.message)) {
      // Attempt a no-cors fetch to distinguish CORS from DNS/network
      try {
        const c2 = new AbortController();
        const t2 = setTimeout(() => c2.abort(), 4_000);
        await fetch(supabaseUrl!, { mode: 'no-cors', signal: c2.signal });
        clearTimeout(t2);
        // If we reach here: server responded (opaque) but CORS blocks the real request
        return {
          ok: false,
          status: 'cors',
          error: 'CORS blocked the request to Supabase.',
          hint:
            'Verify the project URL and check Allowed Origins in ' +
            'Supabase Dashboard → Authentication → URL Configuration.',
        };
      } catch {
        // Both normal and no-cors failed — truly unreachable
        return {
          ok: false,
          status: 'network',
          error: 'Cannot reach the Supabase server.',
          hint:
            'Check your internet connection, VPN, firewall, or ad-blocker. ' +
            'Also verify VITE_SUPABASE_URL in .env is correct.',
        };
      }
    }

    return {
      ok: false,
      status: 'network',
      error: err.message || 'Unknown connection error.',
    };
  }
}

// ── Safe session recovery ───────────────────────────────────────────────────

const RELOAD_FLAG = 'string-auth-recovery-reload';

/**
 * True if the error is specifically a Navigator LockManager conflict.
 * Previous version matched any error with "lock" or "navigator" — way too broad,
 * which caused false positives and unnecessary session wipes.
 */
export function isLockError(err: unknown): boolean {
  const msg = ((err as any)?.message || '').toLowerCase();
  return (
    msg.includes('navigator.locks') ||
    msg.includes('lockmanager') ||
    (msg.includes('lock') && (msg.includes('acquired') || msg.includes('request')))
  );
}

/**
 * Recover from a LockManager conflict by clearing stale keys and reloading.
 *
 * IMPORTANT: Does NOT clear the active session (STORAGE_KEY) on first attempt.
 * The lock error is about concurrent access, not a corrupted session.
 * Only clears the session on a second consecutive failure (RELOAD_FLAG guard).
 */
export function recoverFromLockError(): void {
  if (sessionStorage.getItem(RELOAD_FLAG)) {
    // Second failure — clear everything as last resort, then stop looping
    sessionStorage.removeItem(RELOAD_FLAG);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    try { localStorage.removeItem(OLD_STORAGE_KEY); } catch {}
    return;
  }
  console.error('[Supabase] LockManager error — clearing stale keys and reloading');
  sessionStorage.setItem(RELOAD_FLAG, '1');
  try { sessionStorage.removeItem(CLEANUP_FLAG); } catch {}
  // Only remove stale sb-* keys — keep the active session intact
  try { localStorage.removeItem(OLD_STORAGE_KEY); } catch {}
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) localStorage.removeItem(key);
    }
  } catch {}
  window.location.reload();
}

/**
 * Safe wrapper around getSession(). If a LockManager error occurs,
 * clears Supabase auth keys and reloads once to recover.
 */
export async function safeGetSession() {
  try {
    const result = await supabase.auth.getSession();
    try { sessionStorage.removeItem(RELOAD_FLAG); } catch {}
    return result;
  } catch (err: unknown) {
    if (isLockError(err)) recoverFromLockError();
    throw err;
  }
}
