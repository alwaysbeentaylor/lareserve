'use client';

const steps = [
    {
        number: "01",
        title: "Upload Guest List",
        description: "Import reservations from your PMS (Mews, Opera), Excel, or CSV. We need name, email, and check-in date.",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
        )
    },
    {
        number: "02",
        title: "Automatic VIP Detection",
        description: "Our engine searches LinkedIn, Instagram, Twitter, company databases, and press mentions. Analyzes job titles, social influence, and wealth indicators.",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        )
    },
    {
        number: "03",
        title: "VIP Score & Intelligence",
        description: "Every guest gets a VIP Score (1-10), net worth estimate, job title, social media followers, and influence level. Clear, actionable data.",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        )
    },
    {
        number: "04",
        title: "Service Recommendations",
        description: "Get personalized playbooks: suite upgrades for CEOs, welcome amenities for influencers, dedicated hosts for whales. Know exactly how to impress each VIP.",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
        )
    }
];

export default function HowItWorks() {
    return (
        <section className="section" id="how-it-works">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="badge mb-6">How It Works</span>
                    <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">
                        VIP Detection in{' '}
                        <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4E4B5] bg-clip-text text-transparent">
                            4 Simple Steps
                        </span>
                    </h2>
                    <p className="text-gray-400 text-xl leading-relaxed">
                        From booking data to personalized service recommendations in seconds.
                    </p>
                </div>

                <div className="relative max-w-5xl mx-auto">
                    {/* Connection Line */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#D4AF37]/50 via-[#D4AF37]/30 to-transparent hidden md:block" />

                    <div className="space-y-12">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className={`relative flex flex-col md:flex-row gap-8 items-start ${index % 2 === 1 ? 'md:flex-row-reverse' : ''
                                    }`}
                            >
                                {/* Step Number Circle */}
                                <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 z-10">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] border-2 border-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
                                        <span className="font-heading text-xl font-bold text-[#D4AF37]">{step.number}</span>
                                    </div>
                                </div>

                                {/* Content Card */}
                                <div className={`ml-24 md:ml-0 md:w-1/2 ${index % 2 === 1 ? 'md:pr-20' : 'md:pl-20'}`}>
                                    <div className="card hover:border-[#D4AF37]/50 transition-all group">
                                        <div className="text-[#D4AF37] mb-4 group-hover:scale-110 transition-transform">
                                            {step.icon}
                                        </div>
                                        <h3 className="font-heading text-2xl font-bold mb-3 text-white">
                                            {step.title}
                                        </h3>
                                        <p className="text-gray-400 leading-relaxed text-base">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Empty space for alternating layout */}
                                <div className="hidden md:block md:w-1/2" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center mt-16">
                    <a href="#pricing" className="btn btn-primary inline-flex items-center gap-2">
                        <span>See Pricing Plans</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    );
}
