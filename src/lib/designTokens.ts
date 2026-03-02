/* ═══════════════════════════════════════════════════════════════
   Design Tokens — Single source of truth for the String theme.
   Import from here rather than hardcoding values in components.

   Modern SaaS Theme
   - 8px spacing scale
   - Soft layered shadows
   - 16–20px border radius
   - 200ms ease transitions
   ═══════════════════════════════════════════════════════════════ */

// ── Colors ──────────────────────────────────────────────────────

export const colors = {
  /** Primary pink scale (matches Tailwind `primary-*`) */
  primary: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ed3b91',
    600: '#d6257a',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
    950: '#500724',
  },

  /** Accent blue scale — secondary CTA & interactive accents */
  accent: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#08b8fb',
    brand: '#08b8fb',
    600: '#0ea5e9',
    700: '#0284c7',
    800: '#075985',
    900: '#0c4a6e',
  },

  /** Purple — teacher theme */
  purple: {
    400: '#a78bfa',
    500: '#a855f7',
    600: '#9c4dff',
    700: '#7c3aed',
    800: '#6d28d9',
    900: '#581c87',
  },

  /** Blue / Teal — decorative spheres & waves */
  blue: {
    light: '#7dd3fc',
    DEFAULT: '#38bdf8',
    cyan: '#08b8fb',
  },
  teal: {
    light: '#99f6e4',
    DEFAULT: '#2dd4bf',
    cyan: '#67e8f9',
  },
  pink: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    fuchsia: '#e879f9',
    magenta: '#f0abfc',
  },

  /** Cosmic background gradient stop colors */
  cosmic: {
    900: '#070a1f',
    850: '#0c1033',
    800: '#121440',
    750: '#1a1856',
    700: '#251e6d',
    650: '#332c84',
    600: '#463c9c',
    550: '#5c50b2',
    500: '#7868c6',
    450: '#9684d6',
    400: '#b3a2e2',
    350: '#cec0ec',
    300: '#e0d8f2',
    250: '#ece6f6',
    200: '#f3eff9',
    150: '#f8f5fc',
    100: '#fbf9fd',
  },

  /** Neutral slate scale */
  slate: {
    900: '#0f172a',
    800: '#1e293b',
    700: '#334155',
    600: '#475569',
    500: '#64748b',
    400: '#94a3b8',
    300: '#cbd5e1',
    200: '#e2e8f0',
    100: '#f1f5f9',
    50: '#f8fafc',
  },

  /** Surface / overlay colors (white with alpha) */
  surface: {
    '06': 'rgba(255,255,255,0.06)',
    '08': 'rgba(255,255,255,0.08)',
    '10': 'rgba(255,255,255,0.10)',
    '12': 'rgba(255,255,255,0.12)',
    '15': 'rgba(255,255,255,0.15)',
    '18': 'rgba(255,255,255,0.18)',
    '22': 'rgba(255,255,255,0.22)',
    '72': 'rgba(255,255,255,0.72)',
    '78': 'rgba(255,255,255,0.78)',
    '82': 'rgba(255,255,255,0.82)',
    '85': 'rgba(255,255,255,0.85)',
    '88': 'rgba(255,255,255,0.88)',
    '90': 'rgba(255,255,255,0.90)',
    '92': 'rgba(255,255,255,0.92)',
    '95': 'rgba(255,255,255,0.95)',
    '98': 'rgba(255,255,255,0.98)',
  },
} as const;

// ── Gradients ───────────────────────────────────────────────────

