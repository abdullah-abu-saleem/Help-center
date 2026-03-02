import React from 'react';

/**
 * NoiseOverlay (scoped) — SVG fractalNoise texture.
 *
 * Uses **absolute** positioning so the noise is contained within
 * its nearest positioned ancestor (HelpCenterShell).
 * This prevents noise from leaking onto Dashboard / Admin / other routes.
 *
 * The global fixed version at ui/NoiseOverlay.tsx is left untouched
 * for backward-compat with ThemeWrapper.
 */
export const NoiseOverlay: React.FC = () => (
  <div
    className="pointer-events-none absolute inset-0 z-10 opacity-[0.02]"
    aria-hidden="true"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    }}
  />
);
