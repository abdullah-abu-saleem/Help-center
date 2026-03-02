import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  adminGetSectionById,
  adminGetAllCategories,
  adminCreateSection,
  adminUpdateSection,
  isSessionError,
  type HcCategory,
} from '../../lib/helpCenterApi';

export default function AdminSectionEditorFlat() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = !id;

  const [categories, setCategories] = useState<HcCategory[]>([]);
  const [category, setCategory] = useState<HcCategory | null>(null);
  const [form, setForm] = useState({
    category_id: '',
    slug: '',
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    icon: '',
    sort_order: 0,
    is_published: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const cats = await adminGetAllCategories();
        setCategories(cats);

        if (!isNew && id) {
          const section = await adminGetSectionById(id);
          if (!section) {
            setError('Section not found.');
            return;
          }
          setForm({
            category_id: section.category_id,
            slug: section.slug,
            title: section.title,
            title_ar: section.title_ar || '',
            description: section.description || '',
            description_ar: section.description_ar || '',
            icon: section.icon || '',
            sort_order: section.sort_order,
            is_published: section.is_published,
          });
          const cat = cats.find((c) => c.id === section.category_id) || null;
          setCategory(cat);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isNew]);

  const handleSave = async () => {
    setError('');

    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!form.slug.trim()) {
      setError('Slug is required.');
      return;
    }
    if (!form.category_id) {
      setError('Please select a category.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        category_id: form.category_id,
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        title: form.title.trim(),
        title_ar: form.title_ar.trim() || null,
        description: form.description.trim(),
        description_ar: form.description_ar.trim() || null,
        icon: form.icon.trim(),
        sort_order: form.sort_order,
        is_published: form.is_published,
      };

      if (isNew) {
        await adminCreateSection(payload);
        navigate('/admin/help-center/sections?success=created');
      } else {
        await adminUpdateSection(id!, payload);
        navigate('/admin/help-center/sections?success=updated');
      }
    } catch (err: any) {
      if (isSessionError(err)) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err.message || 'Failed to save section.');
    } finally {
      setSaving(false);
    }
  };

  const autoSlug = () => {
    if (form.title && !form.slug) {
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
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen glass-bg">
      {/* Top Bar */}
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/help-center/sections"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <span className="text-lg font-bold text-slate-900">
              {isNew ? 'New Section' : 'Edit Section'}
            </span>
            {category && (
              <span className="text-sm text-slate-400">in {category.title}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isNew && form.is_published && category && (
              <a
                href={`/#/help-center/${category.slug}/${form.slug}`}
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

      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Section Details Card */}
          <div className="glass-card rounded-2xl p-8 space-y-6 relative overflow-hidden">
            <div className="admin-card-accent" style={{ background: 'linear-gradient(135deg, #ed3b91, #d6257a)' }} />
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Section Details</h2>

            {/* Category selector */}
            {isNew ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
                <select
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all bg-white"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                >
                  <option value="">Select a category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}{!c.is_published ? ' (Inactive)' : ''}</option>
                  ))}
                </select>
              </div>
            ) : category && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <div className="px-4 py-3 text-sm rounded-xl border border-slate-100 bg-slate-50 text-slate-600">
                  {category.title}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title (English) *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all"
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
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all"
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
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all font-mono"
                placeholder="getting-started"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
              <p className="text-xs text-slate-400 mt-1">Auto-generated from title if left empty.</p>
            </div>

            {/* Description EN + AR */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (English)</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all resize-none"
                  placeholder="A brief description of this section..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (Arabic)</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all resize-none"
                  placeholder="وصف موجز لهذا القسم..."
                  dir="rtl"
                  value={form.description_ar}
                  onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                />
              </div>
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Icon</label>
              <input
                type="text"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all"
                placeholder="folder, rocket, shield, book..."
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
              />
              <p className="text-xs text-slate-400 mt-1">Icon name used by the frontend (e.g. &quot;folder&quot;, &quot;rocket&quot;).</p>
            </div>

            {/* Sort Order + Is Active */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sort Order</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-slate-300 text-primary-500 focus:ring-primary-400 focus:ring-offset-0 transition-all"
                    checked={form.is_published}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-slate-700">Is Active</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link
              to="/admin/help-center/sections"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #ed3b91, #d6257a)' }}
            >
              {saving ? 'Saving...' : isNew ? 'Create Section' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
