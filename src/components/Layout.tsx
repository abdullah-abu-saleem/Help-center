import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { SubmitRequestModal } from './SubmitRequestModal';
import StringIcon from './icons/StringIcon';

interface LayoutProps {
  children: React.ReactNode;
  hero?: React.ReactNode; // Optional hero section (e.g. purple search strip)
}

// Reusable Language Dropdown
const LanguageDropdown = () => {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors rounded-lg px-2.5 py-1.5 hover:bg-slate-100"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span className="hidden sm:inline">{locale === 'en-US' ? 'EN' : 'AR'}</span>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-44 bg-white border border-slate-100 rounded-xl shadow-card py-1.5 z-50">
          <button onClick={() => { setLocale('en-US'); setIsOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm rounded-lg mx-auto hover:bg-primary-50 transition-colors ${locale === 'en-US' ? 'font-semibold text-primary-600' : 'text-slate-600'}`}>English (US)</button>
          <button onClick={() => { setLocale('ar-AR'); setIsOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm rounded-lg mx-auto hover:bg-primary-50 transition-colors ${locale === 'ar-AR' ? 'font-semibold text-primary-600' : 'text-slate-600'}`}>العربية (AR)</button>
        </div>
      )}
    </div>
  );
};

export const Header = ({ onOpenRequest }: { onOpenRequest: () => void }) => {
  const { t, dir } = useI18n();
  const location = useLocation();

  const isResourcesRoute = location.pathname.startsWith('/resources');
  const brandLabel = isResourcesRoute ? 'Resources' : t('helpCenter');
  const brandLink = isResourcesRoute ? '/resources' : '/help';

  return (
    <header className="sticky top-0 z-50 w-full glass-header h-[70px]">
      <div className="container mx-auto flex h-full items-center justify-between px-6 md:px-8">
        {/* Left: Logo & Title */}
        <Link to={brandLink} className="flex items-center gap-2.5 group">
          <StringIcon size={32} className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-lg font-bold tracking-tight text-slate-900">String</span>
            <span className="text-lg text-slate-400 font-light">{brandLabel}</span>
          </div>
        </Link>

        {/* Right: Links & Actions */}
        <div className="flex items-center gap-3 md:gap-5">
          <a href="https://string.education" target="_blank" rel="noreferrer" className="hidden md:block text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors">
            {t('stringWebsite')}
          </a>

          <div className="hidden md:block w-px h-4 bg-slate-200"></div>

          <LanguageDropdown />

          <button
            onClick={onOpenRequest}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-white font-medium bg-gradient-to-r from-[#ff4da6] to-[#ed3b91] shadow-md hover:from-[#ff66b5] hover:to-[#d81b78] hover:shadow-lg transition-all duration-200"
          >
            {t('submitRequest')}
          </button>
        </div>
      </div>
    </header>
  );
};

export const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="border-t border-slate-200/40 bg-white/80 backdrop-blur-sm pt-16 pb-12 relative z-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12 mb-12">
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">{t('company')}</h3>
            <a href="#" className="text-sm text-slate-500 hover:text-primary-600 transition-colors">{t('aboutUs')}</a>
            <a href="#" className="text-sm text-slate-500 hover:text-primary-600 transition-colors">{t('careers')}</a>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">{t('resources')}</h3>
            <Link to="/help/resources/teachers" className="text-sm text-slate-500 hover:text-primary-600 transition-colors">{t('teacherResources')}</Link>
            <Link to="/help/resources/students" className="text-sm text-slate-500 hover:text-primary-600 transition-colors">{t('forStudents')}</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">{t('support')}</h3>
            <a href="#" className="text-sm text-slate-500 hover:text-primary-600 transition-colors">{t('helpCenter')}</a>
            <a href="#" className="text-sm text-slate-500 hover:text-primary-600 transition-colors">{t('contactUs')}</a>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">{t('community')}</h3>
            <a href="#" className="text-sm text-slate-500 hover:text-primary-600 transition-colors">Twitter</a>
            <a href="#" className="text-sm text-slate-500 hover:text-primary-600 transition-colors">YouTube</a>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-400">&copy; {new Date().getFullYear()} {t('allRightsReserved')}</div>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-primary-600 transition-colors">{t('privacyPolicy')}</a>
            <a href="#" className="hover:text-primary-600 transition-colors">{t('termsOfService')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, hero }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <Header onOpenRequest={() => setIsModalOpen(true)} />
      {hero}
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <SubmitRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};