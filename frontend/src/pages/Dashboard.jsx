import { useState, useEffect } from 'react';

function Dashboard({ onUpdate }) {
    const [stats, setStats] = useState({
        totalGuests: 0,
        vipGuests: 0,
        pendingResearch: 0,
        recentImports: 0
    });
    const [recentGuests, setRecentGuests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, guestsRes] = await Promise.all([
                fetch('/api/dashboard/stats'),
                fetch('/api/guests?limit=5')
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            if (guestsRes.ok) {
                const guestsData = await guestsRes.json();
                setRecentGuests(guestsData.guests || []);
            }
        } catch (error) {
            console.log('Backend nog niet beschikbaar');
        } finally {
            setLoading(false);
        }
    };

    const getVIPBadgeClass = (score) => {
        if (!score) return 'vip-badge low';
        if (score >= 8) return 'vip-badge high';
        if (score >= 5) return 'vip-badge medium';
        return 'vip-badge low';
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h2 className="font-heading text-3xl font-semibold">Dashboard</h2>
                <p className="text-[var(--color-text-secondary)] mt-2">
                    Overzicht van VIP gastonderzoek en statistieken
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalGuests}</div>
                    <div className="stat-label">Totaal Gasten</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.vipGuests}</div>
                    <div className="stat-label">VIP Gasten</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.pendingResearch}</div>
                    <div className="stat-label">Wacht op Onderzoek</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.recentImports}</div>
                    <div className="stat-label">Recent Geïmporteerd</div>
                </div>
            </div>

            {/* Recent Guests */}
            <div className="card">
                <div className="p-6 border-b border-[var(--color-border)]">
                    <h3 className="font-heading text-xl font-semibold">Recente Gasten</h3>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-[var(--color-text-secondary)]">
                        Laden...
                    </div>
                ) : recentGuests.length > 0 ? (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Naam</th>
                                <th>Bedrijf</th>
                                <th>Land</th>
                                <th>VIP Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentGuests.map((guest) => (
                                <tr key={guest.id} className="clickable">
                                    <td className="font-medium">{guest.full_name}</td>
                                    <td className="text-[var(--color-text-secondary)]">
                                        {guest.company || guest.research_company || '-'}
                                    </td>
                                    <td className="text-[var(--color-text-secondary)]">
                                        {guest.country || '-'}
                                    </td>
                                    <td>
                                        {guest.vip_score ? (
                                            <span className={getVIPBadgeClass(guest.vip_score)}>
                                                {guest.vip_score}/10
                                            </span>
                                        ) : (
                                            <span className="text-[var(--color-text-secondary)] text-sm">
                                                Niet onderzocht
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center">
                        <p className="text-[var(--color-text-secondary)]">
                            Nog geen gasten geïmporteerd
                        </p>
                        <a
                            href="/import"
                            className="btn btn-primary mt-4 inline-flex"
                        >
                            Gasten Importeren
                        </a>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <a href="/import" className="card p-6 hover:border-[var(--color-accent-gold)] transition-colors block">
                    <div className="text-2xl mb-3">📋</div>
                    <h4 className="font-semibold mb-2">CSV Importeren</h4>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Upload een Mews export om nieuwe gasten toe te voegen
                    </p>
                </a>
                <a href="/guests" className="card p-6 hover:border-[var(--color-accent-gold)] transition-colors block">
                    <div className="text-2xl mb-3">👤</div>
                    <h4 className="font-semibold mb-2">Gast Toevoegen</h4>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Handmatig een nieuwe gast registreren
                    </p>
                </a>
                <div className="card p-6 hover:border-[var(--color-accent-gold)] transition-colors cursor-pointer">
                    <div className="text-2xl mb-3">📄</div>
                    <h4 className="font-semibold mb-2">Dagrapport</h4>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Download PDF overzicht van vandaag
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
