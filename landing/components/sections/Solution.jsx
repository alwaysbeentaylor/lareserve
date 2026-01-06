'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function Solution() {
    const { t } = useLanguage();

    return (
        <section className="section" id="solution">
            <div className="container">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="badge mb-6">{t.solution.badge}</span>
                        <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">
                            {t.solution.title}
                        </h2>
                        <p className="text-xl text-gray-400 leading-relaxed">
                            {t.solution.subtitle}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto mb-12">
                        <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 transition-all">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-white font-semibold">{t.solution.point1}</p>
                        </div>

                        <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 transition-all">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <p className="text-white font-semibold">{t.solution.point2}</p>
                        </div>

                        <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 transition-all">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-white font-semibold">{t.solution.point3}</p>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="inline-block p-6 rounded-2xl bg-gradient-to-r from-[#1E3A8A]/10 via-[#D4AF37]/5 to-[#1E3A8A]/10 border border-[#D4AF37]/30">
                            <p className="text-lg text-gray-300">
                                {t.solution.conclusion}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
