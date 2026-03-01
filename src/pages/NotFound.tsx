import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useI18n } from '../lib/i18n';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <Layout>
      <div className="glass-bg flex flex-col items-center justify-center min-h-[50vh] text-center px-4 fade-up">
        <div className="w-24 h-24 mb-6 rounded-2xl bg-primary-50 flex items-center justify-center">
          <span className="text-5xl font-extrabold gradient-text">404</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('pageNotFound')}</h2>
        <p className="text-slate-500 max-w-md mb-8">
          {t('pageNotFoundDesc')}
        </p>
        <Link to="/" className="px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-purple-700 transition-all shadow-soft hover:shadow-lg active:scale-[0.97]">
          {t('returnHome')}
        </Link>
      </div>
    </Layout>
  );
}