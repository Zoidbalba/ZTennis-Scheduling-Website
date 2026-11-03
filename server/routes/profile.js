/**
 * Profile Routes — /api/profile
 *
 * GET  /           — public: returns the coach profile (no password_hash)
 * PUT  /           — auth:   updates coach profile fields
 */

import { Router } from 'express';
import { getDb, saveDb } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

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
 * GET /api/profile
 */
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT id, name, photo_url, bio, experience, specialties,
              location, court_details, phone, email,
              messenger_link, facebook_link, instagram_link, viber_link
       FROM coach_profile WHERE id = 1`
    );
    const rows = rowsToObjects(result);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Coach profile not found.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/profile
 */
router.put('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();

    const allowedFields = [
      'name',
      'photo_url',
      'bio',
      'experience',
      'specialties',
      'location',
      'court_details',
      'phone',
      'email',
      'messenger_link',
      'facebook_link',
      'instagram_link',
      'viber_link',
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    values.push(1); // coach id

    db.run(`UPDATE coach_profile SET ${updates.join(', ')} WHERE id = ?`, values);
    saveDb(db);

    const result = db.exec(
      `SELECT id, name, photo_url, bio, experience, specialties,
              location, court_details, phone, email,
              messenger_link, facebook_link, instagram_link, viber_link
       FROM coach_profile WHERE id = 1`
    );
    const rows = rowsToObjects(result);

    res.json({ message: 'Profile updated', profile: rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
