import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Layout } from '../components/Layout';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useI18n } from '../lib/i18n';
import {
  getArticleBySlug,
  getSectionById,
  getCategoryById,
  getGroupsBySectionId,
  getArticlesByGroupId,
  getArticlesBySectionId
} from '../lib/api';
import {
  getHcArticleBySlugFull,
  getHcGroupsBySection,
  getHcArticlesByGroup,
  getHcArticlesBySection,
  type HcArticle,
  type HcGroup,
} from '../lib/helpCenterApi';
import { formatDate, uniqueSlugIds, scrollToHash } from '../lib/utils';
import { Section, Category, Group, Article } from '../types';

// ── Stable references (defined outside component to prevent re-renders) ──
const REMARK_PLUGINS = [remarkGfm];
const MARKDOWN_COMPONENTS = {
  h2: ({node, ...props}: any) => <h2 className="text-2xl font-bold mt-8 mb-4 scroll-mt-32" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-xl font-semibold mt-6 mb-3 scroll-mt-32" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc pl-5 space-y-2 mb-4" {...props} />,
  li: ({node, ...props}: any) => <li className="text-slate-700 leading-relaxed" {...props} />,
  p: ({node, ...props}: any) => <p className="mb-4 text-slate-700 leading-relaxed" {...props} />,
};

