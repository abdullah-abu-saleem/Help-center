import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  adminGetAllTutorials,
  adminCreateTutorial,
  adminUpdateTutorial,
  adminDeleteTutorial,
  isValidYouTubeUrl,
  type TutorialInput,
} from '../../lib/tutorialsApi';
import type { Tutorial } from '../../types';

/* ═══════════════════════════════════════════════════
   Admin Tutorials — list + modal form
   ═══════════════════════════════════════════════════ */

const emptyForm: TutorialInput & { id?: string } = {
  title: '',
  title_ar: '',
  description: '',
  description_ar: '',
  youtube_url: '',
  thumbnail_url: '',
  sort_order: 0,
  is_published: false,
};

export default function AdminTutorials() {
  const navigate = useNavigate();

  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<TutorialInput & { id?: string }>(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Fetch tutorials (retries once if session not yet hydrated) ──
  useEffect(() => {
    let cancelled = false;
    let retried = false;

    const load = () => {
      adminGetAllTutorials()
        .then((rows) => {
          if (cancelled) return;
          console.log('[AdminTutorials] Loaded', rows.length, 'tutorials');
          setTutorials(rows);
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;
          // Retry once after 1.5 s if the session wasn't ready yet
          if (!retried && /no active session/i.test(err?.message || '')) {
            retried = true;
            console.warn('[AdminTutorials] Session not ready, retrying in 1.5 s…');
            setTimeout(() => { if (!cancelled) load(); }, 1500);
            return;
          }
          console.error('[AdminTutorials] Fetch failed:', err);
          const msg = err?.message || 'Failed to load tutorials.';
          const hint = err?.hint ? ` Hint: ${err.hint}` : '';
          const code = err?.code ? ` (code ${err.code})` : '';
          setError(`${msg}${code}${hint}`);
          setLoading(false);
        });
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Auto-dismiss success ──
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    navigate('/admin/login', { replace: true });
  };

  // ── Open modal for new/edit ──
  const openNew = () => {
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (t: Tutorial) => {
    setForm({
      id: t.id,
      title: t.title,
      title_ar: t.title_ar ?? '',
      description: t.description ?? '',
      description_ar: t.description_ar ?? '',
      youtube_url: t.youtube_url,
      thumbnail_url: t.thumbnail_url ?? '',
      sort_order: t.sort_order,
      is_published: t.is_published,
    });
    setFormError('');
    setShowModal(true);
  };

  // ── Save (create or update) ──
  const handleSave = async () => {
    setFormError('');

    // Validate
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    if (!form.youtube_url.trim()) { setFormError('YouTube URL is required.'); return; }
    if (!isValidYouTubeUrl(form.youtube_url.trim())) {
      setFormError('Invalid YouTube URL. Accepted formats: youtube.com/watch?v=... or youtu.be/...');
      return;
    }

    setSaving(true);
    try {
      const payload: TutorialInput = {
        title: form.title,
        title_ar: form.title_ar,
        description: form.description,
        description_ar: form.description_ar,
        youtube_url: form.youtube_url,
        thumbnail_url: form.thumbnail_url,
        sort_order: form.sort_order,
        is_published: form.is_published,
      };
      console.log('[AdminTutorials] Saving payload:', JSON.stringify(payload, null, 2), '| id:', form.id ?? 'NEW');

      if (form.id) {
        const updated = await adminUpdateTutorial(form.id, form);
        setTutorials((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setSuccessMsg('Tutorial updated successfully!');
      } else {
        const created = await adminCreateTutorial(form);
        setTutorials((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setSuccessMsg('Tutorial created successfully!');
      }
      setShowModal(false);
    } catch (err: any) {
      const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      console.error('[AdminTutorials] Save failed:', err);
      setFormError(msg || 'Failed to save tutorial.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (id: string) => {
    try {
      await adminDeleteTutorial(id);
      setTutorials((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirm(null);
      setSuccessMsg('Tutorial deleted successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to delete tutorial.');
    }
  };

  // ── Toggle published ──
  const togglePublished = async (t: Tutorial) => {
    try {
      const updated = await adminUpdateTutorial(t.id, {
        title: t.title,
        title_ar: t.title_ar,
        description: t.description,
        description_ar: t.description_ar,
        youtube_url: t.youtube_url,
        thumbnail_url: t.thumbnail_url,
        sort_order: t.sort_order,
        is_published: !t.is_published,
      });
      setTutorials((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setSuccessMsg(updated.is_published ? 'Tutorial published!' : 'Tutorial unpublished.');
    } catch (err: any) {
      setError(err.message || 'Failed to update tutorial.');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#fafbfc' }}>
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #ED3B91, #08B8FB)' }}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
            </Link>
            <span className="text-lg font-bold text-slate-900">Tutorials</span>
            <span className="text-lg text-slate-400 font-light">CMS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/help" target="_blank" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
              View Public Site
            </Link>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 transition-colors">
              Exit CMS
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Success Toast */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {successMsg}
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Header + New Tutorial Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tutorials</h1>
            <p className="text-sm text-slate-500 mt-1">
              {tutorials.length} tutorial{tutorials.length !== 1 ? 's' : ''} total.
            </p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Tutorial
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
            <button onClick={() => setError('')} className="ml-2 underline">dismiss</button>
          </div>
        )}

        {/* Tutorial List */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading tutorials...</div>
        ) : tutorials.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <p className="text-slate-500 mb-4">No tutorials yet.</p>
            <button onClick={openNew} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Create the first tutorial
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tutorials.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Thumbnail preview */}
                  {t.thumbnail_url && (
                    <img
                      src={t.thumbnail_url}
                      alt=""
                      className="w-16 h-10 rounded-lg object-cover flex-shrink-0 bg-slate-100"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{t.title}</h3>
                      {t.is_published ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                          Published
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      Order: {t.sort_order} · {t.youtube_url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {/* Published toggle */}
                  <button
                    onClick={() => togglePublished(t)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${t.is_published ? 'bg-emerald-400' : 'bg-slate-200'}`}
                    title={t.is_published ? 'Unpublish' : 'Publish'}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${t.is_published ? 'left-5' : 'left-0.5'}`}
                    />
                  </button>

                  <button
                    onClick={() => openEdit(t)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Edit
                  </button>

                  {deleteConfirm === t.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(t.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════
          MODAL — New / Edit Tutorial
          ══════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setShowModal(false)} />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-6">
                {form.id ? 'Edit Tutorial' : 'New Tutorial'}
              </h2>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                  {formError}
                </div>
              )}

              {/* Title (EN) */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-700">
                  Title (EN) <span className="text-red-400">*</span>
                </span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  placeholder="e.g. Creating Your First Class"
                />
              </label>

              {/* Title (AR) */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-700">Title (AR)</span>
                <input
                  type="text"
                  dir="rtl"
                  value={form.title_ar ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  placeholder="مثال: إنشاء فصلك الأول"
                />
              </label>

              {/* Description (EN) */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-700">Description (EN)</span>
                <textarea
                  rows={2}
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none"
                  placeholder="Brief description of the tutorial"
                />
              </label>

              {/* Description (AR) */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-700">Description (AR)</span>
                <textarea
                  rows={2}
                  dir="rtl"
                  value={form.description_ar ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description_ar: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none"
                  placeholder="وصف مختصر للدرس"
                />
              </label>

              {/* YouTube URL */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-700">
                  YouTube URL <span className="text-red-400">*</span>
                </span>
                <input
                  type="url"
                  value={form.youtube_url}
                  onChange={(e) => setForm((f) => ({ ...f, youtube_url: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <span className="text-xs text-slate-400 mt-1 block">
                  Accepts youtube.com/watch?v=... and youtu.be/...
                </span>
              </label>

              {/* Thumbnail URL */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-700">Thumbnail URL</span>
                <input
                  type="url"
                  value={form.thumbnail_url ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  placeholder="Leave empty to auto-generate from YouTube"
                />
              </label>

              {/* Sort order + Published */}
              <div className="flex gap-4 mb-6">
                <label className="block flex-1">
                  <span className="text-sm font-medium text-slate-700">Sort Order</span>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                    className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  />
                </label>
                <label className="flex items-center gap-2 mt-6 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Published</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {saving ? 'Saving...' : form.id ? 'Update Tutorial' : 'Create Tutorial'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
