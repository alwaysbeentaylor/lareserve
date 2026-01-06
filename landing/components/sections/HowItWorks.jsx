'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function HowItWorks() {
    const { t } = useLanguage();

    const steps = [
        {
            number: "01",
            title: t.howItWorks.step1Title,
            description: t.howItWorks.step1Desc,
        },
        {
            number: "02",
            title: t.howItWorks.step2Title,
            description: t.howItWorks.step2Desc,
        },
        {
            number: "03",
            title: t.howItWorks.step3Title,
            description: t.howItWorks.step3Desc,
        },
        {
            number: "04",
            title: t.howItWorks.step4Title,
            description: t.howItWorks.step4Desc,
        }
    ];

    return (
        <section className="section" id="how-it-works">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="badge mb-6">{t.howItWorks.badge}</span>
                    <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6 text-white">
                        {t.howItWorks.title}
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-12">
                    {steps.map((step, index) => (
                        <div key={index} className="text-center p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 transition-all">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center border-2 border-[#D4AF37]">
                                <span className="font-heading text-lg font-bold text-[#D4AF37]">{step.number}</span>
                            </div>
                            <h3 className="font-heading text-xl font-bold text-white mb-3">
                                {step.title}
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="text-center max-w-2xl mx-auto space-y-2">
                    <p className="text-gray-400">{t.howItWorks.noDashboards}</p>
                    <p className="text-gray-400">{t.howItWorks.noExtraWork}</p>
                </div>
            </div>
        </section>
    );
}
