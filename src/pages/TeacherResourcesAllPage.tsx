import React, { useState, useEffect, useMemo } from 'react';
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
      <ResourcesGridView
        videos={[]}
        accentColor="#ED3B91"
        backTo="/help/resources/teachers"
        backLabel={lang === 'ar' ? 'العودة' : 'Back'}
        title={lang === 'ar' ? <>جميع دروس <span className="gradient-text">المعلمين</span></> : <>All <span className="gradient-text">Teacher</span> Tutorials</>}
        customThumbnails={{}}
        loading={false}
      />
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
