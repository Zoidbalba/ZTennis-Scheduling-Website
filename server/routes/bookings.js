/**
 * Bookings Routes — /api/bookings
 *
 * POST   /              — public: creates a booking request (status: pending)
 * GET    /              — auth:   returns all bookings, newest first
 * PUT    /:id/status    — auth:   updates booking status (confirmed / declined)
 */

import { Router } from 'express';
import { getDb, saveDb } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * Helper: convert sql.js result set to an array of plain objects.
 */
function rowsToObjects(result) {
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
 * POST /api/bookings
 *
 * Creates a new booking request (public — no auth required).
 * Body: { slot_id?, player_name, player_contact, player_email?, skill_level?,
 *         message?, booking_date, start_time, end_time }
 */
router.post('/', async (req, res) => {
  try {
    const {
      slot_id,
      player_name,
      player_contact,
      player_email,
      skill_level,
      message,
      booking_date,
      start_time,
      end_time,
    } = req.body;

    // Validate required fields
    if (!player_name || !player_contact || !booking_date || !start_time || !end_time) {
      return res.status(400).json({
        error: 'player_name, player_contact, booking_date, start_time, and end_time are required.',
      });
    }

    const db = await getDb();

    db.run(
      `INSERT INTO bookings
         (slot_id, player_name, player_contact, player_email,
          skill_level, message, status, booking_date, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        slot_id || null,
        player_name,
        player_contact,
        player_email || '',
        skill_level || '',
        message || '',
        booking_date,
        start_time,
        end_time,
      ]
    );

    saveDb(db);

    // Retrieve the newly created booking
    const stmt = db.prepare('SELECT * FROM bookings WHERE id = last_insert_rowid()');
    let booking = null;
    if (stmt.step()) {
      const columns = stmt.getColumnNames();
      const row = stmt.get();
      booking = {};
      columns.forEach((col, i) => {
        booking[col] = row[i];
      });
    }
    stmt.free();

    res.status(201).json({ message: 'Booking request submitted', booking });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/bookings
 *
 * Returns all bookings ordered by booking_date DESC, start_time DESC.
 * Requires authentication.
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT * FROM bookings ORDER BY booking_date DESC, start_time DESC, created_at DESC');
    res.json(rowsToObjects(result));
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/bookings/trainees
 *
 * Returns aggregated trainee profiles based on bookings.
 * Requires authentication.
 */
router.get('/trainees', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT * FROM bookings ORDER BY booking_date DESC, start_time DESC');
    const allBookings = rowsToObjects(result);

    // Group bookings by trainee (using lowercased player_name + player_contact as key)
    const traineesMap = new Map();

    for (const b of allBookings) {
      const key = `${(b.player_name || '').trim().toLowerCase()}_${(b.player_contact || '').trim()}`;
      if (!traineesMap.has(key)) {
        traineesMap.set(key, {
          id: b.id,
          name: b.player_name,
          contact: b.player_contact,
          email: b.player_email || '',
          skill_level: b.skill_level || 'Beginner',
          coach_notes: b.coach_notes || '',
          total_sessions: 0,
          confirmed_sessions: 0,
          pending_sessions: 0,
          last_session_date: b.booking_date,
          sessions: [],
        });
      }

      const trainee = traineesMap.get(key);
      trainee.total_sessions += 1;
      if (b.status === 'confirmed' || b.status === 'completed') {
        trainee.confirmed_sessions += 1;
      } else if (b.status === 'pending') {
        trainee.pending_sessions += 1;
      }
      if (b.coach_notes && !trainee.coach_notes) {
        trainee.coach_notes = b.coach_notes;
      }
      trainee.sessions.push(b);
    }

    const trainees = Array.from(traineesMap.values());
    res.json(trainees);
  } catch (err) {
    console.error('Get trainees error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/bookings/:id/status
 *
 * Updates a booking's status ('confirmed', 'declined', 'pending', 'completed').
 * Requires authentication.
 */
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'confirmed', 'declined', 'completed'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Status must be one of: ' + allowedStatuses.join(', '),
      });
    }

    const db = await getDb();

    db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, Number(id)]);
    saveDb(db);

    const stmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
    stmt.bind([Number(id)]);
    let booking = null;
    if (stmt.step()) {
      const columns = stmt.getColumnNames();
      const row = stmt.get();
      booking = {};
      columns.forEach((col, i) => {
        booking[col] = row[i];
      });
    }
    stmt.free();

    res.json({ message: `Booking status updated to ${status}`, booking });
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/bookings/:id
 *
 * Updates booking details (booking_date, start_time, end_time, coach_notes, status).
 * Requires authentication.
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { booking_date, start_time, end_time, coach_notes, status } = req.body;

    const db = await getDb();

    // Fetch existing
    const checkStmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
    checkStmt.bind([Number(id)]);
    if (!checkStmt.step()) {
      checkStmt.free();
      return res.status(404).json({ error: 'Booking not found' });
    }
    const current = {};
    checkStmt.getColumnNames().forEach((col, i) => {
      current[col] = checkStmt.get()[i];
    });
    checkStmt.free();

    const newDate = booking_date !== undefined ? booking_date : current.booking_date;
    const newStart = start_time !== undefined ? start_time : current.start_time;
    const newEnd = end_time !== undefined ? end_time : current.end_time;
    const newNotes = coach_notes !== undefined ? coach_notes : current.coach_notes;
    const newStatus = status !== undefined ? status : current.status;

    db.run(
      'UPDATE bookings SET booking_date = ?, start_time = ?, end_time = ?, coach_notes = ?, status = ? WHERE id = ?',
      [newDate, newStart, newEnd, newNotes, newStatus, Number(id)]
    );
    saveDb(db);

    const stmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
    stmt.bind([Number(id)]);
    let booking = null;
    if (stmt.step()) {
      const columns = stmt.getColumnNames();
      const row = stmt.get();
      booking = {};
      columns.forEach((col, i) => {
        booking[col] = row[i];
      });
    }
    stmt.free();

    res.json({ message: 'Booking updated successfully', booking });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/bookings/:id
 *
 * Deletes a booking by ID.
 * Requires authentication.
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    db.run('DELETE FROM bookings WHERE id = ?', [Number(id)]);
    saveDb(db);

    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
