import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { blogStore } from '../../lib/blog';
import { supabase } from '../../lib/supabase';
import type { BlogPost } from '../../types';

export default function AdminBlogList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Load posts ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await blogStore.getAll();
        if (!cancelled) setPosts(data);
      } catch (err: any) {
        console.error('[AdminBlogList] Load failed:', err);
        if (!cancelled) setError(err?.code === '42501' ? 'Access denied – admin required' : (err.message || 'Failed to load posts'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Success toast from URL params ──
  useEffect(() => {
    const success = searchParams.get('success');
    if (success) {
      const messages: Record<string, string> = {
        created: 'Blog post created successfully!',
        updated: 'Blog post updated successfully!',
        published: 'Blog post published!',
        unpublished: 'Blog post unpublished.',
        deleted: 'Blog post deleted!',
        saved: 'Draft saved successfully!',
      };
      setSuccessMsg(messages[success] || 'Operation completed.');
      navigate(location.pathname, { replace: true });
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate, location.pathname]);

  const handleDelete = async (id: string) => {
    try {
      await blogStore.remove(user, id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
      setSuccessMsg('Blog post deleted!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('[AdminBlogList] Delete failed:', err);
      setError(err?.code === '42501' ? 'Access denied – admin required' : (err.message || 'Failed to delete post.'));
    }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    navigate('/admin/login', { replace: true });
  };

  // ── Filtered posts ──
  const filtered = useMemo(() => {
    let list = posts;
    if (statusFilter === 'published') list = list.filter((p) => p.status === 'published');
    if (statusFilter === 'draft') list = list.filter((p) => p.status === 'draft');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  }, [posts, search, statusFilter]);

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
            <span className="text-lg font-bold text-slate-900">Blog Management</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/blog"
              target="_blank"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              View Public Blog
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

        {/* Header + New Post Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Blog Posts</h1>
            <p className="text-sm text-slate-500 mt-1">
              {posts.length} post{posts.length !== 1 ? 's' : ''} total.
            </p>
          </div>
          <Link
            to="/admin/blog/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #ED3B91, #ff4da6)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Post
          </Link>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'published', 'draft'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter === f
                    ? 'bg-pink-100 text-pink-700'
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
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#ED3B91] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Loading posts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
              </svg>
            </div>
            <p className="text-slate-500 mb-4">
              {search || statusFilter !== 'all' ? 'No posts match your filters.' : 'No blog posts yet.'}
            </p>
            {!search && statusFilter === 'all' && (
              <Link
                to="/admin/blog/new"
                className="text-sm font-semibold text-[#ED3B91] hover:text-pink-700"
              >
                Create your first post
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(237, 59, 145, 0.08)' }}
                  >
                    <svg className="w-5 h-5" style={{ color: '#ED3B91' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{post.title}</h3>
                      {post.status === 'published' ? (
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
                      by {post.authorName} &middot;{' '}
                      {new Date(post.publishedAt).toLocaleDateString()}
                      {post.tags && post.tags.length > 0 && ` · ${post.tags.join(', ')}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {post.status === 'published' && (
                    <a
                      href={`/#/blog/${post.id}`}
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
                    to={`/admin/blog/edit/${post.id}`}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Edit
                  </Link>
                  {deleteConfirm === post.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(post.id)}
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
                      onClick={() => setDeleteConfirm(post.id)}
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
