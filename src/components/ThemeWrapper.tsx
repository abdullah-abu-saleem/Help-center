import React from 'react';
import { NoiseOverlay } from './ui/NoiseOverlay';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children }) => (
  <>
    <NoiseOverlay />
    <style>{`
      @keyframes fadeScale {
        from { opacity: 0; transform: scale(0.97) translateY(8px); }
        to   { opacity: 1; transform: scale(1)    translateY(0);    }
      }
      .fade-scale-in {
        animation: fadeScale 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @media (prefers-reduced-motion: reduce) {
        .fade-scale-in,
        .fade-up {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
    <div className="fade-scale-in">{children}</div>
  </>
);
