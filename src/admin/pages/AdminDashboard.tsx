import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';
import { supabase } from '../../lib/supabase';
import {
  adminGetAllCategories,
  isSessionError,
  type HcCategory,
} from '../../lib/helpCenterApi';
import { useDataRefresh } from '../../lib/dataEvents';
import { CategoryCard } from '../../components/categories/CategoryCard';
import { CategoryGrid } from '../../components/categories/CategoryGrid';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<HcCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasData = useRef(false);

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    navigate('/admin/login', { replace: true });
  };

  const fetchData = useCallback(() => {
    adminGetAllCategories()
      .then((cats) => {
        setCategories(cats);
        setError('');
        hasData.current = cats.length > 0;
      })
      .catch((err) => {
        if (isSessionError(err)) {
          navigate('/admin/login', { replace: true });
          return;
        }
        if (!hasData.current) setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useDataRefresh(['hc_categories'], fetchData);

  return (
    <div className="min-h-screen glass-bg">
      {/* Admin Top Bar */}
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center" style={{ gap: 8 }}>
            <img src="/logo.svg" alt="Logo" style={{ height: 32, width: 'auto' }} />
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">String</span>
              <span className="text-lg text-slate-400 font-light">Admin</span>
              <span className="admin-badge">ADMIN</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-slate-500">
                {user.name} <span className="text-xs px-2 py-0.5 rounded-full bg-pink-50 text-[#ED3B91] font-medium ml-1">Admin</span>
              </span>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Hero — pixel-identical to public HelpCenterHome */}
      <section className="relative w-full overflow-hidden hero-mesh">
        <div
          className="aurora-orb aurora-orb-1"
          style={{ width: 400, height: 400, top: '-10%', left: '-5%', background: 'rgba(237,59,145,0.2)' }}
          aria-hidden="true"
        />
        <div
          className="aurora-orb aurora-orb-2"
          style={{ width: 350, height: 350, top: '10%', right: '-8%', background: 'rgba(237,59,145,0.18)' }}
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

      {/* Categories Grid — same layout as public, cards link to admin edit */}
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
                  linkTo={`/admin/help-center/category/${cat.id}/manage`}
                />
              ))}
            </CategoryGrid>
          )}
        </div>
      </section>
    </div>
  );
}
