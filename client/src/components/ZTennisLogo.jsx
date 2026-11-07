import React, { useId } from 'react';

/**
 * Official ZTennis Brand Logo Component
 *
 * Brand Palette:
 * - Rose: #E0749A
 * - Ink: #1A1118
 * - Court Green: #1F7A5A
 *
 * Features:
 * - Rose tennis ball with crisp white curved seams
 * - Bold Ink 'Z' centered inside the ball
 * - Bold 'ZTennis' wordmark
 * - Optional 'COACHING, SCHEDULED.' tagline
 */
export default function ZTennisLogo({
  className = 'w-8 h-8',
  textClassName = 'text-xl font-black',
  showText = true,
  showTagline = false,
  textColor = 'text-[#1A1118] dark:text-white',
  taglineColor = 'text-[#1F7A5A] dark:text-[#E0749A]',
  taglineClassName = 'text-[8.5px] font-black tracking-[0.22em] uppercase',
}) {
  const clipId = useId();

  return (
    <div className="inline-flex items-center gap-2.5 select-none group">
      {/* Official Rose Tennis Ball Icon with White Seams and Ink Z */}
      <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
        <svg
          className={`${className} flex-shrink-0 drop-shadow-sm`}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipId}>
              <circle cx="50" cy="50" r="46" />
            </clipPath>
          </defs>

          {/* Rose Ball Base (#E0749A) */}
          <circle cx="50" cy="50" r="46" fill="#E0749A" />

          {/* White Curved Seams clipped to ball radius */}
          <g clipPath={`url(#${clipId})`}>
            {/* Left curved seam */}
            <path
              d="M 17 15 C 38 32 38 68 17 85"
              stroke="#FFFFFF"
              strokeWidth="6.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right curved seam */}
            <path
              d="M 83 15 C 62 32 62 68 83 85"
              stroke="#FFFFFF"
              strokeWidth="6.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Bold Ink 'Z' in the Center (#1A1118) */}
          <path
            d="M 37 35.5 H 63 V 42.5 L 47 57.5 H 63 V 64.5 H 37 V 57.5 L 53 42.5 H 37 V 35.5 Z"
            fill="#1A1118"
          />
        </svg>
      </div>

      {/* Wordmark and Tagline */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span className={`tracking-tight ${textClassName} ${textColor}`}>
            ZTennis
          </span>
          {showTagline && (
            <span className={`mt-1 font-sans ${taglineClassName} ${taglineColor}`}>
              COACHING, SCHEDULED.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
