import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  adminGetCategoryById,
  adminGetSectionsByCategory,
  adminGetArticlesBySection,
  adminCreateSection,
  adminUpdateSection,
  adminDeleteSection,
  adminDeleteArticle,
  adminUpdateArticle,
  isSessionError,
  type HcCategory,
  type HcSection,
  type HcArticle,
} from '../../lib/helpCenterApi';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface SectionWithArticles extends HcSection {
  articles: HcArticle[];
  articlesLoading: boolean;
}

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function AdminCategoryManagement() {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();

  const [category, setCategory] = useState<HcCategory | null>(null);
  const [sections, setSections] = useState<SectionWithArticles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Section modal
  const [sectionModal, setSectionModal] = useState<{
    open: boolean;
    editing: HcSection | null;
  }>({ open: false, editing: null });
  const [sectionForm, setSectionForm] = useState({
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    slug: '',
    icon: '',
    sort_order: 0,
    is_published: true,
  });
  const [sectionSaving, setSectionSaving] = useState(false);

  // Delete confirms
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);

  // Success toast
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  /* ── Stable refs (prevent useCallback/useEffect churn) ──────────────── */

  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const fetchingRef = useRef(false);

  /* ── Fetch ─────────────────────────────────────────────────────────────── */

  const fetchData = useCallback(async () => {
    if (!categoryId || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const [cat, secs] = await Promise.all([
        adminGetCategoryById(categoryId),
        adminGetSectionsByCategory(categoryId),
      ]);
      if (!cat) {
        setError('Category not found.');
        setLoading(false);
        return;
      }
      setCategory(cat);

      const initial: SectionWithArticles[] = secs.map((s) => ({
        ...s,
        articles: [],
        articlesLoading: true,
      }));
      setSections(initial);
      setLoading(false);

      // Fetch articles per section in parallel
      const results = await Promise.allSettled(
        secs.map((s) => adminGetArticlesBySection(s.id)),
      );
      setSections((prev) =>
        prev.map((sec, i) => ({
          ...sec,
          articles:
            results[i].status === 'fulfilled'
              ? (results[i] as PromiseFulfilledResult<HcArticle[]>).value
              : [],
          articlesLoading: false,
        })),
      );
    } catch (err: any) {
      if (isSessionError(err)) {
        navigateRef.current('/admin/login', { replace: true });
        return;
      }
      setError(err.message || 'Failed to load data.');
      setLoading(false);
    } finally {
      fetchingRef.current = false;
    }
  }, [categoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Section modal ─────────────────────────────────────────────────────── */

  const openAddSection = () => {
    setSectionForm({
      title: '',
      title_ar: '',
      description: '',
      description_ar: '',
      slug: '',
      icon: '',
      sort_order: sections.length * 10,
      is_published: true,
    });
    setSectionModal({ open: true, editing: null });
  };

  const openEditSection = (sec: HcSection) => {
    setSectionForm({
      title: sec.title,
      title_ar: sec.title_ar || '',
      description: sec.description || '',
      description_ar: sec.description_ar || '',
      slug: sec.slug,
      icon: sec.icon || '',
      sort_order: sec.sort_order,
      is_published: sec.is_published,
    });
    setSectionModal({ open: true, editing: sec });
  };

  const handleSaveSection = async () => {
    if (!sectionForm.title.trim()) {
      setError('Section title is required.');
      return;
    }
    const slug =
      sectionForm.slug.trim() ||
      sectionForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    setSectionSaving(true);
    setError('');
    try {
      const payload = {
        category_id: categoryId!,
        slug,
        title: sectionForm.title.trim(),
        title_ar: sectionForm.title_ar.trim() || null,
        description: sectionForm.description.trim(),
        description_ar: sectionForm.description_ar.trim() || null,
        icon: sectionForm.icon.trim(),
        sort_order: sectionForm.sort_order,
        is_published: sectionForm.is_published,
      };

      if (sectionModal.editing) {
        await adminUpdateSection(sectionModal.editing.id, payload);
        showSuccess('Section updated.');
      } else {
        await adminCreateSection(payload);
        showSuccess('Section created.');
      }
      setSectionModal({ open: false, editing: null });
    } catch (err: any) {
      if (isSessionError(err)) {
        navigateRef.current('/admin/login', { replace: true });
        return;
      }
      setError(err.message || 'Failed to save section.');
      return;
    } finally {
      setSectionSaving(false);
    }
    // Single controlled refetch after modal closes and saving clears
    fetchData();
  };

  /* ── Delete handlers ───────────────────────────────────────────────────── */

  const handleDeleteSection = async (id: string) => {
    try {
      await adminDeleteSection(id);
      setSections((prev) => prev.filter((s) => s.id !== id));
      setDeletingSectionId(null);
      showSuccess('Section deleted.');
    } catch (err: any) {
      if (isSessionError(err)) {
        navigateRef.current('/admin/login', { replace: true });
        return;
      }
      setError(err.message || 'Failed to delete section.');
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    try {
      await adminDeleteArticle(articleId);
      setSections((prev) =>
        prev.map((sec) => ({
          ...sec,
          articles: sec.articles.filter((a) => a.id !== articleId),
        })),
      );
      setDeletingArticleId(null);
      showSuccess('Article deleted.');
    } catch (err: any) {
      if (isSessionError(err)) {
        navigateRef.current('/admin/login', { replace: true });
        return;
      }
      setError(err.message || 'Failed to delete article.');
    }
  };

  /* ── Toggle publish ────────────────────────────────────────────────────── */

  const handleTogglePublish = async (article: HcArticle) => {
    try {
      await adminUpdateArticle(article.id, {
        is_published: !article.is_published,
      });
      setSections((prev) =>
        prev.map((sec) => ({
          ...sec,
          articles: sec.articles.map((a) =>
            a.id === article.id
              ? { ...a, is_published: !a.is_published }
              : a,
          ),
        })),
      );
      showSuccess(
        article.is_published ? 'Article unpublished.' : 'Article published.',
      );
    } catch (err: any) {
      if (isSessionError(err)) {
        navigateRef.current('/admin/login', { replace: true });
        return;
      }
      setError(err.message || 'Failed to update article.');
    }
  };

  /* ── Return-to path for article editor ─────────────────────────────────── */

  const returnTo = encodeURIComponent(
    `/admin/help-center/category/${categoryId}/manage`,
  );

  /* ── Render ────────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center glass-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen glass-bg">
      {/* ── Top Bar ── */}
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </Link>
            <span className="text-lg font-bold text-slate-900">
              {category?.title || 'Category'}
            </span>
            <span className="admin-badge">ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={`/admin/help-center/category/${categoryId}/edit`}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                />
              </svg>
              Edit Category
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Success Toast */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-emerald-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              {successMsg}
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-400 hover:text-emerald-600"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-center justify-between">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-2 underline text-red-400 hover:text-red-600"
            >
              dismiss
            </button>
          </div>
        )}

        {/* ── Category header card ── */}
        <div className="glass-card rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div
            className="admin-card-accent"
            style={{
              background: 'linear-gradient(135deg, #ed3b91, #d6257a)',
            }}
          />
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {category?.title}
                </h1>
                {category && !category.is_published && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-medium">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {category?.description || 'No description.'}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                /{category?.slug} &middot; {sections.length} section
                {sections.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={openAddSection}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #ed3b91, #d6257a)',
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Add Section
            </button>
          </div>
        </div>

        {/* ── Sections list ── */}
        {sections.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-slate-300"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
                />
              </svg>
            </div>
            <p className="text-slate-500 mb-4">
              No sections in this category yet.
            </p>
            <button
              onClick={openAddSection}
              className="text-sm font-semibold text-primary-500 hover:text-primary-700"
            >
              Create your first section
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((sec) => (
              <div
                key={sec.id}
                className="glass-card rounded-2xl overflow-hidden"
              >
                {/* Section header */}
                <div className="px-6 py-5 border-b border-slate-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">
                          {sec.title}
                        </h2>
                        {!sec.is_published && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-medium">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        /{sec.slug} &middot; Order: {sec.sort_order} &middot;{' '}
                        {sec.articles.length} article
                        {sec.articles.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditSection(sec)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Edit
                    </button>
                    {deletingSectionId === sec.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDeleteSection(sec.id)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingSectionId(null)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingSectionId(sec.id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Articles list */}
                <div>
                  {sec.articlesLoading ? (
                    <div className="px-6 py-8 text-center">
                      <div className="w-5 h-5 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin mx-auto" />
                    </div>
                  ) : sec.articles.length === 0 ? (
                    <div className="px-6 py-8 text-center text-sm text-slate-400">
                      No articles in this section yet.
                    </div>
                  ) : (
                    sec.articles.map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between px-6 py-3.5 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <svg
                            className="w-4 h-4 text-slate-300 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                            />
                          </svg>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {article.title}
                            </p>
                            <p className="text-xs text-slate-400">
                              /{article.slug}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          {/* Publish toggle */}
                          <button
                            onClick={() => handleTogglePublish(article)}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
                              article.is_published
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {article.is_published ? 'Published' : 'Draft'}
                          </button>

                          {/* Edit */}
                          <Link
                            to={`/admin/help-center/articles/edit/${article.id}?returnTo=${returnTo}`}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            Edit
                          </Link>

                          {/* Delete */}
                          {deletingArticleId === article.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  handleDeleteArticle(article.id)
                                }
                                className="px-2.5 py-1 text-[11px] font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeletingArticleId(null)}
                                className="px-2.5 py-1 text-[11px] font-medium text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                setDeletingArticleId(article.id)
                              }
                              className="px-2.5 py-1 text-[11px] font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Add Article link */}
                  <div className="px-6 py-3 border-t border-slate-100/60">
                    <Link
                      to={`/admin/help-center/articles/new?categoryId=${categoryId}&sectionId=${sec.id}&returnTo=${returnTo}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-primary-700 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                      Add Article
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Section Add/Edit Modal ── */}
      {sectionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {sectionModal.editing ? 'Edit Section' : 'New Section'}
              </h3>
              <button
                onClick={() =>
                  setSectionModal({ open: false, editing: null })
                }
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all"
                    placeholder="Getting Started"
                    value={sectionForm.title}
                    onChange={(e) =>
                      setSectionForm({ ...sectionForm, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Title (Arabic)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all"
                    placeholder="البدء"
                    dir="rtl"
                    value={sectionForm.title_ar}
                    onChange={(e) =>
                      setSectionForm({
                        ...sectionForm,
                        title_ar: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all font-mono"
                  placeholder="getting-started (auto-generated)"
                  value={sectionForm.slug}
                  onChange={(e) =>
                    setSectionForm({ ...sectionForm, slug: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all resize-none"
                    placeholder="Brief description..."
                    value={sectionForm.description}
                    onChange={(e) =>
                      setSectionForm({
                        ...sectionForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description (Arabic)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all resize-none"
                    placeholder="وصف موجز..."
                    dir="rtl"
                    value={sectionForm.description_ar}
                    onChange={(e) =>
                      setSectionForm({
                        ...sectionForm,
                        description_ar: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all"
                    value={sectionForm.sort_order}
                    onChange={(e) =>
                      setSectionForm({
                        ...sectionForm,
                        sort_order: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-slate-300 text-primary-500 focus:ring-primary-400 focus:ring-offset-0 transition-all"
                      checked={sectionForm.is_published}
                      onChange={(e) =>
                        setSectionForm({
                          ...sectionForm,
                          is_published: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Active
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() =>
                  setSectionModal({ open: false, editing: null })
                }
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSection}
                disabled={sectionSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #ed3b91, #d6257a)',
                }}
              >
                {sectionSaving
                  ? 'Saving...'
                  : sectionModal.editing
                    ? 'Save Changes'
                    : 'Create Section'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
