import React from 'react';

export default function TestimonialsSection() {
  const reviews = [
    {
      name: 'Juan dela Cruz',
      level: 'Beginner',
      rating: 5,
      date: 'Malaybalay City',
      comment:
        'Coach Zoid has endless patience. In just 3 sessions, my forehand went from erratic to consistent over the net. He breaks down strokes so it feels natural.',
      avatarBg: 'bg-[#FFF0F5] text-[#E0749A]',
      initials: 'JD',
    },
    {
      name: 'Mika Alvarez',
      level: 'Intermediate',
      rating: 5,
      date: 'Malaybalay City',
      comment:
        'The group morning drills are the best part of my week. High tempo, practical point construction, and a friendly community of local players.',
      avatarBg: 'bg-[#E8F3ED] text-[#1F7A5A]',
      initials: 'MA',
    },
    {
      name: 'Rafael Santos',
      level: 'Advanced / Competitive',
      rating: 5,
      date: 'Bukidnon',
      comment:
        'Helped me clean up my kick serve and court positioning before our local club tournament. Highly recommended if you want structured, competitive coaching.',
      avatarBg: 'bg-amber-100 text-amber-800',
      initials: 'RS',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-[#F4F8F5] dark:bg-[#0A1612] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 sm:mb-14 gap-4">
          <div>
            <span className="text-[11px] font-black tracking-widest text-[#E0749A] uppercase mb-2 block">
              TRAINEE EXPERIENCES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Trusted by 40+ local players.
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-sm sm:text-right">
            From complete beginners holding a racket for the first time to active club tournament competitors.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-3xl p-7 sm:p-8 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Stars */}
                <div className="flex items-center gap-1 text-[#E0749A] mb-4">
                  {[...Array(r.rating)].map((_, s) => (
                    <span key={s} className="text-base">★</span>
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic mb-6">
                  "{r.comment}"
                </p>
              </div>

              <div className="flex items-center gap-3.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className={`w-10 h-10 rounded-full font-black text-xs flex items-center justify-center ${r.avatarBg}`}>
                  {r.initials}
                </span>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {r.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {r.level} • {r.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
