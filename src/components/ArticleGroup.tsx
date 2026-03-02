import React from 'react';
import { Link } from 'react-router-dom';
import { Article, Group } from '../types';
import { useI18n } from '../lib/i18n';

interface ArticleGroupProps {
  id?: string;
  group: Group;
  articles: Article[];
  defaultOpen?: boolean;
}

export const ArticleGroup: React.FC<ArticleGroupProps> = ({ id, group, articles }) => {
  const { localize } = useI18n();
  if (articles.length === 0) return null;

  return (
    <section id={id} className="scroll-mt-32">
      {/* Group title */}
      <h2 className="text-xl font-bold text-[#091e42] tracking-tight mb-1">
        {localize(group, 'title')}
      </h2>
      {localize(group, 'description') && (
        <p className="text-sm text-[#6882a9] mb-4">{localize(group, 'description')}</p>
      )}

      {/* Pure link list — no card, no container */}
      <div className="link-list">
        {articles.map((article, idx) => (
          <Link
            key={article.id}
            to={`/help/article/${article.slug}`}
            className={`link-list-item group${idx < articles.length - 1 ? ' border-b border-slate-200/50' : ''}`}
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
    </section>
  );
};
