/**
 * Help Center CMS — Supabase API Layer
 *
 * 3-level hierarchy: hc_categories → hc_sections → hc_articles
 *
 * Public reads use the anon key (RLS allows SELECT on active/published rows).
 * Admin writes require an authenticated admin user session (RLS enforced).
 */

import { supabase, supabasePublic, safeGetSession } from './supabase';
import { emitDataChange } from './dataEvents';

/**
 * Returns true when an error message indicates the session has expired
 * or is invalid. Admin pages should redirect to /admin/login when this is true.
 */
export function isSessionError(err: unknown): boolean {
  const msg = ((err as any)?.message || '').toLowerCase();
  return msg.includes('session') || msg.includes('sign in') || msg.includes('jwt');
}

/**
 * Race a promise against a timeout — rejects with a labelled error if the
 * operation hangs (prevents "Loading…" spinners that never resolve).
 */
function raceTimeout<T>(
  p: Promise<T> | PromiseLike<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let done = false;
    const t = setTimeout(() => {
      if (!done) {
        done = true;
        reject(new Error(`${label}: timed out after ${ms}ms`));
      }
    }, ms);
    Promise.resolve(p).then(
      (v) => { if (!done) { done = true; clearTimeout(t); resolve(v); } },
      (e) => { if (!done) { done = true; clearTimeout(t); reject(e); } },
    );
  });
}

// ─── Types ────────────────────────────────────────────────────

