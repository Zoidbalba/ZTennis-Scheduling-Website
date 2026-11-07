/**
 * Auth Routes — /api/auth
 *
 * POST /api/auth/login           — Unified or Coach Login
 * POST /api/auth/trainee/login   — Trainee Login (rejects if not signed up yet)
 * POST /api/auth/trainee/signup  — Trainee Registration (creates new trainee)
 * POST /api/auth/google          — Trainee Google/Gmail Login & Signup
 * GET  /api/auth/me              — Returns currently authenticated user
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, saveDb } from '../db/database.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/trainee/signup (Trainee Registration)
 */
router.post('/trainee/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Your name is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = (phone || '').trim();

    const db = await getDb();

    // Check if trainee already exists
    const existing = await db.get(
      'SELECT id, email FROM trainees WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [cleanEmail]
    );

    if (existing) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please switch to Sign In.',
      });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const insertRes = await db.run(
      `INSERT INTO trainees (email, name, phone, password_hash)
       VALUES (?, ?, ?, ?)`,
      [cleanEmail, cleanName, cleanPhone, passwordHash]
    );
    saveDb(db);

    const traineeId = insertRes.lastInsertRowid || insertRes.id;
    const newTrainee = await db.get('SELECT id, name, email, picture, phone FROM trainees WHERE id = ?', [traineeId]);

    const token = jwt.sign(
      {
        id: newTrainee.id,
        email: newTrainee.email,
        name: newTrainee.name,
        picture: newTrainee.picture || '',
        role: 'trainee',
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      role: 'trainee',
      trainee: newTrainee,
    });
  } catch (err) {
    console.error('Trainee signup error:', err);
    res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

/**
 * POST /api/auth/trainee/login (Trainee Login — Rejects if not signed up yet!)
 */
router.post('/trainee/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = await getDb();

    // Find trainee
    const trainee = await db.get(
      'SELECT * FROM trainees WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [cleanEmail]
    );

    // If trainee not signed up yet, REJECT
    if (!trainee) {
      return res.status(404).json({
        error: 'No account found with this email. You have not signed up yet! Please sign up first.',
        notRegistered: true,
      });
    }

    // Verify password if hash exists
    if (trainee.password_hash) {
      const isMatch = bcrypt.compareSync(password, trainee.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect password. Please try again.' });
      }
    }

    const token = jwt.sign(
      {
        id: trainee.id,
        email: trainee.email,
        name: trainee.name,
        picture: trainee.picture || '',
        role: 'trainee',
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      role: 'trainee',
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
    console.error('Trainee login error:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

/**
 * POST /api/auth/login (Unified Coach / Trainee Login)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const db = await getDb();

    // 1. Check if it's the coach
    const coach = await db.get('SELECT * FROM coach_profile WHERE id = 1');
    const isCoachEmail = !email || (coach && coach.email && coach.email.toLowerCase() === email.toLowerCase());

    if (isCoachEmail && coach) {
      const isMatch = bcrypt.compareSync(password, coach.password_hash);
      if (isMatch) {
        const token = jwt.sign(
          { id: coach.id, name: coach.name, email: coach.email, role: 'coach' },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.json({
          message: 'Coach login successful',
          token,
          role: 'coach',
          coach: {
            id: coach.id,
            name: coach.name,
            email: coach.email,
            role: 'coach',
          },
        });
      }
    }

    // 2. If email provided and not coach, check trainee
    if (email && email.includes('@')) {
      const cleanEmail = email.trim().toLowerCase();
      const trainee = await db.get(
        'SELECT * FROM trainees WHERE LOWER(email) = LOWER(?) LIMIT 1',
        [cleanEmail]
      );

      if (!trainee) {
        return res.status(404).json({
          error: 'No account found with this email. You have not signed up yet! Please sign up first.',
          notRegistered: true,
        });
      }

      if (trainee.password_hash) {
        const isMatch = bcrypt.compareSync(password, trainee.password_hash);
        if (!isMatch) {
          return res.status(401).json({ error: 'Incorrect password. Please try again.' });
        }
      }

      const token = jwt.sign(
        {
          id: trainee.id,
          email: trainee.email,
          name: trainee.name,
          picture: trainee.picture || '',
          role: 'trainee',
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        role: 'trainee',
        trainee: {
          id: trainee.id,
          name: trainee.name,
          email: trainee.email,
          picture: trainee.picture,
          phone: trainee.phone,
          role: 'trainee',
        },
      });
    }

    return res.status(401).json({ error: 'Invalid email or password.' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/google (Trainee Google/Gmail Login or Signup)
 * Body: { credential, email, name, picture, google_id, mode: 'signin' | 'signup' }
 */
router.post('/google', async (req, res) => {
  try {
    let { credential, email, name, picture, google_id, mode = 'signin' } = req.body;

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

    // MODE: SIGNIN — If NOT registered yet, REJECT!
    if (mode === 'signin' && !trainee) {
      return res.status(404).json({
        error: 'No account found for this Google email. You have not signed up yet! Please switch to Sign Up to create your account first.',
        notRegistered: true,
      });
    }

    // MODE: SIGNUP — If not registered yet, create new trainee; if already registered, log in directly
    if (!trainee) {
      const insertRes = await db.run(
        `INSERT INTO trainees (email, name, picture, google_id)
         VALUES (?, ?, ?, ?)`,
        [cleanEmail, cleanName, cleanPicture, cleanGoogleId]
      );
      saveDb(db);
      const newId = insertRes.lastInsertRowid || insertRes.id;
      trainee = await db.get('SELECT * FROM trainees WHERE id = ?', [newId]);
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
      message: mode === 'signup' ? 'Google signup successful' : 'Google login successful',
      token,
      role: 'trainee',
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