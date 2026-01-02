'use client';

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
            {/* Background Effects */}
            <div className="hero-gradient" />
            <div className="grid-pattern opacity-50" />

            {/* Decorative Elements */}
            <div className="absolute top-1/4 right-10 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-[#1E3A8A]/10 rounded-full blur-3xl" />

            <div className="container relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-[#D4AF37]/20 mb-8 animate-fade-in">
                        <svg className="w-4 h-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-300">
                            Trusted by premium hospitality businesses across Europe
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <span className="text-white">Identify</span>{' '}
                        <span className="bg-gradient-to-r from-[#D4AF37] via-[#F4E4B5] to-[#D4AF37] bg-clip-text text-transparent">
                            High-Rollers
                        </span>
                        {', '}
                        <span className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent">
                            CEOs
                        </span>
                        {', & '}
                        <span className="bg-gradient-to-r from-[#D4AF37] via-[#F4E4B5] to-[#D4AF37] bg-clip-text text-transparent">
                            Influencers
                        </span>
                        <br />
                        <span className="text-white">Before They Check In</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
                        Automated VIP detection from booking data.<br />
                        Know <span className="text-white font-semibold">net worth</span>, <span className="text-white font-semibold">social influence</span>, and <span className="text-white font-semibold">service preferences</span> in seconds.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <a href="#contact" className="btn btn-primary text-base px-8 py-4 group">
                            <span>See VIP Demo</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </a>
                        <a href="#how-it-works" className="btn btn-ghost text-base px-8 py-4">
                            How It Works
                        </a>
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex flex-wrap items-center justify-center gap-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                        <div className="trust-badge">
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            GDPR Compliant
                        </div>
                        <div className="trust-badge">
                            <svg className="w-4 h-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            €2M+ VIP Revenue Generated
                        </div>
                        <div className="trust-badge">
                            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Made in EU
                        </div>
                    </div>
                </div>

                {/* Dashboard Preview */}
                <div className="mt-20 relative animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-transparent z-10 pointer-events-none" />

                    {/* Glow effect behind card */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A]/20 via-[#D4AF37]/20 to-[#1E3A8A]/20 blur-3xl opacity-50" />

                    <div className="card-glass p-6 mx-auto max-w-4xl animate-float relative">
                        <div className="bg-[#0A0A0F] rounded-lg p-6 border border-[#D4AF37]/20">
                            {/* Mock Dashboard Header */}
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center border-2 border-[#D4AF37]/30">
                                        <span className="text-white font-bold text-lg">SC</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white text-lg">Sarah Chen</p>
                                        <p className="text-sm text-gray-400">Arriving Today • Executive Suite</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#F4E4B5] text-black border border-[#D4AF37]">
                                        ⭐ VIP
                                    </span>
                                </div>
                            </div>

                            {/* Mock VIP Score Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-[#1E3A8A]/20 to-[#2563EB]/10 border border-[#1E3A8A]/30">
                                    <p className="text-4xl font-heading font-bold bg-gradient-to-r from-[#D4AF37] to-[#F4E4B5] bg-clip-text text-transparent">9.2</p>
                                    <p className="text-xs text-gray-400 mt-1 font-medium">VIP Score</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
                                    <p className="text-lg font-semibold text-white">CEO</p>
                                    <p className="text-xs text-gray-400 mt-1">TechCorp International</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
                                    <p className="text-lg font-semibold text-[#D4AF37]">€15M+</p>
                                    <p className="text-xs text-gray-400 mt-1">Est. Net Worth</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
                                    <p className="text-lg font-semibold text-white">45K</p>
                                    <p className="text-xs text-gray-400 mt-1">LinkedIn Connections</p>
                                </div>
                            </div>

                            {/* VIP Service Recommendation */}
                            <div className="p-4 rounded-lg border border-[#D4AF37]/30 bg-gradient-to-r from-[#D4AF37]/5 to-transparent">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-white mb-1">VIP Service Recommendation</p>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            High-value tech executive with luxury lifestyle indicators. Recommend: Executive suite upgrade,
                                            personalized welcome amenity, assign dedicated concierge.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </div>
        </section>
    );
}
