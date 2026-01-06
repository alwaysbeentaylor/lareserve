const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');

// Helper: Generate anonymous visitor hash from IP
function getVisitorHash(req) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    // Create anonymous hash (cannot be reversed to IP)
    return crypto.createHash('sha256').update(ip + userAgent.substring(0, 50)).digest('hex').substring(0, 16);
}

// Track a page view
router.post('/pageview', (req, res) => {
    try {
        const visitorHash = getVisitorHash(req);
        const { page_path, referrer } = req.body;
        const userAgent = req.headers['user-agent'] || '';

        const stmt = db.prepare(`
      INSERT INTO page_views (visitor_hash, page_path, referrer, user_agent)
      VALUES (?, ?, ?, ?)
    `);

        stmt.run(visitorHash, page_path || '/', referrer || null, userAgent);

        res.json({ success: true });
    } catch (error) {
        console.error('Error tracking pageview:', error);
        res.status(500).json({ error: error.message });
    }
});

// Track an event (CTA click, form submit, etc.)
router.post('/event', (req, res) => {
    try {
        const visitorHash = getVisitorHash(req);
        const { event_type, event_data, page_path } = req.body;

        const stmt = db.prepare(`
      INSERT INTO analytics_events (visitor_hash, event_type, event_data, page_path)
      VALUES (?, ?, ?, ?)
    `);

        stmt.run(
            visitorHash,
            event_type || 'unknown',
            event_data ? JSON.stringify(event_data) : null,
            page_path || '/'
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error tracking event:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get dashboard stats
router.get('/stats', (req, res) => {
    try {
        // Total page views
        const totalViews = db.prepare('SELECT COUNT(*) as count FROM page_views').get().count;

        // Unique visitors (based on visitor_hash)
        const uniqueVisitors = db.prepare('SELECT COUNT(DISTINCT visitor_hash) as count FROM page_views').get().count;

        // Views today
        const viewsToday = db.prepare(`
      SELECT COUNT(*) as count FROM page_views 
      WHERE DATE(visited_at) = DATE('now')
    `).get().count;

        // Unique visitors today
        const visitorsToday = db.prepare(`
      SELECT COUNT(DISTINCT visitor_hash) as count FROM page_views 
      WHERE DATE(visited_at) = DATE('now')
    `).get().count;

        // Views this week
        const viewsThisWeek = db.prepare(`
      SELECT COUNT(*) as count FROM page_views 
      WHERE visited_at >= datetime('now', '-7 days')
    `).get().count;

        // Unique visitors this week
        const visitorsThisWeek = db.prepare(`
      SELECT COUNT(DISTINCT visitor_hash) as count FROM page_views 
      WHERE visited_at >= datetime('now', '-7 days')
    `).get().count;

        // Views last 30 days by day (for chart)
        const viewsByDay = db.prepare(`
      SELECT DATE(visited_at) as date, 
             COUNT(*) as views,
             COUNT(DISTINCT visitor_hash) as visitors
      FROM page_views 
      WHERE visited_at >= datetime('now', '-30 days')
      GROUP BY DATE(visited_at)
      ORDER BY date ASC
    `).all();

        // Top pages
        const topPages = db.prepare(`
      SELECT page_path, COUNT(*) as views, COUNT(DISTINCT visitor_hash) as visitors
      FROM page_views
      GROUP BY page_path
      ORDER BY views DESC
      LIMIT 10
    `).all();

        // Event counts by type
        const eventsByType = db.prepare(`
      SELECT event_type, COUNT(*) as count
      FROM analytics_events
      WHERE occurred_at >= datetime('now', '-30 days')
      GROUP BY event_type
      ORDER BY count DESC
    `).all();

        // Form submissions (contact form events)
        const formSubmissions = db.prepare(`
      SELECT COUNT(*) as count FROM analytics_events 
      WHERE event_type = 'form_submit'
    `).get().count;

        // CTA clicks
        const ctaClicks = db.prepare(`
      SELECT COUNT(*) as count FROM analytics_events 
      WHERE event_type = 'cta_click'
    `).get().count;

        // Recent visitors (last 10)
        const recentVisitors = db.prepare(`
      SELECT visitor_hash, page_path, referrer, visited_at
      FROM page_views
      ORDER BY visited_at DESC
      LIMIT 10
    `).all();

        // Top referrers
        const topReferrers = db.prepare(`
      SELECT referrer, COUNT(*) as count
      FROM page_views
      WHERE referrer IS NOT NULL AND referrer != ''
      GROUP BY referrer
      ORDER BY count DESC
      LIMIT 10
    `).all();

        res.json({
            overview: {
                totalViews,
                uniqueVisitors,
                viewsToday,
                visitorsToday,
                viewsThisWeek,
                visitorsThisWeek,
                formSubmissions,
                ctaClicks
            },
            viewsByDay,
            topPages,
            eventsByType,
            recentVisitors,
            topReferrers,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting analytics stats:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
