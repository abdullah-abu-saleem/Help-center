import React from 'react';
import { NeuroNetworkCanvas } from './NeuroNetworkCanvas';
import { COLORS } from '../../theme/colors';

/**
 * AnimatedBackground — three-layer decorative backdrop.
 *
 * Layers (bottom → top):
 *  1. Grid overlay (50 px lines, border colour at 0.6 opacity)
 *  2. NeuroNetworkCanvas (moving points + connecting lines)
 *  3. Soft radial-gradient fade to white/60
 *
 * Does NOT include NoiseOverlay — that lives in HelpCenterShell
 * so it stays scoped (absolute, not fixed) to help/resources pages only.
 */
export const AnimatedBackground: React.FC = () => (
  <div
    className="absolute inset-0 overflow-hidden pointer-events-none z-0"
    aria-hidden="true"
  >
    {/* Layer 1: Grid overlay */}
    <div
      className="absolute inset-0 opacity-[0.6]"
      style={{
        backgroundImage: `linear-gradient(${COLORS.border} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border} 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      }}
    />

    {/* Layer 2: Moving points + connecting lines */}
    <NeuroNetworkCanvas />

    {/* Layer 3: Soft radial fade to white/60 */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.6)_100%)] pointer-events-none" />
  </div>
);
