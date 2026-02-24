import { supabase, safeGetSession } from './supabase';
import { emitDataChange } from './dataEvents';
import { BlogPost, BlogComment, BlogLike } from '../types';
import type { TeacherUser, UserRole } from './auth';

// ─── Error types ─────────────────────────────────────────────────────────────

export class BlogAuthError extends Error {
  code: 401 | 403;
  constructor(message: string, code: 401 | 403) {
    super(message);
    this.name = 'BlogAuthError';
    this.code = code;
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────

const COMMENTS_KEY = 'blogComments';
const LIKES_KEY = 'blogLikes';
const RATE_LIMIT_KEY = 'blogCommentRateLimit';

const BLOG_WRITE_ROLES: UserRole[] = ['teacher', 'admin'];
const MAX_COMMENT_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

// ─── Slug helper ─────────────────────────────────────────────────────────────

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── RLS error helper ───────────────────────────────────────────────────────

function handleSupabaseError(error: any): never {
  console.error('[blogStore] Supabase error:', error);
  if (error?.code === '42501') {
    throw new BlogAuthError('Access denied – admin required', 403);
  }
  throw error;
}

// ─── DB row → BlogPost mapping ──────────────────────────────────────────────
// Actual table columns:
//   id, title, slug, content, excerpt, author_id,
//   is_published, published_at, created_at, updated_at

interface BlogPostRow {
  id: string;
  title: string;
  title_ar: string | null;
  slug: string;
  content: string;
  content_ar: string | null;
  excerpt: string | null;
  excerpt_ar: string | null;
  author_id: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    title: row.title,
    title_ar: row.title_ar ?? undefined,
    excerpt: row.excerpt ?? undefined,
    excerpt_ar: row.excerpt_ar ?? undefined,
    body: row.content,
    body_ar: row.content_ar ?? undefined,
    authorId: row.author_id,
    authorName: '', // no author_name column; populated client-side if needed
    publishedAt: row.published_at ?? row.created_at,
    updatedAt: row.updated_at,
    likes: 0,
    comments: 0,
    status: row.is_published ? 'published' : 'draft',
  };
}

// ─── Auth guards ────────────────────────────────────────────────────────────

function requireAuth(user: TeacherUser | null): asserts user is TeacherUser {
  if (!user) throw new BlogAuthError('Authentication required', 401);
}

function requireBlogWriter(user: TeacherUser | null): asserts user is TeacherUser {
  requireAuth(user);
  if (!BLOG_WRITE_ROLES.includes(user.role)) {
    throw new BlogAuthError('Forbidden: teacher or admin role required', 403);
  }
}

async function requireSession() {
  // Step 1: try reading the existing session from memory/storage
  const { data, error } = await safeGetSession();
  if (error) throw error;

  if (data.session) {
    if (import.meta.env.DEV) {
      console.log('[blogStore] Session OK — user:', data.session.user.id);
    }
    return data.session;
  }

  // Step 2: session is null — attempt a token refresh before giving up
  console.warn('[blogStore] No session from getSession, attempting refreshSession…');
  const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
  if (refreshErr) {
    console.error('[blogStore] refreshSession failed:', refreshErr.message);
    throw new BlogAuthError('No active session. Please sign in again.', 401);
  }
  if (!refreshData.session) {
    console.error('[blogStore] refreshSession returned no session');
    throw new BlogAuthError('No active session. Please sign in again.', 401);
  }

  if (import.meta.env.DEV) {
    console.log('[blogStore] Session recovered via refresh — user:', refreshData.session.user.id);
  }
  return refreshData.session;
}

// ─── Comment / Like helpers (still localStorage) ────────────────────────────

const SEED_COMMENTS: BlogComment[] = [
  { id: 'comment-seed-1', postId: 'post-seed-1', userId: 'teacher-seed-1', userName: 'Sarah Johnson', content: 'The collaborative story building activity worked wonderfully with my Year 5 class!', createdAt: '2026-01-18T09:15:00Z' },
  { id: 'comment-seed-2', postId: 'post-seed-1', userId: 'teacher-seed-2', userName: 'Maria Garcia', content: 'I adapted the scavenger hunt for a science lesson and the students loved it.', createdAt: '2026-01-19T14:30:00Z' },
  { id: 'comment-seed-3', postId: 'post-seed-3', userId: 'teacher-seed-1', userName: 'Sarah Johnson', content: 'The AI tutor has been a game-changer for differentiation in my mixed-ability class.', createdAt: '2026-02-11T10:00:00Z' },
];
const SEED_LIKES: BlogLike[] = [];

function loadList<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) { localStorage.setItem(key, JSON.stringify(seed)); return seed; }
    return JSON.parse(raw);
  } catch { return []; }
}
function saveList<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

