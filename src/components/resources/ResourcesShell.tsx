import React from 'react';

/**
 * ResourcesShell — transparent content wrapper for Resources pages.
 *
 * Background layers (grid + dots + noise) are now handled globally
 * by GlobalBackground in App.tsx — no duplicate rendering here.
 *
 * This shell provides:
 *   - Subtle gradient blobs (blue top-left, pink bottom-right)
 *   - Min-height so the page fills the viewport
 *   - Content z-layer above the blobs
 */
export const ResourcesShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rs-root">
    <div className="rs-blob rs-blob--blue" aria-hidden="true" />
    <div className="rs-blob rs-blob--pink" aria-hidden="true" />
    <div className="rs-content">{children}</div>

    <style>{`
.rs-root {
  position: relative;
  min-height: calc(100vh - 72px);
  overflow: hidden;
}
.rs-blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}
.rs-blob--blue {
  width: 600px;
  height: 600px;
  top: -12%;
  left: -8%;
  background: radial-gradient(circle, rgba(8, 184, 251, 0.13), transparent 70%);
  filter: blur(60px);
}
.rs-blob--pink {
  width: 600px;
  height: 600px;
  bottom: -12%;
  right: -8%;
  background: radial-gradient(circle, rgba(237, 59, 145, 0.11), transparent 70%);
  filter: blur(60px);
}
.rs-content {
  position: relative;
  z-index: 1;
}
    `}</style>
  </div>
);
