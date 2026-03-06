'use client';
import React, { memo } from 'react';

const CosmicBackground = memo(() => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none" style={{ background: 'var(--bg-primary)' }}>
      {/* Glowing Nebula Orbs (theme-driven colors via CSS vars) */}
      <div className="cosmic-orb orb-1"></div>
      <div className="cosmic-orb orb-2"></div>
      <div className="cosmic-orb orb-3"></div>

      {/* Star Layers — parallax drift at different speeds */}
      <div className="star-layer-1"></div>
      <div className="star-layer-1" style={{ top: '100vh', left: '50vw' }}></div>
      <div className="star-layer-2"></div>
      <div className="star-layer-2" style={{ top: '100vh', left: '30vw' }}></div>
      <div className="star-layer-3"></div>
      <div className="star-layer-3" style={{ top: '80vh', left: '20vw' }}></div>

      {/* Twinkling stars — pulsing bright stars */}
      <div className="star-layer-twinkle"></div>
      <div className="star-layer-twinkle" style={{ transform: 'rotate(180deg)' }}></div>

      {/* No overlay — dark bg already provides contrast for stars */}
    </div>
  );
});

CosmicBackground.displayName = 'CosmicBackground';

export default CosmicBackground;
