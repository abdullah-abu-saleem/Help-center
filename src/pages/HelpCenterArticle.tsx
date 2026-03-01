import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Layout } from '../components/Layout';
import { useI18n } from '../lib/i18n';
import { getHcArticleBySlug, type HcArticleWithSection } from '../lib/helpCenterApi';
import { useDataRefresh } from '../lib/dataEvents';

export default function HelpCenterArticle() {
  const { categorySlug, sectionSlug, articleSlug } = useParams<{
    categorySlug: string;
    sectionSlug: string;
    articleSlug: string;
  }>();
  const { lang } = useI18n();
  const [article, setArticle] = useState<HcArticleWithSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { console.log('[HC_ARTICLE] mounted, slug:', articleSlug); }, []);

  const fetchData = useCallback(() => {
    if (!articleSlug) { setLoading(false); return; }
    setLoading(true);
    getHcArticleBySlug(articleSlug)
      .then((art) => {
        if (!art) {
          setError('Article not found.');
          return;
        }
        setArticle(art);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [articleSlug]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useDataRefresh(['hc_articles'], fetchData);

  const localized = (en: string, ar: string | null) =>
    lang === 'ar' && ar ? ar : en;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center text-slate-400">
          Loading...
        </div>
      </Layout>
    );
  }

  if (error || !article) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-red-500 mb-4">{error || 'Article not found.'}</p>
          <Link
            to={categorySlug && sectionSlug ? `/help-center/${categorySlug}/${sectionSlug}` : '/help-center'}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Back
          </Link>
        </div>
      </Layout>
    );
  }

  const sec = article.hc_sections;
  const cat = sec?.hc_categories;
  const catSlug = cat?.slug || categorySlug || '';
  const catTitle = cat ? localized(cat.title, cat.title_ar) : 'Category';
  const secSlug = sec?.slug || sectionSlug || '';
  const secTitle = sec ? localized(sec.title, sec.title_ar) : 'Section';

  const body = localized(article.body_markdown, article.body_markdown_ar);

  return (
    <Layout>
      {/* Breadcrumbs */}
      <div className="max-w-3xl mx-auto px-6 pt-8">
        <nav className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
          <Link to="/help-center" className="hover:text-slate-600 transition-colors">
            Help Center
          </Link>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <Link to={`/help-center/${catSlug}`} className="hover:text-slate-600 transition-colors">
            {catTitle}
          </Link>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <Link to={`/help-center/${catSlug}/${secSlug}`} className="hover:text-slate-600 transition-colors">
            {secTitle}
          </Link>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-slate-700 font-medium truncate">
            {localized(article.title, article.title_ar)}
          </span>
        </nav>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 pt-8 pb-20">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          {localized(article.title, article.title_ar)}
        </h1>

        {article.summary && (
          <p className="text-slate-500 mb-6">
            {localized(article.summary, article.summary_ar)}
          </p>
        )}

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-8">
            {article.tags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-indigo-600 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </div>

        {article.updated_at && (
          <div className="mt-12 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Last updated: {new Date(article.updated_at).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="mt-8">
          <Link
            to={`/help-center/${catSlug}/${secSlug}`}
            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to {secTitle}
          </Link>
        </div>
      </article>
    </Layout>
  );
}
