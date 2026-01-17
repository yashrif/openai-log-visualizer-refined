"use client";

import React from 'react';

interface WaveformProps {
  color?: 'primary' | 'secondary' | 'green';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const Waveform: React.FC<WaveformProps> = ({
  color = 'primary',
  size = 'md',
  animated = false,
}) => {
  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    green: 'bg-green-500',
  };

  const sizeClasses = {
    sm: 'h-5 gap-0.5',
    md: 'h-10 gap-1.5',
    lg: 'h-14 gap-2',
  };

  const barWidths = {
    sm: 'w-0.5',
    md: 'w-1',
    lg: 'w-1.5',
  };

  // Randomized heights for visual variety
  const heights = [30, 60, 40, 80, 50, 70, 30, 90, 45, 20];

  return (
    <div
      className={`flex items-end px-4 py-2 bg-black/40 rounded-2xl border border-white/5 w-full ${sizeClasses[size]}`}
    >
      {heights.map((h, i) => (
        <div
          key={i}
          className={`${barWidths[size]} rounded-full ${colorClasses[color]} ${animated ? 'waveform-bar' : ''}`}
          style={{
            height: `${h}%`,
            opacity: Math.max(0.3, h / 100),
          }}
        />
      ))}
    </div>
  );
};

export default Waveform;
