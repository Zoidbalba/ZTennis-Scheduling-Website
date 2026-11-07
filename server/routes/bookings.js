/**
 * Bookings Routes — /api/bookings
 *
 * POST   /              — public: creates a booking request (status: pending)
 * GET    /              — auth:   returns all bookings, newest first
 * GET    /trainees      — auth:   returns aggregated trainee profiles
 * PUT    /:id/status    — auth:   updates booking status (confirmed / declined) & sends automated SMS
 * POST   /:id/send-sms  — auth:   manually dispatches SMS to trainee
 * PUT    /:id           — auth:   updates booking details & coach notes
 * DELETE /:id           — auth:   deletes a booking
 */

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getDb, saveDb } from '../db/database.js';
import { authMiddleware, JWT_SECRET } from '../middleware/auth.js';
import { sendBookingStatusSms, sendSms } from '../services/sms.js';
import {
  sendBookingConfirmationEmail,
  sendBookingSubmittedEmail,
  sendFollowUpNotificationToCoach,
  sendCustomCoachEmail,
} from '../services/email.js';

const router = Router();

/**
 * POST /api/bookings
 *
 * Creates a new booking request (public — no auth required).
 * Body: { slot_id?, player_name, player_contact, player_email?, skill_level?,
 *         message?, booking_date, start_time, end_time }
 */