export const gradients = {
  /** 17-stop cosmic dark-to-light background */
  cosmicBg: `linear-gradient(180deg,
    ${colors.cosmic[900]} 0%, ${colors.cosmic[850]} 6%, ${colors.cosmic[800]} 12%,
    ${colors.cosmic[750]} 18%, ${colors.cosmic[700]} 24%, ${colors.cosmic[650]} 30%,
    ${colors.cosmic[600]} 36%, ${colors.cosmic[550]} 42%, ${colors.cosmic[500]} 48%,
    ${colors.cosmic[450]} 53%, ${colors.cosmic[400]} 58%, ${colors.cosmic[350]} 63%,
    ${colors.cosmic[300]} 68%, ${colors.cosmic[250]} 73%, ${colors.cosmic[200]} 80%,
    ${colors.cosmic[150]} 88%, ${colors.cosmic[100]} 100%)`,

  /** Brand gradient text (pink → purple → cyan) */
  text: `linear-gradient(135deg, #ED3B91 0%, #9C4DFF 50%, #08B8FB 100%)`,

  /** Pink title gradient */
  titlePink: `linear-gradient(135deg, #f0abfc 0%, #ec4899 40%, #f472b6 70%, #fda4af 100%)`,

  /** Small decorative divider */
  divider: `linear-gradient(90deg, #ed3b91, #08b8fb)`,

  /** CTA button — primary pink */
  ctaPurple: `linear-gradient(135deg, #d6257a 0%, #ed3b91 50%, #f472b6 100%)`,

  /** CTA button — hot pink (submit request) */
  ctaPink: `linear-gradient(135deg, #ff4da6, #ed3b91)`,
  ctaPinkHover: `linear-gradient(135deg, #ff66b5, #d81b78)`,

  /** Wave ribbon gradient #1 (blue → indigo → purple → fuchsia) */
  wave1: `linear-gradient(to right, rgba(56,189,248,0.55), rgba(129,140,248,0.35), rgba(167,139,250,0.35), rgba(232,121,249,0.50))`,

  /** Wave ribbon gradient #2 (cyan → indigo → pink) */
  wave2: `linear-gradient(to right, rgba(103,232,249,0.30), rgba(129,140,248,0.20), rgba(240,171,252,0.30))`,

  /** Hero mesh (light pages — radial aurora blobs) */
  heroMesh: `
    radial-gradient(ellipse 80% 60% at 10% 40%, rgba(237,59,145,0.10) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 90% 30%, rgba(8,184,251,0.08) 0%, transparent 55%),
    radial-gradient(ellipse 70% 40% at 50% 80%, rgba(237,59,145,0.06) 0%, transparent 50%),
    radial-gradient(ellipse 50% 50% at 70% 60%, rgba(8,184,251,0.05) 0%, transparent 55%),
    linear-gradient(135deg, #fdf2f8 0%, #fce7f3 25%, #fdf4f8 50%, #fce7f3 75%, #fdf2f8 100%)`,

  /** Teacher card header */
  teacherHeader: `linear-gradient(150deg, #0f0c3d 0%, #1e1b6e 25%, #2d269a 50%, #3b31b0 70%, #1a1260 100%)`,

  /** Student card header */
  studentHeader: `linear-gradient(150deg, #6b1040 0%, #9b1658 25%, #c81e6e 50%, #e0388a 70%, #8a1250 100%)`,
} as const;

// ── Shadows (soft, layered approach) ────────────────────────────

export const shadows = {
  xs: '0 1px 2px rgba(0,0,0,0.04)',
  soft: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
  card: '0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)',
  cardHover: '0 4px 8px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.08)',
  glass: '0 8px 32px rgba(0,0,0,0.06)',
  glassHover: '0 16px 48px rgba(0,0,0,0.08)',
  glassCard: '0 8px 32px rgba(0,0,0,0.05)',
  glassCardHover: '0 16px 48px rgba(0,0,0,0.08)',
  search: '0 4px 20px rgba(0,0,0,0.05)',
  btnPurple: '0 4px 14px rgba(237,59,145,0.25)',
  btnPurpleHover: '0 8px 24px rgba(237,59,145,0.35)',
  btnPink: '0 4px 14px rgba(236,72,153,0.25)',
  btnPinkHover: '0 8px 24px rgba(236,72,153,0.35)',
  cosmicCard: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
  cosmicCardTeacherHover: '0 16px 48px rgba(109,40,217,0.15), 0 4px 16px rgba(0,0,0,0.05)',
  cosmicCardStudentHover: '0 16px 48px rgba(236,72,153,0.15), 0 4px 16px rgba(0,0,0,0.05)',
  modal: '0 24px 48px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.03)',
} as const;

