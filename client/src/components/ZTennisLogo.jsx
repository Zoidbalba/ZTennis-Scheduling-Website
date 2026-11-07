import React from 'react';

export default function ZTennisLogo({ className = 'w-8 h-8', textClassName = 'text-xl', showText = true, textColor = 'text-slate-900 dark:text-white' }) {
  return (
    <div className="flex items-center gap-2.5 group">
      {/* Tennis Ball Icon with Pink Seams and Top-Right Dot */}
      <div className="relative flex-shrink-0">
        <svg
          className={`${className} text-[#E27396] transition-transform group-hover:rotate-12 duration-300`}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Ball Circle */}
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.2" />
          {/* Curved Tennis Seams */}
          <path
            d="M6.8 16C12.5 16 16 12.5 16 6.8M16 25.2C16 19.5 19.5 16 25.2 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Decorative Dot at Top Right */}
          <circle cx="23.5" cy="8.5" r="1.8" fill="currentColor" />
        </svg>
      </div>

      {showText && (
        <span className={`font-black tracking-tight ${textClassName} ${textColor}`}>
          ZTennis
        </span>
      )}
    </div>
  );
}

