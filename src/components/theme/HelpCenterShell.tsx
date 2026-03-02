import React from 'react';
import { COLORS } from '../../theme/colors';

/* ═══════════════════════════════════════════════════════════════
   HelpCenterShell — Page-level content wrapper.

   Background layers (grid + dots + noise) are now handled globally
   by AppBackground in App.tsx — no duplicate rendering here.

   This shell provides:
     1. fadeScale entry animation
     2. prefers-reduced-motion guard
     3. Content z-layer (z-20) above the global background
     4. Optional THEME_DEBUG badge
   ═══════════════════════════════════════════════════════════════ */

const THEME_DEBUG = true;

interface HelpCenterShellProps {
  children: React.ReactNode;
  /** Override container class (default: none — pages handle their own) */
  className?: string;
  /** Skip the page background (for pages with hero sections that need full-bleed) */
  noBg?: boolean;
}

export const HelpCenterShell: React.FC<HelpCenterShellProps> = ({
  children,
  className = '',
  noBg = false,
}) => (
  <div
    className="relative min-h-screen overflow-x-hidden font-sans selection:bg-[#08b8fb]/20"
  >
    {/* Keyframe styles + reduced-motion guard */}
    <style>{`
      @keyframes fadeScale {
        from { opacity: 0; transform: scale(0.97) translateY(8px); }
        to   { opacity: 1; transform: scale(1)    translateY(0);   }
      }
      .hc-shell-enter {
        animation: fadeScale 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @media (prefers-reduced-motion: reduce) {
        .hc-shell-enter,
        .fade-scale-in,
        .fade-up {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>

    {/* Content layer — sits above global background */}
    <div className={`relative z-20 hc-shell-enter ${className}`}>
      {children}
    </div>

    {/* Debug badge — proves the theme is active */}
    {THEME_DEBUG && (
      <div
        className="fixed bottom-4 right-6 z-[9999] inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm backdrop-blur-sm"
        style={{
          background: 'rgba(8, 184, 251, 0.10)',
          color: COLORS.secondary,
          border: '1px solid rgba(8, 184, 251, 0.20)',
        }}
      >
        <span
          className="inline-block rounded-full"
          style={{ width: 6, height: 6, background: '#4ade80' }}
        />
        Theme Active
      </div>
    )}
  </div>
);
