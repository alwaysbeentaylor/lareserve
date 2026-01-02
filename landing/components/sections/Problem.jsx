'use client';

export default function Problem() {
    return (
        <section className="section section-dark">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="badge mb-6">The VIP Blind Spot</span>
                    <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">
                        80% of VIPs Check In{' '}
                        <span className="bg-gradient-to-r from-[#EF4444] to-[#DC2626] bg-clip-text text-transparent">
                            Unnoticed
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400 leading-relaxed">
                        While you're treating them like regular guests, your competitors are rolling out the red carpet.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {/* Problem 1 */}
                    <div className="card border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent hover:border-red-500/40 transition-all group">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-heading text-xl font-semibold text-white mb-3">
                            Missed Opportunities
                        </h3>
                        <p className="text-gray-400 leading-relaxed mb-4">
                            A tech CEO books a standard room. You don't recognize them. They spend €200 and never return.
                        </p>
                        <div className="text-sm text-red-400 font-semibold">
                            Lost: €50K+ lifetime value
                        </div>
                    </div>

                    {/* Problem 2 */}
                    <div className="card border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent hover:border-orange-500/40 transition-all group">
                        <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <h3 className="font-heading text-xl font-semibold text-white mb-3">
                            Competitor Advantage
                        </h3>
                        <p className="text-gray-400 leading-relaxed mb-4">
                            Your rival identifies the same VIP, offers suite upgrade + comps. They win €50K/year loyalty.
                        </p>
                        <div className="text-sm text-orange-400 font-semibold">
                            Lost: Market share to competitors
                        </div>
                    </div>

                    {/* Problem 3 */}
                    <div className="card border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent hover:border-yellow-500/40 transition-all group">
                        <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-heading text-xl font-semibold text-white mb-3">
                            Manual Research Fails
                        </h3>
                        <p className="text-gray-400 leading-relaxed mb-4">
                            Front desk manually Googles 5 guests/day. Misses 95% of arrivals. Takes 15 min per guest.
                        </p>
                        <div className="text-sm text-yellow-400 font-semibold">
                            Wasted: 75+ hours/month
                        </div>
                    </div>
                </div>

                {/* Stat Callout */}
                <div className="mt-16 max-w-4xl mx-auto">
                    <div className="card border-[#D4AF37]/30 bg-gradient-to-r from-[#1E3A8A]/10 via-[#D4AF37]/5 to-[#1E3A8A]/10">
                        <div className="text-center">
                            <div className="inline-flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h3 className="font-heading text-2xl font-bold text-white">
                                    The Solution
                                </h3>
                            </div>
                            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                                <span className="text-white font-semibold">Know Your VIP</span> automatically identifies high-value guests from booking data.
                                Get VIP scores, net worth estimates, and service recommendations{' '}
                                <span className="text-[#D4AF37] font-semibold">before they arrive</span>.
                            </p>
                            <div className="mt-6">
                                <a href="#how-it-works" className="btn btn-primary inline-flex items-center gap-2">
                                    <span>See How It Works</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
