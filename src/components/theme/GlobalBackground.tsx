import React from 'react';
import { NeuroNetworkCanvas } from './NeuroNetworkCanvas';
import { COLORS } from '../../theme/colors';

/**
 * GlobalBackground — fixed full-viewport animated background for every route.
 *
 * Layers (bottom → top):
 *   1. Page background colour (#F8FAFC)
 *   2. NeuroNetworkCanvas (animated pink/blue dots + connecting lines)
 *   3. Grid overlay (50px squares, low opacity)
 *   4. Soft radial fade (transparent centre → white 60% edges)
 *   5. Noise overlay (SVG fractalNoise at 2% opacity)
 *
 * Mounted ONCE at the app root (App.tsx).
 * Uses `fixed inset-0` so it stays behind every route.
 * pointer-events: none ensures nothing is blocked.
 */
export const GlobalBackground: React.FC = () => (
  <>
    {/* 1. Page background colour */}
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
      style={{ background: COLORS.bgPage }}
    />

    {/* 2-4. Canvas + Grid + Radial fade */}
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    >
      {/* Animated dots + connecting lines */}
      <NeuroNetworkCanvas />

      {/* Grid overlay (subtle) */}
      <div
        className="absolute inset-0 opacity-[0.6]"
        style={{
          backgroundImage: `linear-gradient(${COLORS.border} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Soft radial fade to white/60 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.6)_100%)] pointer-events-none" />
    </div>

    {/* 5. Noise overlay */}
    <div
      className="fixed inset-0 z-[1] pointer-events-none opacity-[0.02]"
      aria-hidden="true"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  </>
);
