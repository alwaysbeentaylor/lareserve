'use client';
import { useState } from 'react';

const faqs = [
    {
        question: "What data sources do you use?",
        answer: "Know Your VIP searches publicly available sources: LinkedIn profiles, company websites, press articles, and public social media. We don't access private accounts or secured information."
    },
    {
        question: "Is this legal and GDPR-compliant?",
        answer: "Yes, completely. We only collect information guests have made public themselves. This falls under 'legitimate interest' in GDPR legislation. We don't store sensitive personal data, guests can request deletion anytime, and data auto-deletes after 2 years."
    },
    {
        question: "How accurate is the VIP scoring?",
        answer: "Our VIP Score (1-10) is based on 11 objective criteria: job title level, company size, LinkedIn connections, social influence, net worth indicators, and more. We show you why someone got their score, so your team can make informed decisions."
    },
    {
        question: "Can Know Your VIP integrate with our systems?",
        answer: "Yes, we integrate with most Property Management Systems (Mews, Opera, Protel, Clock PMS) and reservation platforms. Integration ensures VIP intelligence appears automatically in your existing workflows. Custom integrations available in Enterprise plans."
    },
    {
        question: "How many guests can we scan per month?",
        answer: "Depends on your plan: VIP Starter includes 200 scans, VIP Professional includes 1,000 scans, and VIP Enterprise is unlimited. A 'scan' is enriching one guest profile. Returning guests are auto-updated without using additional scans."
    },
    {
        question: "What if a guest isn't found online?",
        answer: "Not every guest has an active LinkedIn or social media presence. In that case, the guest gets a standard VIP score based on available data (email domain, booking behavior). You can always add manual notes based on internal knowledge or previous visits."
    },
    {
        question: "What types of businesses use Know Your VIP?",
        answer: "We serve premium hospitality businesses: luxury hotels, private clubs, high-end restaurants, casinos, and exclusive event venues. Our Casino Edition includes whale tracking, gambling indicators, and KYC compliance. Contact sales for industry-specific features."
    },
    {
        question: "What's the difference vs manual Google research?",
        answer: "Manual research takes 15+ minutes per guest and only covers 5-10% of arrivals. Know Your VIP researches 100% of guests in seconds, aggregates 10+ data sources automatically, and provides consistent VIP scoring across your entire team."
    }
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section className="section section-dark" id="faq">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <span className="badge mb-6">FAQ</span>
                    <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">
                        Frequently Asked{' '}
                        <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4E4B5] bg-clip-text text-transparent">
                            Questions
                        </span>
                    </h2>
                    <p className="text-gray-400 text-xl leading-relaxed">
                        Everything you need to know about Know Your VIP.
                    </p>
                </div>

                <div className="max-w-3xl mx-auto">
                    {faqs.map((faq, index) => (
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
                        Still have questions? We're happy to answer them personally.
                    </p>
                    <a href="#contact" className="btn btn-primary">
                        Contact Sales
                    </a>
                </div>
            </div>
        </section>
    );
}
