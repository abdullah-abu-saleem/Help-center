import React from 'react';

export interface CategoryGridProps {
  children: React.ReactNode;
}

export function CategoryGrid({ children }: CategoryGridProps) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      style={{ gap: 24 }}
    >
      {children}
    </div>
  );
}