// ── Glass Morphism Presets ───────────────────────────────────────

export const glass = {
  header: {
    background: 'rgba(255,255,255,0.80)',
    backdropFilter: 'blur(16px) saturate(1.5)',
    border: '1px solid rgba(226,232,240,0.5)',
  },
  sidebar: {
    background: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(12px) saturate(1.3)',
    border: '1px solid rgba(226,232,240,0.5)',
    borderRadius: '20px',
  },
  card: {
    background: 'rgba(255,255,255,0.90)',
    backdropFilter: 'blur(8px) saturate(1.2)',
    border: '1px solid rgba(226,232,240,0.5)',
    borderRadius: '20px',
  },
  cardModern: {
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(12px) saturate(1.4)',
    border: '1px solid rgba(226,232,240,0.5)',
    borderRadius: '20px',
  },
  frostedBtn: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: '9999px',
  },
  cosmicPanel: {
    background: colors.surface['08'],
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '20px',
  },
  icon: {
    background: colors.surface['10'],
    backdropFilter: 'blur(18px)',
    border: '1.5px solid rgba(255,255,255,0.22)',
    borderRadius: '20px',
  },
} as const;

// ── Typography ──────────────────────────────────────────────────

export const typography = {
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  fontFamilyMono: "'Fira Code', 'Consolas', monospace",

  /** Font sizes with responsive clamp values */
  fontSize: {
    heroTitle: 'clamp(2.8rem, 6vw, 4.2rem)',
    sectionTitle: 'clamp(2.4rem, 5.5vw, 3.8rem)',
    cardTitle: '22px',
    sectionHeading: 'clamp(1.6rem, 3.2vw, 2.2rem)',
    body: '15px',
    bodySmall: '14px',
    caption: '13px',
    cta: '16px',
    badge: '10px',
  },

  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.75,
  },

  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.01em',
    wider: '0.05em',
  },
} as const;

// ── Spacing & Layout ────────────────────────────────────────────

export const spacing = {
  /** 8px base scale */
  scale: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
  },

  /** Border radius presets */
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '26px',
    pill: '9999px',
  },

  /** Container max-width presets */
  maxWidth: {
    cardsRow: '830px',
    heroText: '768px',
    headingPanel: '560px',
    cardSingle: '392px',
    cardMobile: '400px',
  },
} as const;

// ── Animations ──────────────────────────────────────────────────

export const animation = {
  /** Easing curves */
  easing: {
    spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
    smooth: 'cubic-bezier(.4, 0, .2, 1)',
    ease: 'ease',
    easeInOut: 'ease-in-out',
  },

  /** Duration presets (200ms base) */
  duration: {
    fast: '150ms',
    normal: '200ms',
    medium: '250ms',
    slow: '300ms',
    entrance: '600ms',
  },

  /** Named animations (keyframe names from global CSS) */
  keyframes: {
    fadeUp: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both',
    fadeIn: 'fadeIn 0.6s ease both',
    scaleIn: 'scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) both',
    slideInLeft: 'slideInLeft 0.6s cubic-bezier(0.16,1,0.3,1) both',
    auroraFloat: 'auroraFloat 12s ease-in-out infinite',
    heroFloat: 'heroFloat 6s ease-in-out infinite',
    heroFloatSlow: 'heroFloatSlow 8s ease-in-out infinite',
    heroFloatAlt: 'heroFloatAlt 7s ease-in-out infinite',
    heroTwinkle: 'heroTwinkle 3s ease-in-out infinite',
    heroTwinkleSlow: 'heroTwinkle 5s ease-in-out infinite',
    shimmer: 'shimmer 3s ease-in-out infinite',
  },
} as const;

// ── Full Theme Export ───────────────────────────────────────────

export const theme = {
  colors,
  gradients,
  shadows,
  glass,
  typography,
  spacing,
  animation,
} as const;

export default theme;
