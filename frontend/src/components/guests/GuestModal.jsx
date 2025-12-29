import { useState } from 'react';

function GuestModal({ guest, onClose, onUpdate, onResearch, onDownloadPDF }) {
    const [vipScore, setVipScore] = useState(guest.research?.vip_score || 5);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        full_name: guest.full_name,
        email: guest.email || '',
        phone: guest.phone || '',
        country: guest.country || '',
        company: guest.company || '',
        notes: guest.notes || ''
    });
    const [saving, setSaving] = useState(false);
    const [researching, setResearching] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleVipScoreChange = async (newScore) => {
        setVipScore(newScore);
        try {
            await fetch(`/api/guests/${guest.id}/vip-score`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vip_score: newScore })
            });
        } catch (error) {
            console.error('VIP score update mislukt:', error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/guests/${guest.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });

            if (response.ok) {
                setIsEditing(false);
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            console.error('Opslaan mislukt:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleResearch = async () => {
        setResearching(true);
        try {
            await onResearch(guest.id);
            if (onUpdate) onUpdate();
        } finally {
            setResearching(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const response = await fetch(`/api/guests/${guest.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                if (onUpdate) onUpdate();
                onClose();
            } else {
                console.error('Verwijderen mislukt');
            }
        } catch (error) {
            console.error('Verwijderen mislukt:', error);
        } finally {
            setDeleting(false);
        }
    };

    const getInfluenceLevel = (score) => {
        if (score >= 9) return 'VIP';
        if (score >= 7) return 'Hoog';
        if (score >= 5) return 'Gemiddeld';
        return 'Laag';
    };

    const research = guest.research;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-[var(--color-border)]">
                    <div className="flex items-start justify-between">
                        <div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editData.full_name}
                                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                                    className="input text-xl font-heading font-semibold"
                                />
                            ) : (
                                <h2 className="font-heading text-2xl font-semibold">{guest.full_name}</h2>
                            )}
                            {research?.job_title && (
                                <p className="text-[var(--color-text-secondary)] mt-1">
                                    {research.job_title}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-2xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* VIP Score */}
                <div className="p-6 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-sm text-[var(--color-text-secondary)] uppercase tracking-wide">
                                VIP Score
                            </span>
                            <div className="vip-score-display mt-2">
                                <span className="vip-score-number">{vipScore}</span>
                                <span className="vip-score-label">/10<br />{getInfluenceLevel(vipScore)}</span>
                            </div>
                        </div>
                        <div className="flex-1 max-w-xs ml-8">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={vipScore}
                                onChange={(e) => handleVipScoreChange(parseInt(e.target.value))}
                                className="slider w-full"
                            />
                            <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mt-1">
                                <span>1</span>
                                <span>5</span>
                                <span>10</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="p-6 grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide block mb-1">
                            E-mail
                        </span>
                        {isEditing ? (
                            <input
                                type="email"
                                value={editData.email}
                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                className="input"
                            />
                        ) : (
                            <span className="text-sm">{guest.email || '-'}</span>
                        )}
                    </div>
                    <div>
                        <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide block mb-1">
                            Telefoon
                        </span>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={editData.phone}
                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                className="input"
                            />
                        ) : (
                            <span className="text-sm">{guest.phone || '-'}</span>
                        )}
                    </div>
                    <div>
                        <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide block mb-1">
                            Land
                        </span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editData.country}
                                onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                                className="input"
                            />
                        ) : (
                            <span className="text-sm">{guest.country || '-'}</span>
                        )}
                    </div>
                    <div>
                        <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide block mb-1">
                            Bedrijf
                        </span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editData.company}
                                onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                                className="input"
                            />
                        ) : (
                            <span className="text-sm">{research?.company_name || guest.company || '-'}</span>
                        )}
                    </div>
                    <div>
                        <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide block mb-1">
                            Totaal Verblijven
                        </span>
                        <span className="text-sm">{guest.total_stays || 1}x</span>
                    </div>
                    <div>
                        <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide block mb-1">
                            Eerste Bezoek
                        </span>
                        <span className="text-sm">{guest.first_seen || '-'}</span>
                    </div>
                </div>

                {/* Research Results */}
                {research && (
                    <div className="p-6 border-t border-[var(--color-border)]">
                        <h4 className="font-semibold text-sm text-[var(--color-accent-gold)] uppercase tracking-wide mb-4">
                            Onderzoeksresultaten
                        </h4>

                        {/* Financial Info */}
                        {(research.net_worth || research.followers_estimate) && (
                            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg">
                                {research.net_worth && (
                                    <div>
                                        <span className="text-xs text-[var(--color-text-secondary)] uppercase">Net Worth</span>
                                        <div className="text-lg font-semibold text-[var(--color-accent-gold)]">{research.net_worth}</div>
                                    </div>
                                )}
                                {research.followers_estimate && (
                                    <div>
                                        <span className="text-xs text-[var(--color-text-secondary)] uppercase">Volgers</span>
                                        <div className="text-lg font-semibold">{research.followers_estimate}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Social Media Links */}
                        <div className="flex flex-wrap gap-3 mb-4">
                            {research.linkedin_url && (
                                <a href={research.linkedin_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-[#0077B5] text-white rounded-lg text-sm hover:opacity-90">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                    </svg>
                                    LinkedIn
                                </a>
                            )}
                            {research.instagram_url && (
                                <a href={research.instagram_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white rounded-lg text-sm hover:opacity-90">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                    Instagram
                                </a>
                            )}
                            {research.twitter_url && (
                                <a href={research.twitter_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded-lg text-sm hover:opacity-90">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    X / Twitter
                                </a>
                            )}
                            {research.facebook_url && (
                                <a href={research.facebook_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-[#1877F2] text-white rounded-lg text-sm hover:opacity-90">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                                    </svg>
                                    Facebook
                                </a>
                            )}
                            {research.youtube_url && (
                                <a href={research.youtube_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-[#FF0000] text-white rounded-lg text-sm hover:opacity-90">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                    </svg>
                                    YouTube
                                </a>
                            )}
                            {research.website_url && (
                                <a href={research.website_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-[var(--color-accent-gold)] text-white rounded-lg text-sm hover:opacity-90">
                                    🌐 Website
                                </a>
                            )}
                        </div>

                        <div className="space-y-3">
                            {research.industry && (
                                <div className="flex items-start gap-2">
                                    <span className="text-sm">🏢</span>
                                    <span className="text-sm">{research.industry}</span>
                                </div>
                            )}
                            {research.notable_info && (
                                <div className="mt-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg border-l-4 border-[var(--color-accent-gold)]">
                                    <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide block mb-2">
                                        Opmerkelijke Info
                                    </span>
                                    <p className="text-sm">{research.notable_info}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {(isEditing || guest.notes) && (
                    <div className="p-6 border-t border-[var(--color-border)]">
                        <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide block mb-2">
                            Notities
                        </span>
                        {isEditing ? (
                            <textarea
                                value={editData.notes}
                                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                className="input min-h-[80px]"
                                placeholder="Voeg notities toe..."
                            />
                        ) : (
                            <p className="text-sm">{guest.notes}</p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="p-6 border-t border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg-secondary)]">
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="btn btn-primary"
                                >
                                    {saving ? 'Opslaan...' : 'Opslaan'}
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="btn btn-secondary"
                                >
                                    Annuleren
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn btn-secondary"
                                >
                                    ✏️ Bewerken
                                </button>
                                {showDeleteConfirm ? (
                                    <div className="flex gap-2 items-center">
                                        <span className="text-sm text-red-600">Weet je het zeker?</span>
                                        <button
                                            onClick={handleDelete}
                                            disabled={deleting}
                                            className="btn text-white px-3 py-1 text-sm"
                                            style={{ backgroundColor: '#dc2626' }}
                                        >
                                            {deleting ? 'Bezig...' : 'Ja, verwijder'}
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="btn btn-secondary px-3 py-1 text-sm"
                                        >
                                            Nee
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="btn btn-secondary"
                                        style={{ color: '#dc2626' }}
                                    >
                                        🗑️ Verwijderen
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {!research && (
                            <button
                                onClick={handleResearch}
                                disabled={researching}
                                className="btn btn-secondary"
                            >
                                {researching ? '🔍 Zoeken...' : '🔍 Onderzoek Starten'}
                            </button>
                        )}
                        <button
                            onClick={() => onDownloadPDF(guest.id, guest.full_name)}
                            className="btn btn-primary"
                        >
                            📄 PDF Downloaden
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GuestModal;
