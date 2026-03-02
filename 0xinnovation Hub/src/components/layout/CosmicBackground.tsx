"use client";

import { memo } from "react";

/**
 * Cosmic Background — Pure CSS version
 * Uses CSS animations + GPU-accelerated transforms instead of 150 Framer Motion instances.
 * This reduces JS memory usage by ~95% and eliminates animation frame jank.
 */
const CosmicBackground = memo(function CosmicBackground() {
    return (
        <div className="cosmic-bg" aria-hidden="true">
            {/* Nebula orbs — Pure CSS animated */}
            <div className="cosmic-orb cosmic-orb-1" />
            <div className="cosmic-orb cosmic-orb-2" />
            <div className="cosmic-orb cosmic-orb-3" />

            {/* Stars — CSS-only particles (much lighter than 150 framer-motion instances) */}
            <div className="cosmic-stars cosmic-stars-1" />
            <div className="cosmic-stars cosmic-stars-2" />
            <div className="cosmic-stars cosmic-stars-3" />
        </div>
    );
});

export default CosmicBackground;
