/**
 * Supabase Retry & Health Utilities
 *
 * Handles cold-start resilience for free-tier Supabase projects that sleep
 * after inactivity. Provides:
 *  - warmUp()        – one-shot health ping that wakes the project
 *  - withRetry(fn)   – wraps any async call with timeout + exponential backoff
 */

import { supabasePublic } from './supabase';

// ── Config ──────────────────────────────────────────────────────────────────

const ATTEMPT_TIMEOUT_MS = 8_000;       // per-attempt timeout
const RETRY_DELAYS = [0, 1_000, 2_500]; // delay BEFORE each attempt (attempt 1, 2, 3)
const WARMUP_TIMEOUT_MS = 10_000;       // health-ping timeout

// ── Health ping / warm-up ───────────────────────────────────────────────────

let _warmUpPromise: Promise<WarmUpResult> | null = null;

export interface WarmUpResult {
  ok: boolean;
  ms: number;
  coldStart: boolean;  // took > 5 s
  error?: string;
}

/**
 * Sends a lightweight SELECT to wake the Supabase project.
 * Uses the Supabase JS client directly (headers are automatic).
 * Runs only once per page load (subsequent calls return the cached result).
 */
export function warmUp(): Promise<WarmUpResult> {
  if (_warmUpPromise) return _warmUpPromise;

  _warmUpPromise = (async (): Promise<WarmUpResult> => {
    const t0 = performance.now();
    const tag = '[Supabase warmUp]';
    const url = import.meta.env.VITE_SUPABASE_URL || '(not set)';
    const keyLen = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').length;

    if (import.meta.env.DEV) {
      console.log(`${tag} supabaseUrl = ${url}`);
      console.log(`${tag} anonKey length = ${keyLen} (valid: ${keyLen > 20})`);
      console.log(`${tag} navigator.onLine = ${navigator.onLine}`);
      console.log(`${tag} pinging: supabase.from('hc_categories').select('id').limit(1) …`);
    }

    try {
      // Run the query as a real Promise (async IIFE avoids thenable issues)
      // and race it against a timeout.
      const queryPromise = (async () => {
        return await supabasePublic.from('hc_categories').select('id').limit(1);
      })();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Warm-up timed out after ${WARMUP_TIMEOUT_MS}ms (navigator.onLine=${navigator.onLine})`)),
          WARMUP_TIMEOUT_MS,
        );
      });

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      const ms = Math.round(performance.now() - t0);
      const coldStart = ms > 5_000;

      if (error) {
        console.warn(`${tag} query error (${ms}ms):`, {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        return { ok: false, ms, coldStart, error: `${error.message} [code: ${error.code}]` };
      }

      if (import.meta.env.DEV) {
        console.log(`${tag} OK in ${ms}ms (rows: ${data?.length ?? 0})${coldStart ? ' ⚠ COLD START' : ''}`);
      }
      return { ok: true, ms, coldStart };
    } catch (err: any) {
      const ms = Math.round(performance.now() - t0);
      const errMsg = classifyError(err);
      console.error(`${tag} FAILED (${ms}ms):`, errMsg);
      // Log the raw error object for maximum visibility
      console.error(`${tag} raw error:`, err);
      return { ok: false, ms, coldStart: false, error: errMsg };
    }
  })();

  return _warmUpPromise;
}

// ── withRetry ───────────────────────────────────────────────────────────────

/**
 * Wraps an async function with per-attempt timeout and exponential backoff.
 *
 * Usage:
 *   const cat = await withRetry(() => getHcCategoryBySlug(slug));
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label = 'query',
): Promise<T> {
  const maxAttempts = RETRY_DELAYS.length;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const delay = RETRY_DELAYS[attempt];
    if (delay > 0) {
      if (import.meta.env.DEV) console.log(`[withRetry:${label}] waiting ${delay}ms before attempt ${attempt + 1}…`);
      await sleep(delay);
    }

    try {
      if (import.meta.env.DEV) console.log(`[withRetry:${label}] attempt ${attempt + 1}/${maxAttempts}`);
      const result = await withTimeout(fn(), ATTEMPT_TIMEOUT_MS);
      return result;
    } catch (err: any) {
      const errMsg = classifyError(err);
      const isLast = attempt === maxAttempts - 1;

      if (import.meta.env.DEV) {
        console.warn(`[withRetry:${label}] attempt ${attempt + 1} failed: ${errMsg}`);
      }

      if (isLast) {
        // Attach diagnostic context to the final error
        const finalErr = new Error(
          `${label} failed after ${maxAttempts} attempts: ${errMsg}`,
        );
        (finalErr as any).cause = err;
        throw finalErr;
      }
    }
  }

  // Unreachable, but TypeScript needs it
  throw new Error(`${label}: exhausted retries`);
}

// ── Internals ───────────────────────────────────────────────────────────────

/** Race a promise against a timeout. Rejects with a clear message on timeout. */
function withTimeout<T>(promise: Promise<T> | PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`Timed out after ${ms}ms (navigator.onLine=${navigator.onLine})`));
      }
    }, ms);

    Promise.resolve(promise).then(
      (val) => { if (!settled) { settled = true; clearTimeout(timer); resolve(val); } },
      (err) => { if (!settled) { settled = true; clearTimeout(timer); reject(err); } },
    );
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Classify an error for human-readable diagnostics. */
function classifyError(err: any): string {
  if (!err) return 'Unknown error';
  const msg: string = err.message || String(err);

  // Network / CORS
  if (err instanceof TypeError && /fetch|network|cors/i.test(msg)) {
    return `Network error (TypeError): ${msg}. navigator.onLine=${navigator.onLine}`;
  }
  // AbortError (our timeout)
  if (err.name === 'AbortError' || /abort/i.test(msg)) {
    return `Request aborted: ${msg}`;
  }
  // Timeout (our wrapper)
  if (/timed out/i.test(msg)) {
    return msg;
  }
  return msg;
}
