import React from 'react';

type GradientPreset = 'brand' | 'pink' | 'purple';

interface GradientTextProps {
  children: React.ReactNode;
  preset?: GradientPreset;
  /** Custom gradient CSS value — overrides `preset` */
  gradient?: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
}

const presets: Record<GradientPreset, string> = {
  brand: 'linear-gradient(to right, #ED3B91 0%, #9C4DFF 50%, #08B8FB 100%)',
  pink: 'linear-gradient(135deg, #f0abfc 0%, #ec4899 40%, #f472b6 70%, #fda4af 100%)',
  purple: 'linear-gradient(135deg, #f472b6 0%, #ed3b91 50%, #d6257a 100%)',
};

/**
 * Renders children with a gradient background-clip text effect.
 *
 * Presets:
 * - `brand`  — pink → purple → cyan (default, used in `.gradient-text`)
 * - `pink`   — fuchsia → hot-pink → rose (used in section titles on cosmic bg)
 * - `purple` — indigo → violet (subtle)
 */
export const GradientText: React.FC<GradientTextProps> = ({
  children,
  preset = 'brand',
  gradient,
  as: Tag = 'span',
  className = '',
  style,
}) => {
  const bg = gradient ?? presets[preset];

  return (
    <Tag
      className={className}
      style={{
        background: bg,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};
