import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ResourcesGridView } from '../components/resources/ResourcesGridView';
import { useI18n } from '../lib/i18n';
import { getHcResourceVideos, type HcResourceVideo } from '../lib/helpCenterApi';
import type { ResourceVideo } from '../data/resourceVideos';

export default function TeacherResourcesAllPage() {
  const { lang, localize } = useI18n();
  const [rawVideos, setRawVideos] = useState<HcResourceVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    console.log('[TeacherResourcesAllPage] Fetching hc_resource_videos (teacher)…');
    (async () => {
      try {
        const rows = await getHcResourceVideos('teacher');
        if (cancelled) return;
        console.log('[TeacherResourcesAllPage] Loaded', rows.length, 'videos');
        setRawVideos(rows);
      } catch (err: any) {
        console.error('[TeacherResourcesAllPage] Supabase error:', err);
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

  if (error) {
    return (
      <Layout>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <svg style={{ width: 48, height: 48, color: '#ef4444', marginBottom: 16, opacity: 0.7 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p style={{ fontSize: 15, color: '#ef4444', marginBottom: 16 }}>{error}</p>
          <Link
            to="/help/resources/teachers"
            style={{ fontSize: 14, fontWeight: 600, color: '#ED3B91', textDecoration: 'none' }}
          >
            &larr; {lang === 'ar' ? 'العودة' : 'Back'}
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <ResourcesGridView
      videos={videos}
      accentColor="#ED3B91"
      backTo="/help/resources/teachers"
      backLabel={lang === 'ar' ? 'العودة' : 'Back'}
      title={lang === 'ar' ? <>جميع دروس <span className="gradient-text">المعلمين</span></> : <>All <span className="gradient-text">Teacher</span> Tutorials</>}
      customThumbnails={customThumbnails}
      loading={loading}
    />
  );
}
