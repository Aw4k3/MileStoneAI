// src/components/common/ProgressRing.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressRing({
  progress = 0,
  size = 72,
  strokeWidth = 6,
  showLabel = true,
  className = '',
}) {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <div
      role="progressbar"
      aria-valuenow={safeProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progress completion"
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/[0.08]"
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          strokeLinecap="round"
          className={safeProgress === 100 ? 'text-[#4cc38a]' : 'text-blue-500'}
          fill="transparent"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-medium tracking-normal text-[#eef0f5] font-mono tnum">
            {safeProgress}%
          </span>
        </div>
      )}
    </div>
  );
}
