import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { searchHcArticles, type HcArticle } from '../lib/helpCenterApi';
import { useI18n } from '../lib/i18n';
import { HelpCenterShell } from '../components/theme/HelpCenterShell';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { COLORS } from '../theme/colors';

interface MappedResult {
  article: {
    id: string;
    sectionId: string;
    slug: string;
    title: string;
    title_ar?: string | null;
    summary: string;
    summary_ar?: string | null;
    bodyMarkdown: string;
    bodyMarkdown_ar?: string | null;
    updatedAt: string;
    tags: string[];
    isTop: boolean;
    isFeatured: boolean;
  };
  score: number;
  matches: string[];
}

export default function SearchPage() {
  const { t, localize } = useI18n();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = React.useState<MappedResult[]>([]);
  const [sort, setSort] = React.useState<'relevance' | 'updated'>('relevance');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    searchHcArticles(query)
      .then((dbResults) => {
        if (cancelled) return;
        const mapped: MappedResult[] = dbResults.map((a: HcArticle) => ({
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
          },
          score: 1,
          matches: ['Database match'],
        }));
        if (sort === 'updated') {
          mapped.sort((a, b) => new Date(b.article.updatedAt).getTime() - new Date(a.article.updatedAt).getTime());
        }
        setResults(mapped);
      })
      .catch((err: any) => {
        console.error('[SearchPage] Supabase error:', err);
        if (!cancelled) {
          setError(err?.message || 'Search failed');
          setResults([]);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [query, sort]);

  return (
    <Layout>
      <HelpCenterShell>
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-[#091e42] mb-2">
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
                        className="text-sm border-none bg-transparent font-medium text-[#6882a9] focus:ring-0"
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
                                <span key={tag} className="text-xs bg-[#fdf2f8] text-[#ed3b91] px-2 py-0.5 rounded">
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
                    <SpotlightCard className="p-8 text-center">
                        <p className="text-slate-600 mb-4">{t('noResults')}</p>
                        <p className="text-sm" style={{ color: COLORS.neutralLight }}>{t('tryKeywords')}</p>
                    </SpotlightCard>
                )}
            </div>
        </div>
      </div>
      </HelpCenterShell>
    </Layout>
  );
}