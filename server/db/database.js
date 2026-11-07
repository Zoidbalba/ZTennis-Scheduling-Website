/**
 * Unified Database Module — Supports Supabase (PostgreSQL) & Local SQLite (sql.js)
 *
 * If DATABASE_URL or SUPABASE_DATABASE_URL is set in environment:
 *   - Connects to Supabase / PostgreSQL using `pg` (node-postgres)
 *   - Auto-creates tables and schemas
 *   - Auto-seeds initial coach profile, slots, and rates if empty
 *
 * If DATABASE_URL is NOT set:
 *   - Falls back gracefully to local SQLite (sql.js) persisted at server/db/tennis_coach.db
 *
 * Exports:
 *   getDb()  – lazily initialises and returns the unified database adapter instance
 *   saveDb() – persists SQLite to disk (safe no-op on PostgreSQL)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import initSqlJs from 'sql.js';

// Resolve directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'tennis_coach.db');

// Configure pg type parsing for decimals/counts
pg.types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val))); // NUMERIC / DECIMAL
pg.types.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10))); // BIGINT / COUNT(*)

/** Singleton adapter instance */
let adapterInstance = null;

/**
 * Persist SQLite to disk. Safe no-op on PostgreSQL.
 */
export function saveDb(database) {
  if (database && database.isSqlite && database.rawDb) {
    const data = database.rawDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

/**
 * Helper to convert `?` placeholders into `$1, $2, ...` for PostgreSQL.
 */
function convertPlaceholders(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

/**
 * Helper to convert sql.js result format into array of plain objects.
 */
function sqlJsResultToObjects(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

/**
 * PostgreSQL Database Adapter (Supabase)
 */
class PostgresAdapter {
  constructor(pool) {
    this.pool = pool;
    this.isPostgres = true;
    this.isSqlite = false;
  }

  async query(sql, params = []) {
    const pgSql = convertPlaceholders(sql);
    const result = await this.pool.query(pgSql, params);
    return result.rows;
  }

  async get(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  async run(sql, params = []) {
    let pgSql = convertPlaceholders(sql.trim());
    const isInsert = /^\s*INSERT\s+INTO/i.test(pgSql);
    const hasReturning = /RETURNING/i.test(pgSql);

    // Automatically append RETURNING id for INSERT queries if not already present
    if (isInsert && !hasReturning) {
      pgSql += ' RETURNING id';
    }

    const result = await this.pool.query(pgSql, params);
    const lastInsertRowid = result.rows && result.rows[0] ? result.rows[0].id : null;
    return {
      lastInsertRowid,
      changes: result.rowCount || 0,
      rows: result.rows,
    };
  }

  async exec(sql) {
    const result = await this.pool.query(sql);
    // Provide backwards compatibility if someone inspects columns/values
    if (Array.isArray(result)) {
      return result.map((r) => r.rows);
    }
    return result.rows || [];
  }

  // Backwards compatibility for code calling db.prepare(...)
  prepare(sql) {
    const pgSql = convertPlaceholders(sql);
    const pool = this.pool;
    return {
      bind(params) {
        this.params = params;
      },
      async step() {
        if (!this.executed) {
          const res = await pool.query(pgSql, this.params || []);
          this.rows = res.rows;
          this.index = 0;
          this.executed = true;
        }
        return this.index < this.rows.length;
      },
      get() {
        return Object.values(this.rows[this.index++]);
      },
      getColumnNames() {
        return this.rows[0] ? Object.keys(this.rows[0]) : [];
      },
      free() {},
    };
  }
}

/**
 * SQLite Database Adapter (sql.js)
 */
class SqliteAdapter {
  constructor(sqliteDb) {
    this.rawDb = sqliteDb;
    this.isPostgres = false;
    this.isSqlite = true;
  }

  async query(sql, params = []) {
    const stmt = this.rawDb.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    const rows = [];
    while (stmt.step()) {
      const cols = stmt.getColumnNames();
      const vals = stmt.get();
      const obj = {};
      cols.forEach((c, i) => {
        obj[c] = vals[i];
      });
      rows.push(obj);
    }
    stmt.free();
    return rows;
  }

  async get(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  async run(sql, params = []) {
    this.rawDb.run(sql, params);
    saveDb(this);

    let lastInsertRowid = null;
    try {
      const res = this.rawDb.exec('SELECT last_insert_rowid() AS id');
      if (res && res[0] && res[0].values && res[0].values[0]) {
        lastInsertRowid = res[0].values[0][0];
      }
    } catch (e) {}

    return {
      lastInsertRowid,
      changes: this.rawDb.getRowsModified ? this.rawDb.getRowsModified() : 1,
    };
  }

  async exec(sql) {
    return this.rawDb.exec(sql);
  }

  prepare(sql) {
    return this.rawDb.prepare(sql);
  }
}

/**
 * Initialize PostgreSQL Schema on Supabase
 */
async function initPostgresSchema(pool) {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS coach_profile (
        id SERIAL PRIMARY KEY,
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

      CREATE TABLE IF NOT EXISTS availability_slots (
        id SERIAL PRIMARY KEY,
        day_of_week INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        specific_date TEXT,
        is_blocked INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS rates (
        id SERIAL PRIMARY KEY,
        session_type TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        price NUMERIC NOT NULL,
        description TEXT DEFAULT '',
        is_package INTEGER DEFAULT 0,
        package_sessions INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        slot_id INTEGER REFERENCES availability_slots(id) ON DELETE SET NULL,
        session_type TEXT DEFAULT 'Individual Session',
        member_count INTEGER DEFAULT 1,
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
        sms_status TEXT DEFAULT '',
        sms_sent_at TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrations / column additions for existing PG databases
    const migrations = [
      "ALTER TABLE coach_profile ADD COLUMN IF NOT EXISTS facebook_link TEXT DEFAULT ''",
      "ALTER TABLE coach_profile ADD COLUMN IF NOT EXISTS instagram_link TEXT DEFAULT ''",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'Individual Session'",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 1",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS coach_notes TEXT DEFAULT ''",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS sms_status TEXT DEFAULT ''",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS sms_sent_at TEXT DEFAULT ''",
    ];

    for (const mig of migrations) {
      try {
        await client.query(mig);
      } catch (e) {
        // Safe to ignore if column exists
      }
    }
  } finally {
    client.release();
  }
}

/**
 * Initialize SQLite Schema locally
 */
async function initSqliteSchema(sqliteDb) {
  sqliteDb.run(`
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

    CREATE TABLE IF NOT EXISTS availability_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      specific_date TEXT,
      is_blocked INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_type TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      price REAL NOT NULL,
      description TEXT DEFAULT '',
      is_package INTEGER DEFAULT 0,
      package_sessions INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_id INTEGER,
      session_type TEXT DEFAULT 'Individual Session',
      member_count INTEGER DEFAULT 1,
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
      sms_status TEXT DEFAULT '',
      sms_sent_at TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (slot_id) REFERENCES availability_slots(id)
    );
  `);

  const migrations = [
    "ALTER TABLE coach_profile ADD COLUMN facebook_link TEXT DEFAULT ''",
    "ALTER TABLE coach_profile ADD COLUMN instagram_link TEXT DEFAULT ''",
    "ALTER TABLE bookings ADD COLUMN session_type TEXT DEFAULT 'Individual Session'",
    "ALTER TABLE bookings ADD COLUMN member_count INTEGER DEFAULT 1",
    "ALTER TABLE bookings ADD COLUMN coach_notes TEXT DEFAULT ''",
    "ALTER TABLE bookings ADD COLUMN sms_status TEXT DEFAULT ''",
    "ALTER TABLE bookings ADD COLUMN sms_sent_at TEXT DEFAULT ''",
  ];

  for (const mig of migrations) {
    try {
      sqliteDb.run(mig);
    } catch (e) {}
  }
}

/**
 * Lazily initialise the database adapter.
 *
 * Checks for DATABASE_URL or SUPABASE_DATABASE_URL:
 *   - If found: initializes Supabase / PostgreSQL pool and schema.
 *   - If absent: initializes SQLite (sql.js) and schema.
 *
 * Then auto-seeds default data if coach_profile is empty.
 *
 * @returns {Promise<PostgresAdapter|SqliteAdapter>}
 */
export async function getDb() {
  if (adapterInstance) return adapterInstance;

  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

  if (connectionString) {
    console.log('🔗 Connecting to Supabase / PostgreSQL database...');
    const pool = new pg.Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    });

    // Test connection
    try {
      const client = await pool.connect();
      console.log('✅ Connected to Supabase / PostgreSQL successfully.');
      client.release();
    } catch (connErr) {
      console.error('❌ Failed to connect to PostgreSQL / Supabase:', connErr.message);
      throw connErr;
    }

    await initPostgresSchema(pool);
    adapterInstance = new PostgresAdapter(pool);
  } else {
    console.log('📁 No DATABASE_URL found. Running with local SQLite (sql.js)...');
    const SQL = await initSqlJs();

    let sqliteDb;
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      sqliteDb = new SQL.Database(fileBuffer);
    } else {
      sqliteDb = new SQL.Database();
    }

    await initSqliteSchema(sqliteDb);
    adapterInstance = new SqliteAdapter(sqliteDb);
    saveDb(adapterInstance);
  }

  // Check if coach profile is empty (fresh database). If empty, auto-seed defaults.
  try {
    const coach = await adapterInstance.get('SELECT id FROM coach_profile LIMIT 1');
    if (!coach) {
      console.log('⚡ Initial deployment detected (database empty). Auto-seeding default data...');
      const { seedDatabase } = await import('./seed.js');
      await seedDatabase(adapterInstance);
    }
  } catch (err) {
    console.warn('Auto-seed check notice:', err.message);
  }

  return adapterInstance;
}