router.post('/', async (req, res) => {
  try {
    // 1. Verify Authentication: Booking is strictly for logged-in trainees/coach
    let authedUser = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        authedUser = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        // invalid token
      }
    }

    const {
      slot_id,
      session_type,
      member_count,
      player_name,
      player_contact,
      player_email,
      skill_level,
      message,
      booking_date,
      start_time,
      end_time,
    } = req.body;

    const emailToCheck = (player_email || authedUser?.email || '').trim().toLowerCase();
    const db = await getDb();

    // Verify trainee is registered in database
    let registeredTrainee = null;
    if (emailToCheck) {
      registeredTrainee = await db.get(
        'SELECT id, email, name FROM trainees WHERE LOWER(email) = LOWER(?) LIMIT 1',
        [emailToCheck]
      );
    }

    const isCoach = authedUser && authedUser.role === 'coach';

    if (!isCoach && !registeredTrainee && !authedUser) {
      return res.status(401).json({
        error: 'Booking is only allowed for logged-in users. Please sign in or sign up first.',
        requiresAuth: true,
      });
    }

    // Validate required fields
    if (!player_name || !player_contact || !booking_date || !start_time || !end_time) {
      return res.status(400).json({
        error: 'player_name, player_contact, booking_date, start_time, and end_time are required.',
      });
    }

    const count = member_count ? Math.max(1, parseInt(member_count, 10)) : 1;

    // Check if date already has an accepted/confirmed booking (meaning someone already availed a schedule on that date)
    const existingConfirmed = await db.get(
      "SELECT id, player_name FROM bookings WHERE booking_date = ? AND LOWER(status) IN ('confirmed', 'completed', 'accepted') LIMIT 1",
      [booking_date]
    );
    if (existingConfirmed) {
      return res.status(400).json({
        error: 'This date has already been booked and confirmed for another session. Please choose another open morning.',
      });
    }

    const runRes = await db.run(
      `INSERT INTO bookings
         (slot_id, session_type, member_count, player_name, player_contact, player_email,
          skill_level, message, status, booking_date, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        slot_id || null,
        session_type || 'Individual Session',
        count,
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

    let booking = null;
    const insertedId = runRes?.lastInsertRowid || runRes?.id;
    if (insertedId) {
      booking = await db.get('SELECT * FROM bookings WHERE id = ?', [insertedId]);
    }
    if (!booking) {
      booking = await db.get(
        'SELECT * FROM bookings WHERE LOWER(player_email) = LOWER(?) AND booking_date = ? ORDER BY id DESC LIMIT 1',
        [emailToCheck, booking_date]
      );
    }

    // Send confirmation receipt email asynchronously in the background so user booking responds INSTANTLY without hanging
    if (booking && booking.player_email && booking.player_email.includes('@')) {
      (async () => {
        try {
          const coachProfile = await db.get('SELECT name, phone, email FROM coach_profile LIMIT 1');
          await sendBookingSubmittedEmail({ booking, coachProfile });
        } catch (emailErr) {
          console.warn('Booking submission email background notice:', emailErr.message);
        }
      })();
    }

    res.status(201).json({ message: 'Booking request submitted', booking });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/bookings/booked-dates
 *
 * Public endpoint that returns the dates that already have an accepted/confirmed booking,
 * allowing the public calendar to close those specific dates.
 */
router.get('/booked-dates', async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.query(
      `SELECT DISTINCT booking_date, start_time, end_time, session_type, status
       FROM bookings
       WHERE LOWER(status) IN ('confirmed', 'completed', 'accepted')`
    );

    // Normalize date strings into clean YYYY-MM-DD
    const formatted = (rows || []).map((r) => {
      let bDate = r.booking_date;
      if (bDate) {
        const str = String(bDate).trim();
        const m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (m) {
          bDate = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
        }
      }
      return {
        ...r,
        booking_date: bDate,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Get booked dates error:', err);
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
    const rows = await db.query(
      'SELECT * FROM bookings ORDER BY booking_date DESC, start_time DESC, created_at DESC'
    );
    res.json(rows);
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
    const allBookings = await db.query(
      'SELECT * FROM bookings ORDER BY booking_date DESC, start_time DESC'
    );

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
 * Updates a booking's status ('confirmed', 'declined', 'pending', 'completed')
 * and automatically sends an SMS notification to the trainee.
 * Requires authentication.
 */
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, send_notification = true } = req.body;

    const allowedStatuses = ['pending', 'confirmed', 'declined', 'completed'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Status must be one of: ' + allowedStatuses.join(', '),
      });
    }

    const db = await getDb();

    // Check existing booking
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [Number(id)]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Fetch coach profile for notifications
    let coachProfile = null;
    try {
      coachProfile = await db.get('SELECT name, phone, email FROM coach_profile LIMIT 1');
    } catch (e) {}

    // 1. Send automated email confirmation to trainee's Gmail/email
    let emailResult = null;
    let emailStatusVal = booking.email_status || '';
    let emailSentAtVal = booking.email_sent_at || '';

    if (send_notification && booking.player_email && (status === 'confirmed' || status === 'declined' || status === 'completed')) {
      try {
        emailResult = await sendBookingConfirmationEmail({
          booking,
          coachProfile,
          status,
        });

        if (emailResult.sent) {
          emailStatusVal = emailResult.simulated ? 'sent (simulated)' : 'sent';
          emailSentAtVal = new Date().toISOString();
        } else {
          emailStatusVal = `failed: ${emailResult.error || 'unknown'}`;
        }
      } catch (emailErr) {
        console.error('Error dispatching automated email confirmation:', emailErr);
        emailResult = { sent: false, error: emailErr.message };
        emailStatusVal = `failed: ${emailErr.message}`;
      }
    }

    // Update status and email tracking in database
    await db.run(
      `UPDATE bookings
       SET status = ?, email_status = ?, email_sent_at = ?
       WHERE id = ?`,
      [status, emailStatusVal, emailSentAtVal, Number(id)]
    );
    saveDb(db);

    const updatedBooking = await db.get('SELECT * FROM bookings WHERE id = ?', [Number(id)]);

    res.json({
      message: `Booking status updated to ${status}`,
      booking: updatedBooking,
      email: emailResult,
    });
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/bookings/:id/send-email
 *
 * Sends or resends an official email to the trainee (either a custom note or schedule confirmation).
 * Body: { message?: string, subject?: string }
 * Requires authentication.
 */
router.post('/:id/send-email', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, subject } = req.body;

    const db = await getDb();
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [Number(id)]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!booking.player_email) {
      return res.status(400).json({ error: 'No email address registered for this booking' });
    }

    let coachProfile = null;
    try {
      coachProfile = await db.get('SELECT name, phone, email FROM coach_profile LIMIT 1');
    } catch (e) {}

    let emailResult;
    if (message && message.trim()) {
      emailResult = await sendCustomCoachEmail({
        booking,
        coachProfile,
        subject,
        message: message.trim(),
      });
    } else {
      emailResult = await sendBookingConfirmationEmail({
        booking,
        coachProfile,
        status: booking.status || 'confirmed',
      });
    }

    const emailStatusVal = emailResult.sent
      ? (emailResult.simulated ? 'sent (simulated)' : 'sent')
      : `failed: ${emailResult.error || 'error'}`;
    const emailSentAtVal = emailResult.sent ? new Date().toISOString() : booking.email_sent_at;

    await db.run(
      'UPDATE bookings SET email_status = ?, email_sent_at = ? WHERE id = ?',
      [emailStatusVal, emailSentAtVal, Number(id)]
    );
    saveDb(db);

    res.json({
      message: emailResult.sent ? 'Email sent successfully' : 'Failed to send email',
      email: emailResult,
    });
  } catch (err) {
    console.error('Manual send email error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/bookings/:id/send-sms (Backward-compatible alias for send-email)
 */
router.post('/:id/send-sms', authMiddleware, async (req, res) => {
  // Delegate directly to send-email handler logic
  try {
    const { id } = req.params;
    const { message, subject } = req.body;
    const db = await getDb();
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [Number(id)]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.player_email) {
      const coachProfile = await db.get('SELECT name, phone, email FROM coach_profile LIMIT 1');
      const emailResult = message
        ? await sendCustomCoachEmail({ booking, coachProfile, subject, message })
        : await sendBookingConfirmationEmail({ booking, coachProfile, status: booking.status || 'confirmed' });
      return res.json({ message: 'Email dispatched', email: emailResult });
    }

    res.json({ message: 'No email found for this booking' });
  } catch (err) {
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
    const { booking_date, start_time, end_time, coach_notes, status, session_type, member_count } = req.body;

    const db = await getDb();

    // Fetch existing
    const current = await db.get('SELECT * FROM bookings WHERE id = ?', [Number(id)]);
    if (!current) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const newDate = booking_date !== undefined ? booking_date : current.booking_date;
    const newStart = start_time !== undefined ? start_time : current.start_time;
    const newEnd = end_time !== undefined ? end_time : current.end_time;
    const newNotes = coach_notes !== undefined ? coach_notes : current.coach_notes;
    const newStatus = status !== undefined ? status : current.status;
    const newSessionType = session_type !== undefined ? session_type : (current.session_type || 'Individual Session');
    const newMemberCount = member_count !== undefined ? Number(member_count) : (current.member_count || 1);

    await db.run(
      'UPDATE bookings SET booking_date = ?, start_time = ?, end_time = ?, coach_notes = ?, status = ?, session_type = ?, member_count = ? WHERE id = ?',
      [newDate, newStart, newEnd, newNotes, newStatus, newSessionType, newMemberCount, Number(id)]
    );
    saveDb(db);

    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [Number(id)]);

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

    await db.run('DELETE FROM bookings WHERE id = ?', [Number(id)]);
    saveDb(db);

    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/bookings/my-bookings
 *
 * Trainee route to fetch their personal bookings.
 * Accepts:
 * - Authorization Bearer token (containing trainee email)
 * - OR ?email=user@gmail.com
 */
router.get('/my-bookings', async (req, res) => {
  try {
    let email = req.query.email;

    // Check token if provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        if (decoded.email) {
          email = decoded.email;
        }
      } catch (e) {}
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email parameter or trainee authentication is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = await getDb();

    const rows = await db.query(
      `SELECT * FROM bookings
       WHERE LOWER(player_email) = LOWER(?)
       ORDER BY booking_date DESC, start_time DESC`,
      [cleanEmail]
    );

    res.json(rows || []);
  } catch (err) {
    console.error('Get my-bookings error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/bookings/:id/follow-up
 *
 * Trainee sends a personal follow-up message to manually inform the coach about their pending schedule.
 * Body: { message: string }
 */
router.post('/:id/follow-up', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Follow-up message cannot be empty.' });
    }

    const db = await getDb();
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [Number(id)]);

    if (!booking) {
      return res.status(404).json({ error: 'Booking schedule not found.' });
    }

    const cleanMsg = message.trim();
    const nowIso = new Date().toISOString();

    await db.run(
      'UPDATE bookings SET follow_up_message = ?, follow_up_sent_at = ? WHERE id = ?',
      [cleanMsg, nowIso, Number(id)]
    );
    saveDb(db);

    const updatedBooking = await db.get('SELECT * FROM bookings WHERE id = ?', [Number(id)]);

    // Notify Coach Zoid via email
    let coachProfile = null;
    try {
      coachProfile = await db.get('SELECT name, phone, email FROM coach_profile LIMIT 1');
    } catch (e) {}

    let notifyResult = null;
    try {
      notifyResult = await sendFollowUpNotificationToCoach({
        booking: updatedBooking,
        followUpMessage: cleanMsg,
        coachProfile,
      });
    } catch (notifyErr) {
      console.warn('Follow-up coach email notice:', notifyErr.message);
    }

    res.json({
      message: 'Follow-up message sent to Coach Zoid!',
      booking: updatedBooking,
      notification: notifyResult,
    });
  } catch (err) {
    console.error('Follow-up error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
