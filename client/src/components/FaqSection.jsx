import React, { useState } from 'react';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'What should I bring to my first session?',
      a: 'Bring your tennis racket (or message Coach Zoid in advance to borrow one for free), comfortable athletic clothing, rubber or court shoes, a water bottle, and a small towel.',
    },
    {
      q: 'How long do sessions last?',
      a: 'Regular morning training runs between 1.5 to 2 hours (6:00 AM – 9:00 AM window), and playtime can extend depending on the public court queue and schedule.',
    },
    {
      q: 'What happens if it rains in the morning?',
      a: 'If wet courts or morning showers prevent safe play, Coach Zoid will send you an SMS notification to reschedule your slot to the next open morning that fits your schedule.',
    },
    {
      q: 'Are sessions beginner-friendly if I have never played?',
      a: 'Absolutely! Many of Coach Zoid’s trainees started with zero experience. We focus on patient, step-by-step stroke mechanics and rallying so tennis is enjoyable right from day one.',
    },
    {
      q: 'Where does coaching take place in Malaybalay City?',
      a: 'All sessions are held at the Malaybalay City Public Tennis Court. Ample public parking and spectator seating are available.',
    },
  ];

  return (
    <section className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10 sm:mb-14">
        <span className="text-[11px] font-black tracking-widest text-[#E0749A] uppercase mb-2 block">
          COMMON QUESTIONS
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Everything you need to know.
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-2">
          Have questions before stepping onto the court? Here are the most common answers.
        </p>
      </div>

      <div className="space-y-3.5">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-soft-xs overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  {faq.q}
                </span>
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-transform duration-200 ${
                    isOpen
                      ? 'bg-[#E0749A] text-white rotate-180'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ↓
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-50 dark:border-slate-800/60 pt-3 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Direct Contact Callout */}
      <div className="mt-10 p-6 rounded-3xl bg-[#FFF0F5] dark:bg-[#20101a] border border-pink-100 dark:border-pink-900/40 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <h4 className="font-black text-sm text-slate-900 dark:text-white">
            Have a specific training request?
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Reach Coach Zoid directly via Call, SMS, or Messenger anytime.
          </p>
        </div>
        <a
          href="tel:09350034792"
          className="bg-[#E0749A] hover:bg-[#cf5479] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-soft-xs transition-colors shrink-0 cursor-pointer"
        >
          Call 0935 003 4792 →
        </a>
      </div>
    </section>
  );
}
