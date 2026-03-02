import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  adminGetAllArticles,
  adminGetAllCategories,
  adminGetAllSections,
  adminDeleteArticle,
  isSessionError,
  type HcCategory,
  type HcSection,
  type HcArticleWithSection,
} from '../../lib/helpCenterApi';

export default function AdminArticleListAll() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [articles, setArticles] = useState<HcArticleWithSection[]>([]);
  const [categories, setCategories] = useState<HcCategory[]>([]);
  const [sections, setSections] = useState<(HcSection & { category_id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Pre-select filters from URL ──
  useEffect(() => {
    const cat = searchParams.get('category');
    const sec = searchParams.get('section');
    if (cat) setCategoryFilter(cat);
    if (sec) setSectionFilter(sec);
  }, [searchParams]);

  // ── Success toast from URL params ──
  useEffect(() => {
    const success = searchParams.get('success');
    if (success) {
      const messages: Record<string, string> = {
        created: 'Article created successfully!',
        updated: 'Article updated successfully!',
        published: 'Article published successfully!',
        unpublished: 'Article unpublished.',
        deleted: 'Article deleted successfully!',
        saved: 'Draft saved successfully!',
      };
      setSuccessMsg(messages[success] || 'Operation completed.');
      // Clear only the success param, keep other filters
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('success');
      const qs = newParams.toString();
      navigate(location.pathname + (qs ? `?${qs}` : ''), { replace: true });
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate, location.pathname]);

  useEffect(() => {
    Promise.all([adminGetAllArticles(), adminGetAllCategories(), adminGetAllSections()])
      .then(([arts, cats, secs]) => {
        setArticles(arts);
        setCategories(cats);
        setSections(secs as any);
      })
      .catch((err) => setError(err.message || 'Failed to load data.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await adminDeleteArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);
      setSuccessMsg('Article deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      if (isSessionError(err)) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err.message || 'Failed to delete article.');
    }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    navigate('/admin/login', { replace: true });
  };

  // Sections filtered by category selection
  const filteredSections = useMemo(() => {
    if (categoryFilter === 'all') return sections;
    return sections.filter((s) => s.category_id === categoryFilter);
  }, [sections, categoryFilter]);

  // Reset section filter when category changes
  useEffect(() => {
    if (categoryFilter !== 'all') {
      const valid = sections.some((s) => s.category_id === categoryFilter && s.id === sectionFilter);
      if (!valid && sectionFilter !== 'all') setSectionFilter('all');
    }
  }, [categoryFilter, sections, sectionFilter]);

  // ── Filtered articles ──
  const filtered = useMemo(() => {
    let list = articles;
    if (statusFilter === 'published') list = list.filter((a) => a.is_published);
    if (statusFilter === 'draft') list = list.filter((a) => !a.is_published);
    if (sectionFilter !== 'all') {
      list = list.filter((a) => a.section_id === sectionFilter);
    } else if (categoryFilter !== 'all') {
      list = list.filter((a) => a.hc_sections?.hc_categories && sections.some((s) => s.id === a.section_id && s.category_id === categoryFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.slug.includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [articles, search, statusFilter, categoryFilter, sectionFilter, sections]);

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
            className="px-5 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-white/60 rounded-lg transition-all"
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
            className="px-5 py-2 text-sm font-semibold bg-[#ed3b91] text-white rounded-lg shadow-sm"
          >
            All Articles
          </Link>
        </div>

        {/* Header + New Article Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">All Articles</h1>
            <p className="text-sm text-slate-500 mt-1">
              {articles.length} article{articles.length !== 1 ? 's' : ''} across all sections.
            </p>
          </div>
          <Link
            to="/admin/help-center/articles/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #ed3b91, #d6257a)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Article
          </Link>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm search-glow rounded-xl border border-slate-200/60">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-transparent outline-none transition-all placeholder-slate-400"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'published', 'draft'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter === f
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setSectionFilter('all'); }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-50 outline-none transition-all bg-white"
          >
            <option value="all">All Sections</option>
            {filteredSections.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
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
            <p className="text-sm text-slate-500">Loading articles...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <p className="text-slate-500 mb-4">
              {search || statusFilter !== 'all' || categoryFilter !== 'all' || sectionFilter !== 'all'
                ? 'No articles match your filters.'
                : 'No articles yet.'}
            </p>
            {!search && statusFilter === 'all' && categoryFilter === 'all' && sectionFilter === 'all' && (
              <Link
                to="/admin/help-center/articles/new"
                className="text-sm font-semibold text-primary-500 hover:text-primary-800"
              >
                Create the first article
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((article) => {
              const secSlug = article.hc_sections?.slug;
              const catSlug = article.hc_sections?.hc_categories?.slug;
              const secTitle = article.hc_sections?.title;
              const catTitle = article.hc_sections?.hc_categories?.title;

              return (
                <div
                  key={article.id}
                  className="glass-card rounded-2xl p-5 flex items-center justify-between hover:shadow-lg transition-all relative overflow-hidden"
                >
                  <div className="admin-card-accent" style={{ background: 'linear-gradient(135deg, #ed3b91, #d6257a)' }} />
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-400 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">{article.title}</h3>
                        {article.is_published ? (
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
                        {catTitle && (
                          <span className="text-primary-500">{catTitle}</span>
                        )}
                        {catTitle && secTitle && ' › '}
                        {secTitle && (
                          <span className="text-primary-400">{secTitle}</span>
                        )}
                        {(catTitle || secTitle) && ' · '}
                        /{article.slug}
                        {article.tags.length > 0 && ` · ${article.tags.join(', ')}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {article.is_published && catSlug && secSlug && (
                      <a
                        href={`/#/help-center/${catSlug}/${secSlug}/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        title="View on public site"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    )}
                    <Link
                      to={`/admin/help-center/articles/edit/${article.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Edit
                    </Link>
                    {deleteConfirm === article.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(article.id)}
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
                        onClick={() => setDeleteConfirm(article.id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
