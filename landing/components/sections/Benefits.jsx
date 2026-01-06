'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function Benefits() {
    const { t } = useLanguage();

    return (
        <section className="section" id="benefits">
            <div className="container">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="badge mb-6">{t.benefits.badge}</span>
                        <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6 text-white">
                            {t.benefits.badge}
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Front Desk */}
                        <div className="p-8 rounded-xl bg-gradient-to-br from-[#1E3A8A]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30">
                            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-heading font-bold text-white mb-4">
                                {t.benefits.frontDeskTitle}
                            </h3>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-300">{t.benefits.frontDesk1}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-300">{t.benefits.frontDesk2}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-300">{t.benefits.frontDesk3}</span>
                                </li>
                            </ul>
                        </div>

                        {/* Management */}
                        <div className="p-8 rounded-xl bg-gradient-to-br from-[#1E3A8A]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30">
                            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-heading font-bold text-white mb-4">
                                {t.benefits.managementTitle}
                            </h3>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-300">{t.benefits.management1}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-300">{t.benefits.management2}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-300">{t.benefits.management3}</span>
                                </li>
                            </ul>
                        </div>

                        {/* Guests */}
                        <div className="p-8 rounded-xl bg-gradient-to-br from-[#1E3A8A]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30">
                            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-heading font-bold text-white mb-4">
                                {t.benefits.guestsTitle}
                            </h3>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-300">{t.benefits.guests1}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-300">{t.benefits.guests2}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-300">{t.benefits.guests3}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