export default function ArticlePage() {
  const { t, localize } = useI18n();
  const { articleSlug } = useParams();

  // Supabase-first data
  const [dbArticle, setDbArticle] = useState<any>(null);
  const [dbSection, setDbSection] = useState<any>(null);
  const [dbCategory, setDbCategory] = useState<any>(null);
  const [dbGroups, setDbGroups] = useState<any[]>([]);
  const [dbGroupArticles, setDbGroupArticles] = useState<Map<string, any[]>>(new Map());
  const [dbSectionArticles, setDbSectionArticles] = useState<any[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Static fallback
  const staticArticle = getArticleBySlug(articleSlug || '');

  // Use DB article if available, else static
  const article = dbLoaded && dbArticle
    ? {
        ...dbArticle,
        sectionId: dbArticle.section_id,
        groupId: dbArticle.group_id,
        bodyMarkdown: dbArticle.body_markdown,
        bodyMarkdown_ar: dbArticle.body_markdown_ar,
        summary_ar: dbArticle.summary_ar,
        updatedAt: dbArticle.updated_at,
        isTop: dbArticle.is_top,
        isFeatured: dbArticle.is_featured,
      }
    : staticArticle;

  // Data State
  const [section, setSection] = useState<Section | undefined>(undefined);
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [sectionGroups, setSectionGroups] = useState<Group[]>([]);

  // Navigation State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  // TOC State
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const observer = useRef<IntersectionObserver | null>(null);

  // Scroll to top when article changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [articleSlug]);

  // Load from Supabase
  useEffect(() => {
    let cancelled = false;
    setDbLoaded(false);
    (async () => {
      try {
        const art = await getHcArticleBySlugFull(articleSlug || '');
        if (cancelled || !art) { if (!cancelled) setDbLoaded(true); return; }
        setDbArticle(art);

        const sec = (art as any).hc_sections;
        if (sec) {
          setDbSection(sec);
          const cat = sec.hc_categories;
          if (cat) setDbCategory(cat);

          // Load groups + articles for sidebar
          const [grps, secArts] = await Promise.all([
            getHcGroupsBySection(sec.id),
            getHcArticlesBySection(sec.id),
          ]);
          if (cancelled) return;
          setDbGroups(grps);
          setDbSectionArticles(secArts);

          // Load articles per group
          const groupArtsMap = new Map<string, any[]>();
          for (const g of grps) {
            const gArts = await getHcArticlesByGroup(g.id);
            if (cancelled) return;
            groupArtsMap.set(g.id, gArts);
          }
          setDbGroupArticles(groupArtsMap);
        }
      } catch {
        // Supabase unavailable — fall back
      } finally {
        if (!cancelled) setDbLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [articleSlug]);

  // Load static context data (fallback)
  useEffect(() => {
    if (staticArticle && !dbArticle) {
      const s = getSectionById(staticArticle.sectionId);
      setSection(s);
      if (s) {
        setSectionGroups(getGroupsBySectionId(s.id));
        setCategory(getCategoryById(s.categoryId));
      }
    }
  }, [staticArticle, dbArticle]);

  // Map DB data to context when available
  useEffect(() => {
    if (dbLoaded && dbSection) {
      setSection({ id: dbSection.id, categoryId: dbSection.category_id, slug: dbSection.slug, title: dbSection.title, title_ar: dbSection.title_ar, description: '', order: 0 } as any);
      if (dbCategory) {
        setCategory({ id: dbCategory.id, slug: dbCategory.slug, title: dbCategory.title, title_ar: dbCategory.title_ar, description: '', order: 0, icon: '' } as any);
      }
      setSectionGroups(dbGroups.map((g: any) => ({ id: g.id, sectionId: g.section_id, title: g.title, title_ar: g.title_ar, description: g.description, description_ar: g.description_ar, order: g.sort_order })));
    }
  }, [dbLoaded, dbSection, dbCategory, dbGroups]);

  // Generate TOC & Set up Observer
  useEffect(() => {
    if (!article) return;

    // Give Markdown a tick to render
    setTimeout(() => {
      const headings = Array.from(document.querySelectorAll('.markdown-body h2, .markdown-body h3'));
      const texts = headings.map(h => h.textContent || '');
      const ids = uniqueSlugIds(texts);

      const tocData = headings.map((h, i) => {
        h.id = ids[i]; // Assign stable slugified ID
        return {
          id: ids[i],
          text: texts[i],
          level: h.tagName === 'H2' ? 2 : 3
        };
      });
      setToc(tocData);

      // Setup Intersection Observer for Highlight
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      }, { rootMargin: '-80px 0px -60% 0px' });

      headings.forEach((h) => observer.current?.observe(h));
    }, 200);

    return () => observer.current?.disconnect();
  }, [article?.id]); // Re-run when article changes

  if (!dbLoaded && !staticArticle) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-[#6366f1] rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }
  if (!article || !section || !category) {
    if (dbLoaded && !article) return <Navigate to="/404" replace />;
    return null; // Loading
  }

  return (
    <Layout>
      <div className="glass-bg min-h-screen">
        <div className="container mx-auto px-4 md:px-6 max-w-[1280px]">

          {/* Breadcrumbs (Desktop) */}
          <div className="hidden lg:block pt-6 pb-2">
            <Breadcrumbs items={[
              { label: t('helpCenter'), path: '/help' },
              { label: localize(category, 'title'), path: `/help/category/${category.slug}` },
              { label: localize(section, 'title'), path: `/help/category/${category.slug}/section/${section.slug}` }
            ]} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] gap-8 relative items-start pt-6 lg:pt-2">

            {/* --- LEFT SIDEBAR: NAVIGATION --- */}
            <aside className={`
              fixed inset-0 z-50 bg-white transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block lg:z-0 lg:h-auto lg:bg-transparent overflow-y-auto
              ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
              {/* Mobile Close Button */}
              <div className="lg:hidden p-4 border-b flex justify-between items-center bg-slate-50">
                 <span className="font-bold text-slate-900">{t('articles')}</span>
                 <button onClick={() => setMobileMenuOpen(false)}>
                   <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              <div className="p-4 lg:p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto custom-scrollbar glass-sidebar" style={{ background: '#fff' }}>

                {/* Section Title */}
                <div className="mb-5">
                  <Link
                    to={`/help/category/${category.slug}/section/${section.slug}`}
                    className="flex items-center gap-2.5 font-bold text-slate-900 hover:text-primary-600 transition-colors text-[15px]"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    {localize(section, 'title')}
                  </Link>
                </div>

                {/* Groups Tree */}
                <div className="space-y-1">
                  {sectionGroups.map(group => {
                    // Check if this group contains the current article
                    const groupArticles = dbGroupArticles.size > 0
                      ? (dbGroupArticles.get(group.id) || []).map((a: any) => ({ ...a, sectionId: a.section_id, groupId: a.group_id, bodyMarkdown: a.body_markdown || '', updatedAt: a.updated_at || '', tags: a.tags || [] }))
                      : getArticlesByGroupId(group.id);
                    const isCurrentGroup = group.id === article.groupId;

                    if (isCurrentGroup) {
                      // Expanded State
                      return (
                        <div key={group.id} className="mb-2">
                           <div className="flex items-center gap-2.5 ml-1 py-2 text-sm font-bold text-slate-800">
                             <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                             {localize(group, 'title')}
                           </div>
                           <div className="ml-2 pl-3 border-l-2 border-primary-200/60 space-y-1 mt-1">
                              {groupArticles.map(a => {
                                const isCurrentArticle = a.id === article.id;
                                return (
                                  <Link
                                    key={a.id}
                                    to={`/help/article/${a.slug}`}
                                    className={`block text-[13px] leading-snug transition-colors ${
                                      isCurrentArticle
                                      ? 'text-primary-700 font-semibold sidebar-active-pill'
                                      : 'text-slate-500 hover:text-primary-600 hover:bg-white/40 py-1.5 pl-3 pr-2'
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                  >
                                    {localize(a, 'title')}
                                  </Link>
                                );
                              })}
                           </div>
                        </div>
                      );
                    } else {
                      // Collapsed State
                      return (
                        <div key={group.id}>
                          <Link
                             to={groupArticles.length > 0 ? `/help/article/${groupArticles[0].slug}` : '#'}
                             className="flex items-center gap-2.5 ml-1 py-2 text-sm font-medium text-slate-500 hover:text-primary-600 rounded-lg transition-colors"
                             onClick={() => setMobileMenuOpen(false)}
                          >
                             <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                             {localize(group, 'title')}
                          </Link>
                        </div>
                      );
                    }
                  })}

                  {/* Fallback for ungrouped articles if any */}
                  {sectionGroups.length === 0 && (dbSectionArticles.length > 0
                    ? dbSectionArticles.map((a: any) => ({ ...a, sectionId: a.section_id, groupId: a.group_id, bodyMarkdown: a.body_markdown || '', updatedAt: a.updated_at || '', tags: a.tags || [] }))
                    : getArticlesBySectionId(section.id)
                  ).map(a => (
                     <Link
                        key={a.id}
                        to={`/help/article/${a.slug}`}
                        className={`block text-sm py-1.5 px-2 rounded-md ${a.id === article.id ? 'bg-purple-50 text-purple-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {localize(a, 'title')}
                     </Link>
                  ))}
                </div>
              </div>
            </aside>

            {/* --- MOBILE NAV TOGGLES --- */}
            <div className="lg:hidden col-span-1 flex gap-2 mb-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 p-3 rounded-lg shadow-sm text-slate-700 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                {t('menu')}
              </button>
              {toc.length > 0 && (
                <button
                  onClick={() => setMobileTocOpen(!mobileTocOpen)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 p-3 rounded-lg shadow-sm text-slate-700 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  {t('onThisPage')}
                </button>
              )}
            </div>

            {/* --- CENTER: ARTICLE CONTENT --- */}
            <main className="min-w-0">
              {/* Mobile TOC Dropdown */}
              {mobileTocOpen && toc.length > 0 && (
                 <div className="lg:hidden mb-6 bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <h4 className="font-bold text-purple-900 mb-2 text-sm uppercase">{t('tableOfContents')}</h4>
                    <ul className="space-y-2">
                       {toc.map(item => (
                         <li key={item.id}>
                           <a
                             href={`#${item.id}`}
                             className="block text-sm text-purple-700 hover:underline"
                             onClick={(e) => {
                               e.preventDefault();
                               setMobileTocOpen(false);
                               scrollToHash(item.id);
                             }}
                           >
                             {item.text}
                           </a>
                         </li>
                       ))}
                    </ul>
                 </div>
              )}

              <article className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline">
                 <h1 className="text-4xl font-extrabold text-slate-900 mb-5 leading-tight tracking-tight">{localize(article, 'title')}</h1>

                 {/* Intro / Summary */}
                 <p className="text-lg text-slate-500 leading-relaxed mb-10 border-b border-slate-200/50 pb-10">
                   {localize(article, 'summary')}
                 </p>

                 {/* Main Markdown Body */}
                 <div className="markdown-body">
                   <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={MARKDOWN_COMPONENTS}>
                     {localize(article, 'bodyMarkdown')}
                   </ReactMarkdown>
                 </div>
              </article>

              <div className="mt-16 pt-8 border-t border-slate-200 text-sm text-slate-500 flex justify-between items-center">
                 <span>{t('lastUpdated')}: {formatDate(article.updatedAt)}</span>
              </div>
            </main>

            {/* --- RIGHT SIDEBAR: TABLE OF CONTENTS --- */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 glass-sidebar p-5" style={{ background: '#fff' }}>
                 <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">{t('tableOfContents')}</h4>
                 <nav>
                   <ul className="space-y-1">
                      {toc.map(item => {
                        const isActive = activeId === item.id;
                        return (
                          <li key={item.id}>
                             <a
                               href={`#${item.id}`}
                               className={`
                                 block py-1.5 text-sm transition-all duration-200
                                 ${item.level === 3 ? 'pl-3 text-[13px]' : ''}
                                 ${isActive
                                   ? 'text-primary-700 font-semibold'
                                   : 'text-slate-400 hover:text-primary-600'}
                               `}
                               onClick={(e) => {
                                 e.preventDefault();
                                 scrollToHash(item.id);
                               }}
                             >
                               {item.text}
                             </a>
                          </li>
                        );
                      })}
                   </ul>

                   {toc.length === 0 && (
                     <p className="text-xs text-slate-400 italic">{t('noSubsections')}</p>
                   )}
                 </nav>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </Layout>
  );
}
