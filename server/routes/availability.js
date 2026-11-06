/**
 * Availability Routes — /api/availability
 *
 * GET    /       — public: returns non-blocked slots
 * GET    /all    — auth:   returns ALL slots (including blocked)
 * POST   /       — auth:   creates a new slot
 * PUT    /:id    — auth:   updates a slot
 * DELETE /:id    — auth:   deletes a slot
 */

import { Router } from 'express';
import { getDb, saveDb } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/availability
 *
 * Returns all availability slots that are NOT blocked (public view).
 */
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.query('SELECT * FROM availability_slots WHERE is_blocked = 0');
    res.json(rows);
  } catch (err) {
    console.error('Get availability error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/availability/all
 *
 * Returns ALL availability slots including blocked ones.
 * Requires authentication.
 */
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.query('SELECT * FROM availability_slots');
    res.json(rows);
  } catch (err) {
    console.error('Get all availability error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/availability
 *
 * Creates a new availability slot.
 * Body: { day_of_week, start_time, end_time, specific_date?, is_blocked? }
 * Requires authentication.
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { day_of_week, start_time, end_time, specific_date, is_blocked } = req.body;

    if (day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({ error: 'day_of_week, start_time, and end_time are required.' });
    }

    const db = await getDb();

    const runRes = await db.run(
      `INSERT INTO availability_slots (day_of_week, start_time, end_time, specific_date, is_blocked)
       VALUES (?, ?, ?, ?, ?)`,
      [day_of_week, start_time, end_time, specific_date || null, is_blocked ? 1 : 0]
    );

    saveDb(db);

    const slot = await db.get('SELECT * FROM availability_slots WHERE id = ?', [runRes.lastInsertRowid]);

    res.status(201).json({ message: 'Slot created', slot });
  } catch (err) {
    console.error('Create slot error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/availability/:id
 *
 * Updates an existing availability slot.
 * Requires authentication.
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { day_of_week, start_time, end_time, specific_date, is_blocked } = req.body;

    const db = await getDb();

    const updates = [];
    const values = [];

    if (day_of_week !== undefined) {
      updates.push('day_of_week = ?');
      values.push(day_of_week);
    }
    if (start_time !== undefined) {
      updates.push('start_time = ?');
      values.push(start_time);
    }
    if (end_time !== undefined) {
      updates.push('end_time = ?');
      values.push(end_time);
    }
    if (specific_date !== undefined) {
      updates.push('specific_date = ?');
      values.push(specific_date);
    }
    if (is_blocked !== undefined) {
      updates.push('is_blocked = ?');
      values.push(is_blocked ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    values.push(Number(id));
    await db.run(`UPDATE availability_slots SET ${updates.join(', ')} WHERE id = ?`, values);
    saveDb(db);

    const slot = await db.get('SELECT * FROM availability_slots WHERE id = ?', [Number(id)]);

    res.json({ message: 'Slot updated', slot });
  } catch (err) {
    console.error('Update slot error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/availability/:id
 *
 * Deletes an availability slot.
 * Requires authentication.
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    await db.run('DELETE FROM availability_slots WHERE id = ?', [Number(id)]);
    saveDb(db);

    res.json({ message: 'Slot deleted' });
  } catch (err) {
    console.error('Delete slot error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