function getAllComments(): BlogComment[] { return loadList(COMMENTS_KEY, SEED_COMMENTS); }
function saveComments(c: BlogComment[]): void { saveList(COMMENTS_KEY, c); }
function getAllLikes(): BlogLike[] { return loadList(LIKES_KEY, SEED_LIKES); }
function saveLikes(l: BlogLike[]): void { saveList(LIKES_KEY, l); }

function sanitizeText(input: string): string {
  return input.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').trim();
}

function checkCommentRateLimit(userId: string): void {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const records: { userId: string; ts: number }[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    if (records.filter((r) => r.userId === userId && r.ts > windowStart).length >= RATE_LIMIT_MAX) {
      throw new BlogAuthError('Too many comments. Please wait a moment.', 403);
    }
    records.push({ userId, ts: now });
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(records.filter((r) => r.ts > windowStart)));
  } catch (e) { if (e instanceof BlogAuthError) throw e; }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export const blogStore = {
  // ── Post CRUD (Supabase) ─────────────────────────────────

  async getAll(): Promise<BlogPost[]> {
    await requireSession();
    console.log('[blogStore.getAll] Fetching all posts...');
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) handleSupabaseError(error);
    console.log('[blogStore.getAll] Loaded', data?.length ?? 0, 'posts');
    return (data || []).map(mapRow);
  },

  async getPublished(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    if (error) handleSupabaseError(error);
    return (data || []).map(mapRow);
  },

  async getDrafts(user: TeacherUser | null): Promise<BlogPost[]> {
    if (!user || !BLOG_WRITE_ROLES.includes(user.role)) return [];
    await requireSession();
    let query = supabase.from('blog_posts').select('*').eq('is_published', false);
    if (user.role !== 'admin') query = query.eq('author_id', user.id);
    const { data, error } = await query.order('updated_at', { ascending: false });
    if (error) handleSupabaseError(error);
    return (data || []).map(mapRow);
  },

  async getLatestPublished(): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) handleSupabaseError(error);
    return data ? mapRow(data) : null;
  },

  async getById(id: string): Promise<BlogPost | undefined> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') handleSupabaseError(error);
    return data ? mapRow(data) : undefined;
  },

  async create(
    user: TeacherUser | null,
    post: Omit<BlogPost, 'id' | 'likes' | 'comments' | 'authorId' | 'authorName'>,
  ): Promise<BlogPost> {
    requireBlogWriter(user);
    await requireSession();

    const isPublishing = post.status === 'published';
    const slug = generateSlug(post.title) || `post-${Date.now()}`;

    const payload: Record<string, unknown> = {
      title: post.title.trim(),
      slug,
      content: post.body.trim(),
      excerpt: post.excerpt?.trim() || null,
      author_id: user.id,
      is_published: isPublishing,
      published_at: isPublishing
        ? (post.publishedAt || new Date().toISOString())
        : null,
    };
    if (post.title_ar !== undefined) payload.title_ar = post.title_ar?.trim() || null;
    if (post.body_ar !== undefined) payload.content_ar = post.body_ar?.trim() || null;
    if (post.excerpt_ar !== undefined) payload.excerpt_ar = post.excerpt_ar?.trim() || null;

    console.log('[blogStore.create] Payload:', payload);

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(payload)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    console.log('[blogStore.create] Success:', data);
    emitDataChange('blog_posts');
    return mapRow(data);
  },

  async update(
    user: TeacherUser | null,
    id: string,
    updates: Partial<Omit<BlogPost, 'id' | 'authorId' | 'authorName'>>,
  ): Promise<BlogPost | null> {
    requireBlogWriter(user);
    await requireSession();

    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) {
      payload.title = updates.title.trim();
      payload.slug = generateSlug(updates.title);
    }
    if (updates.excerpt !== undefined) payload.excerpt = updates.excerpt?.trim() || null;
    if (updates.body !== undefined) payload.content = updates.body.trim();
    if (updates.status !== undefined) payload.is_published = updates.status === 'published';
    if (updates.publishedAt !== undefined) payload.published_at = updates.publishedAt;
    if (updates.title_ar !== undefined) payload.title_ar = updates.title_ar?.trim() || null;
    if (updates.body_ar !== undefined) payload.content_ar = updates.body_ar?.trim() || null;
    if (updates.excerpt_ar !== undefined) payload.excerpt_ar = updates.excerpt_ar?.trim() || null;

    console.log('[blogStore.update] id:', id, 'payload:', payload);

    const { data, error } = await supabase
      .from('blog_posts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    console.log('[blogStore.update] Success:', data);
    emitDataChange('blog_posts');
    return data ? mapRow(data) : null;
  },

  async remove(user: TeacherUser | null, id: string): Promise<boolean> {
    requireBlogWriter(user);
    await requireSession();
    console.log('[blogStore.remove] id:', id);
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) handleSupabaseError(error);
    emitDataChange('blog_posts');
    return true;
  },

  canModifyPost(user: TeacherUser | null, post: BlogPost): boolean {
    if (!user) return false;
    if (!BLOG_WRITE_ROLES.includes(user.role)) return false;
    if (user.role === 'admin') return true;
    return post.authorId === user.id;
  },

  // ── Comments (localStorage) ──────────────────────────────

  getComments(postId: string): BlogComment[] {
    return getAllComments()
      .filter((c) => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  getCommentCount(postId: string): number {
    return getAllComments().filter((c) => c.postId === postId).length;
  },

  addComment(user: TeacherUser | null, postId: string, content: string): BlogComment {
    requireAuth(user);
    checkCommentRateLimit(user.id);
    const sanitized = sanitizeText(content);
    if (!sanitized) throw new BlogAuthError('Comment cannot be empty', 403);
    const comment: BlogComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      postId,
      userId: user.id,
      userName: user.name,
      content: sanitized.slice(0, MAX_COMMENT_LENGTH),
      createdAt: new Date().toISOString(),
    };
    const all = getAllComments();
    all.push(comment);
    saveComments(all);
    return comment;
  },

  deleteComment(user: TeacherUser | null, commentId: string): boolean {
    requireAuth(user);
    const all = getAllComments();
    const comment = all.find((c) => c.id === commentId);
    if (!comment) return false;
    if (user.role !== 'admin' && comment.userId !== user.id) {
      throw new BlogAuthError('Forbidden: you can only delete your own comments', 403);
    }
    saveComments(all.filter((c) => c.id !== commentId));
    return true;
  },

  // ── Likes (localStorage) ─────────────────────────────────

  hasUserLiked(postId: string, userId: string): boolean {
    return getAllLikes().some((l) => l.postId === postId && l.userId === userId);
  },

  getLikeCount(postId: string): number {
    return getAllLikes().filter((l) => l.postId === postId).length;
  },

  toggleLike(user: TeacherUser | null, postId: string): boolean {
    requireAuth(user);
    const all = getAllLikes();
    const idx = all.findIndex((l) => l.postId === postId && l.userId === user.id);
    if (idx !== -1) {
      all.splice(idx, 1);
      saveLikes(all);
      return false;
    }
    all.push({ postId, userId: user.id });
    saveLikes(all);
    return true;
  },
};
