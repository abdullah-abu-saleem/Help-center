import React from 'react';

interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  iconBg?: string;
  iconColor?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  iconBg = 'rgba(237,59,145,0.08)',
  iconColor = '#ed3b91',
}) => (
  <div className="flex items-center gap-5 mb-10">
    <div className="flex-1 h-px shimmer-line" style={{ height: 1 }} />
    <h3 className="text-lg font-bold text-[#091e42] whitespace-nowrap flex items-center gap-3">
      {icon && (
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: iconBg }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </span>
      )}
      {title}
    </h3>
    <div className="flex-1 h-px shimmer-line" style={{ height: 1 }} />
  </div>
);
