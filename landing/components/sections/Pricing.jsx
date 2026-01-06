'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function Pricing() {
    const { t } = useLanguage();

    return (
        <section className="section section-dark" id="pricing">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <span className="badge mb-6">{t.pricing.badge}</span>
                    <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6 text-white">
                        {t.pricing.badge}
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* CORE */}
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 transition-all">
                        <h3 className="text-2xl font-heading font-bold text-white mb-2">{t.pricing.coreName}</h3>
                        <p className="text-gray-400 mb-6">{t.pricing.coreTagline}</p>

                        <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-1">{t.pricing.corePrice}</p>
                            <p className="text-sm text-gray-500">{t.pricing.corePriceUnit}</p>
                        </div>

                        <ul className="space-y-3 mb-8">
                            <li className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-300 text-sm">{t.pricing.coreFeature1}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-300 text-sm">{t.pricing.coreFeature2}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-300 text-sm">{t.pricing.coreFeature3}</span>
                            </li>
                        </ul>

                        <a href="#contact" className="btn btn-secondary w-full">{t.pricing.ctaCore}</a>
                    </div>

                    {/* PRO - Most Popular */}
                    <div className="p-8 rounded-2xl bg-gradient-to-br from-[#1E3A8A]/10 to-[#D4AF37]/5 border-2 border-[#D4AF37] relative md:scale-105 md:-my-4">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#F4E4B5] text-black uppercase tracking-wide shadow-lg">
                                {t.pricingExtra.mostPopular}
                            </span>
                        </div>

                        <h3 className="text-2xl font-heading font-bold text-white mb-2">{t.pricing.proName}</h3>
                        <p className="text-gray-400 mb-6">{t.pricing.proTagline}</p>

                        <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-1">{t.pricing.proPrice}</p>
                            <p className="text-sm text-gray-500">{t.pricing.proPriceUnit}</p>
                        </div>

                        <p className="text-sm text-gray-400 mb-3">{t.pricing.proIncludes}</p>

                        <ul className="space-y-3 mb-8">
                            <li className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-300 text-sm">{t.pricing.proFeature1}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-300 text-sm">{t.pricing.proFeature2}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-300 text-sm">{t.pricing.proFeature3}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-300 text-sm">{t.pricing.proFeature4}</span>
                            </li>
                        </ul>

                        <a href="#contact" className="btn w-full bg-gradient-to-r from-[#D4AF37] to-[#F4E4B5] text-black hover:shadow-lg hover:shadow-[#D4AF37]/30 font-bold">
                            {t.pricing.ctaPro}
                        </a>
                    </div>

                    {/* ENTERPRISE */}
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 transition-all">
                        <h3 className="text-2xl font-heading font-bold text-white mb-2">{t.pricing.enterpriseName}</h3>
                        <p className="text-gray-400 mb-6">{t.pricing.enterpriseTagline}</p>

                        <div className="mb-6">
                            <p className="text-sm text-gray-500">{t.pricing.enterprisePrice}</p>
                        </div>

                        <p className="text-sm text-gray-400 mb-3">{t.pricing.enterpriseIncludes}</p>

                        <ul className="space-y-3 mb-8">
                            <li className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-300 text-sm">{t.pricing.enterpriseFeature1}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-300 text-sm">{t.pricing.enterpriseFeature2}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-300 text-sm">{t.pricing.enterpriseFeature3}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-300 text-sm">{t.pricing.enterpriseFeature4}</span>
                            </li>
                        </ul>

                        <a href="#contact" className="btn btn-secondary w-full">{t.pricing.ctaEnterprise}</a>
                    </div>
                </div>

                {/* Pricing Note */}
                <p className="text-center text-gray-500 text-sm mt-8">
                    {t.pricing.pricingNote}
                </p>
            </div>
        </section>
    );
}
