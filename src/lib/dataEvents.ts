import { useEffect, useRef } from 'react';

/**
 * Lightweight event bus for data invalidation — works across tabs.
 *
 * When admin CRUD succeeds → call emitDataChange('tutorials').
 * Public pages → useDataRefresh(['tutorials'], refetchFn) to auto-refetch.
 *
 * Uses BroadcastChannel so an admin save in one tab triggers a re-fetch
 * in the public-site tab automatically (no stale data).
 */

export type DataTable =
  | 'hc_categories'
  | 'hc_sections'
  | 'hc_articles'
  | 'tutorials'
  | 'blog_posts';

const EVENT_NAME = 'hc-data-change';
const CHANNEL_NAME = 'hc-data-sync';

// ─── BroadcastChannel (cross-tab) ────────────────────────────

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    // When another tab emits a change, dispatch it locally
    channel.onmessage = (e: MessageEvent) => {
      const table = e.data?.table as DataTable | undefined;
      if (table) {
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { table } }));
      }
    };
  }
  return channel;
}

// Eagerly initialise so the listener is registered on module load
try { getChannel(); } catch { /* SSR / unsupported */ }

// ─── Public API ──────────────────────────────────────────────

/** Fire after any successful admin CRUD operation. */
export function emitDataChange(table: DataTable) {
  // Same-tab listeners
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { table } }));
  // Cross-tab listeners
  try { getChannel()?.postMessage({ table }); } catch { /* closed */ }
}

/**
 * Hook: re-run `onRefresh` whenever one of the listed tables changes.
 * Uses a stable ref so the callback doesn't need to be memoized.
 */
export function useDataRefresh(
  tables: DataTable[],
  onRefresh: () => void,
) {
  const cbRef = useRef(onRefresh);
  cbRef.current = onRefresh;

  useEffect(() => {
    const handler = (e: Event) => {
      const table = (e as CustomEvent).detail?.table as DataTable;
      if (tables.includes(table)) cbRef.current();
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join(',')]);
}
