import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useI18n } from '../lib/i18n';

/* ═══════════════════════════════════════════════════════════
   /resources — Cosmic-wave landing page.
   Matches the provided mockup: dark-to-light gradient,
   flowing wave ribbons, glowing spheres, dot accents,
   two large illustration cards, and a CTA pill button.
   ═══════════════════════════════════════════════════════════ */

export default function ResourcesLanding() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <Layout>
      <div className="rl-root">
        {/* ═══ Background decoration layers ═══ */}

        {/* Flowing wave lines */}
        <svg
          className="rl-waves"
          viewBox="0 0 1440 480"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="rlW1" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#38bdf8" stopOpacity="0.55" />
              <stop offset="0.35" stopColor="#818cf8" stopOpacity="0.35" />
              <stop offset="0.65" stopColor="#a78bfa" stopOpacity="0.35" />
              <stop offset="1" stopColor="#e879f9" stopOpacity="0.50" />
            </linearGradient>
            <linearGradient id="rlW2" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#67e8f9" stopOpacity="0.30" />
              <stop offset="0.4" stopColor="#818cf8" stopOpacity="0.20" />
              <stop offset="1" stopColor="#f0abfc" stopOpacity="0.30" />
            </linearGradient>
          </defs>
          {/* Primary wave bundle */}
          <path d="M-60 180Q200 120,460 190T940 150T1500 200" stroke="url(#rlW1)" strokeWidth="1.6" opacity=".70" />
          <path d="M-60 200Q240 140,500 210T980 170T1500 220" stroke="url(#rlW1)" strokeWidth="1.2" opacity=".55" />
          <path d="M-60 220Q180 160,440 230T920 190T1500 240" stroke="url(#rlW1)" strokeWidth="1.8" opacity=".60" />
          <path d="M-60 240Q260 180,520 250T1000 210T1500 260" stroke="url(#rlW1)" strokeWidth="1.0" opacity=".45" />
          <path d="M-60 260Q200 200,460 270T940 230T1500 280" stroke="url(#rlW1)" strokeWidth="1.4" opacity=".55" />
          {/* Secondary softer set */}
          <path d="M-60 285Q250 225,510 295T990 255T1500 305" stroke="url(#rlW2)" strokeWidth="0.9" opacity=".35" />
          <path d="M-60 305Q190 245,450 315T930 275T1500 325" stroke="url(#rlW2)" strokeWidth="1.1" opacity=".28" />
          <path d="M-60 325Q260 265,520 335T1000 295T1500 345" stroke="url(#rlW2)" strokeWidth="0.7" opacity=".22" />
        </svg>

        {/* Glowing spheres */}
        <div className="rl-sphere rl-sphere--blue" aria-hidden="true" />
        <div className="rl-sphere rl-sphere--teal" aria-hidden="true" />
        <div className="rl-sphere rl-sphere--pink-lg" aria-hidden="true" />
        <div className="rl-sphere rl-sphere--pink-sm" aria-hidden="true" />

        {/* Dot-grid accents */}
        <div className="rl-dots rl-dots--left" aria-hidden="true">
          {/* Small connector lines for network-like feel */}
          <svg width="100" height="140" viewBox="0 0 100 140" fill="none" style={{ position: 'absolute', inset: 0 }}>
            <line x1="12" y1="24" x2="24" y2="36" stroke="rgba(129,140,248,0.25)" strokeWidth="1" />
            <line x1="24" y1="36" x2="12" y2="48" stroke="rgba(129,140,248,0.20)" strokeWidth="1" />
            <line x1="24" y1="60" x2="36" y2="72" stroke="rgba(129,140,248,0.18)" strokeWidth="1" />
            <line x1="36" y1="72" x2="48" y2="60" stroke="rgba(129,140,248,0.15)" strokeWidth="1" />
            <circle cx="12" cy="24" r="2.5" fill="rgba(129,140,248,0.4)" />
            <circle cx="24" cy="36" r="3" fill="rgba(129,140,248,0.45)" />
            <circle cx="12" cy="48" r="2" fill="rgba(129,140,248,0.35)" />
            <circle cx="24" cy="60" r="2.5" fill="rgba(129,140,248,0.30)" />
            <circle cx="36" cy="72" r="3" fill="rgba(129,140,248,0.40)" />
            <circle cx="48" cy="60" r="2" fill="rgba(129,140,248,0.25)" />
            <circle cx="36" cy="48" r="2" fill="rgba(129,140,248,0.20)" />
            <circle cx="48" cy="84" r="2.5" fill="rgba(129,140,248,0.30)" />
            <circle cx="12" cy="72" r="2" fill="rgba(129,140,248,0.22)" />
            <circle cx="36" cy="96" r="2" fill="rgba(129,140,248,0.20)" />
            <circle cx="24" cy="108" r="2.5" fill="rgba(129,140,248,0.25)" />
            <circle cx="48" cy="108" r="2" fill="rgba(129,140,248,0.18)" />
          </svg>
        </div>
        <div className="rl-dots rl-dots--right" aria-hidden="true">
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none" style={{ position: 'absolute', inset: 0 }}>
            {/* Arc of dots */}
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

        {/* ═══ Content ═══ */}
        <div className="rl-content">
          {/* ── Hero ── */}
          <h1 className="rl-title">{t('resLandingTitle')}</h1>
          <p className="rl-subtitle">
            {t('resLandingSubtitle')}
          </p>
          <div className="rl-divider" />

          {/* ── Cards ── */}
          <div className="rl-cards">
            {/* ────── Teacher Card ────── */}
            <button
              className="rl-card-btn"
              onClick={() => navigate('/resources/teacher')}
              aria-label={t('teacherResources')}
            >
              <div className="rl-card rl-card--teacher">
                {/* Header illustration area */}
                <div className="rl-card__header rl-card__header--teacher">
                  <div className="rl-card__mesh" />

                  {/* Glow pool at bottom */}
                  <div className="rl-card__glow rl-card__glow--teacher" />

                  {/* Platform rings */}
                  <div className="rl-card__platform">
                    <div className="rl-card__ring rl-card__ring--outer rl-card__ring--teacher" />
                    <div className="rl-card__ring rl-card__ring--inner rl-card__ring--teacher" />
                  </div>

                  {/* Decorative books (left) */}
                  <div className="rl-deco" style={{ left: 28, bottom: 50 }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: 22, height: 28, borderRadius: 3, background: '#f472b6', transform: 'rotate(-6deg)', opacity: 0.85 }} />
                    <div style={{ position: 'absolute', bottom: 3, left: 9, width: 22, height: 30, borderRadius: 3, background: '#60a5fa', transform: 'rotate(3deg)', opacity: 0.85 }} />
                    <div style={{ position: 'absolute', bottom: 6, left: 17, width: 22, height: 26, borderRadius: 3, background: '#34d399', transform: 'rotate(-2deg)', opacity: 0.85 }} />
                  </div>

                  {/* Decorative pencil cup (right) */}
                  <div className="rl-deco" style={{ right: 28, bottom: 44 }}>
                    <div style={{ position: 'absolute', bottom: 0, width: 20, height: 24, borderRadius: '4px 4px 2px 2px', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }} />
                    <div style={{ position: 'absolute', bottom: 20, left: 3, width: 3, height: 30, borderRadius: 2, background: '#f472b6', transform: 'rotate(-8deg)' }} />
                    <div style={{ position: 'absolute', bottom: 20, left: 8, width: 3, height: 26, borderRadius: 2, background: '#60a5fa', transform: 'rotate(5deg)' }} />
                    <div style={{ position: 'absolute', bottom: 20, left: 14, width: 3, height: 28, borderRadius: 2, background: '#fbbf24', transform: 'rotate(-3deg)' }} />
                  </div>

                  {/* Central glass icon */}
                  <div className="rl-card__icon rl-card__icon--teacher">
                    <svg width="38" height="38" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                </div>

                {/* Body */}
                <div className="rl-card__body">
                  <h2 className="rl-card__title"><strong>{t('resTeacherTitle')}</strong> {t('resTeacherTitleAccent')}</h2>
                  <p className="rl-card__desc">{t('resTeacherCardDesc')}</p>
                  <div className="rl-card__footer">
                    <div className="rl-card__accent" style={{ background: '#6d28d9' }} />
                    <div className="rl-card__arrow rl-card__arrow--teacher">
                      <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </button>

            {/* ────── Student Card ────── */}
            <button
              className="rl-card-btn"
              onClick={() => navigate('/resources/student')}
              aria-label={t('resStudentTitle') + ' ' + t('resStudentTitleAccent')}
            >
              <div className="rl-card rl-card--student">
                {/* Header illustration area */}
                <div className="rl-card__header rl-card__header--student">
                  <div className="rl-card__mesh" />

                  <div className="rl-card__glow rl-card__glow--student" />

                  <div className="rl-card__platform">
                    <div className="rl-card__ring rl-card__ring--outer rl-card__ring--student" />
                    <div className="rl-card__ring rl-card__ring--inner rl-card__ring--student" />
                  </div>

                  {/* Decorative books (left) */}
                  <div className="rl-deco" style={{ left: 28, bottom: 50 }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: 22, height: 28, borderRadius: 3, background: '#818cf8', transform: 'rotate(-5deg)', opacity: 0.85 }} />
                    <div style={{ position: 'absolute', bottom: 3, left: 10, width: 22, height: 30, borderRadius: 3, background: '#f472b6', transform: 'rotate(3deg)', opacity: 0.85 }} />
                  </div>

                  {/* Decorative play icon (right) */}
                  <div className="rl-deco" style={{ right: 24, top: 44 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'rgba(255,255,255,0.13)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>

                  {/* Small floating spheres */}
                  <div className="rl-deco" style={{ right: 56, bottom: 36 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', position: 'absolute', top: 0, right: 0 }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', position: 'absolute', top: 22, right: 22 }} />
                  </div>

                  {/* Central glass icon */}
                  <div className="rl-card__icon rl-card__icon--student">
                    <svg width="38" height="38" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                  </div>
                </div>

                {/* Body */}
                <div className="rl-card__body">
                  <h2 className="rl-card__title"><strong>{t('resStudentTitle')}</strong> {t('resStudentTitleAccent')}</h2>
                  <p className="rl-card__desc">{t('resStudentCardDesc')}</p>
                  <div className="rl-card__footer">
                    <div className="rl-card__accent" style={{ background: '#ec4899' }} />
                    <div className="rl-card__arrow rl-card__arrow--student">
                      <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* ── CTA ── */}
          <div className="rl-cta">
            <a
              href="https://string.education/auth/login"
              className="rl-cta__btn"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              {t('resSignInBtn')}
            </a>
          </div>
        </div>

        {/* ═══════════ Styles ═══════════ */}
        <style>{`
/* ────────────────────────────────────
   Root — cosmic gradient background
   ──────────────────────────────────── */
.rl-root {
  position: relative;
  min-height: calc(100vh - 72px);
  overflow: hidden;
  background:
    linear-gradient(
      180deg,
      #070a1f 0%,
      #0c1033 6%,
      #121440 12%,
      #1a1856 18%,
      #251e6d 24%,
      #332c84 30%,
      #463c9c 36%,
      #5c50b2 42%,
      #7868c6 48%,
      #9684d6 53%,
      #b3a2e2 58%,
      #cec0ec 63%,
      #e0d8f2 68%,
      #ece6f6 73%,
      #f3eff9 80%,
      #f8f5fc 88%,
      #fbf9fd 100%
    );
}

/* Subtle noise texture (CSS only) */
.rl-root::before {
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

/* ────────────────────────────────────
   Wave SVG
   ──────────────────────────────────── */
.rl-waves {
  position: absolute;
  top: 8%;
  left: 0;
  width: 100%;
  height: 55%;
  z-index: 1;
  pointer-events: none;
}

/* ────────────────────────────────────
   Glowing spheres
   ──────────────────────────────────── */
.rl-sphere {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
}
.rl-sphere--blue {
  width: 130px; height: 130px;
  top: 8%; left: 4%;
  background: radial-gradient(circle at 38% 32%, #7dd3fc 0%, #38bdf8 30%, rgba(56,189,248,0.25) 65%, transparent 100%);
  box-shadow: 0 0 70px 10px rgba(56,189,248,0.30);
  filter: blur(1.5px);
}
.rl-sphere--teal {
  width: 36px; height: 36px;
  top: 6%; right: 18%;
  background: radial-gradient(circle at 40% 35%, #99f6e4 0%, #2dd4bf 60%, transparent 100%);
  box-shadow: 0 0 18px rgba(45,212,191,0.35);
  filter: blur(0.5px);
}
.rl-sphere--pink-lg {
  width: 150px; height: 150px;
  top: 30%; right: 1%;
  background: radial-gradient(circle at 45% 38%, #f9a8d4 0%, #ec4899 35%, rgba(236,72,153,0.25) 65%, transparent 100%);
  box-shadow: 0 0 80px 12px rgba(236,72,153,0.28);
  filter: blur(2px);
}
.rl-sphere--pink-sm {
  width: 44px; height: 44px;
  bottom: 32%; right: 7%;
  background: radial-gradient(circle at 40% 35%, #fbcfe8 0%, #f472b6 55%, transparent 100%);
  box-shadow: 0 0 24px rgba(244,114,182,0.30);
  filter: blur(0.5px);
}

/* ────────────────────────────────────
   Dot-grid accents
   ──────────────────────────────────── */
.rl-dots {
  position: absolute;
  z-index: 1;
  pointer-events: none;
}
.rl-dots--left {
  width: 100px; height: 140px;
  top: 44%; left: 3%;
}
.rl-dots--right {
  width: 90px; height: 90px;
  top: 42%; right: 3%;
}

/* ────────────────────────────────────
   Content layout
   ──────────────────────────────────── */
.rl-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 24px 88px;
}

/* ── Hero ── */
.rl-title {
  font-size: clamp(2.8rem, 6vw, 4.2rem);
  font-weight: 800;
  color: #fff;
  text-align: center;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 0 0 22px;
  text-shadow: 0 2px 40px rgba(0,0,0,0.25);
}
.rl-subtitle {
  font-size: clamp(0.95rem, 1.8vw, 1.08rem);
  color: rgba(255,255,255,0.65);
  text-align: center;
  line-height: 1.75;
  margin: 0 0 22px;
}
.rl-divider {
  width: 46px;
  height: 3px;
  border-radius: 4px;
  background: linear-gradient(90deg, #ec4899, #a855f7);
  margin-bottom: 60px;
}

/* ────────────────────────────────────
   Cards row
   ──────────────────────────────────── */
.rl-cards {
  display: flex;
  gap: 36px;
  justify-content: center;
  width: 100%;
  max-width: 830px;
  margin-bottom: 60px;
}
.rl-card-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  flex: 0 1 392px;
  max-width: 392px;
  outline: none;
}
.rl-card-btn:focus-visible .rl-card {
  outline: 2px solid #818cf8;
  outline-offset: 4px;
}

/* Card shell */
.rl-card {
  border-radius: 26px;
  overflow: hidden;
  background: #fff;
  box-shadow:
    0 10px 50px rgba(0,0,0,0.10),
    0 2px 8px rgba(0,0,0,0.04);
  transition: transform 0.35s cubic-bezier(.4,0,.2,1), box-shadow 0.35s cubic-bezier(.4,0,.2,1);
  border: 1px solid rgba(255,255,255,0.15);
}
.rl-card:hover {
  transform: translateY(-8px);
}
.rl-card--teacher:hover {
  box-shadow: 0 28px 70px rgba(109,40,217,0.20), 0 8px 24px rgba(0,0,0,0.06);
}
.rl-card--student:hover {
  box-shadow: 0 28px 70px rgba(236,72,153,0.20), 0 8px 24px rgba(0,0,0,0.06);
}

/* ── Card header (illustration area) ── */
.rl-card__header {
  position: relative;
  height: 248px;
  overflow: hidden;
}
.rl-card__header--teacher {
  background: linear-gradient(150deg, #0f0c3d 0%, #1e1b6e 25%, #2d269a 50%, #3b31b0 70%, #1a1260 100%);
}
.rl-card__header--student {
  background: linear-gradient(150deg, #6b1040 0%, #9b1658 25%, #c81e6e 50%, #e0388a 70%, #8a1250 100%);
}

/* Subtle grid mesh */
.rl-card__mesh {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 30px 30px;
  z-index: 1;
}

/* Glow pool */
.rl-card__glow {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  height: 110px;
  border-radius: 50%;
  filter: blur(35px);
  z-index: 1;
}
.rl-card__glow--teacher {
  background: radial-gradient(ellipse, rgba(129,140,248,0.55) 0%, rgba(99,102,241,0.20) 50%, transparent 75%);
}
.rl-card__glow--student {
  background: radial-gradient(ellipse, rgba(244,114,182,0.55) 0%, rgba(236,72,153,0.20) 50%, transparent 75%);
}

/* Platform rings */
.rl-card__platform {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 60px;
  z-index: 2;
}
.rl-card__ring {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  border-radius: 50%;
}
.rl-card__ring--outer {
  width: 190px; height: 44px;
}
.rl-card__ring--inner {
  width: 148px; height: 34px;
  bottom: 5px;
}
.rl-card__ring--teacher {
  border: 1px solid rgba(129,140,248,0.18);
  box-shadow: 0 0 12px rgba(129,140,248,0.08);
}
.rl-card__ring--student {
  border: 1px solid rgba(244,114,182,0.18);
  box-shadow: 0 0 12px rgba(244,114,182,0.08);
}

/* Decorative items container */
.rl-deco {
  position: absolute;
  z-index: 3;
}

/* Central glass icon */
.rl-card__icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%);
  width: 84px;
  height: 84px;
  border-radius: 24px;
  background: rgba(255,255,255,0.10);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1.5px solid rgba(255,255,255,0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
}
.rl-card__icon--teacher {
  box-shadow:
    0 8px 44px rgba(99,102,241,0.40),
    0 0 0 1px rgba(129,140,248,0.10),
    inset 0 1px 0 rgba(255,255,255,0.12);
}
.rl-card__icon--student {
  box-shadow:
    0 8px 44px rgba(236,72,153,0.40),
    0 0 0 1px rgba(244,114,182,0.10),
    inset 0 1px 0 rgba(255,255,255,0.12);
}

/* ── Card body ── */
.rl-card__body {
  padding: 28px 28px 24px;
}
.rl-card__title {
  font-size: 22px;
  font-weight: 400;
  color: #1e293b;
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}
.rl-card__title strong {
  font-weight: 800;
}
.rl-card__desc {
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0 0 22px;
}
.rl-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rl-card__accent {
  width: 38px;
  height: 3px;
  border-radius: 4px;
}
.rl-card__arrow {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.rl-card__arrow--teacher {
  background: #6d28d9;
  box-shadow: 0 5px 18px rgba(109,40,217,0.35);
}
.rl-card__arrow--student {
  background: #ec4899;
  box-shadow: 0 5px 18px rgba(236,72,153,0.35);
}
.rl-card:hover .rl-card__arrow {
  transform: scale(1.10);
}
.rl-card--teacher:hover .rl-card__arrow {
  box-shadow: 0 8px 28px rgba(109,40,217,0.45);
}
.rl-card--student:hover .rl-card__arrow {
  box-shadow: 0 8px 28px rgba(236,72,153,0.45);
}

/* ────────────────────────────────────
   CTA
   ──────────────────────────────────── */
.rl-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.rl-cta__btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 17px 38px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #1e1b6e 0%, #312e81 30%, #4338ca 60%, #5b4fcc 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 0.01em;
  box-shadow:
    0 8px 36px rgba(67,56,202,0.40),
    0 2px 8px rgba(0,0,0,0.10);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.rl-cta__btn:hover {
  transform: scale(1.04);
  box-shadow:
    0 12px 48px rgba(67,56,202,0.50),
    0 4px 14px rgba(0,0,0,0.12);
}
.rl-cta__sub {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin-top: 16px;
  font-size: 14px;
  color: #94a3b8;
}
.rl-cta__deco {
  flex-shrink: 0;
  margin-top: -2px;
}

/* ────────────────────────────────────
   Responsive
   ──────────────────────────────────── */
@media (max-width: 860px) {
  .rl-cards {
    flex-direction: column;
    align-items: center;
  }
  .rl-card-btn {
    flex: 0 0 auto;
    width: 100%;
    max-width: 400px;
  }
}
@media (max-width: 520px) {
  .rl-content {
    padding: 52px 16px 64px;
  }
  .rl-card__header {
    height: 210px;
  }
  .rl-divider {
    margin-bottom: 44px;
  }
  .rl-sphere--pink-lg,
  .rl-sphere--pink-sm {
    display: none;
  }
  .rl-dots {
    display: none;
  }
}
        `}</style>
      </div>
    </Layout>
  );
}
