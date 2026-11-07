import React from 'react';

export default function TrustTicker() {
  const items = [
    '✦ Personal Coaching in Bukidnon',
    '🎾 Malaybalay Public Tennis Court',
    '⏰ Morning Sessions 6:00 AM – 9:00 AM',
    '₱300 Individual • ₱250 Group',
    '✦ Forehand • Backhand • Serve • Drills',
    '✓ All Ages & Skill Levels Welcome',
  ];

  return (
    <div className="w-full bg-[#1A1118] text-white py-3.5 border-y border-white/10 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-6 overflow-x-auto no-scrollbar text-xs font-bold tracking-wider uppercase text-slate-300">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-6 flex-shrink-0">
            <span className={item.includes('✦') || item.includes('₱') ? 'text-[#E0749A]' : 'text-[#1F7A5A]'}>
              ●
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
