import React from 'react';
import type { Resource, ResourceActionType } from '../resourcesData';
import { SpotlightCard } from './ui/SpotlightCard';
import { COLORS } from '../theme/colors';

const actionLabels: Record<ResourceActionType, string> = {
  watch: 'Watch',
  download: 'Download',
  open: 'Open',
};

const actionIcons: Record<ResourceActionType, React.ReactNode> = {
  watch: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  open: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  ),
};

interface ResourceCardProps {
  resource: Resource;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  return (
    <SpotlightCard className="hover:shadow-xl hover:-translate-y-1">
      <a
        href={resource.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col h-full focus:outline-none"
      >
        {/* Thumbnail */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16 / 10' }}>
          <img
            src={resource.thumbnail}
            alt={resource.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* Type badge */}
          <div
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-white backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            {actionIcons[resource.type]}
            <span className="capitalize">{actionLabels[resource.type]}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5">
          <h3
            className="text-base font-bold mb-1.5 leading-snug transition-colors duration-200"
            style={{ color: COLORS.neutral }}
          >
            <span className="group-hover:text-[#ed3b91]">{resource.title}</span>
          </h3>
          <p style={{ color: COLORS.neutralLight }} className="text-sm leading-relaxed mb-4 flex-1">
            {resource.description}
          </p>

          {/* Action button */}
          <div
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-200"
            style={{ color: COLORS.primary }}
          >
            {actionIcons[resource.type]}
            <span>{actionLabels[resource.type]}</span>
            <svg
              className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>
      </a>
    </SpotlightCard>
  );
};
