require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Routes
const importRoutes = require('./routes/import');
const guestRoutes = require('./routes/guests');
const researchRoutes = require('./routes/research');
const reportRoutes = require('./routes/reports');

// Database
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/import', importRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const stats = {
      totalGuests: db.prepare('SELECT COUNT(*) as count FROM guests').get().count,
      vipGuests: db.prepare('SELECT COUNT(*) as count FROM research_results WHERE vip_score >= 7').get().count,
      pendingResearch: db.prepare(`
        SELECT COUNT(*) as count FROM guests g 
        WHERE NOT EXISTS (SELECT 1 FROM research_results r WHERE r.guest_id = g.id)
      `).get().count,
      recentImports: db.prepare(`
        SELECT COUNT(DISTINCT guest_id) as count FROM reservations 
        WHERE imported_at >= datetime('now', '-7 days')
      `).get().count
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Er is iets misgegaan!' });
});

app.listen(PORT, () => {
  console.log(`🏨 VIP Research Tool server draait op http://localhost:${PORT}`);
});

module.exports = app;
