import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { blogStore } from '../../lib/blog';
import { RichTextEditor } from '../../components/editor/RichTextEditor';

// ─── Autosave helpers ────────────────────────────────────────────────────────

const AUTOSAVE_INTERVAL = 5_000;

function draftKey(userId: string, postId?: string): string {
  return `blogDraft:${userId}:${postId ?? 'new'}`;
}

interface DraftData {
  title: string;
  body: string;
  savedAt: string;
}

function loadDraft(userId: string, postId?: string): DraftData | null {
  try {
    const raw = localStorage.getItem(draftKey(userId, postId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraftToStorage(userId: string, postId: string | undefined, data: DraftData) {
  localStorage.setItem(draftKey(userId, postId), JSON.stringify(data));
}

function clearDraft(userId: string, postId?: string) {
  localStorage.removeItem(draftKey(userId, postId));
}

// ─── Sanitize HTML ───────────────────────────────────────────────────────────

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminBlogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const [existing, setExisting] = useState<import('../../types').BlogPost | undefined>(undefined);
  const [loadingPost, setLoadingPost] = useState(!!id);
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [body, setBody] = useState('');
  const [bodyAr, setBodyAr] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [contentError, setContentError] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeLang, setActiveLang] = useState<'en' | 'ar'>('en');

  const initialised = useRef(false);

  // ── Load existing post from Supabase ──
  useEffect(() => {
    if (!id) { setLoadingPost(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const post = await blogStore.getById(id);
        if (cancelled) return;
        setExisting(post);
        if (post) {
          setTitle(post.title);
          setTitleAr(post.title_ar || '');
          setBody(post.body);
          setBodyAr(post.body_ar || '');
          setStatus(post.status);
        }
      } catch {
        // leave existing undefined → "not found" UI
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // ── Restore autosaved draft ──
  useEffect(() => {
    if (!user || loadingPost) return;

    const draft = loadDraft(user.id, id);
    if (draft) {
      const savedTime = new Date(draft.savedAt).toLocaleString();
      const restore = window.confirm(
        `A draft was autosaved on ${savedTime}. Restore it?`,
      );
      if (restore) {
        setTitle(draft.title);
        setBody(draft.body);
        setDraftRestored(true);
      } else {
        clearDraft(user.id, id);
      }
    }

    requestAnimationFrame(() => {
      initialised.current = true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id, loadingPost]);

  // ── Autosave every 5 seconds ──
  const titleRef = useRef(title);
  const bodyRef = useRef(body);
  titleRef.current = title;
  bodyRef.current = body;

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (!initialised.current) return;
      const hasContent =
        titleRef.current.trim() ||
        (bodyRef.current.trim() && bodyRef.current !== '<p></p>');
      if (!hasContent) return;

      saveDraftToStorage(user.id, id, {
        title: titleRef.current,
        body: bodyRef.current,
        savedAt: new Date().toISOString(),
      });
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [user, id]);

  const bodyIsEmpty = !body.trim() || body.replace(/<[^>]*>/g, '').trim() === '';

  // ── Save handler ──
  const handleSave = useCallback(
    async (asStatus: 'draft' | 'published') => {
      if (!user) return;

      const empty = !body.trim() || body.replace(/<[^>]*>/g, '').trim() === '';

      if (asStatus === 'published') {
        const noTitle = !title.trim();
        const noContent = empty;
        if (noTitle) setTitleError(true);
        if (noContent) setContentError(true);
        if (noTitle || noContent) return;
      }
      setSaving(true);
      setSaveError('');

      const cleanBody = sanitizeHtml(body.trim());

      const cleanBodyAr = sanitizeHtml(bodyAr.trim());

      try {
        if (isEditing && id) {
          await blogStore.update(user, id, {
            title: title.trim(),
            title_ar: titleAr.trim() || undefined,
            body: cleanBody,
            body_ar: cleanBodyAr || undefined,
            status: asStatus,
            publishedAt:
              asStatus === 'published' && existing?.status === 'draft'
                ? new Date().toISOString()
                : (existing?.publishedAt ?? new Date().toISOString()),
          });
          clearDraft(user.id, id);
          const action = asStatus === 'published' ? 'published' : 'updated';
          navigate(`/admin/blog?success=${action}`, { replace: true });
        } else {
          await blogStore.create(user, {
            title: title.trim(),
            title_ar: titleAr.trim() || undefined,
            body: cleanBody,
            body_ar: cleanBodyAr || undefined,
            publishedAt: new Date().toISOString(),
            status: asStatus,
          });
          clearDraft(user.id, undefined);
          navigate(`/admin/blog?success=created`, { replace: true });
        }
      } catch (e: any) {
        console.error('[AdminBlogEditor] Save failed:', e);
        const msg = e?.code === '42501'
          ? 'Access denied – admin required'
          : (e.message || 'Failed to save post');
        setSaveError(msg);
      } finally {
        setSaving(false);
      }
    },
    [user, title, titleAr, body, bodyAr, isEditing, id, existing, navigate],
  );

  // Loading state while fetching existing post
  if (loadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fafbfc' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-[#ED3B91] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading post...</p>
        </div>
      </div>
    );
  }

  // Not found when editing non-existent post
  if (isEditing && !existing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fafbfc' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Post Not Found</h1>
          <p className="text-sm text-slate-500 mb-6">Cannot edit a post that doesn't exist.</p>
          <Link
            to="/admin/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #ff4da6, #ED3B91)' }}
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#fafbfc' }}>
      {/* Admin Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[900px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/blog"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <span className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Post' : 'New Post'}
            </span>
            {draftRestored && (
              <span className="text-xs text-amber-600 font-medium ml-2">Draft restored</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isEditing && existing?.status === 'published' && (
              <a
                href={`/#/blog/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                View on Site
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Save error banner */}
      {saveError && (
        <div className="max-w-[900px] mx-auto px-6 mt-4">
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-center justify-between">
            <span>{saveError}</span>
            <button onClick={() => setSaveError('')} className="text-red-400 hover:text-red-600 ml-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Editor area */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {preview ? (
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 leading-tight">
              {title || 'Untitled Post'}
            </h1>
            <div
              className="blog-prose"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) || '<p><em>No content yet...</em></p>' }}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Language tabs */}
            <div className="flex items-center gap-2">
              {(['en', 'ar'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeLang === lang
                      ? 'bg-pink-100 text-pink-700'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {lang === 'en' ? 'English' : 'العربية'}
                </button>
              ))}
            </div>

            {/* English fields */}
            {activeLang === 'en' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Post Title (EN) <span style={{ color: '#ED3B91' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(false); }}
                    placeholder="Enter a clear and descriptive title"
                    className={`w-full text-lg font-semibold placeholder-slate-400 rounded-xl px-3.5 py-2.5 border outline-none transition-all ${
                      titleError
                        ? 'border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-400'
                        : 'border-slate-200 focus:ring-2 focus:ring-[#ED3B91]/30 focus:border-[#ED3B91]'
                    }`}
                    style={{ lineHeight: 1.3, background: '#FFFFFF', color: '#111827', fontSize: '18px' }}
                  />
                  {titleError && (
                    <p className="mt-1.5 text-xs text-red-500">Post title is required</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Content (EN) <span style={{ color: '#ED3B91' }}>*</span>
                  </label>
                  <RichTextEditor
                    value={body}
                    onChange={(html) => {
                      setBody(html);
                      if (contentError) setContentError(false);
                    }}
                    placeholder="Start writing your post..."
                    editable
                  />
                  {contentError && (
                    <p className="mt-1.5 text-xs text-red-500">Post content is required</p>
                  )}
                </div>
              </>
            )}

            {/* Arabic fields */}
            {activeLang === 'ar' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Post Title (AR)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="أدخل عنوان المقال"
                    className="w-full text-lg font-semibold placeholder-slate-400 rounded-xl px-3.5 py-2.5 border border-slate-200 outline-none transition-all focus:ring-2 focus:ring-[#ED3B91]/30 focus:border-[#ED3B91]"
                    style={{ lineHeight: 1.3, background: '#FFFFFF', color: '#111827', fontSize: '18px' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Content (AR)
                  </label>
                  <RichTextEditor
                    value={bodyAr}
                    onChange={(html) => setBodyAr(html)}
                    placeholder="ابدأ الكتابة..."
                    editable
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-8">
          <Link
            to="/admin/blog"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </Link>
          <div className="flex items-center gap-2">
            {/* Preview toggle */}
            <button
              onClick={() => setPreview(!preview)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={
                preview
                  ? { background: '#08B8FB', color: '#fff' }
                  : { background: '#f1f5f9', color: '#64748b' }
              }
            >
              {preview ? 'Edit' : 'Preview'}
            </button>

            {/* Unpublish (only when editing published post) */}
            {isEditing && existing?.status === 'published' && (
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all disabled:opacity-40"
              >
                Unpublish
              </button>
            )}

            {/* Save as draft */}
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-40"
            >
              Save Draft
            </button>

            {/* Publish */}
            <button
              onClick={() => handleSave('published')}
              disabled={saving || !title.trim() || bodyIsEmpty}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #ff4da6, #ED3B91)' }}
            >
              {isEditing && existing?.status === 'published' ? 'Update' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
