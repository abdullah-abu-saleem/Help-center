/**
 * Resources API — Supabase queries for hc_videos table.
 *
 * Public reads use supabasePublic (no session, no token refresh).
 */

import { supabasePublic } from './supabase';

// ─── Types ────────────────────────────────────────────────────

export interface HcVideo {
  id: number;
  section: string;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  youtube_url: string;
  sort_order: number;
  is_published: boolean;
  audience: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Return the localised value of a field.
 * If lang is 'ar' and the Arabic column exists → use it;
 * otherwise fall back to the English value.
 */
export function getLocalizedText(
  item: HcVideo,
  field: 'title' | 'description',
  lang: 'en' | 'ar',
): string {
  if (lang === 'ar') {
    const arValue = item[`${field}_ar` as keyof HcVideo] as string | null | undefined;
    if (arValue) return arValue;
  }
  return (item[field] as string) || '';
}

// ─── Public Reads ─────────────────────────────────────────────

/**
 * Fetch published resource videos for a given audience.
 *
 * The `section` column in hc_videos stores 'teacher' or 'student'.
 */
export async function getResourceVideos(
  audience: 'teacher' | 'student',
): Promise<HcVideo[]> {
  console.log('[Resources] getResourceVideos — audience:', audience);

  const { data, error } = await supabasePublic
    .from('hc_videos')
    .select('id, section, title, title_ar, description, description_ar, youtube_url, sort_order, is_published, audience, order_index')
    .eq('section', audience)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[Resources] videos error:', error.message, '| code:', error.code, '| details:', error.details, '| hint:', error.hint);
    const err = new Error(error.message);
    (err as any).code = error.code;
    (err as any).details = error.details;
    (err as any).hint = error.hint;
    throw err;
  }

  console.log('[Resources] videos loaded — count:', data?.length ?? 0);
  return data ?? [];
}
