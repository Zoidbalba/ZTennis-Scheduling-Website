/**
 * Rates Routes — /api/rates
 *
 * GET    /       — public: returns all rates
 * POST   /       — auth:   creates a new rate
 * PUT    /:id    — auth:   updates a rate
 * DELETE /:id    — auth:   deletes a rate
 */

import { Router } from 'express';
import { getDb, saveDb } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/rates
 *
 * Returns all session rates.
 */
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.query('SELECT * FROM rates');
    res.json(rows);
  } catch (err) {
    console.error('Get rates error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/rates
 *
 * Creates a new rate entry.
 * Body: { session_type, duration_minutes, price, description?, is_package?, package_sessions? }
 * Requires authentication.
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      session_type,
      duration_minutes,
      price,
      description,
      is_package,
      package_sessions,
    } = req.body;

    if (!session_type || !duration_minutes || price === undefined) {
      return res
        .status(400)
        .json({ error: 'session_type, duration_minutes, and price are required.' });
    }

    const db = await getDb();

    const runRes = await db.run(
      `INSERT INTO rates
         (session_type, duration_minutes, price, description, is_package, package_sessions)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        session_type,
        duration_minutes,
        price,
        description || '',
        is_package ? 1 : 0,
        package_sessions || 1,
      ]
    );

    saveDb(db);

    const rate = await db.get('SELECT * FROM rates WHERE id = ?', [runRes.lastInsertRowid]);

    res.status(201).json({ message: 'Rate created', rate });
  } catch (err) {
    console.error('Create rate error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/rates/:id
 *
 * Updates an existing rate entry.
 * Requires authentication.
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      session_type,
      duration_minutes,
      price,
      description,
      is_package,
      package_sessions,
    } = req.body;

    const db = await getDb();

    const updates = [];
    const values = [];

    if (session_type !== undefined) {
      updates.push('session_type = ?');
      values.push(session_type);
    }
    if (duration_minutes !== undefined) {
      updates.push('duration_minutes = ?');
      values.push(duration_minutes);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      values.push(price);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (is_package !== undefined) {
      updates.push('is_package = ?');
      values.push(is_package ? 1 : 0);
    }
    if (package_sessions !== undefined) {
      updates.push('package_sessions = ?');
      values.push(package_sessions);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    values.push(Number(id));
    await db.run(`UPDATE rates SET ${updates.join(', ')} WHERE id = ?`, values);
    saveDb(db);

    const rate = await db.get('SELECT * FROM rates WHERE id = ?', [Number(id)]);

    res.json({ message: 'Rate updated', rate });
  } catch (err) {
    console.error('Update rate error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/rates/:id
 *
 * Deletes a rate entry.
 * Requires authentication.
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    await db.run('DELETE FROM rates WHERE id = ?', [Number(id)]);
    saveDb(db);

    res.json({ message: 'Rate deleted' });
  } catch (err) {
    console.error('Delete rate error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
