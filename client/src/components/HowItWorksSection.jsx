import React from 'react';

export default function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Pick Your Morning',
      desc: 'Browse open training dates on the interactive court calendar. Choose 6:00 AM, 7:30 AM, or 9:00 AM slots.',
      tag: 'Flexible Schedule',
      icon: (
        <svg className="w-6 h-6 text-[#E0749A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Choose Session Type',
      desc: 'Select 1-on-1 private coaching (₱300) or train with friends in a group clinic (₱250). No advance payment needed.',
      tag: '₱300 / ₱250 Rates',
      icon: (
        <svg className="w-6 h-6 text-[#1F7A5A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Step on the Court',
      desc: 'Receive immediate SMS confirmation with coaching notes. Meet Coach Zoid at Malaybalay Public Court and start playing!',
      tag: 'SMS Notification',
      icon: (
        <svg className="w-6 h-6 text-[#E0749A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <span className="text-[11px] font-black tracking-widest text-[#E0749A] uppercase mb-2 block">
          HOW IT WORKS
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Booking a session is effortless.
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
          From calendar tap to the court in under 60 seconds. Everything is automated with SMS updates.
        </p>
      </div>

      {/* 3 Step Cards */}
      <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
        {steps.map((step, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-3xl p-7 sm:p-8 border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] dark:bg-[#20101a] flex items-center justify-center">
                  {step.icon}
                </div>
                <span className="text-2xl font-black text-slate-300 dark:text-slate-700 tracking-wider">
                  {step.num}
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {step.desc}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#1F7A5A] dark:text-emerald-400 uppercase tracking-wider">
                {step.tag}
              </span>
              <span className="text-[#E0749A] text-sm font-bold">→</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
