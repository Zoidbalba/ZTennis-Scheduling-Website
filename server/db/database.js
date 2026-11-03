/**
 * Database Module — sql.js (pure-JS SQLite) wrapper
 *
 * Exports:
 *   getDb()  – lazily initialises and returns the SQL.js Database instance
 *   saveDb() – persists the in-memory database to disk
 *
 * The database file is stored at server/db/tennis_coach.db.
 * On first run the file is created and the schema is applied.
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Absolute path to the SQLite database file */
const dbPath = path.join(__dirname, 'tennis_coach.db');

/** Singleton database instance (set after first initialisation) */
let db = null;

/**
 * Persist the current in-memory database to disk.
 * Call this after every write operation (INSERT / UPDATE / DELETE).
 *
 * @param {import('sql.js').Database} database – the sql.js Database instance
 */
export function saveDb(database) {
  const data = database.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

/**
 * Lazily initialise the database.
 *
 * - If tennis_coach.db already exists on disk it is loaded into memory.
 * - Otherwise a new, empty database is created and the schema is applied.
 *
 * Subsequent calls return the same singleton instance.
 *
 * @returns {Promise<import('sql.js').Database>} the sql.js Database instance
 */
export async function getDb() {
  if (db) return db;

  // Initialise the sql.js engine (loads the WASM binary)
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    // Load existing database from disk
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    // Create a brand-new database
    db = new SQL.Database();
  }

  // Ensure all tables exist (safe to run on every startup)
  db.run(`
    CREATE TABLE IF NOT EXISTS coach_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      photo_url TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      experience TEXT DEFAULT '',
      specialties TEXT DEFAULT '',
      location TEXT DEFAULT '',
      court_details TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      messenger_link TEXT DEFAULT '',
      facebook_link TEXT DEFAULT '',
      instagram_link TEXT DEFAULT '',
      viber_link TEXT DEFAULT '',
      password_hash TEXT NOT NULL
    );
  `);

  // Migrations for existing database
  try {
    db.run("ALTER TABLE coach_profile ADD COLUMN facebook_link TEXT DEFAULT ''");
  } catch (e) {}
  try {
    db.run("ALTER TABLE coach_profile ADD COLUMN instagram_link TEXT DEFAULT ''");
  } catch (e) {}
  try {
    db.run("ALTER TABLE bookings ADD COLUMN coach_notes TEXT DEFAULT ''");
  } catch (e) {}
  try {
    db.run("ALTER TABLE bookings ADD COLUMN sms_status TEXT DEFAULT ''");
  } catch (e) {}
  try {
    db.run("ALTER TABLE bookings ADD COLUMN sms_sent_at TEXT DEFAULT ''");
  } catch (e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS availability_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      specific_date TEXT,
      is_blocked INTEGER DEFAULT 0
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_type TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      price REAL NOT NULL,
      description TEXT DEFAULT '',
      is_package INTEGER DEFAULT 0,
      package_sessions INTEGER DEFAULT 1
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_id INTEGER,
      player_name TEXT NOT NULL,
      player_contact TEXT NOT NULL,
      player_email TEXT DEFAULT '',
      skill_level TEXT DEFAULT '',
      message TEXT DEFAULT '',
      coach_notes TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      booking_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (slot_id) REFERENCES availability_slots(id)
    );
  `);

  // Persist the freshly-created schema (no-op if loaded from file)
  saveDb(db);

  // If coach_profile is empty (e.g. freshly deployed database), auto-seed defaults
  try {
    const check = db.exec('SELECT COUNT(*) as count FROM coach_profile');
    const count = (check && check[0] && check[0].values[0][0]) || 0;
    if (count === 0) {
      console.log('⚡ Initial deployment detected (database empty). Auto-seeding default data...');
      const { seedDatabase } = await import('./seed.js');
      await seedDatabase(db);
    }
  } catch (err) {
    console.warn('Auto-seed check skipped:', err.message);
  }

  return db;
}
