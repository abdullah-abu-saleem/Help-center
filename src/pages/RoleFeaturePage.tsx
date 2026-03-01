import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ArticleGroup } from '../components/ArticleGroup';
import { useI18n } from '../lib/i18n';
import { FEATURE_CATEGORIES } from '../data';
import {
  getHcCategoryBySlug,
  getHcSectionBySlugs,
  getHcGroupsBySection,
  getHcArticlesByGroup,
  getHcArticlesBySection,
  type HcCategory,
  type HcSection,
  type HcGroup,
  type HcArticle,
} from '../lib/helpCenterApi';
import { scrollToHash } from '../lib/utils';

/* Map role param → category slug used for display (breadcrumbs) */
const ROLE_DISPLAY_CATEGORY_SLUG: Record<string, string> = {
  teacher: 'for-teachers',
  student: 'for-students',
};

/* Map role param → category slug where the sections actually live */
const ROLE_CONTENT_CATEGORY_SLUG: Record<string, string> = {
  teacher: 'for-schools-and-districts',
  student: 'for-students',
};

export default function RoleFeaturePage() {
  const { t, localize } = useI18n();
  const { role, featureSlug } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { console.log('[HC_ROLE_FEATURE] mounted, role:', role, 'feature:', featureSlug); }, []);

  // Static UI config — kept as navigation metadata
  const feature = FEATURE_CATEGORIES.find(
    fc => fc.slug === featureSlug && fc.roles.includes(role as 'teacher' | 'student')
  );

  const siblingFeatures = FEATURE_CATEGORIES.filter(
    fc => fc.roles.includes(role as 'teacher' | 'student')
  );

  // Supabase state
  const [category, setCategory] = useState<HcCategory | null>(null);
  const [section, setSection] = useState<(HcSection & { categoryId: string; order: number }) | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [groupArticlesMap, setGroupArticlesMap] = useState<Map<string, any[]>>(new Map());
  const [ungroupedArticles, setUngroupedArticles] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    if (!role || !featureSlug || !feature) {
      setLoaded(true);
      return;
    }
    (async () => {
      try {
        const displayCatSlug = ROLE_DISPLAY_CATEGORY_SLUG[role];
        const contentCatSlug = ROLE_CONTENT_CATEGORY_SLUG[role];
        if (!displayCatSlug || !contentCatSlug) { setLoaded(true); return; }

        // Fetch display category (for breadcrumbs) and content section in parallel
        const [cat, sec] = await Promise.all([
          getHcCategoryBySlug(displayCatSlug),
          getHcSectionBySlugs(contentCatSlug, featureSlug),
        ]);
        if (cancelled) return;

        if (cat) setCategory(cat);
        if (sec) {
          setSection({ ...sec, categoryId: sec.category_id, order: sec.sort_order });

          // Load groups + section articles
          const [grps, secArts] = await Promise.all([
            getHcGroupsBySection(sec.id),
            getHcArticlesBySection(sec.id),
          ]);
          if (cancelled) return;

          const mappedGroups = grps.map(g => ({
            id: g.id, sectionId: g.section_id,
            title: g.title, title_ar: g.title_ar,
            description: g.description, description_ar: g.description_ar,
            order: g.sort_order,
          }));
          setGroups(mappedGroups);

          if (grps.length > 0) {
            const gMap = new Map<string, any[]>();
            for (const g of grps) {
              const arts = await getHcArticlesByGroup(g.id);
              if (cancelled) return;
              gMap.set(g.id, arts.map(a => ({
                ...a, sectionId: a.section_id, groupId: (a as any).group_id,
                bodyMarkdown: a.body_markdown, bodyMarkdown_ar: a.body_markdown_ar,
                updatedAt: a.updated_at, tags: a.tags || [],
              })));
            }
            setGroupArticlesMap(gMap);
          } else {
            setUngroupedArticles(secArts.map(a => ({
              ...a, sectionId: a.section_id, groupId: (a as any).group_id,
              bodyMarkdown: a.body_markdown, bodyMarkdown_ar: a.body_markdown_ar,
              updatedAt: a.updated_at, tags: a.tags || [],
            })));
          }
        }
      } catch (err: any) {
        console.error('[RoleFeaturePage] Supabase error:', err);
        if (!cancelled) setError(err?.message || 'Failed to load page');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [role, featureSlug]);

  if (!feature) {
    return <Navigate to="/404" replace />;
  }

  if (!loaded) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-[#6366f1] rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <p className="text-red-500 text-sm font-semibold mb-1">Failed to load page</p>
          <p className="text-slate-400 text-xs">{error}</p>
        </div>
      </Layout>
    );
  }

  if (!category || !section) {
    return <Navigate to="/404" replace />;
  }

  const hasGroups = groups.length > 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/help/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const PurpleSearchStrip = (
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

  return (
    <Layout hero={PurpleSearchStrip}>
      <div className="glass-bg pb-20">

        {/* Breadcrumbs */}
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
          <nav className="text-sm text-slate-500 flex items-center gap-2">
            <Link to="/help" className="hover:text-purple-600 transition-colors">{t('stringHelpCenter')}</Link>
            <span className="text-slate-300 text-xs">›</span>
            <Link to={`/help/category/${category.slug}`} className="hover:text-purple-600 transition-colors">{localize(category, 'title')}</Link>
            <span className="text-slate-300 text-xs">›</span>
            <span className="text-slate-900 font-medium">{localize(feature, 'title')}</span>
          </nav>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">

            {/* Left Sidebar Navigation */}
            <aside className="hidden lg:block">
              <div className="glass-sidebar p-6 sticky top-24" style={{ background: '#fff' }}>
                <h3 className="text-[15px] font-bold text-slate-900 mb-5">{localize(category, 'title')}</h3>
                <nav className="text-[15px]">
                  <ul className="space-y-1">
                    {siblingFeatures.map(fc => {
                      const isActive = fc.slug === feature.slug;

                      if (isActive) {
                        return (
                          <li key={fc.slug}>
                            <div className="sidebar-active flex items-center gap-2.5 font-bold text-slate-900 py-2.5 px-3 rounded-lg cursor-default mb-1">
                              <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                              {localize(fc, 'title')}
                            </div>
                            {hasGroups && (
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
                        <li key={fc.slug}>
                          <NavLink
                            to={`/help/${role}/${fc.slug}`}
                            className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/40 transition-all group"
                          >
                            <svg className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                            {localize(fc, 'title')}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </aside>

            {/* Right Main Content */}
            <main className="min-w-0">
              <header className="mb-12">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">{localize(feature, 'title')}</h1>
              </header>

              {/* Mobile Nav */}
              <div className="lg:hidden mb-8 border border-slate-200 rounded p-4 bg-slate-50">
                <div className="font-bold mb-2 text-slate-700">{localize(category, 'title')}</div>
                <select
                  className="w-full p-2 border border-slate-300 rounded"
                  value={`/help/${role}/${feature.slug}`}
                  onChange={(e) => {
                    const path = e.target.value;
                    if (path) navigate(path);
                  }}
                >
                  {siblingFeatures.map(fc => (
                    <option key={fc.slug} value={`/help/${role}/${fc.slug}`}>
                      {fc.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Article list */}
              {hasGroups ? (
                <div className="w-full divide-y divide-slate-200/70">
                  {groups.map((group) => {
                    const groupArticles = groupArticlesMap.get(group.id) || [];
                    return (
                      <div key={group.id} className="py-8 first:pt-0">
                        <ArticleGroup
                          id={`group-${group.id}`}
                          group={group}
                          articles={groupArticles}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : ungroupedArticles.length > 0 ? (
                <div className="bg-transparent rounded-lg border border-slate-200 shadow-sm">
                  <ul className="divide-y divide-slate-100">
                    {ungroupedArticles.map(article => (
                      <li key={article.id}>
                        <Link
                          to={`/help/article/${article.slug}`}
                          className="block p-6 hover:bg-slate-50 transition-colors"
                        >
                          <h3 className="text-lg font-semibold text-primary-600 mb-1">{localize(article, 'title')}</h3>
                          <p className="text-slate-500 text-sm">{localize(article, 'summary')}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
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
    </Layout>
  );
}
