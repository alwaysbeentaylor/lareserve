'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function TargetAudience() {
    const { t } = useLanguage();

    return (
        <section className="section section-dark" id="target-audience">
            <div className="container">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="badge mb-6">{t.targetAudience.badge}</span>
                        <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6 text-white">
                            {t.targetAudience.title}
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        {/* Built for */}
                        <div className="p-8 rounded-xl bg-gradient-to-br from-[#1E3A8A]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30">
                            <h3 className="text-2xl font-heading font-bold text-[#D4AF37] mb-6">
                                {t.targetAudience.builtForTitle}
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-white">{t.targetAudience.builtFor1}</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-white">{t.targetAudience.builtFor2}</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-white">{t.targetAudience.builtFor3}</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-white">{t.targetAudience.builtFor4}</span>
                                </li>
                            </ul>
                        </div>

                        {/* Not for */}
                        <div className="p-8 rounded-xl bg-white/5 border border-white/10">
                            <h3 className="text-2xl font-heading font-bold text-gray-400 mb-6">
                                {t.targetAudience.notForTitle}
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L9.586 10 5.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-400">{t.targetAudience.notFor1}</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L9.586 10 5.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-400">{t.targetAudience.notFor2}</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L9.586 10 5.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-400">{t.targetAudience.notFor3}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="inline-block p-6 rounded-2xl bg-gradient-to-r from-[#1E3A8A]/10 via-[#D4AF37]/5 to-[#1E3A8A]/10 border border-[#D4AF37]/30">
                            <p className="text-lg text-white font-semibold">
                                {t.targetAudience.conclusion}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
