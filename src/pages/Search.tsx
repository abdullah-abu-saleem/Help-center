import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { searchArticles } from '../lib/api';
import { searchHcArticles, type HcArticle } from '../lib/helpCenterApi';
import { SearchResult } from '../types';
import { useI18n } from '../lib/i18n';

export default function SearchPage() {
  const { t, localize } = useI18n();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [sort, setSort] = React.useState<'relevance' | 'updated'>('relevance');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Try Supabase first, fall back to static
    searchHcArticles(query)
      .then((dbResults) => {
        if (cancelled) return;
        if (dbResults.length > 0) {
          // Map DB results to SearchResult format
          const mapped: SearchResult[] = dbResults.map((a: HcArticle) => ({
            article: {
              id: a.id,
              sectionId: a.section_id,
              slug: a.slug,
              title: a.title,
              title_ar: a.title_ar,
              summary: a.summary,
              summary_ar: a.summary_ar,
              bodyMarkdown: a.body_markdown,
              bodyMarkdown_ar: a.body_markdown_ar,
              updatedAt: a.updated_at,
              tags: a.tags || [],
              isTop: (a as any).is_top || false,
              isFeatured: (a as any).is_featured || false,
            } as any,
            score: 1,
            matches: ['Database match'],
          }));
          if (sort === 'updated') {
            mapped.sort((a, b) => new Date(b.article.updatedAt).getTime() - new Date(a.article.updatedAt).getTime());
          }
          setResults(mapped);
        } else {
          // Fallback to static search
          const rawResults = searchArticles(query);
          if (sort === 'updated') {
            rawResults.sort((a, b) => new Date(b.article.updatedAt).getTime() - new Date(a.article.updatedAt).getTime());
          }
          if (!cancelled) setResults(rawResults);
        }
      })
      .catch(() => {
        // Supabase unavailable — use static
        if (cancelled) return;
        const rawResults = searchArticles(query);
        if (sort === 'updated') {
          rawResults.sort((a, b) => new Date(b.article.updatedAt).getTime() - new Date(a.article.updatedAt).getTime());
        }
        setResults(rawResults);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [query, sort]);

  return (
    <Layout>
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {t('searchResults')} "{query}"
            </h1>
            <p className="text-slate-500 mb-8">
                {t('foundArticles', { count: results.length })}
            </p>

            {results.length > 0 && (
                <div className="flex justify-end mb-4">
                    <select 
                        value={sort} 
                        onChange={(e) => setSort(e.target.value as any)}
                        className="text-sm border-none bg-transparent font-medium text-slate-600 focus:ring-0"
                    >
                        <option value="relevance">{t('sortBy')}: {t('relevance')}</option>
                        <option value="updated">{t('sortBy')}: {t('dateUpdated')}</option>
                    </select>
                </div>
            )}

            <div className="space-y-6">
                {results.map(({ article, matches }) => (
                    <div key={article.id} className="block group">
                        <Link to={`/help/article/${article.slug}`}>
                            <h2 className="text-xl font-semibold text-primary-600 group-hover:underline mb-1">
                                {localize(article, 'title')}
                            </h2>
                        </Link>
                        <div className="flex gap-2 mb-2">
                            {article.tags.map(tag => (
                                <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <p className="text-slate-600 text-sm mb-2">{localize(article, 'summary')}</p>
                        {matches.length > 0 && (
                            <p className="text-xs text-slate-400 italic">{t('matchedIn')}: {matches.slice(0, 3).join(', ')}</p>
                        )}
                    </div>
                ))}

                {results.length === 0 && (
                    <div className="bg-slate-50 rounded-lg p-8 text-center border border-slate-200">
                        <p className="text-slate-600 mb-4">{t('noResults')}</p>
                        <p className="text-sm text-slate-500">{t('tryKeywords')}</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </Layout>
  );
}