'use client';

const testimonials = [
    {
        quote: "Sinds we GuestSignal gebruiken, herkennen we belangrijke gasten direct bij binnenkomst. De feedback van gasten is enorm verbeterd.",
        author: "Anna de Vries",
        role: "General Manager",
        hotel: "Hotel Krasnapolsky, Amsterdam",
        avatar: "AV"
    },
    {
        quote: "Geen gemiste kansen meer. Onze concierge weet nu exact welke gasten extra aandacht verdienen en welke attenties passend zijn.",
        author: "Mark Janssen",
        role: "Operations Director",
        hotel: "Boutique Hotel The Dylan",
        avatar: "MJ"
    },
    {
        quote: "De ROI was binnen 3 maanden duidelijk. Twee upgrades naar onze penthouse suite alleen al dekten een heel jaar abonnement.",
        author: "Sophie Laurent",
        role: "Revenue Manager",
        hotel: "Grand Hotel Casselbergh",
        avatar: "SL"
    }
];

const logos = [
    "NH Hotels",
    "Van der Valk",
    "Bilderberg",
    "Marriott",
    "Hilton",
    "Accor"
];

export default function Testimonials() {
    return (
        <section className="section section-dark" id="testimonials">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="badge mb-6">Wat hotels zeggen</span>
                    <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-6">
                        Vertrouwd door{' '}
                        <span className="text-gold-gradient">toonaangevende hotels</span>
                    </h2>
                </div>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="card">
                            {/* Stars */}
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-5 h-5 text-[#C9A962]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-gray-300 leading-relaxed mb-6">
                                "{testimonial.quote}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A962] to-[#E5D4A1] flex items-center justify-center text-sm font-semibold text-black">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <p className="font-semibold text-white text-sm">{testimonial.author}</p>
                                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                                    <p className="text-xs text-gray-600">{testimonial.hotel}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Logo Strip */}
                <div className="border-t border-white/10 pt-12">
                    <p className="text-center text-sm text-gray-500 mb-8">
                        Trusted by leading hotel brands across the Benelux
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50">
                        {logos.map((logo, index) => (
                            <span key={index} className="text-lg font-semibold text-gray-500">
                                {logo}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
