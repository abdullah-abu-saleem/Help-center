import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { blogStore, BlogAuthError } from '../lib/blog';
import { useDataRefresh } from '../lib/dataEvents';
import type { BlogComment } from '../types';

// ─── Sanitize HTML to prevent XSS ───────────────────────────────────────────

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

// ─── Comment component ──────────────────────────────────────────────────────

const CommentItem: React.FC<{
  comment: BlogComment;
  canDelete: boolean;
  onDelete: (id: string) => void;
}> = ({ comment, canDelete, onDelete }) => (
  <div className="flex gap-3 py-4 border-b border-slate-50 last:border-b-0">
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #ED3B91, #08B8FB)' }}
    >
      {comment.userName.charAt(0)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold text-slate-800">{comment.userName}</span>
        <span className="text-xs text-slate-400">{formatCommentDate(comment.createdAt)}</span>
        {canDelete && (
          <button
            onClick={() => onDelete(comment.id)}
            className="ml-auto text-xs text-slate-300 hover:text-red-400 transition-colors"
            title="Delete comment"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
    </div>
  </div>
);

// ─── Main component ─────────────────────────────────────────────────────────

export default function BlogPostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const { localize } = useI18n();

  const [post, setPost] = useState<import('../types').BlogPost | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // ── Fetch post from Supabase ──
  const fetchPost = useCallback(() => {
    if (!postId) { setLoading(false); return; }
    blogStore.getById(postId)
      .then((data) => {
        setPost(data);
        if (data) {
          setLikeCount(data.likes);
          setComments(blogStore.getComments(postId));
          if (user) setLiked(blogStore.hasUserLiked(postId, user.id));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId, user]);

  useEffect(() => { fetchPost(); }, [fetchPost]);
  useDataRefresh(['blog_posts'], fetchPost);
  const [commentText, setCommentText] = useState('');

  const mins = useMemo(() => (post ? readingTime(post.body) : 0), [post]);

  const handleLike = useCallback(() => {
    if (!user || !postId) return;
    try {
      const isNowLiked = blogStore.toggleLike(user, postId);
      setLiked(isNowLiked);
      setLikeCount((prev) => (isNowLiked ? prev + 1 : Math.max(0, prev - 1)));
    } catch (e) {
      if (e instanceof BlogAuthError) alert(e.message);
    }
  }, [user, postId]);

  const handleComment = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !postId || !commentText.trim()) return;
      try {
        const newComment = blogStore.addComment(user, postId, commentText.trim());
        setComments((prev) => [...prev, newComment]);
        setCommentText('');
        setPost((prev) => (prev ? { ...prev, comments: prev.comments + 1 } : prev));
      } catch (e) {
        if (e instanceof BlogAuthError) alert(e.message);
      }
    },
    [user, postId, commentText],
  );

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      try {
        blogStore.deleteComment(user, commentId);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setPost((prev) => (prev ? { ...prev, comments: Math.max(0, prev.comments - 1) } : prev));
      } catch (e) {
        if (e instanceof BlogAuthError) alert(e.message);
      }
    },
    [user],
  );

  // ── Loading ──
  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#ED3B91] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Loading post...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Not found ──
  if (!post) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Post Not Found</h1>
            <p className="text-sm text-slate-500 mb-6">The post you're looking for doesn't exist or has been removed.</p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #ff4da6, #ED3B91)' }}
            >
              Back to Blog
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Draft guard: drafts are not visible on the public page ──
  if (post.status === 'draft') {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Post Not Found</h1>
            <p className="text-sm text-slate-500 mb-6">This post is not published yet.</p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #ff4da6, #ED3B91)' }}
            >
              Back to Blog
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* ── Article header ── */}
      <div style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #f0f9ff 50%, #faf5ff 100%)', borderBottom: '1px solid #f1f5f9' }}>
        <div className="mx-auto px-6 py-10 md:py-14" style={{ maxWidth: 780 }}>
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#ED3B91] transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Blog
          </Link>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-3 py-1 text-xs font-medium rounded-full"
                  style={{ background: 'rgba(237,59,145,0.08)', color: '#ED3B91' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
            {localize(post, 'title') || post.title}
          </h1>

          {/* Meta row */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #ED3B91, #08B8FB)' }}
              >
                {post.authorName.charAt(0)}
              </div>
              <span className="text-sm font-medium text-slate-700">{post.authorName}</span>
            </div>
            <span className="text-sm text-slate-400">{formatDate(post.publishedAt)}</span>
            <span className="text-sm text-slate-400">{mins} min read</span>
          </div>

        </div>
      </div>

      {/* ── Article body ── */}
      <article className="mx-auto px-6 py-10" style={{ maxWidth: 780 }}>
        {/* Post content */}
        <div
          className="blog-prose"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(localize(post, 'body') || post.body) }}
        />

        {/* ── Engagement bar ── */}
        <div
          className="flex items-center gap-4 mt-10 pt-6 border-t border-slate-100"
        >
          {/* Like button */}
          {user ? (
            <button
              onClick={handleLike}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={
                liked
                  ? { background: 'rgba(237,59,145,0.1)', color: '#ED3B91' }
                  : { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }
              }
            >
              <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              {likeCount}
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{ background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0' }}
              title="Sign in to like this post"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              {likeCount}
            </Link>
          )}

          {/* Comment count */}
          <span className="inline-flex items-center gap-2 text-sm text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Comments section ── */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Comments</h2>

          {/* Comment form */}
          {user ? (
            <form onSubmit={handleComment} className="mb-6">
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-1"
                  style={{ background: 'linear-gradient(135deg, #ED3B91, #08B8FB)' }}
                >
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED3B91]/30 focus:border-[#ED3B91] resize-none transition-all"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: commentText.trim() ? 'linear-gradient(135deg, #ff4da6, #ED3B91)' : '#cbd5e1' }}
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-6 p-5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-sm text-slate-500 mb-3">Please sign in to join the conversation.</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#ED3B91] hover:underline"
              >
                Sign In
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          )}

          {/* Comment list */}
          {comments.length > 0 ? (
            <div className="divide-y-0">
              {comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  canDelete={!!user && user.id === c.userId}
                  onDelete={handleDeleteComment}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
          )}
        </section>
      </article>
    </Layout>
  );
}
