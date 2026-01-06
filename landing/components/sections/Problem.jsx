'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function Problem() {
    const { t } = useLanguage();

    return (
        <section className="section section-dark" id="problem">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="badge mb-6">{t.problem.badge}</span>
                    <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6 text-white">
                        {t.problem.title}
                    </h2>
                    <p className="text-xl text-gray-400 leading-relaxed mb-8">
                        {t.problem.intro}
                    </p>
                    <ul className="text-left max-w-xl mx-auto space-y-3 mb-8">
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-300">{t.problem.point1}</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-300">{t.problem.point2}</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-300">{t.problem.point3}</span>
                        </li>
                    </ul>
                    <p className="text-lg text-[#EF4444] font-semibold">
                        {t.problem.discovery}
                    </p>
                </div>

                {/* Consequences */}
                <div className="max-w-2xl mx-auto mb-16">
                    <h3 className="text-2xl font-heading font-bold text-white mb-6 text-center">
                        {t.problem.consequenceTitle}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                            <p className="text-gray-300">{t.problem.consequence1}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                            <p className="text-gray-300">{t.problem.consequence2}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                            <p className="text-gray-300">{t.problem.consequence3}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                            <p className="text-gray-300">{t.problem.consequence4}</p>
                        </div>
                    </div>
                </div>

                {/* The real issue */}
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-block p-8 rounded-2xl bg-gradient-to-r from-[#1E3A8A]/10 via-[#D4AF37]/5 to-[#1E3A8A]/10 border border-[#D4AF37]/30">
                        <p className="text-xl text-gray-300 mb-2">
                            {t.problem.notPeople}
                        </p>
                        <p className="text-2xl font-heading font-bold text-[#D4AF37]">
                            {t.problem.notPeopleBold}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
