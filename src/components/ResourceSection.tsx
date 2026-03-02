import React from 'react';
import type { Resource, ResourceSectionMeta } from '../resourcesData';
import { ResourceCard } from './ResourceCard';
import { COLORS } from '../theme/colors';

interface ResourceSectionProps {
  meta: ResourceSectionMeta;
  resources: Resource[];
}

export const ResourceSection: React.FC<ResourceSectionProps> = ({ meta, resources }) => {
  if (resources.length === 0) return null;

  return (
    <section className="mb-16 last:mb-0">
      {/* Section header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.neutral }}>{meta.title}</h2>
        <p className="text-base leading-relaxed" style={{ color: COLORS.neutralLight }}>{meta.description}</p>
      </div>

      {/* Cards grid: 1 → 2 → 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );
};
