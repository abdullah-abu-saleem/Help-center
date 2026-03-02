import React from 'react';
import type { ResourceVideo } from '../../data/resourceVideos';
import { extractYouTubeId, youTubeThumbnail } from '../../lib/tutorialsApi';
import { useI18n } from '../../lib/i18n';

/* ═══════════════════════════════════════════════════
   TutorialCard — Modern card with inset thumbnail,
   title + description, and circular play button.
   Clicking always opens the modal (no inline play).
   ═══════════════════════════════════════════════════ */

interface TutorialCardProps {
  video: ResourceVideo;
  displayIndex: number;
  onPlay: () => void;
  /** Optional custom poster image — replaces the YouTube thumbnail */
  customThumbnail?: string;
}

import { COLORS } from '../../theme/colors';

const PLAY_BTN = COLORS.primary;

export const TutorialCard: React.FC<TutorialCardProps> = ({
  video,
  displayIndex,
  onPlay,
  customThumbnail,
}) => {
  const { dir } = useI18n();
  const isRTL = dir === 'rtl';
  const videoId = extractYouTubeId(video.url);
  const thumb = customThumbnail || (videoId ? youTubeThumbnail(videoId) : '');
  const idx = String(displayIndex).padStart(2, '0');

  return (
    <div
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlay(); }
      }}
      style={{
        borderRadius: 22,
        overflow: 'hidden',
        background: '#fff',
        cursor: 'pointer',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        border: '1px solid #f1f5f9',
        height: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)';
      }}
    >
      {/* ── Thumbnail area — inset with its own border-radius ── */}
      <div style={{ padding: '14px 14px 0' }}>
        <div style={{
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          background: '#f1f5f9',
          aspectRatio: '16 / 9',
        }}>
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
              {/* Centered play overlay */}
              <div
                className="tc-thumb-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.15)',
                  transition: 'background 0.25s ease',
                }}
              >
                <div style={{
                  width: 66,
                  height: 66,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.92)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill={PLAY_BTN} style={{ marginLeft: 2 }}>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#cbd5e1', minHeight: 190,
            }}>
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
          )}

          {/* Index badge */}
          <div style={{
            position: 'absolute', top: 10, ...(isRTL ? { right: 10 } : { left: 10 }),
            padding: '4px 10px', borderRadius: 8,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            color: '#fff', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.02em',
          }}>
            {idx}
          </div>
        </div>
      </div>

      {/* ── Content area: title + desc (left) + play button (right) ── */}
      <div style={{
        padding: '16px 18px 20px',
        flex: 1,
        display: 'flex',
        flexDirection: isRTL ? 'row-reverse' : 'row',
        gap: 14,
        alignItems: 'flex-start',
      }}>
        <div style={{ flex: 1, minWidth: 0, direction: isRTL ? 'rtl' : 'ltr', textAlign: isRTL ? 'right' : 'left' }}>
          <h3 style={{
            fontSize: 17, fontWeight: 700,
            color: COLORS.neutral,
            lineHeight: 1.35, marginBottom: 5,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          } as React.CSSProperties}>
            {video.title}
          </h3>
          {video.description && (
            <p style={{
              fontSize: 13, color: COLORS.neutralLight,
              lineHeight: 1.55, margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            } as React.CSSProperties}>
              {video.description}
            </p>
          )}
        </div>

        {/* Circular play button */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: PLAY_BTN,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 2,
          boxShadow: '0 4px 14px rgba(237,59,145,0.30)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 2 }}>
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Hover style for thumbnail overlay */}
      <style>{`
        .tc-thumb-overlay:hover {
          background: rgba(0,0,0,0.30) !important;
        }
        .tc-thumb-overlay:hover > div {
          transform: scale(1.08);
          box-shadow: 0 6px 28px rgba(0,0,0,0.25) !important;
        }
      `}</style>
    </div>
  );
};
