/**
 * Profile Routes — /api/profile
 *
 * GET  /           — public: returns the coach profile (no password_hash)
 * PUT  /           — auth:   updates coach profile fields (including optional password update)
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, saveDb } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const PROFILE_COLUMNS = `
  id, name, photo_url, bio, experience, specialties,
  location, court_details, phone, email,
  messenger_link, facebook_link, instagram_link, viber_link
`;

/**
 * GET /api/profile
 */
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const coach = await db.get(`SELECT ${PROFILE_COLUMNS} FROM coach_profile WHERE id = 1`);

    if (!coach) {
      return res.status(404).json({ error: 'Coach profile not found.' });
    }

    res.json(coach);
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

    // Support updating password
    const newPassword = req.body.password || req.body.new_password;
    if (newPassword && typeof newPassword === 'string' && newPassword.trim().length >= 6) {
      const passwordHash = bcrypt.hashSync(newPassword.trim(), 10);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    values.push(1); // coach id

    await db.run(`UPDATE coach_profile SET ${updates.join(', ')} WHERE id = ?`, values);
    saveDb(db);

    const updatedCoach = await db.get(`SELECT ${PROFILE_COLUMNS} FROM coach_profile WHERE id = 1`);

    res.json({ message: 'Profile updated', profile: updatedCoach });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
