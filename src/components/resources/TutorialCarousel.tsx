import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { ResourceVideo } from '../../data/resourceVideos';
import { TutorialCard } from './TutorialCard';

/* ═══════════════════════════════════════════════════
   TutorialCarousel — horizontal scroll with arrows
   Desktop: 3 cards visible, left/right arrows.
   Tablet: 2 cards visible.
   Mobile: 1 card, native swipe via scroll-snap.
   ═══════════════════════════════════════════════════ */

const PINK = '#EC4899';
const PINK_HOVER = '#DB2777';
const PINK_ACTIVE = '#BE185D';
const GAP = 20;

interface TutorialCarouselProps {
  videos: ResourceVideo[];
  onPlayVideo: (video: ResourceVideo) => void;
  heading: string;
  subtitle?: string;
  /** Map of video id → custom poster image URL */
  customThumbnails?: Record<string, string>;
}

export const TutorialCarousel: React.FC<TutorialCarouselProps> = ({
  videos,
  onPlayVideo,
  heading,
  subtitle,
  customThumbnails,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    requestAnimationFrame(updateArrows);
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, videos.length]);

  const scroll = (dir: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    // Read actual rendered card width for accurate scrolling
    const card = el.querySelector('.res-card-slot') as HTMLElement | null;
    const scrollAmount = card ? card.offsetWidth + GAP : 400;
    el.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  if (videos.length === 0) return null;

  const arrowBase: React.CSSProperties = {
    position: 'absolute',
    top: '38%',
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: PINK,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(236,72,153,0.35)',
    transition: 'background 0.2s, transform 0.2s, box-shadow 0.2s',
  };

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 800, color: '#0f172a', marginBottom: 8, lineHeight: 1.2,
        }}>
          {heading}
        </h2>
        {subtitle && (
          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Carousel wrapper */}
      <div style={{ position: 'relative' }}>
        {/* Left arrow */}
        {canLeft && (
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            style={{ ...arrowBase, left: -8, transform: 'translateY(-50%)' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; e.currentTarget.style.background = PINK_HOVER; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.background = PINK; }}
            onMouseDown={(e) => { e.currentTarget.style.background = PINK_ACTIVE; }}
            onMouseUp={(e) => { e.currentTarget.style.background = PINK_HOVER; }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}

        {/* Scrollable track */}
        <div
          ref={trackRef}
          className="res-carousel-track"
          style={{
            display: 'flex',
            gap: GAP,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory' as any,
            padding: '8px 4px 16px',
            scrollbarWidth: 'none',
          }}
        >
          {videos.map((v, i) => (
            <div key={v.id} className="res-card-slot">
              <TutorialCard
                video={v}
                displayIndex={i + 1}
                onPlay={() => onPlayVideo(v)}
                {...(customThumbnails?.[v.id] ? { customThumbnail: customThumbnails[v.id] } : {})}
              />
            </div>
          ))}
        </div>

        {/* Right arrow */}
        {canRight && (
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            style={{ ...arrowBase, right: -8, transform: 'translateY(-50%)' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; e.currentTarget.style.background = PINK_HOVER; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.background = PINK; }}
            onMouseDown={(e) => { e.currentTarget.style.background = PINK_ACTIVE; }}
            onMouseUp={(e) => { e.currentTarget.style.background = PINK_HOVER; }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>

      {/* Responsive card sizing + scrollbar hide */}
      <style>{`
        .res-carousel-track::-webkit-scrollbar { display: none; }
        .res-card-slot {
          flex: 0 0 440px;
          scroll-snap-align: start;
        }
        @media (max-width: 900px) {
          .res-card-slot { flex: 0 0 400px; }
        }
        @media (max-width: 640px) {
          .res-card-slot { flex: 0 0 90vw; }
        }
      `}</style>
    </section>
  );
};
