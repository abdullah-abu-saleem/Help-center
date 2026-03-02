import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useI18n } from '../lib/i18n';
import { getHcCategories, type HcCategory } from '../lib/helpCenterApi';
import { useDataRefresh } from '../lib/dataEvents';

export default function HelpCenterHome() {
  const { t, lang } = useI18n();
  const [categories, setCategories] = useState<HcCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(() => {
    getHcCategories()
      .then(setCategories)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useDataRefresh(['hc_categories'], fetchData);

  const localized = (en: string, ar: string | null) =>
    lang === 'ar' && ar ? ar : en;

  return (
    <Layout>
      {/* Hero */}
      <section className="relative w-full overflow-hidden hero-mesh">
        <div
          className="aurora-orb aurora-orb-1"
          style={{ width: 400, height: 400, top: '-10%', left: '-5%', background: 'rgba(237,59,145,0.15)' }}
          aria-hidden="true"
        />
        <div
          className="aurora-orb aurora-orb-2"
          style={{ width: 350, height: 350, top: '10%', right: '-8%', background: 'rgba(8,184,251,0.14)' }}
          aria-hidden="true"
        />

        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 60%, rgba(255,255,255,0.5) 80%, #ffffff 100%)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto px-6 text-center max-w-[720px] pt-16 md:pt-20 xl:pt-24 pb-40 md:pb-48">
          <h1
            className="text-4xl md:text-[50px] font-extrabold tracking-tight"
            style={{ lineHeight: 1.1, marginBottom: 16 }}
          >
            <span className="text-slate-900">Help </span>
            <span className="gradient-text">Center</span>
          </h1>
          <p
            className="text-base md:text-lg font-normal mx-auto leading-relaxed"
            style={{ color: '#6882a9', maxWidth: 500 }}
          >
            {t('heroSubtitle') || 'Find answers, tutorials, and guides for everything you need.'}
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section
        className="relative"
        style={{ zIndex: 20, marginTop: -100, paddingBottom: 80 }}
      >
        <div className="mx-auto px-6" style={{ maxWidth: 1100 }}>
          {loading ? (
            <div className="text-center py-16 text-slate-400">Loading categories...</div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500 text-sm mb-2">Failed to load categories</p>
              <p className="text-slate-400 text-xs">{error}</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              No help categories available yet.
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              style={{ gap: 24 }}
            >
              {categories.map((cat, idx) => (
                <Link
                  key={cat.id}
                  to={`/help-center/${cat.slug}`}
                  className="group card-modern flex flex-col fade-up cursor-pointer"
                  style={{
                    padding: 0,
                    minHeight: 200,
                    animationDelay: `${0.1 + idx * 0.08}s`,
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ padding: '28px 28px 32px' }}>
                    <div
                      className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500 mb-5"
                      style={{ boxShadow: '0 2px 10px rgba(237,59,145,0.08)' }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                      </svg>
                    </div>

                    <h2
                      className="text-[17px] font-extrabold text-slate-900 group-hover:text-primary-600 transition-colors duration-200"
                      style={{ marginBottom: 8, lineHeight: 1.35 }}
                    >
                      {localized(cat.title, cat.title_ar)}
                    </h2>

                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: '#6882a9', opacity: 0.78, lineHeight: 1.65 }}
                    >
                      {localized(cat.description, cat.description_ar)}
                    </p>

                    <div
                      className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary-500 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      <span>{lang === 'ar' ? 'استكشف' : 'Explore'}</span>
                      <svg
                        className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
