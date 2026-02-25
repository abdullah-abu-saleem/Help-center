import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  adminGetAllTutorials,
  adminGetTutorialsByAudience,
  adminCreateTutorial,
  adminUpdateTutorial,
  adminDeleteTutorial,
  adminGetTutorialItems,
  adminCreateTutorialItem,
  adminUpdateTutorialItem,
  adminDeleteTutorialItem,
  isValidYouTubeUrl,
  type TutorialInput,
  type TutorialItem,
  type TutorialItemInput,
} from '../../lib/tutorialsApi';
import type { Tutorial } from '../../types';

/* ═══════════════════════════════════════════════════
   Constants & helpers
   ═══════════════════════════════════════════════════ */

const AUDIENCES = [
  { key: 'teacher', label: 'Teachers' },
  { key: 'student', label: 'Students' },
  { key: 'families', label: 'Families' },
] as const;

type AudienceKey = (typeof AUDIENCES)[number]['key'];

const emptyTutorialForm: TutorialInput & { id?: string } = {
  title: '',
  title_ar: '',
  description: '',
  description_ar: '',
  audience: 'teacher',
  youtube_url: '',
  thumbnail_url: '',
  sort_order: 0,
  is_published: false,
};

const emptyItemForm: TutorialItemInput & { id?: string } = {
  tutorial_id: '',
  title: '',
  title_ar: '',
  description: '',
  description_ar: '',
  youtube_url: '',
  link: '',
  thumbnail_url: '',
  resource_type: 'watch',
  sort_order: 0,
  is_published: true,
};

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */

