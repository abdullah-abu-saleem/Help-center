import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useI18n } from '../lib/i18n';
import {
  getHcCategoryBySlug,
  getHcSectionsByCategory,
  type HcCategory,
  type HcSection,
} from '../lib/helpCenterApi';
import { useDataRefresh } from '../lib/dataEvents';

export default function HelpCenterCategory() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { lang } = useI18n();
  const [category, setCategory] = useState<HcCategory | null>(null);
  const [sections, setSections] = useState<HcSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasData = useRef(false);

  useEffect(() => { console.log('[HC_CATEGORY] mounted, slug:', categorySlug); }, []);

  const fetchData = useCallback(() => {
    if (!categorySlug) { setLoading(false); return; }
    // Only show spinner on first load — preserve visible data during refetches
    if (!hasData.current) setLoading(true);
    if (import.meta.env.DEV) console.log('[HelpCenterCategory] fetchData START, slug:', categorySlug);
    getHcCategoryBySlug(categorySlug)
      .then(async (cat) => {
        if (!cat) {
          if (!hasData.current) setError('Category not found.');
          return;
        }
        setCategory(cat);
        const secs = await getHcSectionsByCategory(cat.id);
        setSections(secs);
        setError('');
        hasData.current = true;
        if (import.meta.env.DEV) console.log('[HelpCenterCategory] fetchData END, sections:', secs.length);
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.warn('[HelpCenterCategory] fetchData FAILED:', err.message);
        // Only show error if we have no previously-loaded data
        if (!hasData.current) setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [categorySlug]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useDataRefresh(['hc_categories', 'hc_sections'], fetchData);

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

  if (error || !category) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <p className="text-red-500 mb-4">{error || 'Category not found.'}</p>
          <Link to="/help-center" className="text-sm text-indigo-600 hover:text-indigo-800">
            Back to Help Center
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <nav className="flex items-center gap-2 text-sm text-slate-400">
          <Link to="/help-center" className="hover:text-slate-600 transition-colors">
            Help Center
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-slate-700 font-medium">
            {localized(category.title, category.title_ar)}
          </span>
        </nav>
      </div>

      {/* Category Header */}
      <div className="max-w-4xl mx-auto px-6 pt-6 pb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {localized(category.title, category.title_ar)}
        </h1>
        {category.description && (
          <p className="text-slate-500">
            {localized(category.description, category.description_ar)}
          </p>
        )}
      </div>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        {sections.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            No sections in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sections.map((section) => (
              <Link
                key={section.id}
                to={`/help-center/${category.slug}/${section.slug}`}
                className="group block bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md hover:border-slate-200 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                      {localized(section.title, section.title_ar)}
                    </h3>
                    {section.description && (
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {localized(section.description, section.description_ar)}
                      </p>
                    )}
                  </div>
                  <svg
                    className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-1"
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
      </div>
    </Layout>
  );
}
