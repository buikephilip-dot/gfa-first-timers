const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'firstTimers.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS first_timers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      gender TEXT,
      date_of_birth TEXT,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.get(`SELECT * FROM admin_users WHERE username = ?`, ['admin'], (err, row) => {
    if (err) {
      console.error('Error checking admin user:', err.message);
      return;
    }

    if (!row) {
      const bcrypt = require('bcrypt');
      const hashedPassword = bcrypt.hashSync('Admin@123', 10);

      db.run(
        `INSERT INTO admin_users (username, password, email, role) VALUES (?, ?, ?, ?)`,
        ['admin', hashedPassword, 'admin@gfa.local', 'admin'],
        (insertErr) => {
          if (insertErr) {
            console.error('Error creating default admin:', insertErr.message);
          } else {
            console.log('Default admin user created');
          }
        }
      );
    }
  });
});