export default function AdminTutorials() {
  const navigate = useNavigate();

  // Audience tab
  const [audience, setAudience] = useState<AudienceKey>('teacher');

  // Tutorial list
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Tutorial modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<TutorialInput & { id?: string }>(emptyTutorialForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Expanded tutorial → items
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [items, setItems] = useState<TutorialItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState<TutorialItemInput & { id?: string }>(emptyItemForm);
  const [itemFormError, setItemFormError] = useState('');
  const [itemSaving, setItemSaving] = useState(false);
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<string | null>(null);

  // ── Load tutorials by audience ──
  const loadTutorials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await adminGetTutorialsByAudience(audience);
      setTutorials(rows);
    } catch (err: any) {
      // Retry once if session not ready
      if (/no active session/i.test(err?.message || '')) {
        await new Promise((r) => setTimeout(r, 1500));
        try {
          const rows = await adminGetTutorialsByAudience(audience);
          setTutorials(rows);
        } catch (e2: any) {
          setError(e2?.message || 'Failed to load tutorials.');
        }
      } else {
        setError(err?.message || 'Failed to load tutorials.');
      }
    } finally {
      setLoading(false);
    }
  }, [audience]);

  useEffect(() => {
    loadTutorials();
    setExpandedId(null);
    setItems([]);
  }, [loadTutorials]);

  // ── Auto-dismiss success ──
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  // ── Load items when expanding a tutorial ──
  const toggleExpand = async (tutorialId: string) => {
    if (expandedId === tutorialId) {
      setExpandedId(null);
      setItems([]);
      return;
    }
    setExpandedId(tutorialId);
    setItemsLoading(true);
    try {
      const rows = await adminGetTutorialItems(tutorialId);
      setItems(rows);
    } catch {
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    navigate('/admin/login', { replace: true });
  };

  /* ─── Tutorial CRUD ─── */

  const openNew = () => {
    setForm({ ...emptyTutorialForm, audience });
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
      audience: (t as any).audience ?? audience,
      youtube_url: t.youtube_url,
      thumbnail_url: t.thumbnail_url ?? '',
      sort_order: t.sort_order,
      is_published: t.is_published,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    if (!form.youtube_url.trim()) { setFormError('YouTube URL is required.'); return; }
    if (!isValidYouTubeUrl(form.youtube_url.trim())) {
      setFormError('Invalid YouTube URL. Accepted formats: youtube.com/watch?v=... or youtu.be/...');
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        const updated = await adminUpdateTutorial(form.id, form);
        // If audience changed, remove from current list
        if ((updated as any).audience !== audience) {
          setTutorials((prev) => prev.filter((t) => t.id !== updated.id));
        } else {
          setTutorials((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        }
        setSuccessMsg('Tutorial updated successfully!');
      } else {
        const created = await adminCreateTutorial(form);
        if ((created as any).audience === audience) {
          setTutorials((prev) =>
            [...prev, created].sort(
              (a, b) => a.sort_order - b.sort_order || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          );
        }
        setSuccessMsg('Tutorial created successfully!');
      }
      setShowModal(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save tutorial.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminDeleteTutorial(id);
      setTutorials((prev) => prev.filter((t) => t.id !== id));
      if (expandedId === id) { setExpandedId(null); setItems([]); }
      setDeleteConfirm(null);
      setSuccessMsg('Tutorial deleted successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to delete tutorial.');
    }
  };

  const togglePublished = async (t: Tutorial) => {
    try {
      const updated = await adminUpdateTutorial(t.id, {
        title: t.title,
        title_ar: t.title_ar,
        description: t.description,
        description_ar: t.description_ar,
        audience: (t as any).audience ?? audience,
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

  /* ─── Tutorial Item CRUD ─── */

  const openNewItem = (tutorialId: string) => {
    setItemForm({ ...emptyItemForm, tutorial_id: tutorialId });
    setItemFormError('');
    setShowItemModal(true);
  };

  const openEditItem = (item: TutorialItem) => {
    setItemForm({
      id: item.id,
      tutorial_id: item.tutorial_id,
      title: item.title,
      title_ar: item.title_ar ?? '',
      description: item.description ?? '',
      description_ar: item.description_ar ?? '',
      youtube_url: item.youtube_url ?? '',
      link: item.link ?? '',
      thumbnail_url: item.thumbnail_url ?? '',
      resource_type: item.resource_type || 'watch',
      sort_order: item.sort_order,
      is_published: item.is_published,
    });
    setItemFormError('');
    setShowItemModal(true);
  };

  const handleSaveItem = async () => {
    setItemFormError('');
    if (!itemForm.title.trim()) { setItemFormError('Title is required.'); return; }
    if (itemForm.resource_type === 'watch' && itemForm.youtube_url && !isValidYouTubeUrl(itemForm.youtube_url.trim())) {
      setItemFormError('Invalid YouTube URL.');
      return;
    }

    setItemSaving(true);
    try {
      if (itemForm.id) {
        const updated = await adminUpdateTutorialItem(itemForm.id, itemForm);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        setSuccessMsg('Item updated!');
      } else {
        const created = await adminCreateTutorialItem(itemForm);
        setItems((prev) =>
          [...prev, created].sort((a, b) => a.sort_order - b.sort_order)
        );
        setSuccessMsg('Item created!');
      }
      setShowItemModal(false);
    } catch (err: any) {
      setItemFormError(err?.message || 'Failed to save item.');
    } finally {
      setItemSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await adminDeleteTutorialItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setDeleteItemConfirm(null);
      setSuccessMsg('Item deleted!');
    } catch (err: any) {
      setError(err.message || 'Failed to delete item.');
    }
  };

  /* ═══════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════ */

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

        {/* ── Audience Tabs ── */}
        <div className="flex items-center gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1 w-fit">
          {AUDIENCES.map((a) => (
            <button
              key={a.key}
              onClick={() => setAudience(a.key)}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                audience === a.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Header + New Tutorial Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {AUDIENCES.find((a) => a.key === audience)?.label} Tutorials
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {tutorials.length} tutorial{tutorials.length !== 1 ? 's' : ''} for this audience.
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
            <p className="text-slate-500 mb-4">No tutorials for {AUDIENCES.find((a) => a.key === audience)?.label} yet.</p>
            <button onClick={openNew} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Create the first tutorial
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tutorials.map((t) => (
              <div key={t.id}>
                {/* Tutorial Row */}
                <div
                  className={`bg-white rounded-2xl border p-5 flex items-center justify-between hover:shadow-sm transition-shadow ${
                    expandedId === t.id ? 'border-indigo-200 shadow-sm' : 'border-slate-100'
                  }`}
                >
                  <div
                    className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                    onClick={() => toggleExpand(t.id)}
                  >
                    {/* Expand chevron */}
                    <svg
                      className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                        expandedId === t.id ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>

                    {t.thumbnail_url && (
                      <img src={t.thumbnail_url} alt="" className="w-16 h-10 rounded-lg object-cover flex-shrink-0 bg-slate-100" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">{t.title}</h3>
                        {t.is_published ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Published</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">Draft</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        Order: {t.sort_order} · {t.youtube_url}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
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

                {/* ── Expanded Items Panel ── */}
                {expandedId === t.id && (
                  <div className="ml-8 mt-2 mb-4 bg-slate-50 rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-700">
                        Tutorial Items ({items.length})
                      </h4>
                      <button
                        onClick={() => openNewItem(t.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Item
                      </button>
                    </div>

                    {itemsLoading ? (
                      <div className="text-center py-6 text-slate-400 text-sm">Loading items...</div>
                    ) : items.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-sm">
                        No items yet.{' '}
                        <button onClick={() => openNewItem(t.id)} className="text-indigo-600 hover:underline font-medium">
                          Add the first item
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {item.thumbnail_url && (
                                <img src={item.thumbnail_url} alt="" className="w-12 h-8 rounded-lg object-cover flex-shrink-0 bg-slate-100" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-medium text-slate-800 truncate">{item.title}</h5>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                    item.resource_type === 'watch'
                                      ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                      : item.resource_type === 'download'
                                      ? 'bg-violet-50 text-violet-600 border border-violet-100'
                                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                                  }`}>
                                    {item.resource_type}
                                  </span>
                                  {!item.is_published && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">Draft</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5 truncate">
                                  Order: {item.sort_order}
                                  {item.youtube_url && ` · ${item.youtube_url}`}
                                  {item.link && ` · ${item.link}`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                              <button
                                onClick={() => openEditItem(item)}
                                className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                Edit
                              </button>
                              {deleteItemConfirm === item.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="px-2.5 py-1 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setDeleteItemConfirm(null)}
                                    className="px-2.5 py-1 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteItemConfirm(item.id)}
                                  className="px-2.5 py-1 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                  Del
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-6">
                {form.id ? 'Edit Tutorial' : 'New Tutorial'}
              </h2>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">{formError}</div>
              )}

              {/* Audience selector */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-700">Audience <span className="text-red-400">*</span></span>
                <select
                  value={form.audience ?? audience}
                  onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all bg-white"
                >
                  {AUDIENCES.map((a) => (
                    <option key={a.key} value={a.key}>{a.label}</option>
                  ))}
                </select>
              </label>

              {/* Title (EN) */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-700">Title (EN) <span className="text-red-400">*</span></span>
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
                  placeholder="العنوان بالعربية"
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
                <span className="text-sm font-medium text-slate-700">YouTube URL <span className="text-red-400">*</span></span>
                <input
                  type="url"
                  value={form.youtube_url}
                  onChange={(e) => setForm((f) => ({ ...f, youtube_url: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <span className="text-xs text-slate-400 mt-1 block">Accepts youtube.com/watch?v=... and youtu.be/...</span>
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

      {/* ══════════════════════════════════════════════════════
          MODAL — New / Edit Tutorial Item
          ══════════════════════════════════════════════════════ */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !itemSaving && setShowItemModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-6">
                {itemForm.id ? 'Edit Item' : 'New Item'}
              </h2>

              {itemFormError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">{itemFormError}</div>
              )}

              {/* Resource Type */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-700">Type</span>
                <select
                  value={itemForm.resource_type ?? 'watch'}
                  onChange={(e) => setItemForm((f) => ({ ...f, resource_type: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all bg-white"
                >
                  <option value="watch">Watch (Video)</option>
                  <option value="download">Download</option>
                  <option value="open">Open (Link)</option>
                </select>
              </label>

              {/* Title (EN) */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-700">Title (EN) <span className="text-red-400">*</span></span>
                <input
                  type="text"
                  value={itemForm.title}
                  onChange={(e) => setItemForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  placeholder="e.g. How to Create an Assignment"
                />
              </label>

              {/* Title (AR) */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-700">Title (AR)</span>
                <input
                  type="text"
                  dir="rtl"
                  value={itemForm.title_ar ?? ''}
                  onChange={(e) => setItemForm((f) => ({ ...f, title_ar: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  placeholder="العنوان بالعربية"
                />
              </label>

              {/* Description (EN) */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-700">Description (EN)</span>
                <textarea
                  rows={2}
                  value={itemForm.description ?? ''}
                  onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none"
                />
              </label>

              {/* Description (AR) */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-700">Description (AR)</span>
                <textarea
                  rows={2}
                  dir="rtl"
                  value={itemForm.description_ar ?? ''}
                  onChange={(e) => setItemForm((f) => ({ ...f, description_ar: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none"
                />
              </label>

              {/* YouTube URL (for watch type) */}
              {(itemForm.resource_type === 'watch' || !itemForm.resource_type) && (
                <label className="block mb-4">
                  <span className="text-sm font-medium text-slate-700">YouTube URL</span>
                  <input
                    type="url"
                    value={itemForm.youtube_url ?? ''}
                    onChange={(e) => setItemForm((f) => ({ ...f, youtube_url: e.target.value }))}
                    className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </label>
              )}

              {/* Link (for download/open type) */}
              {(itemForm.resource_type === 'download' || itemForm.resource_type === 'open') && (
                <label className="block mb-4">
                  <span className="text-sm font-medium text-slate-700">Link URL</span>
                  <input
                    type="url"
                    value={itemForm.link ?? ''}
                    onChange={(e) => setItemForm((f) => ({ ...f, link: e.target.value }))}
                    className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                    placeholder="https://..."
                  />
                </label>
              )}

              {/* Thumbnail URL */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-slate-700">Thumbnail URL</span>
                <input
                  type="url"
                  value={itemForm.thumbnail_url ?? ''}
                  onChange={(e) => setItemForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
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
                    value={itemForm.sort_order}
                    onChange={(e) => setItemForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                    className="mt-1 w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  />
                </label>
                <label className="flex items-center gap-2 mt-6 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={itemForm.is_published ?? true}
                    onChange={(e) => setItemForm((f) => ({ ...f, is_published: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Published</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowItemModal(false)}
                  disabled={itemSaving}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  disabled={itemSaving}
                  className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {itemSaving ? 'Saving...' : itemForm.id ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
