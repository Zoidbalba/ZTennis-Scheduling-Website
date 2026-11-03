import React from 'react';

function formatPrice(price) {
  return `₱${Number(price).toLocaleString('en-PH')}`;
}

export default function RatesSection({ rates = [] }) {
  if (rates.length === 0) return null;

  const scrollToSchedule = () => {
    document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="rates" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto scroll-mt-20">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 border border-primary-200/60 dark:border-primary-800 px-3.5 py-1 rounded-full shadow-soft-xs">
          Transparent Pricing
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2.5 sm:mt-3 mb-2 tracking-tight">
          Session Rates & Pricing
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-base leading-relaxed">
          Affordable, straightforward rates per person. No hidden membership fees.
        </p>

        {/* Public Court & Duration Highlights */}
        <div className="mt-4 sm:mt-5 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left max-w-xl mx-auto text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-soft-xs">
          <p className="font-bold text-slate-900 dark:text-white">Flexible Court Playtime Notice:</p>
          <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Sessions run for about <strong>1 hr 30 min to 2 hours</strong>. Because training takes place on a <strong>public court</strong>, sessions can comfortably extend depending on open queue and court availability.
          </p>
        </div>
      </div>

      {/* Rates Cards Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
        {rates.map((rate) => {
          const isGroup = rate.session_type.toLowerCase().includes('group') || Number(rate.price) === 250;

          const highlights = isGroup
            ? [
                'Live-ball rallies, partner drills & point simulation',
                'Doubles positioning, court awareness & tactical play',
                'Fun, competitive mini-games with training partners',
                'Motivating team atmosphere — train & improve together',
              ]
            : [
                '1-on-1 dedicated coach focus & instant stroke feedback',
                'Racquet grip, swing path & stroke mechanics correction',
                'Custom footwork patterns, recovery steps & basket drills',
                'Personalized session plan tailored to your tennis goals',
              ];

          return (
            <div
              key={rate.id}
              className={`card-hover-lift relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-soft-md hover:shadow-soft-xl border p-5 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                isGroup
                  ? 'border-emerald-200/80 dark:border-emerald-800/60'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="absolute top-0 right-0">
                {isGroup ? (
                  <span className="inline-block bg-emerald-600 text-white text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-bl-xl sm:rounded-bl-2xl uppercase tracking-wider shadow-soft-xs">
                    Group (2+ Players)
                  </span>
                ) : (
                  <span className="inline-block bg-slate-900 dark:bg-slate-800 text-white text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-bl-xl sm:rounded-bl-2xl uppercase tracking-wider">
                    Private 1-on-1
                  </span>
                )}
              </div>

              <div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">{rate.session_type}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {isGroup ? 'Learn, Rally & Compete with Friends' : 'Dedicated Private Tennis Coaching'}
                  </span>
                </div>

                <div className="mt-4 sm:mt-6 mb-2 sm:mb-3 flex items-baseline">
                  <span className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatPrice(rate.price)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm ml-2 font-semibold">/ person</span>
                </div>

                <div className="inline-flex items-center text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mb-4 sm:mb-5">
                  Duration: 1.5 – 2 Hours (court extendable)
                </div>

                {rate.description && (
                  <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-5 sm:mb-6 font-normal">
                    {rate.description}
                  </p>
                )}

                {/* What's Included bullets */}
                <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-4 sm:pt-5 mb-5 sm:mb-6 text-xs text-slate-600 dark:text-slate-400">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    {isGroup ? "Group Training Highlights:" : "Personalized Focus:"}
                  </p>
                  {highlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        isGroup ? 'bg-emerald-500' : 'bg-slate-900 dark:bg-primary-400'
                      }`}></span>
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 sm:pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Public Court</span>
                <button
                  onClick={scrollToSchedule}
                  className={`btn-hover-glow text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all shadow-soft-xs cursor-pointer flex items-center gap-1.5 ${
                    isGroup
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-500'
                  }`}
                >
                  <span>Book Slot</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
