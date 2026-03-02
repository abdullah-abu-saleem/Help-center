import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useI18n } from '../lib/i18n';
import TutorialsSection from '../components/TutorialsSection';
import { HelpCenterShell } from '../components/theme/HelpCenterShell';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { COLORS } from '../theme/colors';

const ROUTE_DEBUG = false;

/* ═══════════════════════════════════════════════════════
   Category cards configuration
   ═══════════════════════════════════════════════════════ */
const mainCategories = [
  {
    slug: 'for-families',
    titleKey: 'forFamilies' as const,
    descKey: 'forFamiliesDesc' as const,
    gradient: 'from-cyan-500 to-blue-500',
    iconBg: 'bg-gradient-to-br from-cyan-50 to-sky-100',
    iconColor: 'text-cyan-600',
    accentColor: '#06b6d4',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    slug: 'for-students',
    titleKey: 'forStudents' as const,
    descKey: 'forStudentsDesc' as const,
    gradient: 'from-blue-500 to-primary-500',
    iconBg: 'bg-gradient-to-br from-blue-50 to-primary-100',
    iconColor: 'text-blue-600',
    accentColor: '#3b82f6',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    slug: 'for-teachers',
    titleKey: 'forTeachers' as const,
    descKey: 'forTeachersDesc' as const,
    gradient: 'from-amber-400 to-orange-500',
    iconBg: 'bg-gradient-to-br from-amber-50 to-orange-100',
    iconColor: 'text-amber-600',
    accentColor: '#f59e0b',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  {
    slug: 'for-schools-and-districts',
    titleKey: 'forSchoolsDistricts' as const,
    descKey: 'forSchoolsDistrictsDesc' as const,
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-gradient-to-br from-violet-50 to-purple-100',
    iconColor: 'text-violet-600',
    accentColor: '#d6257a',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
];

export default function Home() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/help/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <Layout>
      <HelpCenterShell noBg>
      {ROUTE_DEBUG && (
        <div
          style={{
            position: "fixed",
            top: "16px",
            left: "16px",
            zIndex: 9999,
            background: "#08b8fb",
            color: "white",
            padding: "8px 14px",
            borderRadius: "999px",
            fontWeight: 800,
          }}
        >
          ROUTE CONFIRMED: HELP
        </div>
      )}
      {/* ══════════════════════════════════════════════════════
          HERO — Modern aurora mesh gradient with search
          ══════════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden hero-mesh">
        {/* Animated aurora orbs */}
        <div
          className="aurora-orb aurora-orb-1"
          style={{ width: 400, height: 400, top: '-10%', left: '-5%', background: 'rgba(237,59,145,0.2)' }}
          aria-hidden="true"
        />
        <div
          className="aurora-orb aurora-orb-2"
          style={{ width: 350, height: 350, top: '10%', right: '-8%', background: 'rgba(8,184,251,0.18)' }}
          aria-hidden="true"
        />
        <div
          className="aurora-orb aurora-orb-3"
          style={{ width: 300, height: 300, bottom: '5%', left: '30%', background: 'rgba(59,130,246,0.12)' }}
          aria-hidden="true"
        />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ed3b91 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden="true"
        />

        {/* Bottom fade to white */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 60%, rgba(255,255,255,0.5) 80%, #ffffff 100%)',
          }}
          aria-hidden="true"
        />

        {/* Hero content */}
        <div className="relative z-10 mx-auto px-6 text-center max-w-[720px] pt-16 md:pt-20 xl:pt-24 pb-48 md:pb-56 xl:pb-64">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 fade-up"
            style={{
              background: 'rgba(237,59,145,0.08)',
              border: '1px solid rgba(237,59,145,0.12)',
              animationDelay: '0s',
            }}
          >
            <span
              className="accent-dot stat-pulse"
              style={{ background: '#ed3b91' }}
            />
            <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#ed3b91' }}>
              {t('welcomeTo')}
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-4xl md:text-[56px] font-extrabold tracking-tight fade-up"
            style={{ lineHeight: 1.1, marginBottom: 16, animationDelay: '0.1s' }}
          >
            <span className="text-slate-900">String </span>
            <span className="gradient-text">{t('helpCenter')}</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-base md:text-lg font-normal mx-auto fade-up leading-relaxed"
            style={{ color: '#64748b', maxWidth: 520, animationDelay: '0.2s', marginBottom: 32 }}
          >
            {t('heroSubtitle')}
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="fade-up"
            style={{ animationDelay: '0.3s' }}
          >
            <div
              className="relative mx-auto search-glow"
              style={{
                maxWidth: 560,
                borderRadius: 16,
                border: '1px solid rgba(226,232,240,0.55)',
              }}
            >
              <div className="flex items-center">
                <div className="pl-5 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full py-4 px-4 bg-transparent text-slate-900 placeholder-slate-400 text-[15px] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="submit"
                    className="mr-3 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #ed3b91, #d6257a)',
                      boxShadow: '0 2px 8px rgba(237,59,145,0.3)',
                    }}
                  >
                    Search
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CATEGORY CARDS — overlapping hero
          ══════════════════════════════════════════════════════ */}
      <section
        className="relative card-overlap"
        style={{ zIndex: 20, marginTop: -100, paddingBottom: 16 }}
      >
        <style>{`
          @media (min-width: 768px)  { .card-overlap { margin-top: -130px !important; } }
          @media (min-width: 1280px) { .card-overlap { margin-top: -150px !important; } }
        `}</style>

        <div
          className="relative z-10 mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
          style={{ maxWidth: 1200, gap: 24 }}
        >
          {mainCategories.map((cat, idx) => (
            <Link
              key={cat.slug}
              to={`/help/category/${cat.slug}`}
              className="group flex flex-col fade-up cursor-pointer"
              style={{
                minHeight: 270,
                animationDelay: `${0.1 + idx * 0.08}s`,
                textDecoration: 'none',
              }}
            >
              <SpotlightCard className="flex flex-col h-full">
              {/* Floating gradient accent glow */}
              <div
                className={`card-accent-glow bg-gradient-to-r ${cat.gradient}`}
              />

              <div style={{ padding: '28px 28px 32px' }}>
                {/* Icon in soft rounded gradient container */}
                <div
                  className={`icon-container-glow flex items-center justify-center ${cat.iconBg} ${cat.iconColor}`}
                  style={{
                    width: 56,
                    height: 56,
                    marginBottom: 20,
                    boxShadow: `0 2px 10px ${cat.accentColor}15`,
                  }}
                >
                  {cat.icon}
                </div>

                {/* Title — strong bold */}
                <h2
                  className="text-[17px] font-extrabold text-[#091e42] group-hover:text-[#ed3b91] transition-colors duration-200"
                  style={{ marginBottom: 10, lineHeight: 1.35, letterSpacing: '-0.01em' }}
                >
                  {t(cat.titleKey)}
                </h2>

                {/* Description — subtle with reduced opacity */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: COLORS.neutralLight, opacity: 0.78, lineHeight: 1.65 }}
                >
                  {t(cat.descKey)}
                </p>

                {/* Arrow indicator — micro-interaction */}
                <div
                  className="mt-6 flex items-center gap-2 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{ color: cat.accentColor }}
                >
                  <span>{t('explore') || 'Explore'}</span>
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
              </SpotlightCard>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          VIDEO TUTORIALS (from Supabase)
          ══════════════════════════════════════════════════════ */}
      <TutorialsSection />

      {/* ══════════════════════════════════════════════════════
          NEED MORE HELP?
          ══════════════════════════════════════════════════════ */}
      <section
        className="mx-auto px-6"
        style={{ maxWidth: 1200, paddingTop: 48, paddingBottom: 80 }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="flex items-center gap-5 mb-10">
            <div className="flex-1 h-px shimmer-line" style={{ height: 1 }} />
            <h3
              className="text-lg font-bold text-slate-800 whitespace-nowrap flex items-center gap-3"
            >
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ background: 'rgba(237,59,145,0.08)' }}
              >
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                </svg>
              </span>
              {t('needMoreHelp')}
            </h3>
            <div className="flex-1 h-px shimmer-line" style={{ height: 1 }} />
          </div>

          {/* Help cards */}
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20 }}>
            {/* Safety & Privacy */}
            <Link
              to="/help/category/safety-and-privacy"
              className="group"
            >
              <SpotlightCard className="flex items-center gap-5 p-[22px_24px]">
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-600 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                style={{ width: 56, height: 56 }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-[#091e42] group-hover:text-[#ed3b91] transition-colors duration-200" style={{ marginBottom: 4 }}>
                  {t('safetyPrivacy')}
                </h4>
                <p className="text-sm" style={{ color: COLORS.neutralLight, lineHeight: 1.5 }}>
                  {t('safetyPrivacyDesc')}
                </p>
              </div>
              <svg className="w-5 h-5 text-slate-300 group-hover:text-[#ed3b91] transition-all duration-300 flex-shrink-0 translate-x-0 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              </SpotlightCard>
            </Link>

            {/* String Tutor */}
            <Link
              to="/help/category/string-tutor"
              className="group"
            >
              <SpotlightCard className="flex items-center gap-5 p-[22px_24px]">
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-purple-100 text-violet-600 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                style={{ width: 56, height: 56 }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-[#091e42] group-hover:text-[#ed3b91] transition-colors duration-200" style={{ marginBottom: 4 }}>
                  {t('stringTutor')}
                </h4>
                <p className="text-sm" style={{ color: COLORS.neutralLight, lineHeight: 1.5 }}>
                  {t('stringTutorDesc')}
                </p>
              </div>
              <svg className="w-5 h-5 text-slate-300 group-hover:text-[#ed3b91] transition-all duration-300 flex-shrink-0 translate-x-0 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              </SpotlightCard>
            </Link>
          </div>
        </div>
      </section>
      </HelpCenterShell>
    </Layout>
  );
}
