import React from 'react';

type GlassVariant = 'light' | 'dark' | 'modern';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassVariant;
  className?: string;
  hover?: boolean;
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const variantStyles: Record<GlassVariant, React.CSSProperties> = {
  light: {
    background: 'rgba(255,255,255,0.90)',
    WebkitBackdropFilter: 'blur(8px) saturate(1.2)',
    backdropFilter: 'blur(8px) saturate(1.2)',
    border: '1px solid rgba(226,232,240,0.5)',
    borderRadius: 20,
  },
  dark: {
    background: 'rgba(255,255,255,0.08)',
    WebkitBackdropFilter: 'blur(12px)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20,
  },
  modern: {
    background: 'rgba(255,255,255,0.95)',
    WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
    backdropFilter: 'blur(12px) saturate(1.4)',
    border: '1px solid rgba(226,232,240,0.5)',
    borderRadius: 20,
  },
};

/**
 * Reusable glass-morphism card.
 * - `light`   — standard white glass (use on light backgrounds)
 * - `dark`    — subtle frosted panel (use on cosmic/dark backgrounds)
 * - `modern`  — elevated card with stronger blur (feature cards)
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'light',
  className = '',
  hover = true,
  as: Tag = 'div',
  style,
  onClick,
}) => {
  const base = variantStyles[variant];

  return (
    <Tag
      className={`glass-card-ui ${hover ? 'glass-card-ui--hover' : ''} ${className}`}
      style={{ ...base, ...style }}
      onClick={onClick}
    >
      {children}

      <style>{`
.glass-card-ui {
  box-shadow: 0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04);
  transition:
    transform 200ms ease,
    box-shadow 200ms ease,
    border-color 200ms ease;
}
.glass-card-ui--hover:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.08);
  border-color: rgba(199,210,254,0.5);
}
      `}</style>
    </Tag>
  );
};
