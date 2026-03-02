import React, { useRef, useState, useCallback } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'button' | 'article' | 'section';
  hasError?: boolean;
  glowColor?: string;
  ringColor?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  as: Tag = 'div',
  hasError = false,
  glowColor,
  ringColor,
  style,
  onClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const glow = hasError
    ? 'rgba(239, 68, 68, 0.05)'
    : glowColor || 'rgba(8, 184, 251, 0.05)';
  const ring = hasError
    ? 'rgba(239, 68, 68, 0.4)'
    : ringColor || 'rgba(8, 184, 251, 0.5)';

  const { x, y } = position;

  return (
    <Tag
      ref={ref as any}
      onMouseMove={handleMouseMove}
      onFocus={() => setOpacity(1)}
      onBlur={() => setOpacity(0)}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      onClick={onClick}
      className={`relative rounded-3xl overflow-hidden bg-white border transition-all duration-300 ${
        hasError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
      } group ${className}`}
      style={style}
    >
      {/* Hover glow */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${x}px ${y}px, ${glow}, transparent 40%)`,
        }}
      />
      {/* Focus/hover ring */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-focus-within:opacity-100"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${x}px ${y}px, ${ring}, transparent 40%)`,
          maskImage: 'linear-gradient(#fff, #fff)',
          WebkitMaskImage: 'linear-gradient(#fff, #fff)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />
      <div className="relative h-full">{children}</div>
    </Tag>
  );
};
