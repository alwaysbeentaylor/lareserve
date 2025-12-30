const express = require('express');
const router = express.Router();
const db = require('../db/database');
const pdfGenerator = require('../services/pdfGenerator');

// GET /api/reports/daily/pdf - Generate daily report for all guests arriving today (or all researched guests)
router.get('/daily/pdf', async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        let guests;
        let reportTitle;

        if (date === 'all') {
            // Get all guests with research results
            guests = db.prepare(`
              SELECT DISTINCT g.*, r.vip_score, r.job_title, r.company_name as research_company,
                     r.linkedin_url, r.influence_level, r.notable_info, r.full_report,
                     NULL as room_number, NULL as check_in_date, NULL as check_out_date
              FROM guests g
              INNER JOIN research_results r ON r.guest_id = g.id
              ORDER BY r.vip_score DESC NULLS LAST, g.full_name
            `).all();
            reportTitle = 'alle-gasten';
        } else {
            // Get guests arriving on specific date
            guests = db.prepare(`
              SELECT DISTINCT g.*, r.vip_score, r.job_title, r.company_name as research_company,
                     r.linkedin_url, r.influence_level, r.notable_info, r.full_report,
                     res.room_number, res.check_in_date, res.check_out_date
              FROM guests g
              INNER JOIN reservations res ON res.guest_id = g.id
              LEFT JOIN research_results r ON r.guest_id = g.id
              WHERE res.check_in_date = ?
              ORDER BY r.vip_score DESC NULLS LAST, g.full_name
            `).all(targetDate);
            reportTitle = targetDate;
        }

        if (guests.length === 0) {
            return res.status(404).json({ error: date === 'all' ? 'Geen onderzochte gasten gevonden' : 'Geen gasten gevonden voor deze datum' });
        }

        const pdfBuffer = await pdfGenerator.generateDailyReport(guests, reportTitle);

        const filename = `dagrapport-${reportTitle}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Daily PDF generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/reports/selected/pdf - Generate PDF for selected guests
router.post('/selected/pdf', async (req, res) => {
    try {
        const { guestIds } = req.body;

        if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
            return res.status(400).json({ error: 'Geen gasten geselecteerd' });
        }

        const placeholders = guestIds.map(() => '?').join(',');
        const guests = db.prepare(`
            SELECT DISTINCT g.*, r.vip_score, r.job_title, r.company_name as research_company,
                   r.linkedin_url, r.influence_level, r.notable_info, r.full_report
            FROM guests g
            LEFT JOIN research_results r ON r.guest_id = g.id
            WHERE g.id IN (${placeholders})
            ORDER BY r.vip_score DESC NULLS LAST, g.full_name
        `).all(...guestIds);

        if (guests.length === 0) {
            return res.status(404).json({ error: 'Geen gasten gevonden voor deze selectie' });
        }

        const pdfBuffer = await pdfGenerator.generateBulkReport(guests, 'Handmatige Selectie');

        const filename = `geselecteerde-gasten-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Selected PDF generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reports/bulk/:batchId/pdf - Generate bulk PDF for import batch
router.get('/bulk/:batchId/pdf', async (req, res) => {
    try {
        const { batchId } = req.params;

        // Get all guests from this batch
        const guests = db.prepare(`
      SELECT DISTINCT g.*, r.vip_score, r.job_title, r.company_name as research_company,
             r.linkedin_url, r.influence_level, r.notable_info, r.full_report
      FROM guests g
      INNER JOIN reservations res ON res.guest_id = g.id
      LEFT JOIN research_results r ON r.guest_id = g.id
      WHERE res.import_batch_id = ?
      ORDER BY r.vip_score DESC NULLS LAST, g.full_name
    `).all(batchId);

        if (guests.length === 0) {
            return res.status(404).json({ error: 'Geen gasten gevonden in deze batch' });
        }

        const pdfBuffer = await pdfGenerator.generateBulkReport(guests, batchId);

        const filename = `dagrapport-${batchId}-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Bulk PDF generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reports/:guestId/pdf - Generate PDF for single guest
router.get('/:guestId/pdf', async (req, res) => {
    try {
        const { guestId } = req.params;

        const guest = db.prepare('SELECT * FROM guests WHERE id = ?').get(guestId);
        if (!guest) {
            return res.status(404).json({ error: 'Gast niet gevonden' });
        }

        const research = db.prepare('SELECT * FROM research_results WHERE guest_id = ?').get(guestId);
        const reservations = db.prepare(`
      SELECT * FROM reservations WHERE guest_id = ? ORDER BY check_in_date DESC LIMIT 5
    `).all(guestId);
        const suggestions = db.prepare(`
      SELECT * FROM deal_suggestions WHERE guest_id = ? ORDER BY generated_at DESC
    `).all(guestId);

        const pdfBuffer = await pdfGenerator.generateGuestReport({
            guest,
            research,
            reservations,
            suggestions
        });

        const filename = `guest-report-${guest.full_name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reports/stats - Get report statistics
router.get('/stats', (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const stats = {
            arrivingToday: db.prepare(`
        SELECT COUNT(DISTINCT guest_id) as count FROM reservations WHERE check_in_date = ?
      `).get(today).count,

            vipsToday: db.prepare(`
        SELECT COUNT(DISTINCT g.id) as count 
        FROM guests g
        INNER JOIN reservations res ON res.guest_id = g.id
        INNER JOIN research_results r ON r.guest_id = g.id
        WHERE res.check_in_date = ? AND r.vip_score >= 7
      `).get(today).count,

            pendingResearch: db.prepare(`
        SELECT COUNT(*) as count 
        FROM guests g
        INNER JOIN reservations res ON res.guest_id = g.id
        WHERE res.check_in_date = ? 
        AND NOT EXISTS (SELECT 1 FROM research_results r WHERE r.guest_id = g.id)
      `).get(today).count,

            totalReports: db.prepare('SELECT COUNT(*) as count FROM research_results').get().count
        };

        res.json(stats);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
