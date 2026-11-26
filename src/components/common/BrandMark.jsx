// src/components/common/BrandMark.jsx
import React from 'react';

/**
 * Geometric waypoint monogram for Milestone AI.
 * Flat single-ink vector mark, adapts cleanly to dark and light themes.
 */
export default function BrandMark({ showWordmark = true, suffix = '' }) {
  return (
    <span className="inline-flex items-center gap-1.5 min-[375px]:gap-2 sm:gap-2.5 select-none whitespace-nowrap shrink-0">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 min-[375px]:w-[22px] min-[375px]:h-[22px] sm:w-6 sm:h-6 shrink-0"
        aria-hidden="true"
      >
        <rect
          x="1"
          y="1"
          width="22"
          height="22"
          rx="6"
          className="brand-mark-tile"
          strokeWidth="1.25"
        />
        <path
          d="M6.5 16.5V7.5L12 13L17.5 7.5V16.5"
          className="brand-mark-glyph"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="17.25" r="1.75" className="brand-mark-dot" />
      </svg>
      {showWordmark && (
        <span className="font-medium tracking-[-0.015em] text-[12.5px] min-[375px]:text-[13.5px] sm:text-[15px] text-[#eef0f5] inline-flex items-baseline gap-1.5 whitespace-nowrap">
          <span>Milestone AI</span>
          {suffix && (
            <span className="font-mono text-xs text-[#7a8296] font-normal">{suffix}</span>
          )}
        </span>
      )}
    </span>
  );
}
