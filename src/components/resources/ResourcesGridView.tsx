import React, { useState, useMemo } from 'react';
import { Layout } from '../Layout';
import { Link } from 'react-router-dom';
import { useI18n } from '../../lib/i18n';
import type { ResourceVideo } from '../../data/resourceVideos';
import { TutorialCard } from './TutorialCard';
import { VideoPlayerModal } from './VideoPlayerModal';

/* ═══════════════════════════════════════════════════
   ResourcesGridView — "See all" grid with search
   Used by TeacherResourcesAllPage & StudentResourcesAllPage.
   Accepts pre-resolved videos (title/description already localized).
   ═══════════════════════════════════════════════════ */

interface ResourcesGridViewProps {
  videos: ResourceVideo[];
  accentColor: string;
  backTo: string;
  backLabel: string;
  title: React.ReactNode;
  /** Map of video id → custom poster image URL */
  customThumbnails?: Record<string, string>;
  loading?: boolean;
}

export const ResourcesGridView: React.FC<ResourcesGridViewProps> = ({
  videos,
  accentColor,
  backTo,
  backLabel,
  title,
  customThumbnails,
  loading,
}) => {
  const { lang } = useI18n();
  const [search, setSearch] = useState('');
  const [playerVideo, setPlayerVideo] = useState<ResourceVideo | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return videos;
    const q = search.toLowerCase();
    return videos.filter((v) =>
      v.title.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q)
    );
  }, [videos, search]);

  return (
    <Layout>
      <div style={{ minHeight: '100vh' }}>
        {/* Header */}
        <div style={{
          background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
          padding: '28px 24px 24px',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Link
              to={backTo}
              style={{
                fontSize: 13, fontWeight: 600, color: accentColor,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
                marginBottom: 12,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              {backLabel}
            </Link>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
              {title}
            </h1>

            {/* Search */}
            <div style={{ position: 'relative', maxWidth: 400 }}>
              <svg
                style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  width: 18, height: 18, color: '#94a3b8',
                }}
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث عن فيديو...' : 'Search videos...'}
                style={{
                  width: '100%', padding: '10px 16px 10px 42px',
                  borderRadius: 12, border: '1px solid #e2e8f0',
                  background: '#fff', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = accentColor;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${accentColor}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        </div>

        {/* Grid area */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="w-8 h-8 border-2 border-slate-200 border-t-[#6366f1] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              <svg style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.5 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <p style={{ fontSize: 15 }}>
                {lang === 'ar' ? 'لا توجد نتائج.' : 'No videos found.'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: 24,
            }}>
              {filtered.map((video, i) => (
                <TutorialCard
                  key={video.id}
                  video={video}
                  displayIndex={i + 1}
                  onPlay={() => setPlayerVideo(video)}
                  {...(customThumbnails?.[video.id] ? { customThumbnail: customThumbnails[video.id] } : {})}
                />
              ))}
            </div>
          )}
        </div>
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
};
