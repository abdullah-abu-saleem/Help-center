import React from 'react';

interface GradientDividerProps {
  /** Width in px (default 46) */
  width?: number;
  /** Height in px (default 3) */
  height?: number;
  /** CSS gradient (default pink → purple) */
  gradient?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Small decorative gradient line used as a section divider.
 * Default: pink → purple (matches ResourcesLanding/Listing).
 */
export const GradientDivider: React.FC<GradientDividerProps> = ({
  width = 46,
  height = 3,
  gradient = 'linear-gradient(90deg, #ed3b91, #08b8fb)',
  className = '',
  style,
}) => (
  <div
    className={className}
    style={{
      width,
      height,
      borderRadius: 4,
      background: gradient,
      ...style,
    }}
  />
);
