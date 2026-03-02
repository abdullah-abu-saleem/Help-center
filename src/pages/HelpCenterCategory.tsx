import React, { useState, useEffect, useCallback } from 'react';
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
import { HelpCenterShell } from '../components/theme/HelpCenterShell';
import { ResourcesShell } from '../components/resources/ResourcesShell';
import { COLORS } from '../theme/colors';

export default function HelpCenterCategory() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { lang } = useI18n();
  const [category, setCategory] = useState<HcCategory | null>(null);
  const [sections, setSections] = useState<HcSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(() => {
    if (!categorySlug) return;
    setLoading(true);
    getHcCategoryBySlug(categorySlug)
      .then(async (cat) => {
        if (!cat) {
          setError('Category not found.');
          return;
        }
        setCategory(cat);
        const secs = await getHcSectionsByCategory(cat.id);
        setSections(secs);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [categorySlug]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useDataRefresh(['hc_categories', 'hc_sections'], fetchData);

  const localized = (en: string, ar: string | null) =>
    lang === 'ar' && ar ? ar : en;

  if (loading) {
    return (
      <Layout>
        <HelpCenterShell noBg>
        <ResourcesShell>
          <div className="max-w-4xl mx-auto px-6 py-20 text-center" style={{ color: COLORS.neutralLight }}>
            Loading...
          </div>
        </ResourcesShell>
        </HelpCenterShell>
      </Layout>
    );
  }

  if (error || !category) {
    return (
      <Layout>
        <HelpCenterShell noBg>
        <ResourcesShell>
          <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <p className="text-red-500 mb-4">{error || 'Category not found.'}</p>
            <Link to="/help-center" className="text-sm text-primary-500 hover:text-primary-700">
              Back to Help Center
            </Link>
          </div>
        </ResourcesShell>
        </HelpCenterShell>
      </Layout>
    );
  }

  return (
    <Layout>
      <HelpCenterShell noBg>
      <ResourcesShell>
        {/* Breadcrumbs */}
        <div className="max-w-4xl mx-auto px-6 pt-8">
          <nav className="flex items-center gap-2 text-sm" style={{ color: COLORS.neutralLight }}>
            <Link to="/help-center" className="hover:opacity-80 transition-opacity">
              Help Center
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <span style={{ color: COLORS.neutral }} className="font-medium">
              {localized(category.title, category.title_ar)}
            </span>
          </nav>
        </div>

        {/* Category Header */}
        <div className="max-w-4xl mx-auto px-6 pt-6 pb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: COLORS.neutral }}
          >
            {localized(category.title, category.title_ar)}
          </h1>
          {category.description && (
            <p style={{ color: COLORS.neutralLight }}>
              {localized(category.description, category.description_ar)}
            </p>
          )}
        </div>

        {/* Sections */}
        <div className="max-w-4xl mx-auto px-6 pb-20">
          {sections.length === 0 ? (
            <div className="text-center py-16" style={{ color: COLORS.neutralLight }}>
              No sections in this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sections.map((section) => (
                <Link
                  key={section.id}
                  to={`/help-center/${category.slug}/${section.slug}`}
                  className="group block rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    boxShadow: '0 0 0 1px rgba(9,30,66,0.06), 0 4px 24px rgba(0,0,0,0.05)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-[15px] font-semibold group-hover:text-primary-600 transition-colors mb-1"
                        style={{ color: COLORS.neutral }}
                      >
                        {localized(section.title, section.title_ar)}
                      </h3>
                      {section.description && (
                        <p className="text-sm line-clamp-2" style={{ color: COLORS.neutralLight }}>
                          {localized(section.description, section.description_ar)}
                        </p>
                      )}
                    </div>
                    <svg
                      className="w-5 h-5 group-hover:text-primary-400 transition-colors flex-shrink-0 mt-1"
                      style={{ color: COLORS.border }}
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
      </ResourcesShell>
      </HelpCenterShell>
    </Layout>
  );
}
