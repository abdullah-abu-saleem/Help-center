import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';

const TUTORIAL_FLAG = 'teacherTutorialDone';

const STEPS = [
  {
    titleKey: 'tutorialStep1Title' as const,
    descKey: 'tutorialStep1Desc' as const,
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    titleKey: 'tutorialStep2Title' as const,
    descKey: 'tutorialStep2Desc' as const,
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
      </svg>
    ),
    color: 'from-blue-400 to-primary-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    titleKey: 'tutorialStep3Title' as const,
    descKey: 'tutorialStep3Desc' as const,
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
      </svg>
    ),
    color: 'from-emerald-400 to-green-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
];

export const TeacherTutorial: React.FC = () => {
  const { t, dir } = useI18n();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(TUTORIAL_FLAG);
    if (!done) {
      const timer = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  function finish() {
    localStorage.setItem(TUTORIAL_FLAG, 'true');
    setShow(false);
  }

  function skip() {
    finish();
  }

  if (!show) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" dir={dir}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden fade-up">
        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-100">
          <div
            className={`h-full bg-gradient-to-r ${current.color} transition-all duration-500`}
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {t('tutorialStepOf', { current: String(step + 1), total: String(STEPS.length) })}
            </span>
            <button
              onClick={skip}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              {t('tutorialSkip')}
            </button>
          </div>

          {/* Icon */}
          <div className={`w-20 h-20 rounded-2xl ${current.bgColor} ${current.textColor} flex items-center justify-center mx-auto mb-6`}>
            {current.icon}
          </div>

          {/* Content */}
          <h2 className="text-xl font-bold text-slate-900 text-center mb-3">
            {t(current.titleKey)}
          </h2>
          <p className="text-sm text-slate-500 text-center leading-relaxed mb-8">
            {t(current.descKey)}
          </p>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === step ? `w-6 bg-gradient-to-r ${current.color}` : idx < step ? 'bg-slate-400' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!isFirst && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                {t('tutorialPrev')}
              </button>
            )}
            <button
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
              className={`flex-1 px-5 py-2.5 rounded-xl text-white font-medium bg-gradient-to-r ${current.color} shadow-md hover:shadow-lg transition-all duration-200`}
            >
              {isLast ? t('tutorialFinish') : t('tutorialNext')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
