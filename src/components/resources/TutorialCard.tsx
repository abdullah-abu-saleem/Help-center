import React, { useState } from 'react';
import type { ResourceVideo } from '../../data/resourceVideos';
import { extractYouTubeId, youTubeThumbnail } from '../../lib/tutorialsApi';

/* ═══════════════════════════════════════════════════
   TutorialCard — ClassDojo-style card
   Large thumbnail (220px), rounded,
   title + description + circular play button.
   ═══════════════════════════════════════════════════ */

interface TutorialCardProps {
  video: ResourceVideo;
  displayIndex: number;
  onPlay: () => void;
  /** Optional custom poster image — replaces the YouTube thumbnail */
  customThumbnail?: string;
  /** If true, clicking plays video inline (iframe) instead of opening modal */
  inlinePlay?: boolean;
}

const PLAY_BTN = '#EC4899';
const TITLE_COLOR = '#0891b2';

export const TutorialCard: React.FC<TutorialCardProps> = ({
  video,
  displayIndex,
  onPlay,
  customThumbnail,
  inlinePlay,
}) => {
  const videoId = extractYouTubeId(video.url);
  const thumb = customThumbnail || (videoId ? youTubeThumbnail(videoId) : '');
  const idx = String(displayIndex).padStart(2, '0');
  const [playing, setPlaying] = useState(false);

  const handleClick = () => {
    if (inlinePlay && videoId) {
      setPlaying(true);
    } else {
      onPlay();
    }
  };

  return (
    <div
      onClick={!playing ? handleClick : undefined}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!playing && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleClick(); }
      }}
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        border: '1.5px solid #e8ecf2',
        background: '#fff',
        cursor: playing ? 'default' : 'pointer',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        height: '100%',
      }}
      onMouseEnter={(e) => {
        if (!playing) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!playing) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
        }
      }}
    >
      {/* Thumbnail / Inline player area */}
      <div style={{
        position: 'relative',
        height: 220,
        background: '#f1f5f9',
        overflow: 'hidden',
      }}>
        {playing && videoId ? (
          /* ── Inline YouTube iframe ── */
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        ) : (
          <>
            {thumb ? (
              <>
                <img
                  src={thumb}
                  alt={video.title}
                  loading="lazy"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                {/* Centered play overlay — only for custom thumbnail */}
                {customThumbnail && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.25)',
                    transition: 'background 0.25s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.35)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.25)'; }}
                  >
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'rgba(236,72,153,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 3 }}>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#cbd5e1',
              }}>
                <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
            )}

            {/* Index badge */}
            <div style={{
              position: 'absolute', top: 12, left: 12,
              padding: '4px 10px', borderRadius: 8,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
              color: '#fff', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.02em',
            }}>
              {idx}
            </div>
          </>
        )}
      </div>

      {/* Content area: title + desc (left) + play button (right) */}
      <div style={{
        padding: '16px 18px 20px',
        flex: 1,
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: 15, fontWeight: 700,
            color: TITLE_COLOR,
            lineHeight: 1.35, marginBottom: 6,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          } as React.CSSProperties}>
            {video.title}
          </h3>
          {video.description && (
            <p style={{
              fontSize: 13, color: '#64748b',
              lineHeight: 1.55, margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            } as React.CSSProperties}>
              {video.description}
            </p>
          )}
        </div>

        {/* Circular play button */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: PLAY_BTN,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 2,
          boxShadow: '0 4px 12px rgba(236,72,153,0.3)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 2 }}>
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
