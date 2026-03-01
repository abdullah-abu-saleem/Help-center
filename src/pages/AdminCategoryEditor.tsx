import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  adminGetCategoryById,
  adminCreateCategory,
  adminUpdateCategory,
  type HcCategory,
} from '../lib/helpCenterApi';

export default function AdminCategoryEditor() {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const isNew = categoryId === 'new';

  const [form, setForm] = useState({
    slug: '',
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    icon: 'folder',
    sort_order: 0,
    is_published: true,
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNew && categoryId) {
      if (import.meta.env.DEV) console.log('[EditCategory] loading category id=', categoryId);
      adminGetCategoryById(categoryId)
        .then((cat) => {
          if (cat) {
            if (import.meta.env.DEV) console.log('[EditCategory] init form once, slug=', cat.slug);
            setForm({
              slug: cat.slug,
              title: cat.title,
              title_ar: cat.title_ar || '',
              description: cat.description,
              description_ar: cat.description_ar || '',
              icon: cat.icon,
              sort_order: cat.sort_order,
              is_published: cat.is_published,
            });
          } else {
            setError('Category not found.');
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [categoryId, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!form.slug.trim()) {
      setError('Slug is required.');
      return;
    }

    setSaving(true);
    try {
      const titleEn = form.title.trim();
      const titleAr = form.title_ar.trim();
      const descEn = form.description.trim();
      const descAr = form.description_ar.trim();

      const payload = {
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        title: titleEn || titleAr,
        title_ar: titleAr || titleEn || null,
        description: descEn || descAr,
        description_ar: descAr || descEn || null,
        icon: form.icon.trim() || 'folder',
        sort_order: form.sort_order,
        is_published: form.is_published,
      };

      if (import.meta.env.DEV) console.log('[EditCategory] save start', { isNew, categoryId, payload });

      if (isNew) {
        const created = await adminCreateCategory(payload);
        if (import.meta.env.DEV) console.log('[EditCategory] save end (created)', created.id);
      } else {
        const updated = await adminUpdateCategory(categoryId!, payload);
        if (import.meta.env.DEV) console.log('[EditCategory] save end (updated)', updated.id);
      }

      navigate('/admin/help-center');
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[EditCategory] save error:', err);
      setError(err.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const autoSlug = () => {
    if (form.title && !form.slug) {
      if (import.meta.env.DEV) console.log('[EditCategory] autoslug update from title=', form.title);
      setForm((f) => ({
        ...f,
        slug: f.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center glass-bg">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen glass-bg">
      {/* Top Bar */}
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/help-center"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <span className="text-lg font-bold text-slate-900">
              {isNew ? 'New Category' : 'Edit Category'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6">
          {/* Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title (English)</label>
              <input
                type="text"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                placeholder="Getting Started"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onBlur={autoSlug}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title (Arabic)</label>
              <input
                type="text"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                placeholder="البدء"
                dir="rtl"
                value={form.title_ar}
                onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
              />
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Slug</label>
            <input
              type="text"
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-mono"
              placeholder="getting-started"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <p className="text-xs text-slate-400 mt-1">URL-safe identifier. Auto-generated from title if left empty.</p>
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (English)</label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none"
                placeholder="Help articles for getting started..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (Arabic)</label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none"
                placeholder="مقالات المساعدة للبدء..."
                dir="rtl"
                value={form.description_ar}
                onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
              />
            </div>
          </div>

          {/* Icon + Sort Order + Active */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Icon Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                placeholder="folder"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sort Order</label>
              <input
                type="number"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">Active</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Link
              to="/admin/help-center"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {saving ? 'Saving...' : isNew ? 'Create Category' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
