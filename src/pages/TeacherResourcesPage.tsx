import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import type { ResourceVideo } from '../data/resourceVideos';
import { TutorialCarousel } from '../components/resources/TutorialCarousel';
import { VideoPlayerModal } from '../components/resources/VideoPlayerModal';
import { getHcResourceVideos, type HcResourceVideo } from '../lib/helpCenterApi';

/* ══════════════════════════════════════════════════════════
   TeacherResourcesPage — Supabase-driven videos, carousel
   Hero section preserved, videos from hc_resource_videos.
   ══════════════════════════════════════════════════════════ */

const PINK = '#EC4899';
const PINK_HOVER = '#DB2777';
const PINK_ACTIVE = '#BE185D';

export default function TeacherResourcesPage() {
  const { t, lang, localize } = useI18n();
  const [playerVideo, setPlayerVideo] = useState<ResourceVideo | null>(null);
  const [rawVideos, setRawVideos] = useState<HcResourceVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    console.log('[TeacherResourcesPage] Fetching hc_resource_videos (teacher)…');
    (async () => {
      try {
        const rows = await getHcResourceVideos('teacher');
        if (cancelled) return;
        console.log('[TeacherResourcesPage] Loaded', rows.length, 'videos');
        setRawVideos(rows);
      } catch (err: any) {
        console.error('[TeacherResourcesPage] Supabase error:', err);
        if (!cancelled) setError(err?.message || 'Failed to load videos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const videos: ResourceVideo[] = useMemo(
    () => rawVideos.map((v) => ({
      id: v.id,
      url: v.youtube_url,
      title: localize(v, 'title'),
      description: localize(v, 'description'),
    })),
    [rawVideos, localize],
  );

  const customThumbnails = useMemo(() => {
    const thumbs: Record<string, string> = {};
    for (const v of rawVideos) {
      if (v.thumbnail_url) thumbs[v.id] = v.thumbnail_url;
    }
    return thumbs;
  }, [rawVideos]);

  return (
    <Layout>
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        {/* ── Hero (preserved exactly) ── */}
        <section
          style={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 25%, #f8fafc 50%, #eff6ff 75%, #f0f9ff 100%)',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', borderRadius: '50%', opacity: 0.2,
              width: 320, height: 320, top: -60, right: -40,
              background: 'radial-gradient(circle, #ED3B91 0%, transparent 70%)',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, height: 96,
              background: 'linear-gradient(to bottom, transparent, #ffffff)',
            }}
          />

          <div style={{
            position: 'relative', zIndex: 10, maxWidth: 768,
            margin: '0 auto', padding: '80px 24px 96px', textAlign: 'center' as const,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 9999, marginBottom: 24,
              background: 'rgba(237,59,145,0.08)', border: '1px solid rgba(237,59,145,0.15)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ED3B91', display: 'inline-block' }} />
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: '#ED3B91' }}>
                {t('resTeacherBadge')}
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800,
              letterSpacing: '-0.02em', lineHeight: 1.1, color: '#0f172a', marginBottom: 20,
            }}>
              <span className="gradient-text">{t('resTeacherTitle')}</span>{' '}
              <span style={{
                background: 'linear-gradient(135deg, #ED3B91, #c026a8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                {t('resTeacherTitleAccent')}
              </span>
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.125rem)', color: '#64748b',
              lineHeight: 1.7, maxWidth: 540, margin: '0 auto 32px',
            }}>
              {t('resTeacherSubtitle')}
            </p>

            <Link
              to="/help/resources"
              className="text-sm font-medium text-[#ED3B91] hover:underline"
            >
              &larr; {t('backToResources')}
            </Link>
          </div>
        </section>

        {/* ── Carousel Section ── */}
        <div style={{ padding: '64px 0 24px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="w-8 h-8 border-2 border-slate-200 border-t-[#6366f1] rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: '#ef4444' }}>
              <p style={{ fontSize: 14 }}>{error}</p>
            </div>
          ) : videos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: '#94a3b8' }}>
              <svg style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.5 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <p style={{ fontSize: 15 }}>
                {lang === 'ar' ? 'لا توجد دروس تعليمية حتى الآن.' : 'No tutorials available yet.'}
              </p>
            </div>
          ) : (
            <TutorialCarousel
              videos={videos}
              onPlayVideo={setPlayerVideo}
              heading={t('videoGuidesHeading')}
              subtitle={t('videoGuidesSubtitle')}
              customThumbnails={customThumbnails}
            />
          )}
        </div>

        {/* ── "See all" CTA ── */}
        {!loading && videos.length > 0 && (
          <div style={{ textAlign: 'center', padding: '16px 24px 80px' }}>
            <Link
              to="/help/resources/teachers/all"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 32px', borderRadius: 9999,
                background: PINK, color: '#fff',
                fontSize: 15, fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(236,72,153,0.3)',
                transition: 'background 0.2s, transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = PINK_HOVER;
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(236,72,153,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = PINK;
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(236,72,153,0.3)';
              }}
              onMouseDown={(e) => { e.currentTarget.style.background = PINK_ACTIVE; }}
              onMouseUp={(e) => { e.currentTarget.style.background = PINK_HOVER; }}
            >
              {lang === 'ar' ? 'عرض جميع دروس المعلمين' : 'See all teacher tutorials'}
            </Link>
          </div>
        )}
      </div>

      {/* Player modal */}
      {playerVideo && (
        <VideoPlayerModal
          video={playerVideo}
          onClose={() => setPlayerVideo(null)}
        />
      )}
    </Layout>
  );
}
