import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ArticleGroup } from '../components/ArticleGroup';
import { useI18n } from '../lib/i18n';
import {
  getHcCategoryBySlug,
  getHcSectionsByCategory,
  getHcSectionBySlugs,
  getHcSectionBySlugOnly,
  getHcGroupsBySection,
  getHcArticlesByGroup,
  getHcArticlesBySection,
  type HcCategory,
  type HcSection,
  type HcGroup,
  type HcArticle,
} from '../lib/helpCenterApi';
import { scrollToHash } from '../lib/utils';
import { HelpCenterShell } from '../components/theme/HelpCenterShell';
import { ResourcesShell } from '../components/resources/ResourcesShell';
import { COLORS } from '../theme/colors';

export default function HelpSectionLandingPage() {
  const { t, localize } = useI18n();
  const { categorySlug, sectionSlug } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { console.log('[HC_SECTION_LANDING] mounted, slug:', categorySlug, '/', sectionSlug); }, []);

  // Supabase-first state
  const [dbCategory, setDbCategory] = useState<HcCategory | null>(null);
  const [dbSection, setDbSection] = useState<(HcSection & { hc_categories?: any }) | null>(null);
  const [dbSiblingSections, setDbSiblingSections] = useState<HcSection[]>([]);
  const [dbGroups, setDbGroups] = useState<HcGroup[]>([]);
  const [dbGroupArticles, setDbGroupArticles] = useState<Map<string, HcArticle[]>>(new Map());
  const [dbUngroupedArticles, setDbUngroupedArticles] = useState<HcArticle[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [dbError, setDbError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setDbLoaded(false);
    (async () => {
      try {
        console.log('[HelpSectionLandingPage] fetching section — categorySlug:', categorySlug, 'sectionSlug:', sectionSlug);
        let sec = await getHcSectionBySlugs(categorySlug || '', sectionSlug || '');
        // Fallback: if category-scoped lookup fails, try by section slug only
        if (!sec && sectionSlug) {
          console.warn('[HelpSectionLandingPage] category-scoped lookup returned null, trying slug-only fallback for:', sectionSlug);
          sec = await getHcSectionBySlugOnly(sectionSlug);
        }
        if (cancelled) return;
        if (!sec) {
          console.warn('[HelpSectionLandingPage] section not found even with fallback — sectionSlug:', sectionSlug);
          setDbLoaded(true);
          return;
        }
        console.log('[HelpSectionLandingPage] section found — id:', sec.id, 'slug:', sec.slug);
        setDbSection(sec);

        const catData = (sec as any).hc_categories;
        if (catData) setDbCategory(catData);

        const catId = catData?.id || sec.category_id;
        console.log('[HelpSectionLandingPage] resolved IDs — category.id:', catId, 'section.id:', sec.id, 'section.slug:', sec.slug);
        const [siblings, grps, secArts] = await Promise.all([
          getHcSectionsByCategory(catId),
          getHcGroupsBySection(sec.id),
          getHcArticlesBySection(sec.id),
        ]);
        if (cancelled) return;
        console.log('[HelpSectionLandingPage] articles.length:', secArts.length, 'groups.length:', grps.length);

        setDbSiblingSections(siblings);
        setDbGroups(grps);
        setDbUngroupedArticles(secArts);

        // Load articles per group
        const gMap = new Map<string, HcArticle[]>();
        for (const g of grps) {
          const arts = await getHcArticlesByGroup(g.id);
          if (cancelled) return;
          gMap.set(g.id, arts);
        }
        setDbGroupArticles(gMap);
      } catch (err: any) {
        console.error('[HelpSectionLandingPage] Supabase error:', err);
        if (!cancelled) setDbError(err?.message || 'Failed to load section');
      } finally {
        if (!cancelled) setDbLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [categorySlug, sectionSlug]);

  // Resolved values (Supabase only)
  const category = dbCategory
    ? { ...dbCategory, order: dbCategory.sort_order } as any
    : null;
  const section = dbSection
    ? { ...dbSection, categoryId: dbSection.category_id, order: dbSection.sort_order } as any
    : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/help/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Search Strip
  const SearchStrip = (
    <div className="w-full py-10">
      <div className="container mx-auto px-4 md:px-6 flex justify-center">
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl glass-search">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-5 py-4 bg-transparent rounded-[20px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300/50 transition-shadow text-[15px]"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>
    </div>
  );

  if (!dbLoaded) {
    return (
      <Layout>
        <HelpCenterShell noBg>
        <ResourcesShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-[#ed3b91] rounded-full animate-spin" />
        </div>
        </ResourcesShell>
        </HelpCenterShell>
      </Layout>
    );
  }

  if (dbError) {
    return (
      <Layout>
        <HelpCenterShell noBg>
        <ResourcesShell>
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <p className="text-red-500 text-sm font-semibold mb-1">Failed to load section</p>
          <p className="text-slate-400 text-xs">{dbError}</p>
        </div>
        </ResourcesShell>
        </HelpCenterShell>
      </Layout>
    );
  }

  if (!category || !section) {
    return <Navigate to="/404" replace />;
  }

  // Data loading (Supabase only)
  const groups = dbGroups.map(g => ({ id: g.id, sectionId: g.section_id, title: g.title, title_ar: g.title_ar, description: g.description, description_ar: g.description_ar, order: g.sort_order }));
  const siblingSections = dbSiblingSections.map(s => ({ ...s, categoryId: s.category_id, order: s.sort_order })) as any[];
  // Check if groups actually contain articles (groups may exist but be empty)
  const hasGroupArticles = groups.length > 0 && Array.from(dbGroupArticles.values()).some(arts => arts.length > 0);
  const allSectionArticles = dbUngroupedArticles.map(a => ({ ...a, sectionId: a.section_id, groupId: (a as any).group_id, bodyMarkdown: a.body_markdown, bodyMarkdown_ar: a.body_markdown_ar, updatedAt: a.updated_at, tags: a.tags || [] })) as any[];
  // Show ungrouped articles when there are no groups OR when groups exist but have no articles
  const ungroupedArticles = hasGroupArticles ? [] : allSectionArticles;

  return (
    <Layout hero={SearchStrip}>
      <HelpCenterShell noBg>
      <ResourcesShell>
      <div className="pb-20">

        {/* Breadcrumbs */}
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
          <nav className="text-sm text-slate-500 flex items-center gap-2">
            <Link to="/help" className="hover:text-[#ed3b91] transition-colors">{t('stringHelpCenter')}</Link>
            <span className="text-slate-300 text-xs">›</span>
            <Link to={`/help/category/${category.slug}`} className="hover:text-[#ed3b91] transition-colors">{localize(category, 'title')}</Link>
            <span className="text-slate-300 text-xs">›</span>
            <span className="text-[#091e42] font-medium">{localize(section, 'title')}</span>
          </nav>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">

            {/* Left Sidebar Navigation */}
            <aside className="hidden lg:block">
              <div className="glass-sidebar p-6 sticky top-24" style={{ background: 'rgba(255,255,255,0.85)' }}>
                <h3 className="text-[15px] font-bold text-[#091e42] mb-5">{localize(section, 'title')}</h3>
                <nav className="text-[15px]">
                  <ul className="space-y-1">
                    {siblingSections.map(sibSection => {
                      const isActive = sibSection.id === section.id;

                      if (isActive) {
                        return (
                          <li key={sibSection.id}>
                            <div className="sidebar-active flex items-center gap-2.5 font-bold text-slate-900 py-2.5 px-3 rounded-lg cursor-default mb-1">
                              <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                              {localize(sibSection, 'title')}
                            </div>
                            {hasGroupArticles && (
                              <ul className="ml-5 mt-1 space-y-0.5 border-l-2 border-primary-200/60 pl-4 mb-3">
                                {groups.map(group => (
                                  <li key={group.id}>
                                    <a
                                      href={`#group-${group.id}`}
                                      className="block py-1.5 text-slate-500 hover:text-primary-700 transition-colors"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        scrollToHash(`group-${group.id}`);
                                      }}
                                    >
                                      {localize(group, 'title')}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        );
                      }

                      return (
                        <li key={sibSection.id}>
                          <Link
                            to={`/help/category/${category.slug}/section/${sibSection.slug}`}
                            className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/40 transition-all group"
                          >
                            <svg className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                            {localize(sibSection, 'title')}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </aside>

            {/* Right Main Content — pure link list */}
            <main className="min-w-0">
              <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#091e42] tracking-tight leading-tight">
                  {localize(section, 'title')}
                </h1>
                {localize(section, 'description') && (
                  <p className="text-base text-slate-500 mt-2 leading-relaxed max-w-2xl">
                    {localize(section, 'description')}
                  </p>
                )}
              </header>

              {/* Mobile Nav — only when groups have articles */}
              {hasGroupArticles && (
              <div className="lg:hidden mb-8 border border-slate-200/50 rounded-xl p-4 bg-transparent">
                <div className="font-bold mb-2 text-slate-700 text-sm">{t('sectionMenu')}</div>
                <select
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300/50"
                  onChange={(e) => {
                    const id = e.target.value;
                    if (id) scrollToHash(id);
                  }}
                >
                  <option value="">{t('jumpToTopic')}</option>
                  {groups.map(g => <option key={g.id} value={`group-${g.id}`}>{localize(g, 'title')}</option>)}
                </select>
              </div>
              )}

              {/* Link list — grouped (only when groups actually have articles) */}
              {hasGroupArticles ? (
                <div className="space-y-10">
                  {groups.map((group) => {
                    const groupArticles = (dbGroupArticles.get(group.id) || []).map((a: any) => ({ ...a, sectionId: a.section_id, groupId: a.group_id, bodyMarkdown: a.body_markdown || '', updatedAt: a.updated_at || '', tags: a.tags || [] }));
                    return (
                      <ArticleGroup
                        key={group.id}
                        id={`group-${group.id}`}
                        group={group}
                        articles={groupArticles}
                      />
                    );
                  })}
                </div>
              ) : ungroupedArticles.length > 0 ? (
                <div className="link-list">
                  {ungroupedArticles.map((article, idx) => (
                    <Link
                      key={article.id}
                      to={`/help/article/${article.slug}`}
                      className={`link-list-item group${idx < ungroupedArticles.length - 1 ? ' border-b border-slate-200/50' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-semibold text-primary-600 group-hover:text-primary-700 transition-colors leading-snug">
                          {localize(article, 'title')}
                        </h3>
                        {localize(article, 'summary') && (
                          <p className="text-[13px] text-slate-400 mt-1 leading-relaxed truncate">
                            {localize(article, 'summary')}
                          </p>
                        )}
                      </div>
                      <svg
                        className="w-4 h-4 text-slate-300 group-hover:text-primary-400 flex-shrink-0 transition-all duration-200 group-hover:translate-x-0.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 py-8">
                  {t('noContent')}
                </div>
              )}
            </main>

          </div>
        </div>
      </div>
      </ResourcesShell>
      </HelpCenterShell>
    </Layout>
  );
}
