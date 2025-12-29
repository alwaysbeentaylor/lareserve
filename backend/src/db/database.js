const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  -- Guests table
  CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    full_name TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    company TEXT,
    first_seen DATE DEFAULT CURRENT_DATE,
    last_stay DATE,
    total_stays INTEGER DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Create index on email for faster lookups (not unique - email can be null)
  CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
  CREATE INDEX IF NOT EXISTS idx_guests_name ON guests(full_name);

  -- Research results table
  CREATE TABLE IF NOT EXISTS research_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
    profile_photo_url TEXT,
    job_title TEXT,
    company_name TEXT,
    company_size TEXT,
    industry TEXT,
    linkedin_url TEXT,
    linkedin_connections INTEGER,
    instagram_handle TEXT,
    instagram_followers INTEGER,
    twitter_handle TEXT,
    twitter_followers INTEGER,
    website_url TEXT,
    notable_info TEXT,
    press_mentions TEXT,
    vip_score INTEGER DEFAULT 5 CHECK(vip_score BETWEEN 1 AND 10),
    influence_level TEXT CHECK(influence_level IN ('Laag', 'Gemiddeld', 'Hoog', 'VIP')),
    raw_search_results TEXT,
    researched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_research_guest ON research_results(guest_id);

  -- Deal suggestions table (for future AI integration)
  CREATE TABLE IF NOT EXISTS deal_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
    suggestion_type TEXT,
    suggestion_text TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Reservations table (links to Mews data)
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
    mews_reservation_id TEXT,
    room_number TEXT,
    check_in_date DATE,
    check_out_date DATE,
    number_of_guests INTEGER,
    import_batch_id TEXT,
    imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_reservations_guest ON reservations(guest_id);
  CREATE INDEX IF NOT EXISTS idx_reservations_batch ON reservations(import_batch_id);
`);

console.log('📦 Database geïnitialiseerd:', dbPath);

module.exports = db;
