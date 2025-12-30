const db = require('./src/db/database');
const r = db.prepare('SELECT guest_id, profile_photo_url, full_name FROM research_results r JOIN guests g ON r.guest_id = g.id').all();
console.log(JSON.stringify(r, null, 2));
