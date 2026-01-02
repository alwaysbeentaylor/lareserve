'use client';

export default function About() {
    return (
        <section className="section" id="about">
            <div className="container">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="badge mb-6">Over Guest Signals</span>
                        <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-6">
                            Gebouwd door{' '}
                            <span className="text-gold-gradient">hospitality insiders</span>
                        </h2>
                    </div>

                    <div className="card-glass p-8 md:p-12">
                        <div className="grid md:grid-cols-3 gap-8 items-start">
                            {/* Portrait placeholder */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#C9A962] to-[#E5D4A1] flex items-center justify-center mb-4">
                                    <span className="text-4xl font-heading font-bold text-black">SK</span>
                                </div>
                                <h3 className="font-semibold text-white">SKYE Unlimited</h3>
                                <p className="text-sm text-gray-500">Hospitality Technology</p>
                            </div>

                            {/* Story */}
                            <div className="md:col-span-2 space-y-4">
                                <p className="text-gray-300 leading-relaxed text-lg">
                                    "Na jaren ervaring in de hospitality sector zagen we steeds hetzelfde patroon:
                                    hotels die hun best deden om gasten te herkennen, maar worstelden met inconsistentie,
                                    tijdgebrek en verloren informatie."
                                </p>
                                <p className="text-gray-400 leading-relaxed">
                                    Guest Signals is geboren uit die frustratie. We bouwden een tool die doet wat
                                    uw beste receptionist zou doen — maar dan voor elke gast, elke shift, elke dag.
                                    Zonder de kennis te verliezen wanneer iemand vrij is of vertrekt.
                                </p>
                                <p className="text-gray-400 leading-relaxed">
                                    Wij geloven dat gastvrijheid draait om de details. Een naam onthouden.
                                    Weten dat iemand van rode wijn houdt. Begrijpen wanneer iemand rust nodig
                                    heeft en wanneer aandacht. Guest Signals maakt dat schaalbaar.
                                </p>

                                <div className="pt-6 border-t border-white/10 mt-6">
                                    <div className="flex flex-wrap gap-6">
                                        <div>
                                            <p className="text-2xl font-heading font-bold text-[#C9A962]">150+</p>
                                            <p className="text-sm text-gray-500">Hotels actief</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-heading font-bold text-[#C9A962]">50K+</p>
                                            <p className="text-sm text-gray-500">Gasten geprofileerd</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-heading font-bold text-[#C9A962]">NL & BE</p>
                                            <p className="text-sm text-gray-500">Actieve markten</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
