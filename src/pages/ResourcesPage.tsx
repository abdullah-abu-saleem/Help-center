import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { ResourceSection } from '../components/ResourceSection';
import { teacherSectionsMeta, studentSectionsMeta } from '../resourcesData';
import type { Resource } from '../resourcesData';
import { useI18n } from '../lib/i18n';
import { extractYouTubeId, youTubeThumbnail } from '../lib/tutorialsApi';
import { getHcResourceVideos, type HcResourceVideo } from '../lib/helpCenterApi';

const PINK = '#EC4899';
const BLUE = '#08B8FB';

export default function ResourcesPage() {
  const { localize } = useI18n();

  const [rawTeacher, setRawTeacher] = useState<HcResourceVideo[]>([]);
  const [rawStudent, setRawStudent] = useState<HcResourceVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { console.log('[HC_RESOURCES] mounted'); }, []);

  useEffect(() => {
    let cancelled = false;
    console.log('[ResourcesPage] Fetching hc_resource_videos (teacher + student)…');
    (async () => {
      try {
        const [teacherRows, studentRows] = await Promise.all([
          getHcResourceVideos('teacher'),
          getHcResourceVideos('student'),
        ]);
        if (cancelled) return;
        console.log('[ResourcesPage] Loaded', teacherRows.length, 'teacher +', studentRows.length, 'student videos');
        setRawTeacher(teacherRows);
        setRawStudent(studentRows);
      } catch (err: any) {
        console.error('[ResourcesPage] Supabase error:', err);
        if (!cancelled) setError(err?.message || 'Failed to load resources');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const mapToResources = (rows: HcResourceVideo[], section: string, audience: 'teacher' | 'student'): Resource[] =>
    rows.map((v) => {
      const videoId = extractYouTubeId(v.youtube_url);
      return {
        id: v.id,
        section,
        audience,
        title: localize(v, 'title'),
        description: localize(v, 'description'),
        type: 'watch' as const,
        thumbnail: v.thumbnail_url || (videoId ? youTubeThumbnail(videoId) : ''),
        link: v.youtube_url,
      };
    });

  const teacherResources = useMemo(() => mapToResources(rawTeacher, 'teacher-videos', 'teacher'), [rawTeacher, localize]);
  const studentResources = useMemo(() => mapToResources(rawStudent, 'student-videos', 'student'), [rawStudent, localize]);

  const groupedResources = useMemo(() => {
    const m = new Map<string, Resource[]>();
    m.set('teacher-videos', teacherResources);
    m.set('student-videos', studentResources);
    return m;
  }, [teacherResources, studentResources]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <Layout>
      {/* Page wrapper */}
      <div style={{ position: 'relative', zIndex: 1, display: 'block', minHeight: '100vh' }}>

        {/* ══════════════════════════════════════════════════════
            HERO SECTION (preserved exactly)
            ══════════════════════════════════════════════════════ */}
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
              position: 'absolute',
              borderRadius: '50%',
              opacity: 0.2,
              width: 320,
              height: 320,
              top: -60,
              right: -40,
              background: 'radial-gradient(circle, #ED3B91 0%, transparent 70%)',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              borderRadius: '50%',
              opacity: 0.1,
              width: 240,
              height: 240,
              bottom: -40,
              left: -30,
              background: 'radial-gradient(circle, #08B8FB 0%, transparent 70%)',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 96,
              background: 'linear-gradient(to bottom, transparent, #ffffff)',
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 10,
              maxWidth: 768,
              margin: '0 auto',
              paddingLeft: 24,
              paddingRight: 24,
              paddingTop: 80,
              paddingBottom: 96,
              textAlign: 'center' as const,
            }}
          >
            {/* Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 9999,
                marginBottom: 24,
                background: 'rgba(237,59,145,0.08)',
                border: '1px solid rgba(237,59,145,0.15)',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ED3B91',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: '#ED3B91' }}>
                Resources
              </span>
            </div>

            {/* Heading */}
            <h1
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: '#0f172a',
                marginBottom: 20,
              }}
            >
              String{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #ED3B91, #c026a8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Teaching Resources
              </span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                color: '#64748b',
                lineHeight: 1.7,
                maxWidth: 540,
                margin: '0 auto 40px',
              }}
            >
              Explore tutorials, classroom materials, and professional development resources designed to help educators succeed with String.
            </p>

            {/* CTA Button */}
            <button
              onClick={() => scrollTo('resource-sections')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 28px',
                borderRadius: 12,
                color: '#ffffff',
                fontWeight: 600,
                fontSize: 16,
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #ff4da6, #ED3B91)',
                boxShadow: '0 4px 14px rgba(237,59,145,0.3)',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(237,59,145,0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(237,59,145,0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Browse Resources
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
              </svg>
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            RESOURCE SECTIONS
            ══════════════════════════════════════════════════════ */}
        <div
          id="resource-sections"
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 48,
            paddingBottom: 80,
            scrollMarginTop: 90,
          }}
        >
          {/* ── Audience Tabs ── */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 48,
            }}
          >
            <button
              onClick={() => scrollTo('section-teacher')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 9999,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                background: PINK,
                color: '#fff',
                boxShadow: `0 2px 10px ${PINK}40`,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = `0 4px 16px ${PINK}50`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 2px 10px ${PINK}40`;
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
              </svg>
              Teacher Resources
            </button>
            <button
              onClick={() => scrollTo('section-student')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 9999,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                background: BLUE,
                color: '#fff',
                boxShadow: `0 2px 10px ${BLUE}40`,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = `0 4px 16px ${BLUE}50`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 2px 10px ${BLUE}40`;
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              Student Resources
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="w-8 h-8 border-2 border-slate-200 border-t-[#6366f1] rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: '#ef4444' }}>
              <p style={{ fontSize: 15, fontWeight: 600 }}>Failed to load resources</p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{error}</p>
            </div>
          ) : (
            <>
              {/* ── Teacher Resources ── */}
              <div id="section-teacher" style={{ scrollMarginTop: 90, marginBottom: 64 }}>
                <div style={{ marginBottom: 32, paddingBottom: 16, borderBottom: `3px solid ${PINK}` }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '5px 14px', borderRadius: 9999, marginBottom: 12,
                    background: `${PINK}12`, border: `1px solid ${PINK}25`,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: PINK, display: 'inline-block' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: PINK }}>
                      For Teachers
                    </span>
                  </div>
                  <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                    <span className="gradient-text">Teacher</span> Resources
                  </h2>
                </div>

                {teacherSectionsMeta.map((meta) => (
                  <ResourceSection
                    key={meta.key}
                    meta={meta}
                    resources={groupedResources.get(meta.key) || []}
                  />
                ))}
              </div>

              {/* ── Student Resources ── */}
              <div id="section-student" style={{ scrollMarginTop: 90 }}>
                <div style={{ marginBottom: 32, paddingBottom: 16, borderBottom: `3px solid ${BLUE}` }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '5px 14px', borderRadius: 9999, marginBottom: 12,
                    background: `${BLUE}12`, border: `1px solid ${BLUE}25`,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: BLUE, display: 'inline-block' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: BLUE }}>
                      For Students
                    </span>
                  </div>
                  <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                    <span className="gradient-text">Student</span> Resources
                  </h2>
                </div>

                {studentSectionsMeta.map((meta) => (
                  <ResourceSection
                    key={meta.key}
                    meta={meta}
                    resources={groupedResources.get(meta.key) || []}
                  />
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </Layout>
  );
}
