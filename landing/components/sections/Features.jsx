'use client';

const features = [
    {
        icon: (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ),
        title: "VIP Score™ Algorithm",
        description: "11-factor scoring system (1-10 scale) analyzing job titles, company size, social influence, LinkedIn connections, and wealth indicators."
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        title: "Net Worth Estimation",
        description: "Wealth analysis from company ownership, job title, press mentions, and luxury lifestyle indicators. €10K-€50M+ brackets."
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        ),
        title: "Multi-Source Intelligence",
        description: "LinkedIn profiles, Instagram followers, Twitter influence, company websites, press mentions, and public databases. 10+ data sources aggregated."
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
        title: "VIP Service Playbooks",
        description: "Personalized recommendations: suite upgrades for CEOs, welcome amenities for influencers, dedicated hosts for whales. Actionable insights."
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        title: "PMS Integration",
        description: "Seamless connection with Mews, Opera, Protel. VIP intelligence appears automatically in your existing workflows. No manual imports."
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: "GDPR Compliant",
        description: "Only public data (LinkedIn, social media). Legitimate interest legal basis. Auto-delete after 2 years. Full opt-out support."
    }
];

export default function Features() {
    return (
        <section className="section section-dark" id="features">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="badge mb-6">VIP Intelligence Suite</span>
                    <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">
                        Everything You Need to{' '}
                        <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4E4B5] bg-clip-text text-transparent">
                            Identify VIPs
                        </span>
                    </h2>
                    <p className="text-gray-400 text-xl leading-relaxed">
                        Built by hospitality tech experts. Trusted by luxury properties.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="card group hover:border-[#D4AF37]/50 transition-all"
                        >
                            <div className="p-3 rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#1E3A8A]/10 text-[#D4AF37] w-fit mb-4 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="font-heading text-xl font-bold mb-2 text-white">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-16">
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#1E3A8A]/10 border border-[#1E3A8A]/30">
                        <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-300">
                            <span className="text-white font-semibold">Casino Edition</span> includes gambling indicators, whale tracking, and KYC compliance reports
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
