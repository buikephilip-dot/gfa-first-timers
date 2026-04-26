require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-to-a-random-32-character-string';

// ─── Database ────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS first_timers (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT,
        gender TEXT,
        age_range TEXT,
        marital_status TEXT,
        occupation TEXT,
        how_you_heard TEXT NOT NULL,
        is_first_time TEXT NOT NULL,
        want_contact TEXT NOT NULL,
        contact_method TEXT,
        prayer_request TEXT,
        want_department TEXT,
        departments TEXT,
        service TEXT NOT NULL,
        date_of_visit TEXT NOT NULL,
        follow_up_status TEXT DEFAULT 'Pending',
        follow_up_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create default admin if not exists
    const { rows } = await client.query(
      `SELECT id FROM admin_users WHERE username = $1`,
      ['admin']
    );
    if (rows.length === 0) {
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
      const hashed = await bcrypt.hash(adminPassword, 10);
      await client.query(
        `INSERT INTO admin_users (username, password, email, role) VALUES ($1, $2, $3, $4)`,
        ['admin', hashed, 'admin@gfa.local', 'admin']
      );
      console.log('Default admin user created');
    }

    console.log('Database initialised');
  } finally {
    client.release();
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Auth middleware
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  try {
    req.admin = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── Public Routes ────────────────────────────────────────────────────────────

// Submit first timer form
app.post('/api/submit-first-timer', async (req, res) => {
  const {
    full_name, phone, email, address, gender, age_range,
    marital_status, occupation, how_you_heard, is_first_time,
    want_contact, contact_method, prayer_request, want_department,
    departments, service, date_of_visit,
  } = req.body;

  if (!full_name || !phone || !how_you_heard || !is_first_time || !want_contact || !service || !date_of_visit) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  const departmentsStr = Array.isArray(departments) ? departments.join(', ') : (departments || '');

  try {
    const { rows } = await pool.query(
      `INSERT INTO first_timers
        (full_name, phone, email, address, gender, age_range, marital_status, occupation,
         how_you_heard, is_first_time, want_contact, contact_method, prayer_request,
         want_department, departments, service, date_of_visit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [full_name, phone, email, address, gender, age_range, marital_status, occupation,
       how_you_heard, is_first_time, want_contact, contact_method, prayer_request,
       want_department, departmentsStr, service, date_of_visit]
    );
    res.status(201).json({ success: true, id: rows[0].id });
  } catch (err) {
    console.error('Submit error:', err.message);
    res.status(500).json({ error: 'Failed to save. Please try again.' });
  }
});

// QR code data (returns the public URL for generating a QR)
app.get('/api/qr-code-data', (req, res) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  res.json({ url: baseUrl });
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// Login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT * FROM admin_users WHERE username = $1`,
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: rows[0].id, username: rows[0].username, role: rows[0].role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, username: rows[0].username, role: rows[0].role });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get all first timers (with optional filters)
app.get('/api/admin/first-timers', requireAuth, async (req, res) => {
  const { status, search, limit = 50, offset = 0 } = req.query;
  let query = `SELECT * FROM first_timers WHERE 1=1`;
  const params = [];

  if (status) {
    params.push(status);
    query += ` AND follow_up_status = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    query += ` AND (full_name ILIKE $${params.length} OR phone ILIKE $${params.length} OR email ILIKE $${params.length})`;
  }

  query += ` ORDER BY created_at DESC`;
  params.push(limit);
  query += ` LIMIT $${params.length}`;
  params.push(offset);
  query += ` OFFSET $${params.length}`;

  try {
    const { rows } = await pool.query(query, params);
    const count = await pool.query(`SELECT COUNT(*) FROM first_timers`);
    res.json({ data: rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get single first timer
app.get('/api/admin/first-timers/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM first_timers WHERE id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Update first timer (follow-up status & notes)
app.patch('/api/admin/first-timers/:id', requireAuth, async (req, res) => {
  const { follow_up_status, follow_up_notes } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE first_timers
       SET follow_up_status = COALESCE($1, follow_up_status),
           follow_up_notes  = COALESCE($2, follow_up_notes),
           updated_at       = NOW()
       WHERE id = $3
       RETURNING *`,
      [follow_up_status, follow_up_notes, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Analytics
app.get('/api/admin/analytics', requireAuth, async (req, res) => {
  try {
    const [total, byStatus, bySource, byService, recent] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM first_timers`),
      pool.query(`SELECT follow_up_status, COUNT(*) as count FROM first_timers GROUP BY follow_up_status`),
      pool.query(`SELECT how_you_heard, COUNT(*) as count FROM first_timers GROUP BY how_you_heard ORDER BY count DESC`),
      pool.query(`SELECT service, COUNT(*) as count FROM first_timers GROUP BY service ORDER BY count DESC`),
      pool.query(`SELECT COUNT(*) FROM first_timers WHERE created_at >= NOW() - INTERVAL '7 days'`),
    ]);
    res.json({
      total: parseInt(total.rows[0].count),
      recentWeek: parseInt(recent.rows[0].count),
      byStatus: byStatus.rows,
      bySource: bySource.rows,
      byService: byService.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Export CSV
app.get('/api/admin/export-csv', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM first_timers ORDER BY created_at DESC`);
    const headers = [
      'id','full_name','phone','email','address','gender','age_range','marital_status',
      'occupation','how_you_heard','is_first_time','want_contact','contact_method',
      'prayer_request','want_department','departments','service','date_of_visit',
      'follow_up_status','follow_up_notes','created_at'
    ];
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => escape(r[h])).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="first-timers.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Fallback → index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialise database:', err.message);
    process.exit(1);
  });
