import React from 'react';

interface CosmicBackgroundProps {
  children: React.ReactNode;
  className?: string;
  /** Unique prefix for SVG gradient IDs (avoids clashes when multiple instances exist) */
  id?: string;
}

/**
 * Cosmic gradient background with flowing wave ribbons, glowing spheres,
 * dot-grid accents, and a noise texture overlay.
 *
 * Wraps children in a positioned container — content should use `position: relative; z-index: 2`.
 */
export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({
  children,
  className = '',
  id = 'cb',
}) => (
  <div className={`cosmic-bg ${className}`}>
    {/* Flowing wave lines */}
    <svg
      className="cosmic-bg__waves"
      viewBox="0 0 1440 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`${id}W1`} x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#f472b6" stopOpacity="0.35" />
          <stop offset="0.65" stopColor="#a78bfa" stopOpacity="0.35" />
          <stop offset="1" stopColor="#e879f9" stopOpacity="0.50" />
        </linearGradient>
        <linearGradient id={`${id}W2`} x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#67e8f9" stopOpacity="0.30" />
          <stop offset="0.4" stopColor="#f472b6" stopOpacity="0.20" />
          <stop offset="1" stopColor="#f0abfc" stopOpacity="0.30" />
        </linearGradient>
      </defs>
      <path d="M-60 180Q200 120,460 190T940 150T1500 200" stroke={`url(#${id}W1)`} strokeWidth="1.6" opacity=".70" />
      <path d="M-60 200Q240 140,500 210T980 170T1500 220" stroke={`url(#${id}W1)`} strokeWidth="1.2" opacity=".55" />
      <path d="M-60 220Q180 160,440 230T920 190T1500 240" stroke={`url(#${id}W1)`} strokeWidth="1.8" opacity=".60" />
      <path d="M-60 240Q260 180,520 250T1000 210T1500 260" stroke={`url(#${id}W1)`} strokeWidth="1.0" opacity=".45" />
      <path d="M-60 260Q200 200,460 270T940 230T1500 280" stroke={`url(#${id}W1)`} strokeWidth="1.4" opacity=".55" />
      <path d="M-60 285Q250 225,510 295T990 255T1500 305" stroke={`url(#${id}W2)`} strokeWidth="0.9" opacity=".35" />
      <path d="M-60 305Q190 245,450 315T930 275T1500 325" stroke={`url(#${id}W2)`} strokeWidth="1.1" opacity=".28" />
      <path d="M-60 325Q260 265,520 335T1000 295T1500 345" stroke={`url(#${id}W2)`} strokeWidth="0.7" opacity=".22" />
    </svg>

    {/* Glowing spheres */}
    <div className="cosmic-bg__sphere cosmic-bg__sphere--blue" aria-hidden="true" />
    <div className="cosmic-bg__sphere cosmic-bg__sphere--teal" aria-hidden="true" />
    <div className="cosmic-bg__sphere cosmic-bg__sphere--pink-lg" aria-hidden="true" />
    <div className="cosmic-bg__sphere cosmic-bg__sphere--pink-sm" aria-hidden="true" />

    {/* Dot-grid accents */}
    <div className="cosmic-bg__dots cosmic-bg__dots--left" aria-hidden="true">
      <svg width="100" height="140" viewBox="0 0 100 140" fill="none" style={{ position: 'absolute', inset: 0 }}>
        <line x1="12" y1="24" x2="24" y2="36" stroke="rgba(237,59,145,0.25)" strokeWidth="1" />
        <line x1="24" y1="36" x2="12" y2="48" stroke="rgba(237,59,145,0.20)" strokeWidth="1" />
        <line x1="24" y1="60" x2="36" y2="72" stroke="rgba(237,59,145,0.18)" strokeWidth="1" />
        <line x1="36" y1="72" x2="48" y2="60" stroke="rgba(237,59,145,0.15)" strokeWidth="1" />
        <circle cx="12" cy="24" r="2.5" fill="rgba(237,59,145,0.4)" />
        <circle cx="24" cy="36" r="3" fill="rgba(237,59,145,0.45)" />
        <circle cx="12" cy="48" r="2" fill="rgba(237,59,145,0.35)" />
        <circle cx="24" cy="60" r="2.5" fill="rgba(237,59,145,0.30)" />
        <circle cx="36" cy="72" r="3" fill="rgba(237,59,145,0.40)" />
        <circle cx="48" cy="60" r="2" fill="rgba(237,59,145,0.25)" />
        <circle cx="36" cy="48" r="2" fill="rgba(237,59,145,0.20)" />
        <circle cx="48" cy="84" r="2.5" fill="rgba(237,59,145,0.30)" />
        <circle cx="12" cy="72" r="2" fill="rgba(237,59,145,0.22)" />
        <circle cx="36" cy="96" r="2" fill="rgba(237,59,145,0.20)" />
        <circle cx="24" cy="108" r="2.5" fill="rgba(237,59,145,0.25)" />
        <circle cx="48" cy="108" r="2" fill="rgba(237,59,145,0.18)" />
      </svg>
    </div>
    <div className="cosmic-bg__dots cosmic-bg__dots--right" aria-hidden="true">
      <svg width="90" height="90" viewBox="0 0 90 90" fill="none" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="80" cy="10" r="2" fill="rgba(244,114,182,0.30)" />
        <circle cx="70" cy="22" r="2.5" fill="rgba(244,114,182,0.35)" />
        <circle cx="56" cy="32" r="2" fill="rgba(244,114,182,0.28)" />
        <circle cx="42" cy="38" r="2.5" fill="rgba(244,114,182,0.32)" />
        <circle cx="30" cy="48" r="2" fill="rgba(244,114,182,0.25)" />
        <circle cx="20" cy="60" r="2.5" fill="rgba(244,114,182,0.30)" />
        <circle cx="14" cy="74" r="2" fill="rgba(244,114,182,0.22)" />
        <circle cx="68" cy="38" r="1.5" fill="rgba(244,114,182,0.20)" />
        <circle cx="50" cy="52" r="2" fill="rgba(244,114,182,0.25)" />
        <circle cx="36" cy="64" r="1.5" fill="rgba(244,114,182,0.18)" />
        <circle cx="62" cy="54" r="1.5" fill="rgba(244,114,182,0.15)" />
      </svg>
    </div>

    {/* Content slot */}
    {children}

    <style>{`
.cosmic-bg {
  position: relative;
  min-height: calc(100vh - 72px);
  overflow: hidden;
  background:
    linear-gradient(180deg,
      #070a1f 0%, #0c1033 6%, #121440 12%, #1a1856 18%,
      #251e6d 24%, #332c84 30%, #463c9c 36%, #5c50b2 42%,
      #7868c6 48%, #9684d6 53%, #b3a2e2 58%, #cec0ec 63%,
      #e0d8f2 68%, #ece6f6 73%, #f3eff9 80%, #f8f5fc 88%,
      #fbf9fd 100%);
}
.cosmic-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.018;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 200px 200px;
  pointer-events: none;
}
.cosmic-bg__waves {
  position: absolute;
  top: 8%; left: 0;
  width: 100%; height: 55%;
  z-index: 1;
  pointer-events: none;
}
.cosmic-bg__sphere {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
}
.cosmic-bg__sphere--blue {
  width: 130px; height: 130px;
  top: 8%; left: 4%;
  background: radial-gradient(circle at 38% 32%, #7dd3fc 0%, #38bdf8 30%, rgba(56,189,248,0.25) 65%, transparent 100%);
  box-shadow: 0 0 70px 10px rgba(56,189,248,0.30);
  filter: blur(1.5px);
}
.cosmic-bg__sphere--teal {
  width: 36px; height: 36px;
  top: 6%; right: 18%;
  background: radial-gradient(circle at 40% 35%, #99f6e4 0%, #2dd4bf 60%, transparent 100%);
  box-shadow: 0 0 18px rgba(45,212,191,0.35);
  filter: blur(0.5px);
}
.cosmic-bg__sphere--pink-lg {
  width: 150px; height: 150px;
  top: 30%; right: 1%;
  background: radial-gradient(circle at 45% 38%, #f9a8d4 0%, #ec4899 35%, rgba(236,72,153,0.25) 65%, transparent 100%);
  box-shadow: 0 0 80px 12px rgba(236,72,153,0.28);
  filter: blur(2px);
}
.cosmic-bg__sphere--pink-sm {
  width: 44px; height: 44px;
  bottom: 32%; right: 7%;
  background: radial-gradient(circle at 40% 35%, #fbcfe8 0%, #f472b6 55%, transparent 100%);
  box-shadow: 0 0 24px rgba(244,114,182,0.30);
  filter: blur(0.5px);
}
.cosmic-bg__dots {
  position: absolute;
  z-index: 1;
  pointer-events: none;
}
.cosmic-bg__dots--left {
  width: 100px; height: 140px;
  top: 44%; left: 3%;
}
.cosmic-bg__dots--right {
  width: 90px; height: 90px;
  top: 42%; right: 3%;
}
@media (max-width: 640px) {
  .cosmic-bg__sphere--pink-lg,
  .cosmic-bg__sphere--pink-sm { display: none; }
  .cosmic-bg__dots { display: none; }
}
    `}</style>
  </div>
);
