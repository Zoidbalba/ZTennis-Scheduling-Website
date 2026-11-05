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
        <span className="text-xs font-bold uppercase tracking-widest text-[#92334f] dark:text-[#FFDBE5] bg-[#FFDBE5] dark:bg-[#20101a] px-4 py-1.5 rounded-full shadow-soft-xs inline-block">
          Transparent Pricing
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3 mb-2 tracking-tight">
          Session Rates & Pricing
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-base leading-relaxed">
          Affordable, straightforward rates per person. No hidden membership fees.
        </p>

        {/* Public Court & Duration Highlights — Solid Card */}
        <div className="mt-5 p-5 rounded-3xl bg-white dark:bg-slate-900 text-left max-w-xl mx-auto text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-soft-sm">
          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6D9F71]"></span>
            <span>Flexible Court Playtime Notice:</span>
          </p>
          <p className="text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
            Sessions run for about <strong>1 hr 30 min to 2 hours</strong>. Because training takes place on a <strong>public court</strong>, sessions can comfortably extend depending on open queue and court availability.
          </p>
        </div>
      </div>

      {/* Rates Cards Grid — Solid Smooth Cards (No Outlines) */}
      <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
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
              className="card-hover-lift relative bg-white dark:bg-slate-900 rounded-3xl shadow-soft-md hover:shadow-soft-xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden transition-all duration-300"
            >
              {/* Solid Corner Tag */}
              <div className="absolute top-0 right-0">
                {isGroup ? (
                  <span className="inline-block bg-[#E27396] text-white text-[10px] sm:text-[11px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider shadow-soft-xs">
                    Group (2+ Players)
                  </span>
                ) : (
                  <span className="inline-block bg-[#6D9F71] text-white text-[10px] sm:text-[11px] font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider shadow-soft-xs">
                    Private 1-on-1
                  </span>
                )}
              </div>

              <div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">{rate.session_type}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 block">
                    {isGroup ? 'Learn, Rally & Compete with Friends' : 'Dedicated Private Tennis Coaching'}
                  </span>
                </div>

                <div className="mt-5 mb-3 flex items-baseline">
                  <span className={`text-3xl sm:text-5xl font-black tracking-tight ${
                    isGroup ? 'text-[#E27396] dark:text-[#EA9AB2]' : 'text-slate-900 dark:text-white'
                  }`}>
                    {formatPrice(rate.price)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm ml-2 font-semibold">/ person</span>
                </div>

                {/* Solid Duration Pill */}
                <div className={`inline-flex items-center text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-xl mb-4 sm:mb-5 ${
                  isGroup
                    ? 'bg-[#FFDBE5] text-[#92334f] dark:bg-[#20101a] dark:text-[#FFDBE5]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  Duration: 1.5 – 2 Hours (court extendable)
                </div>

                {rate.description && (
                  <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-5 font-normal">
                    {rate.description}
                  </p>
                )}

                {/* What's Included bullets */}
                <div className="space-y-2.5 pt-3 mb-5 text-xs text-slate-600 dark:text-slate-400">
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                    isGroup ? 'text-[#E27396] dark:text-[#EA9AB2]' : 'text-[#6D9F71] dark:text-[#9ec4b1]'
                  }`}>
                    {isGroup ? "Group Training Highlights:" : "Personalized Focus:"}
                  </p>
                  {highlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        isGroup ? 'bg-[#E27396]' : 'bg-[#6D9F71]'
                      }`}></span>
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-5 flex items-center justify-between border-t border-slate-100/70 dark:border-slate-800/70">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Public Court</span>
                <button
                  onClick={scrollToSchedule}
                  className="btn-hover-pink px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-soft-xs cursor-pointer flex items-center gap-1.5 bg-[#E27396] hover:bg-[#cf5479] text-white"
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
