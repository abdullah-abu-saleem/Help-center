import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  adminGetArticleById,
  adminGetAllCategories,
  adminGetSectionsByCategory,
  adminCreateArticle,
  adminUpdateArticle,
  isSessionError,
  type HcCategory,
  type HcSection,
} from '../../lib/helpCenterApi';

export default function AdminArticleEditorFlat() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = !id;

  const [categories, setCategories] = useState<HcCategory[]>([]);
  const [sections, setSections] = useState<HcSection[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [category, setCategory] = useState<HcCategory | null>(null);
  const [section, setSection] = useState<HcSection | null>(null);
  const [form, setForm] = useState({
    section_id: '',
    slug: '',
    title: '',
    title_ar: '',
    summary: '',
    summary_ar: '',
    body_markdown: '',
    body_markdown_ar: '',
    sort_order: 0,
    is_published: false,
    tags: '',
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
          const article = await adminGetArticleById(id);
          if (!article) {
            setError('Article not found.');
            return;
          }

          // Derive category from nested section data
          const artSection = article.hc_sections;
          const artCategory = artSection?.hc_categories;

          setForm({
            section_id: article.section_id,
            slug: article.slug,
            title: article.title,
            title_ar: article.title_ar || '',
            summary: article.summary,
            summary_ar: article.summary_ar || '',
            body_markdown: article.body_markdown,
            body_markdown_ar: article.body_markdown_ar || '',
            sort_order: article.sort_order,
            is_published: article.is_published,
            tags: (article.tags || []).join(', '),
          });

          // Find full category object and load its sections
          if (artCategory) {
            const cat = cats.find((c) => c.slug === artCategory.slug) || null;
            setCategory(cat);
            if (cat) {
              setSelectedCategoryId(cat.id);
              const secs = await adminGetSectionsByCategory(cat.id);
              setSections(secs);
              const sec = secs.find((s) => s.id === article.section_id) || null;
              setSection(sec);
            }
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isNew]);

  // When category changes, load sections for that category
  const handleCategoryChange = async (catId: string) => {
    setSelectedCategoryId(catId);
    setForm((f) => ({ ...f, section_id: '' }));
    setSection(null);

    const cat = categories.find((c) => c.id === catId) || null;
    setCategory(cat);

    if (catId) {
      try {
        const secs = await adminGetSectionsByCategory(catId);
        setSections(secs);
      } catch {
        setSections([]);
      }
    } else {
      setSections([]);
    }
  };

  const handleSectionChange = (secId: string) => {
    setForm((f) => ({ ...f, section_id: secId }));
    const sec = sections.find((s) => s.id === secId) || null;
    setSection(sec);
  };

  const handleSave = async (publish?: boolean) => {
    setError('');

    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!form.slug.trim()) {
      setError('Slug is required.');
      return;
    }
    if (!form.section_id) {
      setError('Please select a category and section.');
      return;
    }

    const isPublished = publish !== undefined ? publish : form.is_published;

    setSaving(true);
    try {
      const payload = {
        section_id: form.section_id,
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        title: form.title.trim(),
        title_ar: form.title_ar.trim() || null,
        summary: form.summary.trim(),
        summary_ar: form.summary_ar.trim() || null,
        body_markdown: form.body_markdown,
        body_markdown_ar: form.body_markdown_ar || null,
        sort_order: form.sort_order,
        is_published: isPublished,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (isNew) {
        await adminCreateArticle(payload);
        navigate('/admin/help-center/articles?success=created');
      } else {
        await adminUpdateArticle(id!, payload);
        const action = publish === true ? 'published' : publish === false ? 'unpublished' : 'updated';
        navigate(`/admin/help-center/articles?success=${action}`);
      }
    } catch (err: any) {
      if (isSessionError(err)) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err.message || 'Failed to save article.');
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fafbfc' }}>
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#fafbfc' }}>
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/help-center/articles"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <span className="text-lg font-bold text-slate-900">
              {isNew ? 'New Article' : 'Edit Article'}
            </span>
            {category && section && (
              <span className="text-sm text-slate-400">in {category.title} › {section.title}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isNew && form.is_published && category && section && (
              <a
                href={`/#/help-center/${category.slug}/${section.slug}/${form.slug}`}
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
          {/* Basic Info Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Basic Info</h2>

            {/* Cascading Category → Section selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
                <select
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all bg-white"
                  value={selectedCategoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="">Select a category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}{!c.is_active ? ' (Inactive)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Section *</label>
                <select
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all bg-white disabled:opacity-50"
                  value={form.section_id}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  disabled={!selectedCategoryId}
                >
                  <option value="">{selectedCategoryId ? 'Select a section...' : 'Select a category first'}</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}{!s.is_active ? ' (Inactive)' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title (English) *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  placeholder="How to Reset Your Password"
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
                  placeholder="كيفية إعادة تعيين كلمة المرور"
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
                placeholder="how-to-reset-your-password"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
              <p className="text-xs text-slate-400 mt-1">Auto-generated from title if left empty.</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Summary (English)</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none"
                  placeholder="A short description of the article..."
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Summary (Arabic)</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none"
                  placeholder="وصف موجز للمقال..."
                  dir="rtl"
                  value={form.summary_ar}
                  onChange={(e) => setForm({ ...form, summary_ar: e.target.value })}
                />
              </div>
            </div>

            {/* Meta: sort, tags */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Sort Order</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  placeholder="password, reset, account"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Body Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Content (Markdown)</h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Body (English)</label>
              <textarea
                rows={16}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-y font-mono"
                placeholder="# How to Reset Your Password&#10;&#10;Follow these steps to reset..."
                value={form.body_markdown}
                onChange={(e) => setForm({ ...form, body_markdown: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Body (Arabic)</label>
              <textarea
                rows={10}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-y font-mono"
                placeholder="# كيفية إعادة تعيين كلمة المرور"
                dir="rtl"
                value={form.body_markdown_ar}
                onChange={(e) => setForm({ ...form, body_markdown_ar: e.target.value })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link
              to="/admin/help-center/articles"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </Link>
            <div className="flex items-center gap-3">
              {/* Unpublish (only when editing a published article) */}
              {!isNew && form.is_published && (
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all disabled:opacity-50"
                >
                  Unpublish
                </button>
              )}
              {/* Save Draft */}
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              {/* Publish */}
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {saving ? 'Saving...' : isNew ? 'Create & Publish' : 'Save & Publish'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
