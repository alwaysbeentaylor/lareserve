'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function Compliance() {
    const { t } = useLanguage();

    return (
        <section className="section" id="compliance">
            <div className="container">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="badge mb-6">{t.compliance.badge}</span>
                        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                            {t.compliance.title}
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-xl bg-white/5 border border-white/10 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-semibold">{t.compliance.point1}</p>
                            </div>
                        </div>

                        <div className="p-6 rounded-xl bg-white/5 border border-white/10 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-semibold">{t.compliance.point2}</p>
                            </div>
                        </div>

                        <div className="p-6 rounded-xl bg-white/5 border border-white/10 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-semibold">{t.compliance.point3}</p>
                            </div>
                        </div>

                        <div className="p-6 rounded-xl bg-white/5 border border-white/10 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-semibold">{t.compliance.point4}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
