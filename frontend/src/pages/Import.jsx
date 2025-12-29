import { useState, useCallback } from 'react';
import AddGuestForm from '../components/guests/AddGuestForm';

function Import({ onUpdate }) {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.endsWith('.csv')) {
            setFile(droppedFile);
            setError(null);
        } else {
            setError('Alleen CSV bestanden zijn toegestaan');
        }
    }, []);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/import/csv', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
                setFile(null);
                if (onUpdate) onUpdate();
            } else {
                setError(data.error || 'Import mislukt');
            }
        } catch (err) {
            setError('Verbinding met server mislukt');
        } finally {
            setImporting(false);
        }
    };

    const handleGuestAdded = () => {
        setShowAddForm(false);
        if (onUpdate) onUpdate();
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-heading text-3xl font-semibold">Importeren</h2>
                    <p className="text-[var(--color-text-secondary)] mt-2">
                        Upload een CSV of voeg handmatig gasten toe
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

            {/* Upload Zone */}
            <div
                className={`upload-zone ${dragging ? 'dragging' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
            >
                <input
                    type="file"
                    id="file-input"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {file ? (
                    <div className="space-y-2">
                        <div className="text-4xl">📄</div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            {(file.size / 1024).toFixed(1)} KB
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="text-4xl">📋</div>
                        <p className="font-medium">Sleep een CSV bestand hierheen</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            of klik om te selecteren
                        </p>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Import Button */}
            {file && (
                <div className="flex justify-center">
                    <button
                        onClick={handleImport}
                        disabled={importing}
                        className="btn btn-primary px-8"
                    >
                        {importing ? 'Importeren...' : 'CSV Importeren'}
                    </button>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="card">
                    <div className="p-6 border-b border-[var(--color-border)] bg-green-50">
                        <h3 className="font-heading text-xl font-semibold text-green-800">
                            ✓ Import Succesvol
                        </h3>
                        <p className="text-green-700 mt-1">
                            {result.imported} gasten geïmporteerd
                            {result.errors > 0 && ` (${result.errors} fouten)`}
                        </p>
                    </div>

                    {result.guests && result.guests.length > 0 && (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Naam</th>
                                    <th>Email</th>
                                    <th>Land</th>
                                    <th>Check-in</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.guests.slice(0, 20).map((guest, index) => (
                                    <tr key={index}>
                                        <td className="font-medium">{guest.full_name}</td>
                                        <td className="text-[var(--color-text-secondary)]">
                                            {guest.email || '-'}
                                        </td>
                                        <td className="text-[var(--color-text-secondary)]">
                                            {guest.country || '-'}
                                        </td>
                                        <td className="text-[var(--color-text-secondary)]">
                                            {guest.check_in || '-'}
                                        </td>
                                        <td>
                                            {guest.is_returning ? (
                                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                    Returning
                                                </span>
                                            ) : (
                                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                                    Nieuw
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    <div className="p-4 border-t border-[var(--color-border)] flex justify-between items-center">
                        <span className="text-sm text-[var(--color-text-secondary)]">
                            Batch ID: {result.batchId}
                        </span>
                        <button
                            onClick={() => setResult(null)}
                            className="btn btn-secondary"
                        >
                            Nieuwe Import
                        </button>
                    </div>
                </div>
            )}

            {/* CSV Format Help */}
            <div className="card p-6">
                <h4 className="font-semibold mb-4">Ondersteunde CSV Kolommen</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="font-medium">Naam:</span>
                        <span className="text-[var(--color-text-secondary)] ml-2">
                            guest_name, name, naam
                        </span>
                    </div>
                    <div>
                        <span className="font-medium">Email:</span>
                        <span className="text-[var(--color-text-secondary)] ml-2">
                            email, e-mail
                        </span>
                    </div>
                    <div>
                        <span className="font-medium">Land:</span>
                        <span className="text-[var(--color-text-secondary)] ml-2">
                            country, land
                        </span>
                    </div>
                    <div>
                        <span className="font-medium">Bedrijf:</span>
                        <span className="text-[var(--color-text-secondary)] ml-2">
                            company, bedrijf
                        </span>
                    </div>
                </div>
            </div>

            {/* Add Guest Modal */}
            {showAddForm && (
                <AddGuestForm
                    onClose={() => setShowAddForm(false)}
                    onSuccess={handleGuestAdded}
                />
            )}
        </div>
    );
}

export default Import;
