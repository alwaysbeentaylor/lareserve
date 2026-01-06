'use client';
import { useLanguage } from '@/contexts/LanguageContext';

export default function About() {
    const { t } = useLanguage();

    return (
        <section className="section" id="about">
            <div className="container">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="badge mb-6">{t.about.badge}</span>
                        <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-6">
                            {t.about.title}{' '}
                            <span className="text-gold-gradient">{t.about.titleHighlight}</span>
                        </h2>
                    </div>

                    <div className="card-glass p-8 md:p-12">
                        <div className="grid md:grid-cols-3 gap-8 items-start">
                            {/* Portrait placeholder */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#C9A962] to-[#E5D4A1] flex items-center justify-center mb-4">
                                    <span className="text-4xl font-heading font-bold text-black">SK</span>
                                </div>
                                <h3 className="font-semibold text-white">SKYE Unlimited</h3>
                                <p className="text-sm text-gray-500">Hospitality Technology</p>
                            </div>

                            {/* Story */}
                            <div className="md:col-span-2 space-y-4">
                                <p className="text-gray-300 leading-relaxed text-lg">
                                    {t.about.storyP1}
                                </p>
                                <p className="text-gray-400 leading-relaxed">
                                    {t.about.storyP2}
                                </p>
                                <p className="text-gray-400 leading-relaxed">
                                    {t.about.storyP3}
                                </p>

                                <div className="pt-6 border-t border-white/10 mt-6">
                                    <div className="flex flex-wrap gap-6">
                                        <div>
                                            <p className="text-2xl font-heading font-bold text-[#C9A962]">{t.about.stat1Value}</p>
                                            <p className="text-sm text-gray-500">{t.about.stat1Label}</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-heading font-bold text-[#C9A962]">{t.about.stat2Value}</p>
                                            <p className="text-sm text-gray-500">{t.about.stat2Label}</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-heading font-bold text-[#C9A962]">{t.about.stat3Value}</p>
                                            <p className="text-sm text-gray-500">{t.about.stat3Label}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
