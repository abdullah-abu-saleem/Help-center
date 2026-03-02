import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  adminGetAllCategories,
  adminGetAllSections,
  adminGetAllArticles,
  adminDeleteCategory,
  adminUpdateCategory,
  adminSeedDefaultCategories,
  adminSeedDefaultSections,
  adminGetSectionCount,
  isSessionError,
  type HcCategory,
} from '../../lib/helpCenterApi';
import { CategoryCard } from '../../components/categories/CategoryCard';
import { CategoryGrid } from '../../components/categories/CategoryGrid';

export default function AdminHelpCenterHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState<HcCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Edit Category Modal state ──
  const [editingCategory, setEditingCategory] = useState<HcCategory | null>(null);
  const [editForm, setEditForm] = useState({
    title: '', title_ar: '', description: '', description_ar: '',
    icon: '', sort_order: 0, is_published: true,
  });
  const [editSaving, setEditSaving] = useState(false);

  // ── Data consistency stats ──
  const [dbStats, setDbStats] = useState<{ categories: number; sections: number; articles: number } | null>(null);

  // ── Success toast from URL params ──
  useEffect(() => {
    const success = searchParams.get('success');
    if (success) {
      const messages: Record<string, string> = {
        created: 'Category created successfully!',
        updated: 'Category updated successfully!',
        deleted: 'Category deleted successfully!',
      };
      setSuccessMsg(messages[success] || 'Operation completed.');
      navigate(location.pathname, { replace: true });
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate, location.pathname]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      let data = await adminGetAllCategories();

      // Auto-seed default categories if the table is empty
      if (data.length === 0) {
        console.log('[AdminHelpCenterHub] hc_categories table is empty — seeding defaults…');
        try {
          data = await adminSeedDefaultCategories();
          console.log('[AdminHelpCenterHub] Seeded', data.length, 'default categories.');
        } catch (seedErr: any) {
          console.error('[AdminHelpCenterHub] Failed to seed default categories:', seedErr);
        }
      }

      setCategories(data);

      // Fetch consistency stats in parallel
      try {
        const [allSecs, allArts] = await Promise.all([
          adminGetAllSections(),
          adminGetAllArticles(),
        ]);
        setDbStats({ categories: data.length, sections: allSecs.length, articles: allArts.length });
      } catch { /* stats are non-critical */ }

      // Auto-seed default sections if any category exists but has no sections
      if (data.length > 0) {
        try {
          const firstCatCount = await adminGetSectionCount(data[0].id);
          if (firstCatCount === 0) {
            console.log('[AdminHelpCenterHub] hc_sections appears empty — seeding defaults…');
            await adminSeedDefaultSections();
            console.log('[AdminHelpCenterHub] Sections seeded.');
          }
        } catch (seedErr: any) {
          console.error('[AdminHelpCenterHub] Failed to seed sections:', seedErr);
        }
      }
    } catch (err: any) {
      console.error('[AdminHelpCenterHub] Failed to load categories:', err);
      if (isSessionError(err)) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await adminDeleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setDeleteConfirm(null);
      setSuccessMsg('Category deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      if (isSessionError(err)) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err.message || 'Failed to delete category.');
    }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    navigate('/admin/login', { replace: true });
  };

  // ── Edit Category modal helpers ──
  const openEditModal = (cat: HcCategory) => {
    setEditForm({
      title: cat.title,
      title_ar: cat.title_ar || '',
      description: cat.description,
      description_ar: cat.description_ar || '',
      icon: cat.icon || '',
      sort_order: cat.sort_order,
      is_published: cat.is_published,
    });
    setEditingCategory(cat);
  };

  const closeEditModal = () => {
    setEditingCategory(null);
    setEditSaving(false);
  };

  const handleEditSave = async () => {
    if (!editingCategory) return;
    if (!editForm.title.trim()) { setError('Title is required.'); return; }
    try {
      setEditSaving(true);
      await adminUpdateCategory(editingCategory.id, {
        title: editForm.title.trim(),
        title_ar: editForm.title_ar.trim() || null,
        description: editForm.description.trim(),
        description_ar: editForm.description_ar.trim() || null,
        icon: editForm.icon.trim(),
        sort_order: editForm.sort_order,
        is_published: editForm.is_published,
      });
      setSuccessMsg('Category updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      closeEditModal();
      fetchCategories();
    } catch (err: any) {
      if (isSessionError(err)) { navigate('/admin/login', { replace: true }); return; }
      setError(err.message || 'Failed to update category.');
      setEditSaving(false);
    }
  };

  // ── Filtered categories ──
  const filtered = useMemo(() => {
    let list = categories;
    if (filterActive === 'active') list = list.filter((c) => c.is_published);
    if (filterActive === 'inactive') list = list.filter((c) => !c.is_published);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.title.toLowerCase().includes(q) || c.slug.includes(q),
      );
    }
    return list;
  }, [categories, search, filterActive]);

  return (
    <div className="min-h-screen glass-bg">
      {/* Top Bar */}
      <header className="glass-header sticky top-0 z-40">
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
            <span className="text-lg font-bold text-slate-900">Help Center</span>
            <span className="admin-badge">ADMIN</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/help-center"
              target="_blank"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              View Public Site
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 glass-card rounded-xl p-1 w-fit">
          <Link
            to="/admin/help-center/categories"
            className="px-5 py-2 text-sm font-semibold bg-[#ed3b91] text-white rounded-lg shadow-sm"
          >
            Categories
          </Link>
          <Link
            to="/admin/help-center/sections"
            className="px-5 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-white/60 rounded-lg transition-all"
          >
            Sections
          </Link>
          <Link
            to="/admin/help-center/articles"
            className="px-5 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-white/60 rounded-lg transition-all"
          >
            All Articles
          </Link>
        </div>

        {/* Data Consistency Stats */}
        {dbStats && (
          <div className="mb-6 px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs text-slate-500 flex items-center gap-4">
            <span className="font-medium text-slate-600">Supabase:</span>
            <span>{dbStats.categories} categories</span>
            <span className="text-slate-300">|</span>
            <span>{dbStats.sections} sections</span>
            <span className="text-slate-300">|</span>
            <span>{dbStats.articles} articles</span>
          </div>
        )}

        {/* Header + New Category Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Categories</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage help center categories and their articles.
            </p>
          </div>
          <Link
            to="/admin/help-center/category/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #ed3b91, #d6257a)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Category
          </Link>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm search-glow rounded-xl border border-slate-200/60">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-transparent outline-none transition-all placeholder-slate-400"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterActive(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterActive === f
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
            <button onClick={() => setError('')} className="ml-2 underline">dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Loading categories...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
            </div>
            <p className="text-slate-500 mb-4">
              {search || filterActive !== 'all' ? 'No categories match your filters.' : 'No categories yet.'}
            </p>
            {!search && filterActive === 'all' && (
              <Link
                to="/admin/help-center/category/new"
                className="text-sm font-semibold text-primary-500 hover:text-primary-800"
              >
                Create your first category
              </Link>
            )}
          </div>
        ) : (
          <CategoryGrid>
            {filtered.map((cat, idx) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                index={idx}
                lang="en"
                onSingleClick={() => navigate(`/admin/help-center/category/${cat.id}/manage`)}
                onDoubleClick={() => openEditModal(cat)}
              />
            ))}
          </CategoryGrid>
        )}
      </main>

      {/* ── Edit Category Modal ── */}
      {editingCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={closeEditModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Category</h3>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title (English)</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                />
              </div>

              {/* Title AR */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title (Arabic)</label>
                <input
                  type="text"
                  dir="rtl"
                  value={editForm.title_ar}
                  onChange={(e) => setEditForm((f) => ({ ...f, title_ar: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none"
                />
              </div>

              {/* Description AR */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Arabic)</label>
                <textarea
                  rows={2}
                  dir="rtl"
                  value={editForm.description_ar}
                  onChange={(e) => setEditForm((f) => ({ ...f, description_ar: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none"
                />
              </div>

              {/* Icon + Sort Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Icon</label>
                  <input
                    type="text"
                    value={editForm.icon}
                    onChange={(e) => setEditForm((f) => ({ ...f, icon: e.target.value }))}
                    placeholder="e.g. folder"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={editForm.sort_order}
                    onChange={(e) => setEditForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                  />
                </div>
              </div>

              {/* Published */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editForm.is_published}
                  onChange={(e) => setEditForm((f) => ({ ...f, is_published: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-slate-700">Published</span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #ed3b91, #d6257a)' }}
              >
                {editSaving ? 'Saving\u2026' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