export interface HcCategory {
  id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  description: string;
  description_ar: string | null;
  icon: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface HcSection {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  description: string;
  description_ar: string | null;
  icon: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface HcArticle {
  id: string;
  category_id: string;
  section_id: string;
  slug: string;
  title: string;
  title_ar: string | null;
  excerpt: string;
  excerpt_ar: string | null;
  content: string;
  content_ar: string | null;
  summary: string;
  summary_ar: string | null;
  body_markdown: string;
  body_markdown_ar: string | null;
  sort_order: number;
  is_published: boolean;
  tags: string[];
  role: string | null;
  is_top: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface HcGroup {
  id: string;
  section_id: string;
  title: string;
  title_ar: string | null;
  description: string;
  description_ar: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HcResourceVideo {
  id: string;
  section: 'teacher' | 'student';
  title: string;
  title_ar: string | null;
  description: string;
  description_ar: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  playlist_title: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// Joined types for queries that need parent info

export interface HcSectionWithCategory extends HcSection {
  hc_categories: Pick<HcCategory, 'slug' | 'title' | 'title_ar'> | null;
}

export interface HcArticleWithSection extends HcArticle {
  hc_sections: (Pick<HcSection, 'slug' | 'title' | 'title_ar'> & {
    hc_categories: Pick<HcCategory, 'slug' | 'title' | 'title_ar'> | null;
  }) | null;
}

// ─── Public Reads ─────────────────────────────────────────────

/** Fetch all active categories (public). */
export async function getHcCategories(): Promise<HcCategory[]> {
  console.log('[helpCenterApi] getHcCategories…');
  const { data, error } = await supabasePublic
    .from('hc_categories')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error) { console.error('[helpCenterApi] getHcCategories error:', error); throw error; }
  console.log('[helpCenterApi] getHcCategories returned', data?.length, 'rows');
  return data || [];
}

/** Fetch a single category by slug (public, must be active). */
export async function getHcCategoryBySlug(slug: string): Promise<HcCategory | null> {
  console.log('[helpCenterApi] getHcCategoryBySlug:', slug);
  const { data, error } = await supabasePublic
    .from('hc_categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error && error.code !== 'PGRST116') { console.error('[helpCenterApi] getHcCategoryBySlug error:', error); throw error; }
  console.log('[helpCenterApi] getHcCategoryBySlug result:', data ? data.slug : 'null');
  return data || null;
}

/** Fetch active sections for a given category (public). */
export async function getHcSectionsByCategory(categoryId: string): Promise<HcSection[]> {
  console.log('[helpCenterApi] getHcSectionsByCategory:', categoryId);
  const { data, error } = await supabasePublic
    .from('hc_sections')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error) { console.error('[helpCenterApi] getHcSectionsByCategory error:', error); throw error; }
  console.log('[helpCenterApi] getHcSectionsByCategory returned', data?.length, 'rows');
  return data || [];
}

/** Fetch a single section by slug within a category (public, must be active). */
export async function getHcSectionBySlug(
  categoryId: string,
  sectionSlug: string,
): Promise<HcSectionWithCategory | null> {
  const { data, error } = await supabasePublic
    .from('hc_sections')
    .select('*, hc_categories(slug, title, title_ar)')
    .eq('category_id', categoryId)
    .eq('slug', sectionSlug)
    .eq('is_published', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return (data as HcSectionWithCategory) || null;
}

/** Fetch published articles for a given section (public). */
export async function getHcArticlesBySection(sectionId: string): Promise<HcArticle[]> {
  console.log('[helpCenterApi] getHcArticlesBySection — sectionId:', sectionId);
  const { data, error } = await supabasePublic
    .from('hc_articles')
    .select('*')
    .eq('section_id', sectionId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });

  if (error) { console.error('[helpCenterApi] getHcArticlesBySection error:', error); throw error; }
  console.log('[helpCenterApi] getHcArticlesBySection returned', data?.length, 'rows');
  return data || [];
}

/** Fetch published articles by section slug (public).
 *  Resolves the section from its slug first, then fetches articles. */
export async function getHcArticlesBySectionSlug(sectionSlug: string): Promise<HcArticle[]> {
  console.log('[helpCenterApi] getHcArticlesBySectionSlug — slug:', sectionSlug);

  // 1. Resolve section id from slug
  const { data: sec, error: secErr } = await supabasePublic
    .from('hc_sections')
    .select('id')
    .eq('slug', sectionSlug)
    .eq('is_published', true)
    .single();

  if (secErr && secErr.code !== 'PGRST116') {
    console.error('[helpCenterApi] getHcArticlesBySectionSlug section lookup error:', secErr);
    throw secErr;
  }
  if (!sec) {
    console.warn('[helpCenterApi] getHcArticlesBySectionSlug — section not found for slug:', sectionSlug);
    return [];
  }

  // 2. Fetch articles for that section
  const { data, error } = await supabasePublic
    .from('hc_articles')
    .select('*')
    .eq('section_id', sec.id)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });

  if (error) { console.error('[helpCenterApi] getHcArticlesBySectionSlug error:', error); throw error; }
  console.log('[helpCenterApi] getHcArticlesBySectionSlug returned', data?.length, 'rows');
  return data || [];
}

/** Fetch a single published article by slug with full lineage (public). */
export async function getHcArticleBySlug(slug: string): Promise<HcArticleWithSection | null> {
  const { data, error } = await supabasePublic
    .from('hc_articles')
    .select('*, hc_sections(slug, title, title_ar, hc_categories(slug, title, title_ar))')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return (data as HcArticleWithSection) || null;
}

/** Fetch groups for a given section (public).
 *  Safe: returns [] if hc_groups table is missing or inaccessible. */
export async function getHcGroupsBySection(sectionId: string): Promise<HcGroup[]> {
  try {
    const { data, error } = await supabasePublic
      .from('hc_groups')
      .select('*')
      .eq('section_id', sectionId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('[helpCenterApi] getHcGroupsBySection error (non-fatal):', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('[helpCenterApi] getHcGroupsBySection failed (non-fatal):', err);
    return [];
  }
}

/** Fetch published articles for a given group (public). */
export async function getHcArticlesByGroup(groupId: string): Promise<HcArticle[]> {
  const { data, error } = await supabasePublic
    .from('hc_articles')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/** Fetch a single article by slug (public, must be published). Returns full lineage. */
export async function getHcArticleBySlugFull(slug: string): Promise<(HcArticle & {
  hc_sections: (Pick<HcSection, 'id' | 'slug' | 'title' | 'title_ar' | 'category_id'> & {
    hc_categories: Pick<HcCategory, 'id' | 'slug' | 'title' | 'title_ar'> | null;
  }) | null;
}) | null> {
  const { data, error } = await supabasePublic
    .from('hc_articles')
    .select('*, hc_sections(id, slug, title, title_ar, category_id, hc_categories(id, slug, title, title_ar))')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/** Fetch featured articles for a category (public). */
export async function getHcFeaturedArticlesByCategory(categoryId: string): Promise<HcArticle[]> {
  console.log('[helpCenterApi] getHcFeaturedArticlesByCategory:', categoryId);
  // Get all section IDs for this category first
  const { data: sections, error: secErr } = await supabasePublic
    .from('hc_sections')
    .select('id')
    .eq('category_id', categoryId)
    .eq('is_published', true);

  if (secErr) { console.error('[helpCenterApi] featured sections error:', secErr); throw secErr; }
  if (!sections || sections.length === 0) { console.log('[helpCenterApi] no sections for featured — returning []'); return []; }

  const sectionIds = sections.map(s => s.id);
  const { data, error } = await supabasePublic
    .from('hc_articles')
    .select('*')
    .in('section_id', sectionIds)
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('sort_order', { ascending: true });

  if (error) { console.error('[helpCenterApi] featured articles error:', error); throw error; }
  console.log('[helpCenterApi] featured articles returned', data?.length, 'rows');
  return data || [];
}

/** Count published articles for a category (public). */
export async function getHcArticleCountByCategory(categoryId: string): Promise<number> {
  const { data: sections, error: secErr } = await supabasePublic
    .from('hc_sections')
    .select('id')
    .eq('category_id', categoryId)
    .eq('is_published', true);

  if (secErr) throw secErr;
  if (!sections || sections.length === 0) return 0;

  const sectionIds = sections.map(s => s.id);
  const { count, error } = await supabasePublic
    .from('hc_articles')
    .select('*', { count: 'exact', head: true })
    .in('section_id', sectionIds)
    .eq('is_published', true);

  if (error) throw error;
  return count || 0;
}

/** Count published articles for a section (public). */
export async function getHcArticleCountBySection(sectionId: string): Promise<number> {
  const { count, error } = await supabasePublic
    .from('hc_articles')
    .select('*', { count: 'exact', head: true })
    .eq('section_id', sectionId)
    .eq('is_published', true);

  if (error) throw error;
  return count || 0;
}

/** Search published articles by query (public).
 *  Safe fallback: if body_markdown column is missing, retries with title+summary only. */
export async function searchHcArticles(query: string): Promise<HcArticle[]> {
  if (!query.trim()) return [];

  // Use ilike for simple text search across title, summary, body, tags
  const q = `%${query.trim()}%`;
  const { data, error } = await supabasePublic
    .from('hc_articles')
    .select('*')
    .eq('is_published', true)
    .or(`title.ilike.${q},summary.ilike.${q},body_markdown.ilike.${q}`)
    .order('sort_order', { ascending: true })
    .limit(50);

  if (error) {
    // 42703 = undefined_column — body_markdown missing; retry with title+summary only
    if (error.code === '42703') {
      console.warn('[helpCenterApi] search fallback — column missing, retrying without body_markdown');
      const { data: fallback, error: fbErr } = await supabasePublic
        .from('hc_articles')
        .select('*')
        .eq('is_published', true)
        .or(`title.ilike.${q},summary.ilike.${q}`)
        .order('sort_order', { ascending: true })
        .limit(50);
      if (fbErr) throw fbErr;
      return fallback || [];
    }
    throw error;
  }
  return data || [];
}

/** Fetch published resource videos by section (public).
 *  Safe fallback: if is_published column is missing, retries without it.
 *  Sorts by created_at DESC (newest first). */
export async function getHcResourceVideos(section: 'teacher' | 'student'): Promise<HcResourceVideo[]> {
  console.log('[helpCenterApi] getHcResourceVideos:', section);
  const { data, error } = await supabasePublic
    .from('hc_videos')
    .select('*')
    .eq('section', section)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    // 42703 = undefined_column — is_published or created_at may not exist yet
    if (error.code === '42703') {
      console.warn('[helpCenterApi] getHcResourceVideos fallback — column missing, retrying without is_published/created_at order');
      const { data: fallback, error: fbErr } = await supabasePublic
        .from('hc_videos')
        .select('*')
        .eq('section', section);
      if (fbErr) { console.error('[helpCenterApi] getHcResourceVideos fallback error:', fbErr); throw fbErr; }
      console.log('[helpCenterApi] getHcResourceVideos (fallback) returned', fallback?.length, 'rows');
      return fallback || [];
    }
    console.error('[helpCenterApi] getHcResourceVideos error:', error);
    throw error;
  }
  console.log('[helpCenterApi] getHcResourceVideos returned', data?.length, 'rows');
  return data || [];
}

/** Fetch ALL resource videos (admin, includes drafts). */
export async function adminGetAllResourceVideos(): Promise<HcResourceVideo[]> {
  return raceTimeout((async () => {
    await requireSession();
    const { data, error } = await supabase
      .from('hc_videos')
      .select('*')
      .order('section')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  })(), 15_000, 'adminGetAllResourceVideos');
}

/** Fetch a section by slug within a category, resolving by category slug first (public). */
export async function getHcSectionBySlugs(
  categorySlug: string,
  sectionSlug: string,
): Promise<(HcSection & { hc_categories: Pick<HcCategory, 'id' | 'slug' | 'title' | 'title_ar'> | null }) | null> {
  // First get the category
  const cat = await getHcCategoryBySlug(categorySlug);
  if (!cat) return null;

  const { data, error } = await supabasePublic
    .from('hc_sections')
    .select('*, hc_categories(id, slug, title, title_ar)')
    .eq('category_id', cat.id)
    .eq('slug', sectionSlug)
    .eq('is_published', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/** Fallback: fetch a published section by slug only (no category constraint).
 *  Used when the category-scoped lookup fails due to slug/category mismatch. */
export async function getHcSectionBySlugOnly(
  sectionSlug: string,
): Promise<(HcSection & { hc_categories: Pick<HcCategory, 'id' | 'slug' | 'title' | 'title_ar'> | null }) | null> {
  console.log('[helpCenterApi] getHcSectionBySlugOnly — slug:', sectionSlug);
  const { data, error } = await supabasePublic
    .from('hc_sections')
    .select('*, hc_categories(id, slug, title, title_ar)')
    .eq('slug', sectionSlug)
    .eq('is_published', true)
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[helpCenterApi] getHcSectionBySlugOnly error:', error);
    throw error;
  }
  console.log('[helpCenterApi] getHcSectionBySlugOnly result:', data ? `${data.slug} (section_id=${data.id})` : 'null');
  return data || null;
}

// ─── Admin Reads (includes inactive/unpublished) ──────────────

/** Fetch ALL categories for the admin panel (includes inactive). */
export async function adminGetAllCategories(): Promise<HcCategory[]> {
  return raceTimeout((async () => {
    await requireSession();
    const { data, error } = await supabase
      .from('hc_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  })(), 15_000, 'adminGetAllCategories');
}

/** Fetch ALL sections with category info (admin). */
export async function adminGetAllSections(): Promise<HcSectionWithCategory[]> {
  return raceTimeout((async () => {
    await requireSession();
    const { data, error } = await supabase
      .from('hc_sections')
      .select('*, hc_categories(slug, title, title_ar)')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []) as HcSectionWithCategory[];
  })(), 15_000, 'adminGetAllSections');
}

/** Fetch ALL sections for a category (admin, includes inactive). */
export async function adminGetSectionsByCategory(categoryId: string): Promise<HcSection[]> {
  return raceTimeout((async () => {
    await requireSession();
    const { data, error } = await supabase
      .from('hc_sections')
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  })(), 15_000, 'adminGetSectionsByCategory');
}

/** Fetch a single section by ID (admin). */
export async function adminGetSectionById(id: string): Promise<HcSectionWithCategory | null> {
  return raceTimeout((async () => {
    await requireSession();
    const { data, error } = await supabase
      .from('hc_sections')
      .select('*, hc_categories(slug, title, title_ar)')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return (data as HcSectionWithCategory) || null;
  })(), 15_000, 'adminGetSectionById');
}

/** Fetch ALL articles across all sections (admin). */
export async function adminGetAllArticles(): Promise<HcArticleWithSection[]> {
  return raceTimeout((async () => {
    await requireSession();
    const { data, error } = await supabase
      .from('hc_articles')
      .select('*, hc_sections(slug, title, title_ar, hc_categories(slug, title, title_ar))')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []) as HcArticleWithSection[];
  })(), 15_000, 'adminGetAllArticles');
}

/** Fetch ALL articles for a section (admin, includes drafts). */
export async function adminGetArticlesBySection(sectionId: string): Promise<HcArticle[]> {
  return raceTimeout((async () => {
    await requireSession();
    const { data, error } = await supabase
      .from('hc_articles')
      .select('*')
      .eq('section_id', sectionId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  })(), 15_000, 'adminGetArticlesBySection');
}

/** Fetch a single article by ID (admin, includes drafts). */
export async function adminGetArticleById(id: string): Promise<HcArticleWithSection | null> {
  return raceTimeout((async () => {
    await requireSession();
    const { data, error } = await supabase
      .from('hc_articles')
      .select('*, hc_sections(slug, title, title_ar, hc_categories(slug, title, title_ar))')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return (data as HcArticleWithSection) || null;
  })(), 15_000, 'adminGetArticleById');
}

/** Fetch a single category by ID (admin). */
export async function adminGetCategoryById(id: string): Promise<HcCategory | null> {
  return raceTimeout((async () => {
    await requireSession();
    const { data, error } = await supabase
      .from('hc_categories')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  })(), 15_000, 'adminGetCategoryById');
}

// ─── Admin Writes ─────────────────────────────────────────────

/**
 * Raw PATCH via PostgREST with explicit Prefer: return=minimal.
 *
 * The Supabase JS client's .update() does NOT set return=minimal,
 * so PostgREST may default to RETURNING * — which triggers recursive
 * RLS/trigger evaluation causing PostgreSQL "stack depth limit exceeded".
 *
 * This helper guarantees a plain UPDATE (no RETURNING clause).
 */
async function patchRow(
  table: string,
  id: string,
  updates: Record<string, unknown>,
  accessToken: string,
): Promise<void> {
  const baseUrl = (import.meta.env.VITE_SUPABASE_URL as string).replace(/\/+$/, '');
  const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  if (import.meta.env.DEV) console.log(`[patchRow] PATCH ${table} id=${id}`);

  const res = await fetch(
    `${baseUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(updates),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.message || body?.msg || body?.details || `Update failed (HTTP ${res.status})`;
    if (import.meta.env.DEV) console.error(`[patchRow] FAILED ${table}:`, msg, body);
    throw new Error(msg);
  }

  if (import.meta.env.DEV) console.log(`[patchRow] OK ${table} id=${id} (${res.status})`);
}

/**
 * Get the current session or throw.  Wrapped in a 10 s timeout so the admin
 * UI never hangs on "Loading…" if the auth client stalls.
 */
async function requireSession() {
  // Label intentionally avoids the word "session" so isSessionError()
  // does NOT treat a timeout as a session error (would redirect to login).
  return raceTimeout(_doRequireSession(), 10_000, 'auth-check');
}

async function _doRequireSession() {
  if (import.meta.env.DEV) console.log('[requireSession] start');

  // Step 1: try reading the existing session from memory/storage
  const { data, error } = await safeGetSession();
  if (error) {
    if (import.meta.env.DEV) console.error('[requireSession] getSession error:', error);
    throw error;
  }

  if (data.session) {
    const expiresAt = data.session.expires_at;
    const nowSec = Math.floor(Date.now() / 1000);
    if (expiresAt && expiresAt - nowSec < 60) {
      if (import.meta.env.DEV) console.log('[requireSession] token expiring soon, refreshing…');
      const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
      if (!refreshErr && refreshData.session) return refreshData.session;
      if (expiresAt > nowSec) return data.session;
    } else {
      if (import.meta.env.DEV) console.log('[requireSession] session OK, user:', data.session.user.id);
      return data.session;
    }
  }

  // Step 2: session is null — wait briefly for auth init to complete, then retry
  if (import.meta.env.DEV) console.log('[requireSession] no session, waiting 1 s…');
  await new Promise(r => setTimeout(r, 1000));

  const { data: retryData } = await safeGetSession();
  if (retryData.session) {
    if (import.meta.env.DEV) console.log('[requireSession] session found on retry');
    return retryData.session;
  }

  // Step 3: attempt an explicit token refresh before giving up
  if (import.meta.env.DEV) console.log('[requireSession] attempting refreshSession…');
  const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
  if (refreshErr) {
    console.error('[requireSession] refreshSession failed:', refreshErr.message);
    throw new Error('No active session. Please sign in again.');
  }
  if (!refreshData.session) {
    console.error('[requireSession] refreshSession returned no session');
    throw new Error('No active session. Please sign in again.');
  }

  if (import.meta.env.DEV) console.log('[requireSession] session recovered via refresh');
  return refreshData.session;
}

type CategoryInput = Omit<HcCategory, 'id' | 'created_at' | 'updated_at'>;
type SectionInput = Omit<HcSection, 'id' | 'created_at' | 'updated_at'>;
type ArticleInput = Omit<HcArticle, 'id' | 'created_at' | 'updated_at'>;

// ── Category CRUD ──

export async function adminCreateCategory(input: CategoryInput): Promise<HcCategory> {
  return raceTimeout((async () => {
    await requireSession();
    const { data, error } = await supabase
      .from('hc_categories')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    emitDataChange('hc_categories');
    return data;
  })(), 15_000, 'adminCreateCategory');
}

export async function adminUpdateCategory(id: string, updates: Partial<CategoryInput>): Promise<HcCategory> {
  return raceTimeout((async () => {
    const session = await requireSession();
    if (import.meta.env.DEV) console.log('[adminUpdateCategory] PATCH id=', id, updates);

    // Raw PATCH with Prefer: return=minimal — no RETURNING *, no stack depth.
    await patchRow('hc_categories', id, updates as Record<string, unknown>, session.access_token);

    if (import.meta.env.DEV) console.log('[adminUpdateCategory] OK');
    emitDataChange('hc_categories');

    // Return a synthetic row — callers navigate away and the list re-fetches.
    // Avoids an authenticated SELECT that could also trigger recursive RLS.
    return { id, ...updates } as unknown as HcCategory;
  })(), 15_000, 'adminUpdateCategory');
}

export async function adminDeleteCategory(id: string): Promise<void> {
  return raceTimeout((async () => {
    await requireSession();
    const { error } = await supabase.from('hc_categories').delete().eq('id', id);
    if (error) throw error;
    emitDataChange('hc_categories');
  })(), 15_000, 'adminDeleteCategory');
}

// ── Section CRUD ──

export async function adminCreateSection(input: SectionInput): Promise<HcSection> {
  return raceTimeout((async () => {
    await requireSession();
    const { data, error } = await supabase
      .from('hc_sections')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    emitDataChange('hc_sections');
    return data;
  })(), 15_000, 'adminCreateSection');
}

export async function adminUpdateSection(id: string, updates: Partial<SectionInput>): Promise<HcSection> {
  return raceTimeout((async () => {
    const session = await requireSession();
    if (import.meta.env.DEV) console.log('[adminUpdateSection] PATCH id=', id, updates);

    await patchRow('hc_sections', id, updates as Record<string, unknown>, session.access_token);

    if (import.meta.env.DEV) console.log('[adminUpdateSection] OK');
    emitDataChange('hc_sections');
    return { id, ...updates } as unknown as HcSection;
  })(), 15_000, 'adminUpdateSection');
}

export async function adminDeleteSection(id: string): Promise<void> {
  return raceTimeout((async () => {
    await requireSession();
    const { error } = await supabase.from('hc_sections').delete().eq('id', id);
    if (error) throw error;
    emitDataChange('hc_sections');
  })(), 15_000, 'adminDeleteSection');
}

// ── Article CRUD ──

export async function adminCreateArticle(input: ArticleInput): Promise<HcArticle> {
  return raceTimeout((async () => {
    await requireSession();
    const { data, error } = await supabase
      .from('hc_articles')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    emitDataChange('hc_articles');
    return data;
  })(), 15_000, 'adminCreateArticle');
}

export async function adminUpdateArticle(id: string, updates: Partial<ArticleInput>): Promise<HcArticle> {
  return raceTimeout((async () => {
    await requireSession();
    console.log('[adminUpdateArticle] updating id=', id, 'fields:', Object.keys(updates));

    const { data, error } = await supabase
      .from('hc_articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Article not found or update failed — 0 rows affected');

    console.log('[adminUpdateArticle] OK — id:', data.id, 'updated_at:', data.updated_at);
    emitDataChange('hc_articles');
    return data;
  })(), 15_000, 'adminUpdateArticle');
}

export async function adminDeleteArticle(id: string): Promise<void> {
  return raceTimeout((async () => {
    await requireSession();
    const { error } = await supabase.from('hc_articles').delete().eq('id', id);
    if (error) throw error;
    emitDataChange('hc_articles');
  })(), 15_000, 'adminDeleteArticle');
}

// ── Counts ──

export async function adminGetSectionCount(categoryId: string): Promise<number> {
  return raceTimeout((async () => {
    await requireSession();
    const { count, error } = await supabase
      .from('hc_sections')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);
    if (error) throw error;
    return count || 0;
  })(), 15_000, 'adminGetSectionCount');
}

export async function adminGetArticleCount(sectionId: string): Promise<number> {
  return raceTimeout((async () => {
    await requireSession();
    const { count, error } = await supabase
      .from('hc_articles')
      .select('*', { count: 'exact', head: true })
      .eq('section_id', sectionId);
    if (error) throw error;
    return count || 0;
  })(), 15_000, 'adminGetArticleCount');
}

// ─── Default Category Seeding ────────────────────────────────

const DEFAULT_CATEGORIES: Omit<HcCategory, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    slug: 'for-families',
    title: 'For Families',
    title_ar: 'للعائلات',
    description: "I'm a parent, guardian, grandparent, etc.",
    description_ar: 'أنا والد، ولي أمر، جد، إلخ.',
    icon: 'home',
    sort_order: 1,
    is_published: true,
  },
  {
    slug: 'for-students',
    title: 'For Students',
    title_ar: 'للطلاب',
    description: 'Tips and resources for students.',
    description_ar: 'نصائح وموارد للطلاب.',
    icon: 'academic-cap',
    sort_order: 2,
    is_published: true,
  },
  {
    slug: 'for-teachers',
    title: 'For Teachers',
    title_ar: 'للمعلمين',
    description: 'Helpful articles for teachers and educators.',
    description_ar: 'مقالات مفيدة للمعلمين والمربين.',
    icon: 'user',
    sort_order: 3,
    is_published: true,
  },
  {
    slug: 'for-schools-and-districts',
    title: 'For Schools & Districts',
    title_ar: 'للمدارس والمناطق التعليمية',
    description: 'Resources for school leaders and administrators.',
    description_ar: 'موارد لقادة المدارس والإداريين.',
    icon: 'building',
    sort_order: 4,
    is_published: true,
  },
];

export async function adminSeedDefaultCategories(): Promise<HcCategory[]> {
  return raceTimeout((async () => {
    await requireSession();
    const { error } = await supabase
      .from('hc_categories')
      .upsert(DEFAULT_CATEGORIES, { onConflict: 'slug', ignoreDuplicates: true });
    if (error) throw error;
    return adminGetAllCategories();
  })(), 20_000, 'adminSeedDefaultCategories');
}

// ─── Default Section Seeding ─────────────────────────────────

interface SeedSection {
  categorySlug: string;
  slug: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  icon: string;
  sort_order: number;
}

const DEFAULT_SECTIONS: SeedSection[] = [
  // For Families
  { categorySlug: 'for-families', slug: 'parent-setup', title: 'Parent Setup', title_ar: 'إعداد ولي الأمر', description: "Download the app, create your parent account, and connect to your child's class in minutes.", description_ar: 'حمّل التطبيق وأنشئ حساب ولي الأمر واتصل بفصل طفلك في دقائق.', icon: 'download', sort_order: 1 },
  { categorySlug: 'for-families', slug: 'getting-started', title: 'Getting Started', title_ar: 'البدء', description: 'Your first steps on String as a family member — notifications, preferences, and your weekly routine.', description_ar: 'خطواتك الأولى على سترينج كفرد من العائلة — الإشعارات والتفضيلات وروتينك الأسبوعي.', icon: 'rocket', sort_order: 2 },
  { categorySlug: 'for-families', slug: 'account-management', title: 'Account Management', title_ar: 'إدارة الحساب', description: 'Update your contact details, manage multiple children, and recover your account if needed.', description_ar: 'حدّث بيانات الاتصال الخاصة بك وأدر حسابات أطفال متعددين واسترجع حسابك عند الحاجة.', icon: 'cog', sort_order: 3 },
  { categorySlug: 'for-families', slug: 'messaging', title: 'Messaging', title_ar: 'المراسلة', description: 'Read and reply to teacher messages, understand read receipts, and translate messages to your language.', description_ar: 'اقرأ رسائل المعلم وردّ عليها وافهم إيصالات القراءة وترجم الرسائل إلى لغتك.', icon: 'chat', sort_order: 4 },
  { categorySlug: 'for-families', slug: 'student-portfolio', title: 'Student Portfolio', title_ar: 'ملف الطالب', description: "View, download, and comment on your child's portfolio work shared by their teacher.", description_ar: 'اعرض وحمّل وعلّق على أعمال ملف طفلك التي شاركها معلمهم.', icon: 'folder', sort_order: 5 },
  { categorySlug: 'for-families', slug: 'points-and-reports', title: 'Points and Reports', title_ar: 'النقاط والتقارير', description: "Understand your child's behavior points, view weekly progress reports, and set up milestone alerts.", description_ar: 'افهم نقاط سلوك طفلك واعرض تقارير التقدم الأسبوعية وأعد تنبيهات الإنجازات.', icon: 'chart', sort_order: 6 },

  // For Students
  { categorySlug: 'for-students', slug: 'getting-started', title: 'Getting Started', title_ar: 'البدء', description: 'Log in to your student account, explore your dashboard, and set up your profile.', description_ar: 'سجّل الدخول إلى حسابك الطلابي واستكشف لوحة القيادة وأعد ملفك الشخصي.', icon: 'rocket', sort_order: 1 },
  { categorySlug: 'for-students', slug: 'learning-tools', title: 'Learning Tools', title_ar: 'أدوات التعلم', description: 'Use digital portfolios, access class materials, and participate in interactive activities.', description_ar: 'استخدم الملفات الرقمية واطلع على مواد الفصل وشارك في الأنشطة التفاعلية.', icon: 'book', sort_order: 2 },
  { categorySlug: 'for-students', slug: 'online-safety', title: 'Online Safety', title_ar: 'الأمان عبر الإنترنت', description: 'Stay safe on String — learn about digital citizenship, reporting tools, and protecting your information.', description_ar: 'ابقَ آمنًا على سترينج — تعرف على المواطنة الرقمية وأدوات الإبلاغ وحماية معلوماتك.', icon: 'shield', sort_order: 3 },
  { categorySlug: 'for-students', slug: 'student-account', title: 'Student Account', title_ar: 'حساب الطالب', description: 'Learn how to create, verify, and manage your student account on String.', description_ar: 'تعرّف على كيفية إنشاء حسابك الطلابي والتحقق منه وإدارته على سترينج.', icon: 'user', sort_order: 4 },

  // For Teachers
  { categorySlug: 'for-teachers', slug: 'getting-started', title: 'Getting Started', title_ar: 'البدء', description: 'Set up your teacher profile, create your first class, and invite families to connect.', description_ar: 'أعد ملفك الشخصي كمعلم وأنشئ فصلك الأول وادعُ العائلات للتواصل.', icon: 'rocket', sort_order: 1 },
  { categorySlug: 'for-teachers', slug: 'classroom-management', title: 'Classroom Management', title_ar: 'إدارة الفصل', description: 'Organize students into groups, set up behavior points, and manage class rosters throughout the year.', description_ar: 'نظّم الطلاب في مجموعات وأعد نقاط السلوك وأدر قوائم الفصل طوال العام.', icon: 'clipboard', sort_order: 2 },
  { categorySlug: 'for-teachers', slug: 'communication', title: 'Communication', title_ar: 'التواصل', description: 'Write effective messages, schedule announcements, and communicate with multilingual families.', description_ar: 'اكتب رسائل فعّالة وجدول الإعلانات وتواصل مع العائلات متعددة اللغات.', icon: 'chat', sort_order: 3 },
  { categorySlug: 'for-teachers', slug: 'uploading-materials', title: 'Uploading Materials', title_ar: 'رفع المواد التعليمية', description: 'Learn how to upload, organize, and manage teaching materials on String.', description_ar: 'تعرّف على كيفية رفع وتنظيم وإدارة المواد التعليمية على سترينج.', icon: 'upload', sort_order: 4 },

  // For Schools & Districts
  { categorySlug: 'for-schools-and-districts', slug: 'getting-started', title: 'Getting Started', title_ar: 'البدء', description: 'Set up your school on String, create accounts, assign roles, and invite families to connect.', description_ar: 'أعد مدرستك على سترينج وأنشئ حسابات وعيّن أدوارًا وادعُ العائلات للتواصل.', icon: 'rocket', sort_order: 1 },
  { categorySlug: 'for-schools-and-districts', slug: 'account-management', title: 'Account Management', title_ar: 'إدارة الحساب', description: 'Update your profile, manage passwords, configure device settings, and troubleshoot access issues.', description_ar: 'حدّث ملفك الشخصي وأدر كلمات المرور وهيّئ إعدادات الأجهزة واستكشف مشاكل الوصول.', icon: 'cog', sort_order: 2 },
  { categorySlug: 'for-schools-and-districts', slug: 'class-setup-and-access', title: 'Class Setup and Access', title_ar: 'إعداد الفصل والوصول', description: 'Create classes, add students and co-teachers, manage rosters, and control classroom access permissions.', description_ar: 'أنشئ فصولًا وأضف طلابًا ومعلمين مشاركين وأدر القوائم وتحكم في صلاحيات الوصول.', icon: 'key', sort_order: 3 },
  { categorySlug: 'for-schools-and-districts', slug: 'class-messaging', title: 'Class Messaging', title_ar: 'رسائل الفصل', description: 'Send messages to families, schedule announcements, and use built-in translation for multilingual communication.', description_ar: 'أرسل رسائل للعائلات وجدول الإعلانات واستخدم الترجمة المدمجة للتواصل متعدد اللغات.', icon: 'chat', sort_order: 4 },
  { categorySlug: 'for-schools-and-districts', slug: 'class-story-and-events', title: 'Class Story and Class Events', title_ar: 'قصة الفصل وفعاليات الفصل', description: 'Share classroom moments with photos and videos, and create events families can RSVP to.', description_ar: 'شارك لحظات الفصل بالصور والفيديو وأنشئ فعاليات يمكن للعائلات الرد عليها.', icon: 'calendar', sort_order: 5 },
  { categorySlug: 'for-schools-and-districts', slug: 'class-points-and-reports', title: 'Class Points and Reports', title_ar: 'نقاط الفصل والتقارير', description: 'Track student behavior with custom points, generate progress reports, and share insights with families.', description_ar: 'تتبع سلوك الطلاب بنقاط مخصصة وأنشئ تقارير التقدم وشارك الأفكار مع العائلات.', icon: 'chart', sort_order: 6 },
  { categorySlug: 'for-schools-and-districts', slug: 'district-features', title: 'District Features', title_ar: 'ميزات المنطقة التعليمية', description: 'Manage multiple schools, access district-wide analytics, and configure platform settings at scale.', description_ar: 'أدر مدارس متعددة واطلع على تحليلات المنطقة وهيّئ إعدادات المنصة على نطاق واسع.', icon: 'building', sort_order: 7 },
  { categorySlug: 'for-schools-and-districts', slug: 'student-portfolios', title: 'Student Portfolios', title_ar: 'ملفات الطلاب', description: 'Enable digital portfolios where students can showcase their work and teachers can share it with families.', description_ar: 'فعّل الملفات الرقمية حيث يمكن للطلاب عرض أعمالهم وللمعلمين مشاركتها مع العائلات.', icon: 'folder', sort_order: 8 },
  { categorySlug: 'for-schools-and-districts', slug: 'schoolwide-usage', title: 'Schoolwide Usage', title_ar: 'الاستخدام على مستوى المدرسة', description: 'Monitor teacher adoption, family engagement rates, and overall platform usage across your school.', description_ar: 'راقب معدل تبني المعلمين ومشاركة العائلات والاستخدام العام للمنصة عبر مدرستك.', icon: 'chart', sort_order: 9 },
];

/**
 * Seed the hc_sections table with default sections if it is empty.
 * Idempotent — skips insert if sections already exist.
 * Requires categories to be seeded first.
 */
export async function adminSeedDefaultSections(): Promise<HcSectionWithCategory[]> {
  return raceTimeout((async () => {
    await requireSession();
    // Fetch categories to map slugs → UUIDs
    const categories = await adminGetAllCategories();
    const slugToId: Record<string, string> = {};
    for (const c of categories) {
      slugToId[c.slug] = c.id;
    }

    const rows: Omit<HcSection, 'id' | 'created_at' | 'updated_at'>[] = [];
    for (const s of DEFAULT_SECTIONS) {
      const catId = slugToId[s.categorySlug];
      if (!catId) {
        console.warn(`[seedSections] Category "${s.categorySlug}" not found — skipping section "${s.slug}"`);
        continue;
      }
      rows.push({
        category_id: catId,
        slug: s.slug,
        title: s.title,
        title_ar: s.title_ar,
        description: s.description,
        description_ar: s.description_ar,
        icon: s.icon,
        sort_order: s.sort_order,
        is_published: true,
      });
    }

    if (rows.length === 0) return [];

    const { error } = await supabase
      .from('hc_sections')
      .upsert(rows, { onConflict: 'category_id,slug', ignoreDuplicates: true });

    if (error) throw error;
    return adminGetAllSections();
  })(), 25_000, 'adminSeedDefaultSections');
}
