import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from '../components/Layout';
import { useI18n } from '../lib/i18n';
import { getHcCategories, type HcCategory } from '../lib/helpCenterApi';
import { useDataRefresh } from '../lib/dataEvents';
import { CategoryCard } from '../components/categories/CategoryCard';
import { CategoryGrid } from '../components/categories/CategoryGrid';

export default function HelpCenterHome() {
  const { t, lang } = useI18n();
  const [categories, setCategories] = useState<HcCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasData = useRef(false);

  useEffect(() => { console.log('[HC_HOME] mounted'); }, []);

  const fetchData = useCallback(() => {
    if (import.meta.env.DEV) console.log('[HelpCenterHome] fetchData START');
    getHcCategories()
      .then((cats) => {
        if (import.meta.env.DEV) console.log('[HelpCenterHome] fetchData END, rows:', cats.length);
        setCategories(cats);
        setError('');
        hasData.current = cats.length > 0;
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.warn('[HelpCenterHome] fetchData FAILED:', err.message);
        // Only show error if we have no previously-loaded data
        if (!hasData.current) setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useDataRefresh(['hc_categories'], fetchData);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative w-full overflow-hidden hero-mesh">
        <div
          className="aurora-orb aurora-orb-1"
          style={{ width: 400, height: 400, top: '-10%', left: '-5%', background: 'rgba(99,102,241,0.2)' }}
          aria-hidden="true"
        />
        <div
          className="aurora-orb aurora-orb-2"
          style={{ width: 350, height: 350, top: '10%', right: '-8%', background: 'rgba(139,92,246,0.18)' }}
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
            style={{ color: '#64748b', maxWidth: 500 }}
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
            <CategoryGrid>
              {categories.map((cat, idx) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  index={idx}
                  lang={lang}
                  linkTo={`/help-center/${cat.slug}`}
                />
              ))}
            </CategoryGrid>
          )}
        </div>
      </section>
    </Layout>
  );
}
