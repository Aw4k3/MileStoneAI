// src/components/common/Spinner.jsx
import React from 'react';

export default function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div className={`flex items-center justify-center shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-blue-500/20 border-t-blue-500 animate-spin`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
