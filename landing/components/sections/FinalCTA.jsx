'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function FinalCTA() {
    const { t } = useLanguage();

    return (
        <section className="section section-dark" id="final-cta">
            <div className="container">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                        <span className="text-white">{t.finalCta.title1}</span>
                        <br />
                        <span className="bg-gradient-to-r from-[#D4AF37] via-[#F4E4B5] to-[#D4AF37] bg-clip-text text-transparent">
                            {t.finalCta.title2}
                        </span>
                    </h2>

                    <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        {t.finalCta.subtitle}<br />
                        <span className="text-white font-semibold">{t.finalCta.subtitleBold}</span>
                    </p>

                    <div className="flex items-center justify-center">
                        <a href="#contact" className="btn btn-primary text-lg px-10 py-5 group">
                            <span>{t.finalCta.ctaPrimary}</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
