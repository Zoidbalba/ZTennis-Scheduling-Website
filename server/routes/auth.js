/**
 * Auth Routes — POST /api/auth/login
 *
 * Authenticates the single coach account and returns a JWT token.
 * Accepts { email, password } or { username, password }.
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/login
 *
 * Body: { email: string, password: string }
 *    or { username: string, password: string }
 *
 * Targets coach id = 1 (or the first registered coach profile).
 */
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const db = await getDb();

    // Fetch the single coach profile
    const coach = await db.get('SELECT * FROM coach_profile WHERE id = 1');

    if (!coach) {
      return res.status(401).json({ error: 'Coach profile not found. Run the seed script first.' });
    }

    // Compare supplied password against the stored hash
    const isMatch = bcrypt.compareSync(password, coach.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Sign a JWT (expires in 24 hours)
    const token = jwt.sign({ id: coach.id, name: coach.name }, JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      message: 'Login successful',
      token,
      coach: {
        id: coach.id,
        name: coach.name,
        email: coach.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
