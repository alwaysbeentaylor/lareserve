import { useState, useEffect } from 'react';
import GuestModal from '../components/guests/GuestModal';
import AddGuestForm from '../components/guests/AddGuestForm';

function Guests({ onUpdate }) {
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all, vip, pending
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchGuests();
    }, [search, filter]);

    const fetchGuests = async () => {
        setLoading(true);
        try {
            let url = `/api/guests?limit=50`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (filter === 'vip') url += `&vipOnly=true`;
            if (filter === 'pending') url += `&hasResearch=false`;

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setGuests(data.guests || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.log('Fout bij ophalen gasten');
        } finally {
            setLoading(false);
        }
    };

    const handleResearch = async (guestId) => {
        try {
            const response = await fetch(`/api/research/${guestId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                fetchGuests();
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            console.error('Research mislukt:', error);
        }
    };

    const handleDownloadPDF = async (guestId, guestName) => {
        try {
            const response = await fetch(`/api/reports/${guestId}/pdf`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gastrapport-${guestName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('PDF download mislukt:', error);
        }
    };

    const handleGuestClick = async (guest) => {
        try {
            const response = await fetch(`/api/guests/${guest.id}`);
            if (response.ok) {
                const fullGuest = await response.json();
                setSelectedGuest(fullGuest);
            }
        } catch (error) {
            console.error('Fout bij ophalen gastdetails:', error);
        }
    };

    const getVIPBadgeClass = (score) => {
        if (!score) return '';
        if (score >= 8) return 'vip-badge high';
        if (score >= 5) return 'vip-badge medium';
        return 'vip-badge low';
    };

    const handleGuestUpdated = () => {
        fetchGuests();
        setSelectedGuest(null);
        if (onUpdate) onUpdate();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="font-heading text-3xl font-semibold">Gasten</h2>
                    <p className="text-[var(--color-text-secondary)] mt-1">
                        {total} gasten gevonden
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="btn btn-primary"
                >
                    <span>+</span>
                    Gast Toevoegen
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Zoek op naam, email of bedrijf..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        Alle
                    </button>
                    <button
                        onClick={() => setFilter('vip')}
                        className={`btn ${filter === 'vip' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        ★ VIP
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        Niet onderzocht
                    </button>
                </div>
            </div>

            {/* Guest Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-[var(--color-text-secondary)]">
                        Laden...
                    </div>
                ) : guests.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Naam</th>
                                    <th>Functie</th>
                                    <th>Bedrijf</th>
                                    <th>Land</th>
                                    <th>Net Worth</th>
                                    <th>VIP Score</th>
                                    <th>Acties</th>
                                </tr>
                            </thead>
                            <tbody>
                                {guests.map((guest) => (
                                    <tr
                                        key={guest.id}
                                        className="clickable"
                                        onClick={() => handleGuestClick(guest)}
                                    >
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <div className="font-medium">{guest.full_name}</div>
                                                    {guest.email && (
                                                        <div className="text-xs text-[var(--color-text-secondary)]">
                                                            {guest.email}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                    {guest.linkedin_url && (
                                                        <a href={guest.linkedin_url} target="_blank" rel="noopener noreferrer"
                                                            className="social-icon" title="LinkedIn">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                                            </svg>
                                                        </a>
                                                    )}
                                                    {guest.instagram_url && (
                                                        <a href={guest.instagram_url} target="_blank" rel="noopener noreferrer"
                                                            className="social-icon" title="Instagram">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                                            </svg>
                                                        </a>
                                                    )}
                                                    {guest.twitter_url && (
                                                        <a href={guest.twitter_url} target="_blank" rel="noopener noreferrer"
                                                            className="social-icon" title="Twitter/X">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                                            </svg>
                                                        </a>
                                                    )}
                                                    {guest.facebook_url && (
                                                        <a href={guest.facebook_url} target="_blank" rel="noopener noreferrer"
                                                            className="social-icon" title="Facebook">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                                                            </svg>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-[var(--color-text-secondary)]">
                                            {guest.job_title || '-'}
                                        </td>
                                        <td className="text-[var(--color-text-secondary)]">
                                            {guest.research_company || guest.company || '-'}
                                        </td>
                                        <td className="text-[var(--color-text-secondary)]">
                                            {guest.country || '-'}
                                        </td>
                                        <td>
                                            {guest.net_worth ? (
                                                <span className="text-sm font-medium text-[var(--color-accent-gold)]">
                                                    {guest.net_worth}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-[var(--color-text-secondary)]">-</span>
                                            )}
                                        </td>
                                        <td>
                                            {guest.vip_score ? (
                                                <span className={getVIPBadgeClass(guest.vip_score)}>
                                                    {guest.vip_score}/10
                                                </span>
                                            ) : (
                                                <span className="text-xs text-[var(--color-text-secondary)]">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <div className="flex gap-2">
                                                {!guest.researched_at && (
                                                    <button
                                                        onClick={() => handleResearch(guest.id)}
                                                        className="btn btn-ghost text-xs px-3 py-1"
                                                    >
                                                        🔍 Onderzoek
                                                    </button>
                                                )}
                                                {guest.vip_score && (
                                                    <button
                                                        onClick={() => handleDownloadPDF(guest.id, guest.full_name)}
                                                        className="btn btn-ghost text-xs px-3 py-1"
                                                    >
                                                        📄 PDF
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <p className="text-[var(--color-text-secondary)]">
                            {search || filter !== 'all'
                                ? 'Geen gasten gevonden met deze filters'
                                : 'Nog geen gasten geregistreerd'}
                        </p>
                    </div>
                )}
            </div>

            {/* Guest Modal */}
            {selectedGuest && (
                <GuestModal
                    guest={selectedGuest}
                    onClose={() => setSelectedGuest(null)}
                    onUpdate={handleGuestUpdated}
                    onResearch={handleResearch}
                    onDownloadPDF={handleDownloadPDF}
                />
            )}

            {/* Add Guest Form */}
            {showAddForm && (
                <AddGuestForm
                    onClose={() => setShowAddForm(false)}
                    onSuccess={handleGuestUpdated}
                />
            )}
        </div>
    );
}

export default Guests;
