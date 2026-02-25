import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  adminGetAllSections,
  adminGetAllCategories,
  adminDeleteSection,
  isSessionError,
  type HcSectionWithCategory,
  type HcCategory,
} from '../../lib/helpCenterApi';

export default function AdminSectionListAll() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [sections, setSections] = useState<HcSectionWithCategory[]>([]);
  const [categories, setCategories] = useState<HcCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Pre-select category from URL ──
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setCategoryFilter(cat);
  }, [searchParams]);

  // ── Success toast from URL params ──
  useEffect(() => {
    const success = searchParams.get('success');
    if (success) {
      const messages: Record<string, string> = {
        created: 'Section created successfully!',
        updated: 'Section updated successfully!',
        deleted: 'Section deleted successfully!',
      };
      setSuccessMsg(messages[success] || 'Operation completed.');
      // Clear only the success param, keep category
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('success');
      const qs = newParams.toString();
      navigate(location.pathname + (qs ? `?${qs}` : ''), { replace: true });
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate, location.pathname]);

  useEffect(() => {
    Promise.all([adminGetAllSections(), adminGetAllCategories()])
      .then(([secs, cats]) => {
        setSections(secs);
        setCategories(cats);
      })
      .catch((err) => setError(err.message || 'Failed to load data.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await adminDeleteSection(id);
      setSections((prev) => prev.filter((s) => s.id !== id));
      setDeleteConfirm(null);
      setSuccessMsg('Section deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      if (isSessionError(err)) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err.message || 'Failed to delete section.');
    }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    navigate('/admin/login', { replace: true });
  };

  // ── Filtered sections ──
  const filtered = useMemo(() => {
    let list = sections;
    if (statusFilter === 'active') list = list.filter((s) => s.is_published);
    if (statusFilter === 'inactive') list = list.filter((s) => !s.is_published);
    if (categoryFilter !== 'all') list = list.filter((s) => s.category_id === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q),
      );
    }
    return list;
  }, [sections, search, statusFilter, categoryFilter]);

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
            <span className="text-lg font-bold text-slate-900">Help Center CMS</span>
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
        <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
          <Link
            to="/admin/help-center/categories"
            className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            Categories
          </Link>
          <Link
            to="/admin/help-center/sections"
            className="px-4 py-2.5 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 -mb-px"
          >
            Sections
          </Link>
          <Link
            to="/admin/help-center/articles"
            className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            All Articles
          </Link>
        </div>

        {/* Header + New Section Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">All Sections</h1>
            <p className="text-sm text-slate-500 mt-1">
              {sections.length} section{sections.length !== 1 ? 's' : ''} across all categories.
            </p>
          </div>
          <Link
            to="/admin/help-center/sections/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Section
          </Link>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search sections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter === f
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
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
          <div className="text-center py-20 text-slate-400">Loading sections...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
            </div>
            <p className="text-slate-500 mb-4">
              {search || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'No sections match your filters.'
                : 'No sections yet.'}
            </p>
            {!search && statusFilter === 'all' && categoryFilter === 'all' && (
              <Link
                to="/admin/help-center/sections/new"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Create the first section
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((section) => (
              <div
                key={section.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99, 102, 241, 0.08)' }}
                  >
                    <svg className="w-5 h-5" style={{ color: '#6366f1' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{section.title}</h3>
                      {!section.is_published && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {section.hc_categories?.title && (
                        <span className="text-indigo-500">{section.hc_categories.title}</span>
                      )}
                      {section.hc_categories?.title && ' · '}
                      /{section.slug}
                      {' · '}
                      order: {section.sort_order}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {section.is_published && section.hc_categories?.slug && (
                    <a
                      href={`/#/help-center/${section.hc_categories.slug}/${section.slug}`}
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
                    to={`/admin/help-center/articles?section=${section.id}`}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    Articles
                  </Link>
                  <Link
                    to={`/admin/help-center/sections/edit/${section.id}`}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Edit
                  </Link>
                  {deleteConfirm === section.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(section.id)}
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
                      onClick={() => setDeleteConfirm(section.id)}
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
    </div>
  );
}
