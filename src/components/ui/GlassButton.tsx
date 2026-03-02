import React from 'react';
import { Link } from 'react-router-dom';

type ButtonVariant = 'frosted' | 'purple' | 'pink';

interface GlassButtonBaseProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  style?: React.CSSProperties;
}

interface GlassButtonLinkProps extends GlassButtonBaseProps {
  to: string;
  href?: never;
  onClick?: never;
}

interface GlassButtonAnchorProps extends GlassButtonBaseProps {
  href: string;
  to?: never;
  onClick?: never;
}

interface GlassButtonClickProps extends GlassButtonBaseProps {
  onClick: () => void;
  to?: never;
  href?: never;
}

type GlassButtonProps = GlassButtonLinkProps | GlassButtonAnchorProps | GlassButtonClickProps;

const variantClass: Record<ButtonVariant, string> = {
  frosted: 'glass-btn--frosted',
  purple: 'glass-btn--purple',
  pink: 'glass-btn--pink',
};

/**
 * Pill-shaped CTA button with three visual variants:
 * - `frosted`  — semi-transparent glass on dark backgrounds (default)
 * - `purple`   — solid deep-purple gradient
 * - `pink`     — solid hot-pink gradient (submit request style)
 */
export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'frosted',
  className = '',
  style,
  ...rest
}) => {
  const cls = `glass-btn ${variantClass[variant]} ${className}`;

  const content = (
    <>
      {children}
      <style>{`
.glass-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  border-radius: 9999px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: 0.01em;
  border: none;
  cursor: pointer;
  transition: transform 200ms ease, box-shadow 200ms ease, background 200ms ease, border-color 200ms ease;
}
.glass-btn:hover { transform: translateY(-2px); }

/* ── Frosted ── */
.glass-btn--frosted {
  background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
}
.glass-btn--frosted:hover {
  background: linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.12) 100%);
  border-color: rgba(255,255,255,0.32);
  box-shadow: 0 8px 28px rgba(0,0,0,0.15);
}

/* ── Purple ── */
.glass-btn--purple {
  padding: 16px 36px;
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #d6257a 0%, #ed3b91 50%, #f472b6 100%);
  box-shadow: 0 4px 14px rgba(237,59,145,0.25);
}
.glass-btn--purple:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 24px rgba(237,59,145,0.35);
}

/* ── Pink ── */
.glass-btn--pink {
  background: linear-gradient(135deg, #ff4da6, #ed3b91);
  box-shadow: 0 4px 14px rgba(236,72,153,0.25);
}
.glass-btn--pink:hover {
  background: linear-gradient(135deg, #ff66b5, #d81b78);
  box-shadow: 0 8px 24px rgba(236,72,153,0.35);
}
      `}</style>
    </>
  );

  if ('to' in rest && rest.to) {
    return <Link to={rest.to} className={cls} style={style}>{content}</Link>;
  }
  if ('href' in rest && rest.href) {
    return <a href={rest.href} target="_blank" rel="noreferrer" className={cls} style={style}>{content}</a>;
  }
  return <button onClick={(rest as GlassButtonClickProps).onClick} className={cls} style={style}>{content}</button>;
};
