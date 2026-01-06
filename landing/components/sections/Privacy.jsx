'use client';

const privacyPoints = [
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: "Alleen publieke informatie",
        description: "Wij gebruiken uitsluitend informatie die openbaar beschikbaar is: LinkedIn profielen, bedrijfswebsites, nieuwsartikelen. Niets meer."
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
        title: "Geen gevoelige data",
        description: "Wij verzamelen geen medische gegevens, politieke voorkeuren, religieuze overtuigingen of andere bijzondere persoonsgegevens."
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
        ),
        title: "GDPR-compliant",
        description: "Onze werkwijze is volledig in lijn met de Algemene Verordening Gegevensbescherming. We werken alleen met rechtmatige grondslagen."
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        ),
        title: "Uitlegbaar aan gasten",
        description: "Mocht een gast vragen hoe u aan informatie komt, kunt u transparant antwoorden: alles is openbaar te vinden. Geen verborgen praktijken."
    }
];

export default function Privacy() {
    return (
        <section className="section" id="privacy">
            <div className="container">
                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                    {/* Left: Visual */}
                    <div className="relative order-2 lg:order-1">
                        <div className="absolute inset-0 bg-green-500/5 rounded-3xl blur-3xl" />
                        <div className="relative card-glass p-8 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>

                            <h3 className="font-heading text-2xl font-semibold mb-4 text-white">
                                Privacy-first benadering
                            </h3>

                            <div className="space-y-3 text-left">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                                    <span className="text-green-500">✓</span>
                                    <span className="text-sm text-gray-300">Geen scraping van privédata</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                                    <span className="text-green-500">✓</span>
                                    <span className="text-sm text-gray-300">Geen toegang tot accounts van gasten</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                                    <span className="text-green-500">✓</span>
                                    <span className="text-sm text-gray-300">Data verwijdering op verzoek</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                                    <span className="text-green-500">✓</span>
                                    <span className="text-sm text-gray-300">Europese dataopslag (NL)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Content */}
                    <div className="order-1 lg:order-2">
                        <span className="badge mb-6">Privacy & Compliance</span>
                        <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-6">
                            Veilig voor uw hotel,{' '}
                            <span className="text-gold-gradient">veilig voor uw gasten</span>
                        </h2>
                        <p className="text-gray-400 text-lg mb-8">
                            Wij begrijpen dat reputatie alles is in de hospitality. Daarom is privacy
                            ingebouwd in alles wat we doen — niet achteraf toegevoegd.
                        </p>

                        <div className="space-y-6">
                            {privacyPoints.map((point, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="p-2 rounded-lg bg-green-500/10 text-green-500 h-fit">
                                        {point.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">{point.title}</h4>
                                        <p className="text-sm text-gray-400">{point.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
