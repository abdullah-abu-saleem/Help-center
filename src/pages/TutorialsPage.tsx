import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { useI18n } from '../lib/i18n';
import { getPublishedTutorials, extractYouTubeId } from '../lib/tutorialsApi';
import { useDataRefresh } from '../lib/dataEvents';
import { useGuidedTour } from '../hooks/useGuidedTour';
import GuidedTour from '../components/ui/GuidedTour';
import { tutorialsTourSteps, TUTORIALS_TOUR_ID } from '../tours/tutorialsTour';
import type { Tutorial } from '../types';
import type { TourStep } from '../hooks/useGuidedTour';

export default function TutorialsPage() {
  const { localize, t, lang } = useI18n();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTutorials = useCallback(() => {
    getPublishedTutorials()
      .then(setTutorials)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTutorials(); }, [fetchTutorials]);
  useDataRefresh(['tutorials'], fetchTutorials);

  // Resolve tour step translations
  const resolvedSteps: TourStep[] = useMemo(
    () =>
      tutorialsTourSteps.map((s) => ({
        id: s.id,
        title: t(s.titleKey),
        description: t(s.descriptionKey),
        selector: s.selector,
        placement: s.placement,
        padding: s.padding,
      })),
    [t],
  );

  const tour = useGuidedTour({
    tourId: TUTORIALS_TOUR_ID,
    steps: resolvedSteps,
    autoStart: !loading,
  });

  return (
    <Layout>
      {/* Header */}
      <div
        data-tour="tutorials-header"
        className="w-full"
        style={{
          background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f0f9ff 100%)',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div className="mx-auto px-6 py-10 md:py-14" style={{ maxWidth: 1100 }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
                {lang === 'ar' ? 'الدروس التعليمية' : 'Video Tutorials'}
              </h1>
              <p className="text-base text-slate-500 max-w-lg">
                {lang === 'ar'
                  ? 'شاهد دروسًا تعليمية خطوة بخطوة لمساعدتك على البدء.'
                  : 'Watch step-by-step video tutorials to help you get started.'}
              </p>
            </div>

            {/* Replay Tour button */}
            <button
              onClick={tour.startTour}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#d6257a] transition-colors mt-1"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label={t('tourReplay' as any)}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
              {t('tourReplay' as any)}
            </button>
          </div>
        </div>
      </div>

      {/* Tutorial Grid */}
      <div className="mx-auto px-6 py-8" style={{ maxWidth: 1100 }}>
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#d6257a] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">
              {lang === 'ar' ? 'جارٍ التحميل...' : 'Loading tutorials...'}
            </p>
          </div>
        ) : tutorials.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">
              {lang === 'ar' ? 'لا توجد دروس تعليمية حتى الآن.' : 'No tutorials available yet.'}
            </p>
          </div>
        ) : (
          <div
            data-tour="tutorials-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {tutorials.map((tutorial, idx) => {
              const videoId = extractYouTubeId(tutorial.youtube_url);
              const title = localize(tutorial, 'title') || tutorial.title;
              const description = localize(tutorial, 'description') || tutorial.description;

              return (
                <a
                  key={tutorial.id}
                  href={tutorial.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...(idx === 0 ? { 'data-tour': 'tutorials-card' } : {})}
                  className="group block bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-slate-200 hover:-translate-y-0.5"
                >
                  {/* Thumbnail */}
                  {tutorial.thumbnail_url && (
                    <div className="relative aspect-video bg-slate-100">
                      <img
                        src={tutorial.thumbnail_url}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-[#d6257a] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    className="p-5"
                    {...(idx === 0 ? { 'data-tour': 'tutorials-card-info' } : {})}
                  >
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#d6257a] transition-colors mb-1.5 leading-snug">
                      {title}
                    </h3>
                    {description && (
                      <p
                        className="text-sm text-slate-500 leading-relaxed"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {description}
                      </p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Guided Tour overlay */}
      <GuidedTour
        isOpen={tour.isOpen}
        step={tour.step}
        currentIndex={tour.currentIndex}
        totalSteps={tour.totalSteps}
        isFirstStep={tour.isFirstStep}
        isLastStep={tour.isLastStep}
        onNext={tour.nextStep}
        onPrev={tour.prevStep}
        onSkip={tour.skipTour}
      />
    </Layout>
  );
}
