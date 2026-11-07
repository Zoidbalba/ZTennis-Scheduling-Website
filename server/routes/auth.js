/**
 * Auth Routes — /api/auth
 *
 * POST /api/auth/login   — Authenticates the coach account
 * POST /api/auth/google  — Authenticates trainee with Google / Gmail account
 * GET  /api/auth/me      — Returns the currently authenticated user (coach or trainee)
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, saveDb } from '../db/database.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/login (Coach Login)
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

    // Sign a JWT (expires in 7 days)
    const token = jwt.sign(
      { id: coach.id, name: coach.name, email: coach.email, role: 'coach' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      coach: {
        id: coach.id,
        name: coach.name,
        email: coach.email,
        role: 'coach',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/google (Trainee Google/Gmail Login)
 *
 * Body: { credential } from Google One Tap / Identity Services,
 *    OR { email, name, picture, google_id }
 */
router.post('/google', async (req, res) => {
  try {
    let { credential, email, name, picture, google_id } = req.body;

    // Decode Google ID Token if passed from Google Identity Services
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
          const decoded = JSON.parse(payloadJson);
          email = decoded.email || email;
          name = decoded.name || decoded.given_name || (email ? email.split('@')[0] : 'Trainee');
          picture = decoded.picture || picture || '';
          google_id = decoded.sub || google_id || '';
        }
      } catch (parseErr) {
        console.warn('Could not base64-decode Google JWT:', parseErr.message);
      }
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid Gmail or email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || cleanEmail.split('@')[0]).trim();
    const cleanPicture = picture || '';
    const cleanGoogleId = google_id || '';

    const db = await getDb();

    // Check if trainee exists
    let trainee = await db.get(
      'SELECT * FROM trainees WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [cleanEmail]
    );

    if (!trainee) {
      const insertRes = await db.run(
        `INSERT INTO trainees (email, name, picture, google_id)
         VALUES (?, ?, ?, ?)`,
        [cleanEmail, cleanName, cleanPicture, cleanGoogleId]
      );
      saveDb(db);
      trainee = await db.get('SELECT * FROM trainees WHERE id = ?', [insertRes.lastInsertRowid]);
    } else if (cleanPicture || cleanGoogleId) {
      await db.run(
        'UPDATE trainees SET picture = COALESCE(NULLIF(?, ""), picture), google_id = COALESCE(NULLIF(?, ""), google_id), name = COALESCE(NULLIF(?, ""), name) WHERE id = ?',
        [cleanPicture, cleanGoogleId, cleanName, trainee.id]
      );
      saveDb(db);
      trainee = await db.get('SELECT * FROM trainees WHERE id = ?', [trainee.id]);
    }

    // Sign JWT token for the trainee (expires in 30 days)
    const token = jwt.sign(
      {
        id: trainee.id,
        email: trainee.email,
        name: trainee.name,
        picture: trainee.picture,
        role: 'trainee',
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Google login successful',
      token,
      trainee: {
        id: trainee.id,
        name: trainee.name,
        email: trainee.email,
        picture: trainee.picture,
        phone: trainee.phone,
        role: 'trainee',
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: err.message || 'Google authentication failed' });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user (coach or trainee)
 */
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = await getDb();

    if (decoded.role === 'trainee') {
      const trainee = await db.get('SELECT id, name, email, picture, phone FROM trainees WHERE id = ?', [decoded.id]);
      if (!trainee) return res.status(404).json({ error: 'Trainee not found' });
      return res.json({ role: 'trainee', user: trainee });
    }

    // Default to coach
    const coach = await db.get('SELECT id, name, email, phone, location FROM coach_profile WHERE id = 1');
    return res.json({ role: 'coach', user: coach });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
