const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const db = require('../db/database');
const XLSX = require('xlsx');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `import-${timestamp}${ext}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.csv', '.xlsx', '.xls', '.xlxs', '.xlsm'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Alleen CSV en Excel bestanden zijn toegestaan'), false);
        }
    }
});

// Generate simple batch ID
function generateBatchId() {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Convert Excel serial date to JS Date
function excelDateToJSDate(serial) {
    if (!serial || typeof serial !== 'number') return null;
    // Excel dates start from 1900-01-01, but Excel incorrectly counts 1900 as leap year
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);

    // Handle time portion
    const fractional_day = serial - Math.floor(serial);
    const total_seconds = Math.floor(86400 * fractional_day);
    const hours = Math.floor(total_seconds / 3600);
    const minutes = Math.floor((total_seconds % 3600) / 60);

    return new Date(
        date_info.getFullYear(),
        date_info.getMonth(),
        date_info.getDate(),
        hours,
        minutes
    );
}

// Format date for storage
function formatDate(date) {
    if (!date) return null;
    if (date instanceof Date) {
        return date.toISOString().split('T')[0];
    }
    return date;
}

// Normalize guest name for matching
function normalizeGuestName(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')  // Multiple spaces to single
        .replace(/[^\w\s]/g, ''); // Remove special chars
}

// Fuzzy name match (simple implementation)
function fuzzyNameMatch(name1, name2) {
    const n1 = normalizeGuestName(name1);
    const n2 = normalizeGuestName(name2);

    if (n1 === n2) return true;

    // Check if all parts of shorter name are in longer name
    const parts1 = n1.split(' ');
    const parts2 = n2.split(' ');
    const shorter = parts1.length < parts2.length ? parts1 : parts2;
    const longer = parts1.length < parts2.length ? parts2 : parts1;

    return shorter.every(part => longer.some(p => p.includes(part) || part.includes(p)));
}

// Track field changes for guest history
function trackFieldChanges(guestId, existingGuest, newData, batchId) {
    const trackFields = ['email', 'phone', 'country', 'company', 'address'];
    const insertHistory = db.prepare(`
        INSERT INTO guest_history (guest_id, field_name, old_value, new_value, import_batch_id)
        VALUES (?, ?, ?, ?, ?)
    `);

    for (const field of trackFields) {
        const oldVal = existingGuest[field] || null;
        const newVal = newData[field] || null;

        if (newVal && newVal !== oldVal) {
            insertHistory.run(guestId, field, oldVal, newVal, batchId);
        }
    }
}

// Parse Excel file and return structured data
function parseExcelFile(filePath) {
    const workbook = XLSX.readFile(filePath);

    // Look for 'Reserveringen' sheet or use first sheet
    const sheetName = workbook.SheetNames.includes('Reserveringen')
        ? 'Reserveringen'
        : workbook.SheetNames[0];

    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rawData.length < 2) {
        return { headers: [], data: [], sheetName };
    }

    // Find the header row by looking for 'Voornaam' or 'Achternaam' or 'Nummer'
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
        const row = rawData[i];
        const rowStr = row.map(cell => String(cell).toLowerCase()).join(' ');
        if (rowStr.includes('voornaam') || rowStr.includes('achternaam') ||
            (rowStr.includes('nummer') && rowStr.includes('groepsnaam'))) {
            headerRowIndex = i;
            break;
        }
    }

    // Default to row 1 if not found (common for Mews exports)
    if (headerRowIndex === -1) {
        headerRowIndex = 0;
    }

    const headers = rawData[headerRowIndex].map(h => String(h).trim());
    const data = rawData.slice(headerRowIndex + 1).filter(row =>
        row.some(cell => cell !== '' && cell !== null && cell !== undefined)
    );

    // Filter out "Totaal" rows and rows that look like headers repeated
    const filteredData = data.filter(row => {
        const firstCell = String(row[0] || '').toLowerCase();
        const secondCell = String(row[1] || '').toLowerCase();
        // Skip totaal rows and header-like rows
        return firstCell !== 'totaal' &&
            firstCell !== '' &&
            firstCell !== 'nummer' &&
            secondCell !== 'groepsnaam';
    });

    console.log(`📊 Excel parsed: ${sheetName}, headers at row ${headerRowIndex + 1}, ${filteredData.length} data rows`);

    return { headers, data: filteredData, sheetName };
}

// Map Excel row to guest/reservation data
function mapExcelRow(row, headers) {
    const get = (names) => {
        for (const name of names) {
            const idx = headers.findIndex(h =>
                h.toLowerCase().includes(name.toLowerCase())
            );
            if (idx !== -1 && row[idx] !== undefined && row[idx] !== '') {
                return row[idx];
            }
        }
        return null;
    };

    const firstName = get(['Voornaam']) || '';
    const lastName = get(['Achternaam']) || '';
    const fullName = `${firstName} ${lastName}`.trim();

    const arrivalSerial = get(['Aankomst']);
    const departureSerial = get(['Vertrek']);

    return {
        // Guest data
        fullName,
        firstName,
        lastName,
        email: get(['E-mail', 'Email']),
        phone: get(['Telefoon', 'Phone']),
        country: get(['Nationaliteit', 'Land', 'Country']),
        company: get(['Bedrijf', 'Company']),
        address: get(['Adres', 'Address']),
        marketingConsent: get(['Verstuur marketing', 'Marketing']) === 'Ja',

        // Reservation data
        reservationId: get(['Nummer', 'Number', 'ID']),
        roomNumber: get(['Ruimtenummer', 'Room number', 'Kamer']),
        roomCategory: get(['Ruimtecategorie', 'Aangevraagde categorie', 'Room category']),
        checkIn: typeof arrivalSerial === 'number' ? excelDateToJSDate(arrivalSerial) : arrivalSerial,
        checkOut: typeof departureSerial === 'number' ? excelDateToJSDate(departureSerial) : departureSerial,
        numberOfGuests: parseInt(get(['Aantal personen', 'Persons'])) || null,
        totalAmount: parseFloat(get(['Totaal bedrag', 'Total'])) || null,
        products: get(['Producten', 'Products']),
        status: get(['Status', 'Booking status']),
        notes: get(['Opmerkingen', 'Notes']),
        guestNotes: get(['Opmerkingen van gast', 'Guest notes'])
    };
}

// POST /api/import/excel/preview - Preview Excel import
router.post('/excel/preview', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Geen bestand geüpload' });
    }

    try {
        const { headers, data, sheetName } = parseExcelFile(req.file.path);

        if (data.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Geen data gevonden in Excel bestand' });
        }

        // Check existing guests
        const findGuestByEmail = db.prepare('SELECT id, full_name FROM guests WHERE email = ?');
        const findGuestByName = db.prepare('SELECT id, full_name FROM guests WHERE full_name = ?');

        let newGuests = 0;
        let existingGuests = 0;
        let skipped = 0;
        const warnings = [];
        const sampleGuests = [];

        for (let i = 0; i < data.length; i++) {
            const mapped = mapExcelRow(data[i], headers);

            if (!mapped.fullName || mapped.fullName.trim() === '') {
                skipped++;
                if (warnings.length < 5) {
                    warnings.push(`Rij ${i + 2}: Geen naam gevonden`);
                }
                continue;
            }

            // Check if exists
            let exists = false;
            if (mapped.email) {
                const byEmail = findGuestByEmail.get(mapped.email);
                exists = !!byEmail;
            }
            if (!exists) {
                const byName = findGuestByName.get(mapped.fullName);
                exists = !!byName;
            }

            if (exists) {
                existingGuests++;
            } else {
                newGuests++;
            }

            // Collect all guests for preview
            sampleGuests.push({
                index: i,
                fullName: mapped.fullName,
                email: mapped.email,
                country: mapped.country,
                roomCategory: mapped.roomCategory,
                checkIn: formatDate(mapped.checkIn),
                totalAmount: mapped.totalAmount,
                isNew: !exists
            });
        }

        // Clean up
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            filename: req.file.originalname,
            sheetName,
            totalRows: data.length,
            newGuests,
            existingGuests,
            skipped,
            warnings,
            sampleGuests
        });

    } catch (error) {
        console.error('Excel preview error:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
});

// POST /api/import/excel - Full Excel import
router.post('/excel', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Geen bestand geüpload' });
    }

    const batchId = generateBatchId();
    const autoEnrich = req.body.autoEnrich === 'true' || req.body.autoEnrich === true;
    const rawIndices = req.body.selectedIndices || req.body['selectedIndices[]'];
    const selectedIndices = Array.isArray(rawIndices)
        ? rawIndices.map(Number)
        : (rawIndices ? [Number(rawIndices)] : null);

    try {
        const { headers, data } = parseExcelFile(req.file.path);

        if (data.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Geen data gevonden' });
        }

        // Prepare statements
        const findGuestByEmail = db.prepare('SELECT * FROM guests WHERE email = ?');
        const findGuestByName = db.prepare('SELECT * FROM guests WHERE full_name = ?');

        const insertGuest = db.prepare(`
            INSERT INTO guests (full_name, email, phone, country, company, address, marketing_consent, import_batch_id, first_seen, last_stay)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const updateGuest = db.prepare(`
            UPDATE guests SET 
                email = COALESCE(?, email),
                phone = COALESCE(?, phone),
                country = COALESCE(?, country),
                company = COALESCE(?, company),
                address = COALESCE(?, address),
                last_stay = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        const incrementStays = db.prepare('UPDATE guests SET total_stays = total_stays + 1 WHERE id = ?');

        const insertReservation = db.prepare(`
            INSERT INTO reservations (
                guest_id, mews_reservation_id, room_number, room_category,
                check_in_date, check_out_date, number_of_guests,
                total_amount, products, booking_status, import_batch_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertBatch = db.prepare(`
            INSERT INTO import_batches (id, filename, total_rows, new_guests, updated_guests, skipped_rows)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        let newGuests = 0;
        let updatedGuests = 0;
        let skipped = 0;
        const importedGuests = [];
        const newGuestIds = [];
        const errors = [];

        // Process in transaction
        const processImport = db.transaction(() => {
            for (let i = 0; i < data.length; i++) {
                try {
                    const mapped = mapExcelRow(data[i], headers);

                    if (!mapped.fullName || mapped.fullName.trim() === '') {
                        skipped++;
                        continue;
                    }

                    // Filter by selected indices if provided
                    if (selectedIndices && !selectedIndices.includes(i)) {
                        skipped++;
                        continue;
                    }

                    let guestId = null;
                    let existingGuest = null;
                    let isNew = false;

                    // Try to find existing guest
                    if (mapped.email) {
                        existingGuest = findGuestByEmail.get(mapped.email);
                    }
                    if (!existingGuest) {
                        existingGuest = findGuestByName.get(mapped.fullName);
                    }

                    const checkInDate = formatDate(mapped.checkIn);

                    if (existingGuest) {
                        guestId = existingGuest.id;

                        // Track changes before updating
                        trackFieldChanges(guestId, existingGuest, mapped, batchId);

                        // Only increment stays if this is a new visit (different date than last stay)
                        // This handles multiple rooms for the same guest on the same day
                        if (existingGuest.last_stay !== checkInDate) {
                            incrementStays.run(guestId);
                        }

                        // Update guest metadata and last_stay
                        updateGuest.run(
                            mapped.email,
                            mapped.phone,
                            mapped.country,
                            mapped.company,
                            mapped.address,
                            checkInDate,
                            guestId
                        );
                        updatedGuests++;
                    } else {
                        // Create new guest
                        const result = insertGuest.run(
                            mapped.fullName,
                            mapped.email,
                            mapped.phone,
                            mapped.country,
                            mapped.company,
                            mapped.address,
                            mapped.marketingConsent ? 1 : 0,
                            batchId,
                            checkInDate, // first_seen
                            checkInDate  // last_stay
                        );
                        guestId = result.lastInsertRowid;
                        newGuests++;
                        isNew = true;
                        newGuestIds.push(guestId);
                    }

                    // Create reservation
                    insertReservation.run(
                        guestId,
                        mapped.reservationId,
                        mapped.roomNumber,
                        mapped.roomCategory,
                        checkInDate,
                        formatDate(mapped.checkOut),
                        mapped.numberOfGuests,
                        mapped.totalAmount,
                        mapped.products,
                        mapped.status,
                        batchId
                    );

                    importedGuests.push({
                        id: guestId,
                        full_name: mapped.fullName,
                        email: mapped.email,
                        country: mapped.country,
                        room_category: mapped.roomCategory,
                        check_in: checkInDate,
                        total_amount: mapped.totalAmount,
                        is_new: isNew
                    });

                } catch (rowError) {
                    errors.push({ row: i + 2, error: rowError.message });
                    skipped++;
                }
            }

            // Save batch info
            insertBatch.run(batchId, req.file.originalname, data.length, newGuests, updatedGuests, skipped);
        });

        processImport();

        // Clean up
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            batchId,
            totalRows: data.length,
            newGuests,
            updatedGuests,
            skipped,
            errors: errors.length,
            errorDetails: errors,
            guests: importedGuests.slice(0, 50),
            newGuestIds: autoEnrich ? newGuestIds : []
        });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
});

// POST /api/import/csv - Upload and parse CSV (keep existing functionality)
router.post('/csv', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Geen bestand geüpload' });
    }

    const results = [];
    const errors = [];
    const batchId = generateBatchId();
    const autoEnrich = req.body.autoEnrich === 'true' || req.body.autoEnrich === true;
    const newGuestIds = [];

    try {
        // Parse CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv({
                    mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_')
                }))
                .on('data', (row) => {
                    results.push(row);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Map common column names
        const columnMappings = {
            'guest_name': ['guest_name', 'name', 'gast_naam', 'naam', 'customer_name', 'guest'],
            'email': ['email', 'e-mail', 'e_mail', 'guest_email', 'customer_email'],
            'phone': ['phone', 'telefoon', 'telephone', 'mobile', 'mobiel', 'guest_phone'],
            'country': ['country', 'land', 'nationality', 'nationaliteit'],
            'company': ['company', 'bedrijf', 'company_name', 'organization'],
            'room_number': ['room', 'room_number', 'kamer', 'kamernummer'],
            'check_in': ['check_in', 'check-in', 'arrival', 'aankomst', 'arrival_date', 'check_in_date'],
            'check_out': ['check_out', 'check-out', 'departure', 'vertrek', 'departure_date', 'check_out_date'],
            'guests_count': ['guests', 'number_of_guests', 'aantal_gasten', 'pax', 'persons']
        };

        const findColumn = (row, columnKeys) => {
            for (const key of columnKeys) {
                if (row[key] !== undefined && row[key] !== '') {
                    return row[key];
                }
            }
            return null;
        };

        const importedGuests = [];
        const insertGuest = db.prepare(`
            INSERT INTO guests (full_name, email, phone, country, company, import_batch_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const insertReservation = db.prepare(`
            INSERT INTO reservations (guest_id, room_number, check_in_date, check_out_date, number_of_guests, import_batch_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const findGuestByEmail = db.prepare('SELECT * FROM guests WHERE email = ?');
        const findGuestByName = db.prepare('SELECT * FROM guests WHERE full_name = ?');

        const updateGuestMetadata = db.prepare(`
            UPDATE guests SET 
                email = COALESCE(?, email),
                phone = COALESCE(?, phone),
                country = COALESCE(?, country),
                company = COALESCE(?, company),
                last_stay = ?, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `);

        const incrementStays = db.prepare('UPDATE guests SET total_stays = total_stays + 1 WHERE id = ?');

        const insertBatch = db.prepare(`
            INSERT INTO import_batches (id, filename, total_rows, new_guests, updated_guests)
            VALUES (?, ?, ?, ?, ?)
        `);

        let newCount = 0;
        let updatedCount = 0;

        for (let i = 0; i < results.length; i++) {
            const row = results[i];

            try {
                const guestName = findColumn(row, columnMappings.guest_name);

                if (!guestName) {
                    errors.push({ row: i + 2, error: 'Geen gastnaam gevonden' });
                    continue;
                }

                const email = findColumn(row, columnMappings.email);
                const phone = findColumn(row, columnMappings.phone);
                const country = findColumn(row, columnMappings.country);
                const company = findColumn(row, columnMappings.company);
                const roomNumber = findColumn(row, columnMappings.room_number);
                const checkIn = findColumn(row, columnMappings.check_in);
                const checkOut = findColumn(row, columnMappings.check_out);
                const guestsCount = findColumn(row, columnMappings.guests_count);

                let guestId;
                let isReturning = false;

                if (email) {
                    const existing = findGuestByEmail.get(email);
                    if (existing) {
                        guestId = existing.id;
                        isReturning = true;
                        const stayDate = checkIn || new Date().toISOString().split('T')[0];

                        // Only increment if new stay date
                        if (existing.last_stay !== stayDate) {
                            incrementStays.run(guestId);
                        }

                        updateGuestMetadata.run(email, phone, country, company, stayDate, guestId);
                        updatedCount++;
                    }
                }

                if (!guestId) {
                    const existingByName = findGuestByName.get(guestName);
                    if (existingByName) {
                        guestId = existingByName.id;
                        isReturning = true;
                        const stayDate = checkIn || new Date().toISOString().split('T')[0];

                        // Only increment if new stay date
                        if (existingByName.last_stay !== stayDate) {
                            incrementStays.run(guestId);
                        }

                        updateGuestMetadata.run(email, phone, country, company, stayDate, guestId);
                        updatedCount++;
                    }
                }

                if (!guestId) {
                    const result = insertGuest.run(guestName, email, phone, country, company, batchId);
                    guestId = result.lastInsertRowid;

                    // Set both first_seen and last_stay for new guest
                    const stayDate = checkIn || new Date().toISOString().split('T')[0];
                    db.prepare('UPDATE guests SET first_seen = ?, last_stay = ? WHERE id = ?').run(stayDate, stayDate, guestId);

                    newCount++;
                    newGuestIds.push(guestId);
                }

                insertReservation.run(
                    guestId,
                    roomNumber,
                    checkIn,
                    checkOut,
                    guestsCount ? parseInt(guestsCount) : null,
                    batchId
                );

                importedGuests.push({
                    id: guestId,
                    full_name: guestName,
                    email,
                    country,
                    company,
                    room_number: roomNumber,
                    check_in: checkIn,
                    check_out: checkOut,
                    is_returning: isReturning
                });

            } catch (rowError) {
                errors.push({ row: i + 2, error: rowError.message });
            }
        }

        // Save batch
        insertBatch.run(batchId, req.file.originalname, results.length, newCount, updatedCount);

        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            batchId,
            imported: importedGuests.length,
            errors: errors.length,
            guests: importedGuests,
            errorDetails: errors,
            newGuestIds: autoEnrich ? newGuestIds : []
        });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
});

// GET /api/import/batches - Get all import batches
router.get('/batches', (req, res) => {
    try {
        const batches = db.prepare(`
            SELECT 
                id,
                filename,
                imported_at as importedAt,
                total_rows as totalRows,
                new_guests as newGuests,
                updated_guests as updatedGuests,
                skipped_rows as skippedRows,
                status
            FROM import_batches
            ORDER BY imported_at DESC
            LIMIT 50
        `).all();

        res.json(batches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/import/batches/:id - Get batch details with guests
router.get('/batches/:id', (req, res) => {
    try {
        const batch = db.prepare(`
            SELECT * FROM import_batches WHERE id = ?
        `).get(req.params.id);

        if (!batch) {
            return res.status(404).json({ error: 'Batch niet gevonden' });
        }

        const guests = db.prepare(`
            SELECT g.*, r.check_in_date, r.check_out_date, r.room_category, r.total_amount
            FROM guests g
            LEFT JOIN reservations r ON r.guest_id = g.id AND r.import_batch_id = ?
            WHERE g.import_batch_id = ? OR r.import_batch_id = ?
            GROUP BY g.id
            ORDER BY g.full_name
        `).all(req.params.id, req.params.id, req.params.id);

        res.json({ batch, guests });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/import/batches/:id - Delete batch and all associated data
router.delete('/batches/:id', (req, res) => {
    try {
        const batchId = req.params.id;

        // Get guest IDs from this batch
        const guestIds = db.prepare(`
            SELECT DISTINCT g.id FROM guests g
            LEFT JOIN reservations r ON r.guest_id = g.id
            WHERE g.import_batch_id = ? OR r.import_batch_id = ?
        `).all(batchId, batchId).map(g => g.id);

        const deleteBatch = db.transaction(() => {
            // Delete reservations from this batch
            db.prepare('DELETE FROM reservations WHERE import_batch_id = ?').run(batchId);

            // Delete guests that were created in this batch AND have no other reservations
            db.prepare(`
                DELETE FROM guests 
                WHERE import_batch_id = ? 
                AND id NOT IN (SELECT DISTINCT guest_id FROM reservations WHERE guest_id IS NOT NULL)
            `).run(batchId);

            // Delete history for this batch
            db.prepare('DELETE FROM guest_history WHERE import_batch_id = ?').run(batchId);

            // Delete the batch
            db.prepare('DELETE FROM import_batches WHERE id = ?').run(batchId);
        });

        deleteBatch();

        res.json({ success: true, deletedGuestIds: guestIds });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/import/history/:guestId - Get guest change history
router.get('/history/:guestId', (req, res) => {
    try {
        const history = db.prepare(`
            SELECT 
                gh.*,
                ib.filename as batch_filename
            FROM guest_history gh
            LEFT JOIN import_batches ib ON ib.id = gh.import_batch_id
            WHERE gh.guest_id = ?
            ORDER BY gh.changed_at DESC
        `).all(req.params.guestId);

        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/import/reservations/debug - Debug endpoint to check reservation data
router.get('/reservations/debug', (req, res) => {
    try {
        const reservations = db.prepare(`
            SELECT 
                r.id,
                r.guest_id,
                g.full_name,
                r.check_in_date,
                r.check_out_date,
                r.room_number,
                r.import_batch_id
            FROM reservations r
            JOIN guests g ON g.id = r.guest_id
            ORDER BY r.created_at DESC
            LIMIT 20
        `).all();

        const today = new Date().toISOString().split('T')[0];

        res.json({
            today,
            reservations,
            message: `Looking for check_in_date = '${today}'`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;


