import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useI18n } from '../lib/i18n';
import {
  getHcCategoryBySlug,
  getHcSectionsByCategory,
  getHcSectionBySlug,
  getHcSectionBySlugOnly,
  getHcArticlesBySection,
  getHcArticlesBySectionSlug,
  type HcCategory,
  type HcSectionWithCategory,
  type HcArticle,
} from '../lib/helpCenterApi';
import { useDataRefresh } from '../lib/dataEvents';

export default function HelpCenterSection() {
  const { categorySlug, sectionSlug } = useParams<{
    categorySlug: string;
    sectionSlug: string;
  }>();
  const { lang } = useI18n();
  const [category, setCategory] = useState<HcCategory | null>(null);
  const [section, setSection] = useState<HcSectionWithCategory | null>(null);
  const [articles, setArticles] = useState<HcArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(() => {
    if (!categorySlug || !sectionSlug) return;
    setLoading(true);
    console.log('[HelpCenterSection] fetching — categorySlug:', categorySlug, 'sectionSlug:', sectionSlug);
    getHcCategoryBySlug(categorySlug)
      .then(async (cat) => {
        if (!cat) {
          setError('Category not found.');
          return;
        }
        setCategory(cat);

        let sec = await getHcSectionBySlug(cat.id, sectionSlug);
        // Fallback: if category-scoped lookup fails, try slug-only
        if (!sec) {
          console.warn('[HelpCenterSection] category-scoped lookup returned null, trying slug-only for:', sectionSlug);
          sec = await getHcSectionBySlugOnly(sectionSlug) as any;
        }
        if (!sec) {
          setError('Section not found.');
          return;
        }
        console.log('[HelpCenterSection] section found — id:', sec.id, 'slug:', sec.slug);
        setSection(sec);

        const arts = await getHcArticlesBySection(sec.id);
        console.log('[HelpCenterSection] articles loaded:', arts.length);
        setArticles(arts);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [categorySlug, sectionSlug]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useDataRefresh(['hc_sections', 'hc_articles'], fetchData);

  const localized = (en: string, ar: string | null) =>
    lang === 'ar' && ar ? ar : en;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-6 py-20 text-center text-slate-400">
          Loading...
        </div>
      </Layout>
    );
  }

  if (error || !category || !section) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <p className="text-red-500 mb-4">{error || 'Section not found.'}</p>
          <Link
            to={categorySlug ? `/help-center/${categorySlug}` : '/help-center'}
            className="text-sm text-primary-500 hover:text-primary-700"
          >
            Back
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <nav className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
          <Link to="/help-center" className="hover:text-slate-600 transition-colors">
            Help Center
          </Link>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <Link
            to={`/help-center/${category.slug}`}
            className="hover:text-slate-600 transition-colors"
          >
            {localized(category.title, category.title_ar)}
          </Link>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-slate-700 font-medium">
            {localized(section.title, section.title_ar)}
          </span>
        </nav>
      </div>

      {/* Section Header */}
      <div className="max-w-4xl mx-auto px-6 pt-6 pb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {localized(section.title, section.title_ar)}
        </h1>
        {section.description && (
          <p className="text-slate-500">
            {localized(section.description, section.description_ar)}
          </p>
        )}
      </div>

      {/* Articles */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        {articles.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            No articles in this section yet.
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/help-center/${category.slug}/${section.slug}/${article.slug}`}
                className="group block bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md hover:border-slate-200 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0 mt-0.5 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-slate-900 group-hover:text-primary-600 transition-colors mb-1">
                      {localized(article.title, article.title_ar)}
                    </h3>
                    {article.summary && (
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {localized(article.summary, article.summary_ar)}
                      </p>
                    )}
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {article.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <svg
                    className="w-5 h-5 text-slate-300 group-hover:text-primary-400 transition-colors flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="mt-8">
          <Link
            to={`/help-center/${category.slug}`}
            className="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to {localized(category.title, category.title_ar)}
          </Link>
        </div>
      </div>
    </Layout>
  );
}
