'use client';

const benefits = [
    {
        metric: "↑ 35%",
        title: "Higher VIP satisfaction",
        description: "High-value guests feel recognized and valued from the first moment."
    },
    {
        metric: "↑ €200",
        title: "Average revenue per VIP",
        description: "Through targeted upsells at the right time: suites, spa, dining."
    },
    {
        metric: "↑ 0.8",
        title: "Points on review scores",
        description: "Personalized VIP service leads to better online reviews and reputation."
    },
    {
        metric: "5+ hours",
        title: "Saved per week",
        description: "No more manual Googling. Your team focuses on what matters: the guest."
    }
];

export default function Benefits() {
    return (
        <section className="section" id="benefits">
            <div className="container">
                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                    {/* Left: Content */}
                    <div>
                        <span className="badge mb-6">Results</span>
                        <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-6">
                            The investment that{' '}
                            <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4E4B5] bg-clip-text text-transparent">pays for itself</span>
                        </h2>
                        <p className="text-gray-400 text-lg mb-8">
                            One satisfied VIP guest who returns or leaves a positive review pays back your annual subscription. The rest is profit.
                        </p>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="p-5 rounded-xl bg-white/5 border border-white/10">
                                    <p className="font-heading text-2xl font-bold text-[#D4AF37] mb-1">
                                        {benefit.metric}
                                    </p>
                                    <p className="text-sm font-medium text-white mb-1">
                                        {benefit.title}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {benefit.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Visual */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#D4AF37]/5 rounded-3xl blur-3xl" />
                        <div className="relative card-glass p-8">
                            <div className="text-center mb-8">
                                <p className="text-sm text-gray-400 mb-2">Average ROI</p>
                                <p className="font-heading text-6xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#F4E4B5] bg-clip-text text-transparent">12x</p>
                                <p className="text-gray-400 mt-2">within 12 months</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                                    <span className="text-gray-400">Monthly investment</span>
                                    <span className="font-semibold text-white">€299</span>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                                    <span className="text-gray-400">Extra revenue per month</span>
                                    <span className="font-semibold text-[#D4AF37]">+€3.500</span>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                                    <span className="font-medium text-white">Net return</span>
                                    <span className="font-bold text-[#D4AF37]">+€3.200/month</span>
                                </div>
                            </div>

                            <p className="text-center text-xs text-gray-500 mt-6">
                                *Based on averages from hotels with 50+ rooms
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
