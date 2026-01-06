'use client';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FAQ() {
    const { t } = useLanguage();
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section className="section section-dark" id="faq">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <span className="badge mb-6">{t.faq.badge}</span>
                    <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">
                        {t.faq.title}{' '}
                        <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4E4B5] bg-clip-text text-transparent">
                            {t.faq.titleHighlight}
                        </span>
                    </h2>
                    <p className="text-gray-400 text-xl leading-relaxed">
                        {t.faq.subtitle}
                    </p>
                </div>

                <div className="max-w-3xl mx-auto">
                    {t.faq.questions.map((faq, index) => (
                        <div key={index} className="faq-item">
                            <button
                                className="faq-question"
                                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                            >
                                <span className="font-semibold">{faq.question}</span>
                                <svg
                                    className={`w-5 h-5 text-[#D4AF37] transition-transform ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {openIndex === index && (
                                <div className="faq-answer">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Still have questions */}
                <div className="text-center mt-12">
                    <p className="text-gray-400 text-lg mb-4">
                        {t.faq.stillQuestions}
                    </p>
                    <a href="#contact" className="btn btn-primary">
                        {t.faq.contactSales}
                    </a>
                </div>
            </div>
        </section>
    );
}
