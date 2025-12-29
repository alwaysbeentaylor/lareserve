const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const db = require('../db/database');
const { v4: uuidv4 } = require('crypto');

// Configure multer for CSV uploads
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
        cb(null, `import-${timestamp}.csv`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Alleen CSV bestanden zijn toegestaan'), false);
        }
    }
});

// Generate simple batch ID
function generateBatchId() {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// POST /api/import/csv - Upload and parse Mews CSV
router.post('/csv', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Geen bestand geüpload' });
    }

    const results = [];
    const errors = [];
    const batchId = generateBatchId();

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

        // Map common Mews column names
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

        // Helper to find column value
        const findColumn = (row, columnKeys) => {
            for (const key of columnKeys) {
                if (row[key] !== undefined && row[key] !== '') {
                    return row[key];
                }
            }
            return null;
        };

        // Process each row
        const importedGuests = [];
        const insertGuest = db.prepare(`
      INSERT INTO guests (full_name, email, phone, country, company)
      VALUES (?, ?, ?, ?, ?)
    `);

        const insertReservation = db.prepare(`
      INSERT INTO reservations (guest_id, room_number, check_in_date, check_out_date, number_of_guests, import_batch_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

        const findGuestByEmail = db.prepare('SELECT id FROM guests WHERE email = ?');
        const findGuestByName = db.prepare('SELECT id FROM guests WHERE full_name = ?');
        const updateGuestStays = db.prepare(`
      UPDATE guests SET total_stays = total_stays + 1, last_stay = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

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

                // Check if guest already exists
                let guestId;
                let isReturning = false;

                if (email) {
                    const existing = findGuestByEmail.get(email);
                    if (existing) {
                        guestId = existing.id;
                        isReturning = true;
                        updateGuestStays.run(checkIn || new Date().toISOString().split('T')[0], guestId);
                    }
                }

                if (!guestId) {
                    // Check by name if no email match
                    const existingByName = findGuestByName.get(guestName);
                    if (existingByName) {
                        guestId = existingByName.id;
                        isReturning = true;
                        updateGuestStays.run(checkIn || new Date().toISOString().split('T')[0], guestId);
                    }
                }

                // Create new guest if not found
                if (!guestId) {
                    const result = insertGuest.run(guestName, email, phone, country, company);
                    guestId = result.lastInsertRowid;
                }

                // Create reservation
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

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            batchId,
            imported: importedGuests.length,
            errors: errors.length,
            guests: importedGuests,
            errorDetails: errors
        });

    } catch (error) {
        // Clean up file on error
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
        import_batch_id as batchId,
        COUNT(DISTINCT guest_id) as guestCount,
        MIN(imported_at) as importedAt,
        MIN(check_in_date) as earliestCheckIn,
        MAX(check_out_date) as latestCheckOut
      FROM reservations
      WHERE import_batch_id IS NOT NULL
      GROUP BY import_batch_id
      ORDER BY imported_at DESC
      LIMIT 50
    `).all();

        res.json(batches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
