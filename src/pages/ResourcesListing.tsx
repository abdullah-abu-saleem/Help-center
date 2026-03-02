import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { getResourceVideos, getLocalizedText, HcVideo } from '../lib/resourcesApi';
import { TutorialCarousel } from '../components/resources/TutorialCarousel';
import { VideoPlayerModal } from '../components/resources/VideoPlayerModal';
import { ResourcesShell } from '../components/resources/ResourcesShell';
import type { ResourceVideo } from '../data/resourceVideos';
import { useI18n } from '../lib/i18n';

// ─── Constants ────────────────────────────────────────────────

const VALID_AUDIENCES = ['teacher', 'student'] as const;
type Audience = (typeof VALID_AUDIENCES)[number];

// ─── Main page ────────────────────────────────────────────────

export default function ResourcesListing() {
  const { audience: audienceRaw } = useParams<{ audience: string }>();
  const audience = (audienceRaw ?? '').toLowerCase().trim();
  const { t, lang } = useI18n();

  const AUDIENCE_META: Record<Audience, { title: string; accent: string; subtitle: string }> = {
    teacher: {
      title: t('resTeacherTitle'),
      accent: t('resTeacherTitleAccent'),
      subtitle: t('resTeacherSubtitle'),
    },
    student: {
      title: t('resStudentTitle'),
      accent: t('resStudentTitleAccent'),
      subtitle: t('resStudentSubtitle'),
    },
  };

  const [videos, setVideos] = useState<HcVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const [playerVideo, setPlayerVideo] = useState<ResourceVideo | null>(null);

  const isValid = VALID_AUDIENCES.includes(audience as Audience);

  useEffect(() => {
    console.log('[Resources] audience param:', JSON.stringify(audienceRaw), '→ normalized:', JSON.stringify(audience), '| valid:', isValid);
  }, [audienceRaw, audience, isValid]);

  const fetchData = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');
    setErrorDetail('');

    try {
      const data = await getResourceVideos(audience as Audience);
      setVideos(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = (err as any)?.code ?? '';
      const detail = code ? `${code}: ${msg}` : msg;
      console.error('[Resources] fetch error:', detail, err);
      setError(t('resErrorMessage'));
      setErrorDetail(detail);
    } finally {
      setLoading(false);
    }
  }, [audience, isValid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Invalid audience ──
  if (!isValid) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-red-600 font-medium text-lg mb-4">
            {t('resInvalidAudience')}: &quot;{audienceRaw}&quot;
          </p>
          <Link to="/resources" className="text-sm font-medium text-primary-600 hover:text-primary-700 underline">
            {t('backToResources')}
          </Link>
        </div>
      </Layout>
    );
  }

  const meta = AUDIENCE_META[audience as Audience];

  // Map HcVideo → ResourceVideo for existing carousel/card/modal components
  const mapped: ResourceVideo[] = videos.map((v) => ({
    id: String(v.id),
    url: v.youtube_url,
    title: getLocalizedText(v, 'title', lang),
    description: getLocalizedText(v, 'description', lang),
  }));

  return (
    <Layout>
      <ResourcesShell>
        <div className="rls-content">

          {/* ══ Hero Section ══ */}
          <div className="rls-hero">
            <h1 className="rls-title">
              <span className="rls-title-gradient">{meta.title}</span>
            </h1>
            <p className="rls-subtitle">{meta.subtitle}</p>

            <Link to="/resources" className="rls-cta-btn">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              <span>{t('backToResources')}</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="rls-divider" />

          {/* ══ Video Guides Section ══ */}
          <div className="rls-videos">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <div className="w-8 h-8 border-2 border-slate-200 border-t-[#ed3b91] rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                <p style={{ fontSize: 14, color: '#ef4444', marginBottom: 8 }}>{error}</p>
                {import.meta.env.DEV && errorDetail && (
                  <pre style={{ fontSize: 12, color: '#f87171', background: '#fef2f2', borderRadius: 8, padding: 12, maxWidth: 500, margin: '0 auto 16px', textAlign: 'left', overflow: 'auto', maxHeight: 120, whiteSpace: 'pre-wrap' }}>
                    {errorDetail}
                  </pre>
                )}
                <button
                  onClick={fetchData}
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#ef4444',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {t('resRetry')}
                </button>
              </div>
            ) : mapped.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 24px', color: '#94a3b8' }}>
                <svg
                  style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.5 }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
                <p style={{ fontSize: 15 }}>{t('resNoVideos')}</p>
              </div>
            ) : (
              <TutorialCarousel
                videos={mapped}
                onPlayVideo={setPlayerVideo}
                heading={t('videoGuidesHeading')}
                subtitle={t('videoGuidesSubtitle')}
              />
            )}
          </div>
        </div>

        {/* ═══════════ Content-only Styles ═══════════ */}
        <style>{`
/* Content layout */
.rls-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Hero */
.rls-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 80px 24px 40px;
  max-width: 768px;
  margin: 0 auto;
  width: 100%;
}

.rls-title {
  font-size: clamp(2.4rem, 5.5vw, 3.8rem);
  font-weight: 800;
  text-align: center;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 0 0 22px;
  color: #091e42;
}

.rls-title-gradient {
  background: linear-gradient(135deg, #ed3b91, #08b8fb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.rls-subtitle {
  font-size: clamp(0.95rem, 1.8vw, 1.12rem);
  color: #6882a9;
  text-align: center;
  line-height: 1.75;
  margin: 0 0 36px;
  max-width: 540px;
}

/* Gradient divider */
.rls-divider {
  width: 48px;
  height: 3px;
  border-radius: 4px;
  background: linear-gradient(90deg, #ed3b91, #08b8fb);
  margin-bottom: 52px;
}

/* CTA Button — brand gradient pill */
.rls-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #ed3b91, #08b8fb);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: 0.01em;
  box-shadow: 0 4px 20px rgba(237, 59, 145, 0.30);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.rls-cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(237, 59, 145, 0.40);
}

/* Flip arrow for RTL */
[dir="rtl"] .rls-cta-btn svg {
  transform: rotate(180deg);
}

/* Video section */
.rls-videos {
  width: 100%;
  padding: 0 0 88px;
}

/* Responsive */
@media (max-width: 640px) {
  .rls-hero {
    padding: 52px 16px 32px;
  }
  .rls-divider {
    margin-bottom: 36px;
  }
}
@media (max-width: 520px) {
  .rls-hero {
    padding: 44px 16px 28px;
  }
}
        `}</style>
      </ResourcesShell>

      {/* ══ Video Player Modal ══ */}
      {playerVideo && (
        <VideoPlayerModal
          video={playerVideo}
          onClose={() => setPlayerVideo(null)}
        />
      )}
    </Layout>
  );
}
