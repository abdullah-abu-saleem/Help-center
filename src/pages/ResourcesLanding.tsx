import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useI18n } from '../lib/i18n';
import { HelpCenterShell } from '../components/theme/HelpCenterShell';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { ResourcesShell } from '../components/resources/ResourcesShell';

const ROUTE_DEBUG = false;

/* ═══════════════════════════════════════════════════════════
   /resources — String-design landing page.
   Background provided by shared ResourcesShell.
   ═══════════════════════════════════════════════════════════ */

export default function ResourcesLanding() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <Layout>
      <HelpCenterShell noBg>
      {ROUTE_DEBUG && (
        <div
          style={{
            position: "fixed",
            top: "16px",
            left: "16px",
            zIndex: 9999,
            background: "#08b8fb",
            color: "white",
            padding: "8px 14px",
            borderRadius: "999px",
            fontWeight: 800,
          }}
        >
          ROUTE CONFIRMED: RESOURCES
        </div>
      )}
      <ResourcesShell>
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
            <SpotlightCard
              as="button"
              className="rl-card-btn"
              glowColor="rgba(237, 59, 145, 0.06)"
              ringColor="rgba(237, 59, 145, 0.35)"
              onClick={() => navigate('/resources/teacher')}
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              <div className="rl-card__header rl-card__header--teacher">
                <div className="rl-card__mesh" />
                <div className="rl-card__icon">
                  <svg width="36" height="36" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
              </div>

              <div className="rl-card__body">
                <h2 className="rl-card__title"><strong>{t('resTeacherTitle')}</strong> {t('resTeacherTitleAccent')}</h2>
                <p className="rl-card__desc">{t('resTeacherCardDesc')}</p>
                <div className="rl-card__footer">
                  <div className="rl-card__accent" style={{ background: '#ed3b91' }} />
                  <div className="rl-card__arrow rl-card__arrow--teacher">
                    <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* ────── Student Card ────── */}
            <SpotlightCard
              as="button"
              className="rl-card-btn"
              glowColor="rgba(8, 184, 251, 0.06)"
              ringColor="rgba(8, 184, 251, 0.35)"
              onClick={() => navigate('/resources/student')}
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              <div className="rl-card__header rl-card__header--student">
                <div className="rl-card__mesh" />
                <div className="rl-card__icon">
                  <svg width="36" height="36" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>
              </div>

              <div className="rl-card__body">
                <h2 className="rl-card__title"><strong>{t('resStudentTitle')}</strong> {t('resStudentTitleAccent')}</h2>
                <p className="rl-card__desc">{t('resStudentCardDesc')}</p>
                <div className="rl-card__footer">
                  <div className="rl-card__accent" style={{ background: '#08b8fb' }} />
                  <div className="rl-card__arrow rl-card__arrow--student">
                    <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </SpotlightCard>
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

        {/* ═══════════ Content-only Styles ═══════════ */}
        <style>{`
/* Content layout */
.rl-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 24px 88px;
}

/* Hero */
.rl-title {
  font-size: clamp(2.4rem, 5vw, 3.5rem);
  font-weight: 800;
  color: #091e42;
  text-align: center;
  letter-spacing: -0.025em;
  line-height: 1.15;
  margin: 0 0 16px;
}
.rl-subtitle {
  font-size: clamp(0.95rem, 1.6vw, 1.05rem);
  color: #6882a9;
  text-align: center;
  line-height: 1.7;
  max-width: 520px;
  margin: 0 0 20px;
}
.rl-divider {
  width: 48px;
  height: 3px;
  border-radius: 4px;
  background: linear-gradient(90deg, #ed3b91, #08b8fb);
  margin-bottom: 52px;
}

/* Cards row */
.rl-cards {
  display: flex;
  gap: 32px;
  justify-content: center;
  align-items: stretch;
  width: 100%;
  max-width: 820px;
  margin-bottom: 56px;
}

/* SpotlightCard button resets + card sizing */
.rl-card-btn {
  cursor: pointer;
  padding: 0;
  text-align: left;
  font: inherit;
  color: inherit;
  flex: 0 1 380px;
  max-width: 380px;
  box-shadow:
    0 0 0 1px rgba(9, 30, 66, 0.06),
    0 4px 24px rgba(0, 0, 0, 0.05);
}
.rl-card-btn:hover {
  transform: translateY(-4px);
  box-shadow:
    0 0 0 1px rgba(9, 30, 66, 0.08),
    0 16px 48px rgba(0, 0, 0, 0.09);
}
.rl-card-btn:focus-visible {
  outline: 2px solid #08b8fb;
  outline-offset: 4px;
}

/* Card header */
.rl-card__header {
  position: relative;
  height: 180px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rl-card__header--teacher {
  background: linear-gradient(135deg, #091e42 0%, #3d1560 45%, #ed3b91 100%);
}
.rl-card__header--student {
  background: linear-gradient(135deg, #091e42 0%, #0a3d5c 45%, #08b8fb 100%);
}
.rl-card__mesh {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 24px 24px;
  z-index: 1;
}
.rl-card__icon {
  position: relative;
  z-index: 2;
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1.5px solid rgba(255,255,255,0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255,255,255,0.10);
}

/* Card body */
.rl-card__body {
  padding: 28px;
}
.rl-card__title {
  font-size: 20px;
  font-weight: 400;
  color: #091e42;
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}
.rl-card__title strong {
  font-weight: 700;
}
.rl-card__desc {
  font-size: 14px;
  color: #6882a9;
  line-height: 1.65;
  margin: 0 0 22px;
}
.rl-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rl-card__accent {
  width: 36px;
  height: 3px;
  border-radius: 4px;
}
.rl-card__arrow {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.rl-card__arrow--teacher {
  background: #ed3b91;
  box-shadow: 0 4px 16px rgba(237, 59, 145, 0.30);
}
.rl-card__arrow--student {
  background: #08b8fb;
  box-shadow: 0 4px 16px rgba(8, 184, 251, 0.30);
}
.rl-card-btn:hover .rl-card__arrow {
  transform: scale(1.08);
}
.rl-card-btn:hover .rl-card__arrow--teacher {
  box-shadow: 0 6px 24px rgba(237, 59, 145, 0.40);
}
.rl-card-btn:hover .rl-card__arrow--student {
  box-shadow: 0 6px 24px rgba(8, 184, 251, 0.40);
}

/* CTA */
.rl-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.rl-cta__btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #ed3b91, #08b8fb);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: 0.01em;
  box-shadow: 0 4px 20px rgba(237, 59, 145, 0.30);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.rl-cta__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(237, 59, 145, 0.40);
}

/* Responsive */
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
    height: 150px;
  }
  .rl-divider {
    margin-bottom: 40px;
  }
}
        `}</style>
      </ResourcesShell>
      </HelpCenterShell>
    </Layout>
  );
}
