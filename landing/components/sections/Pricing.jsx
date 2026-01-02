'use client';
import { useState } from 'react';

const plans = [
    {
        name: "VIP Starter",
        price: "199",
        description: "Perfect for boutique properties",
        features: [
            { text: "200 guest scans per month", included: true },
            { text: "VIP Score & Intelligence", included: true },
            { text: "LinkedIn + Social Media profiles", included: true },
            { text: "Basic service recommendations", included: true },
            { text: "Email support", included: true },
            { text: "1 property", included: true },
            { text: "PMS integration", included: false },
            { text: "Net worth estimation", included: false },
        ],
        cta: "Start 14-Day Trial",
        popular: false
    },
    {
        name: "VIP Professional",
        price: "399",
        description: "For premium venues",
        features: [
            { text: "1,000 guest scans per month", included: true },
            { text: "VIP Score & Intelligence", included: true },
            { text: "LinkedIn + Social Media profiles", included: true },
            { text: "Advanced VIP playbooks", included: true },
            { text: "Priority email + phone support", included: true },
            { text: "Up to 3 properties", included: true },
            { text: "PMS integration (Mews, Opera)", included: true },
            { text: "Net worth estimation", included: true },
        ],
        cta: "Start 14-Day Trial",
        popular: true
    },
    {
        name: "VIP Enterprise",
        price: "799",
        description: "For groups & high-volume venues",
        features: [
            { text: "Unlimited guest scans", included: true },
            { text: "VIP Score & Intelligence", included: true },
            { text: "LinkedIn + Social Media profiles", included: true },
            { text: "Custom VIP criteria & playbooks", included: true },
            { text: "Dedicated account manager", included: true },
            { text: "Unlimited properties", included: true },
            { text: "Priority PMS integration", included: true },
            { text: "Net worth + gambling indicators", included: true },
        ],
        cta: "Contact Sales",
        popular: false
    }
];

export default function Pricing() {
    const [annual, setAnnual] = useState(false);

    return (
        <section className="section section-dark" id="pricing">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <span className="badge mb-6">Pricing</span>
                    <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">
                        Choose Your{' '}
                        <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4E4B5] bg-clip-text text-transparent">
                            VIP Plan
                        </span>
                    </h2>
                    <p className="text-gray-400 text-xl mb-8 leading-relaxed">
                        No hidden fees. No setup costs. Cancel anytime.<br />
                        <span className="text-white font-semibold">ROI from one VIP</span> covers your annual subscription.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-4 p-1 rounded-full bg-white/5 border border-white/10">
                        <button
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!annual ? 'bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            onClick={() => setAnnual(false)}
                        >
                            Monthly
                        </button>
                        <button
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${annual ? 'bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            onClick={() => setAnnual(true)}
                        >
                            Annual
                            <span className={`text-xs px-2 py-0.5 rounded-full ${annual ? 'bg-[#D4AF37]/30 text-[#D4AF37]' : 'bg-green-500/20 text-green-400'
                                }`}>
                                Save 20%
                            </span>
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`card relative ${plan.popular
                                ? 'border-[#D4AF37] md:scale-105 md:-my-4 shadow-2xl shadow-[#D4AF37]/20'
                                : 'border-white/10'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#F4E4B5] text-black uppercase tracking-wide shadow-lg">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="text-center pb-6 border-b border-white/10">
                                <h3 className="font-heading text-2xl font-bold text-white mb-2">
                                    {plan.name}
                                </h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    {plan.description}
                                </p>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-gray-400 text-lg">€</span>
                                    <span className="font-heading text-5xl font-bold text-white">
                                        {annual ? Math.round(parseInt(plan.price) * 0.8) : plan.price}
                                    </span>
                                    <span className="text-gray-400">/month</span>
                                </div>
                                {annual && (
                                    <p className="text-sm text-[#D4AF37] mt-2 font-medium">
                                        Save €{Math.round(parseInt(plan.price) * 12 * 0.2)}/year
                                    </p>
                                )}
                            </div>

                            <ul className="py-6 space-y-3">
                                {plan.features.map((feature, fIndex) => (
                                    <li key={fIndex} className="flex items-start gap-3">
                                        {feature.included ? (
                                            <svg className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                        <span className={feature.included ? 'text-gray-300 text-sm' : 'text-gray-600 text-sm'}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <a
                                href="#contact"
                                className={`btn w-full ${plan.popular
                                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#F4E4B5] text-black hover:shadow-lg hover:shadow-[#D4AF37]/30 font-bold'
                                    : 'btn-secondary'
                                }`}
                            >
                                {plan.cta}
                            </a>
                        </div>
                    ))}
                </div>

                {/* Bottom note */}
                <div className="text-center mt-12 space-y-4">
                    <p className="text-gray-400 text-sm">
                        All plans include a 14-day free trial. No credit card required.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E3A8A]/10 border border-[#1E3A8A]/30">
                        <svg className="w-4 h-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-300">
                            <span className="text-white font-semibold">Casino Edition</span> available — Contact sales for whale tracking & KYC compliance
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
