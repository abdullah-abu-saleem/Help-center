import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useI18n } from '../lib/i18n';
import { blogStore } from '../lib/blog';
import { useDataRefresh } from '../lib/dataEvents';
import type { BlogPost } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

// ─── Tag list (derived from all posts) ──────────────────────────────────────

const ALL_TOPICS = ['teaching', 'parents', 'ai', 'technology', 'getting-started', 'engagement', 'product'] as const;

// ─── Post card ──────────────────────────────────────────────────────────────

const PostCard: React.FC<{ post: BlogPost }> = ({ post }) => {
  const { localize } = useI18n();
  const postTitle = localize(post, 'title') || post.title;
  const postExcerpt = localize(post, 'excerpt') || post.excerpt;

  return (
  <Link
    to={`/blog/${post.id}`}
    className="group block bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-slate-200 hover:-translate-y-0.5"
  >
    <div className="p-6">
      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full"
              style={{ background: 'rgba(237,59,145,0.08)', color: '#ED3B91' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h2 className="text-lg font-bold text-slate-900 group-hover:text-[#ED3B91] transition-colors duration-200 mb-2 leading-snug">
        {postTitle}
      </h2>

      {/* Excerpt */}
      {postExcerpt && (
        <p
          className="text-sm leading-relaxed mb-4"
          style={{
            color: '#64748b',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {postExcerpt}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-xs" style={{ color: '#94a3b8' }}>
        <div className="flex items-center gap-3">
          {/* Author avatar */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #ED3B91, #08B8FB)' }}
            >
              {post.authorName.charAt(0)}
            </div>
            <span className="font-medium text-slate-600">{post.authorName}</span>
          </div>
          <span>{formatDate(post.publishedAt)}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Read time */}
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {readingTime(post.body)} min
          </span>

          {/* Likes */}
          <span className="flex items-center gap-1" style={{ color: '#f472b6' }}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
            </svg>
            {post.likes}
          </span>

          {/* Comments */}
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            {post.comments}
          </span>
        </div>
      </div>
    </div>
  </Link>
  );
};

// ─── Staff Picks (right rail) ───────────────────────────────────────────────

const StaffPicks: React.FC<{ posts: BlogPost[] }> = ({ posts }) => {
  const { localize } = useI18n();
  const top = posts
    .slice()
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-[#ED3B91]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
        </svg>
        Staff Picks
      </h3>
      <div className="space-y-4">
        {top.map((post) => (
          <Link key={post.id} to={`/blog/${post.id}`} className="group block">
            <h4 className="text-sm font-semibold text-slate-800 group-hover:text-[#ED3B91] transition-colors leading-snug mb-1">
              {localize(post, 'title') || post.title}
            </h4>
            <p className="text-xs text-slate-400">
              {post.authorName} · {formatDate(post.publishedAt)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

// ─── Topics widget (right rail) ─────────────────────────────────────────────

const TopicsWidget: React.FC<{
  active: string | null;
  onSelect: (t: string | null) => void;
}> = ({ active, onSelect }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5">
    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
      Topics
    </h3>
    <div className="flex flex-wrap gap-2">
      {ALL_TOPICS.map((t) => (
        <button
          key={t}
          onClick={() => onSelect(active === t ? null : t)}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
          style={
            active === t
              ? { background: '#ED3B91', color: '#fff' }
              : { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }
          }
        >
          {t}
        </button>
      ))}
    </div>
  </div>
);

// ─── Main feed page ─────────────────────────────────────────────────────────

export default function BlogFeed() {
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [published, setPublished] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(() => {
    blogStore.getPublished()
      .then(setPublished)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useDataRefresh(['blog_posts'], fetchPosts);

  const displayPosts = useMemo(() => {
    if (!activeTopic) return published;
    return published.filter((p) => p.tags?.includes(activeTopic));
  }, [published, activeTopic]);

  return (
    <Layout>
      {/* ── Header banner ── */}
      <div
        className="w-full"
        style={{
          background: 'linear-gradient(135deg, #fdf2f8 0%, #f0f9ff 50%, #faf5ff 100%)',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div className="mx-auto px-6 py-10 md:py-14" style={{ maxWidth: 1200 }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
                String Blog
              </h1>
              <p className="text-base text-slate-500 max-w-lg">
                Insights, tips, and updates from the String team to help you make the most of education technology.
              </p>
            </div>
            {/* Account actions removed from public blog header */}
          </div>
        </div>
      </div>

      {/* ── Content area: 3-column layout ── */}
      <div className="mx-auto px-6 py-8" style={{ maxWidth: 1200 }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left navigation (hidden on mobile) */}
          <aside className="hidden lg:block lg:col-span-2">
            <div className="sticky top-[90px]">
              <nav className="space-y-1">
                <Link
                  to="/blog"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[#ED3B91] bg-pink-50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  Feed
                </Link>
                <Link
                  to="/help"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                  </svg>
                  Help Center
                </Link>
                <Link
                  to="/help/resources"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  Resources
                </Link>
              </nav>

            </div>
          </aside>

          {/* Center feed */}
          <main className="lg:col-span-7">
            {loading ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-[#ED3B91] rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-slate-500">Loading posts...</p>
              </div>
            ) : displayPosts.length === 0 ? (
              <div className="text-center py-20">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 text-slate-300 mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm">
                  {activeTopic ? 'No posts found for this topic.' : 'No posts yet.'}
                </p>
                {activeTopic && (
                  <button
                    onClick={() => setActiveTopic(null)}
                    className="mt-3 text-sm font-medium text-[#ED3B91] hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {displayPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </main>

          {/* Right rail */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-[90px] space-y-5">
              <StaffPicks posts={published} />
              <TopicsWidget active={activeTopic} onSelect={setActiveTopic} />
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
