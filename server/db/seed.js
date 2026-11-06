/**
 * Seed Script — populates database with initial data
 * Supports both PostgreSQL (Supabase) and SQLite (sql.js)
 *
 * Coach info:
 * - Coach Zoid
 * - Location: Malaybalay City
 * - Phone: 09350034792
 * - Socials: Facebook, Instagram, Messenger
 * - Availability: Monday, Tuesday, Thursday, Friday, Saturday (6:00 AM - 9:00 AM)
 * - Rates: ₱300 / person (Individual), ₱250 / person (Group)
 * - Court: Public court, session lasts ~1.5 - 2 hrs (can extend based on court availability)
 */

import bcrypt from 'bcryptjs';
import { getDb, saveDb } from './database.js';

export async function seedDatabase(existingDb) {
  console.log('🌱 Seeding database...');
  const db = existingDb || (await getDb());

  // 1. Reset tables
  await db.run('DELETE FROM bookings');
  await db.run('DELETE FROM rates');
  await db.run('DELETE FROM availability_slots');
  await db.run('DELETE FROM coach_profile');

  if (db.isPostgres) {
    try {
      await db.run('ALTER SEQUENCE IF EXISTS coach_profile_id_seq RESTART WITH 1');
      await db.run('ALTER SEQUENCE IF EXISTS availability_slots_id_seq RESTART WITH 1');
      await db.run('ALTER SEQUENCE IF EXISTS rates_id_seq RESTART WITH 1');
      await db.run('ALTER SEQUENCE IF EXISTS bookings_id_seq RESTART WITH 1');
    } catch (e) {}
  } else {
    try {
      await db.run("DELETE FROM sqlite_sequence WHERE name IN ('coach_profile', 'availability_slots', 'rates', 'bookings')");
    } catch (e) {}
  }

  // 2. Coach Profile (id = 1)
  const passwordHash = bcrypt.hashSync('admin123', 10);
  await db.run(
    `INSERT INTO coach_profile (
      id, name, photo_url, bio, experience, specialties,
      location, court_details, phone, email,
      messenger_link, facebook_link, instagram_link, viber_link, password_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      1,
      'Zoid',
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=80',
      'Dedicated personal tennis coach in Malaybalay City helping players build consistent strokes, solid footwork, and confidence on the court. Tailored sessions for beginners, intermediate rally players, and competitive training.',
      'Active competitive playing & coaching experience',
      'Forehand Consistency, Backhand Fundamentals, Serve Mechanics, Footwork & Rally Drills',
      'Malaybalay City',
      'Public Tennis Court (sessions last around 1.5 to 2 hours, and can extend depending on court availability)',
      '09350034792',
      'coach@tennisph.com',
      'https://m.me/tenniscoachph',
      'https://facebook.com',
      'https://instagram.com',
      '',
      passwordHash,
    ]
  );
  console.log('  ✅ Coach profile created for Zoid in Malaybalay City (Phone: 09350034792)');

  // 3. Availability Slots: Monday(1), Tuesday(2), Thursday(4), Friday(5), Saturday(6)
  // Morning 6:00 AM - 9:00 AM
  const activeDays = [
    { day: 1, name: 'Monday' },
    { day: 2, name: 'Tuesday' },
    { day: 4, name: 'Thursday' },
    { day: 5, name: 'Friday' },
    { day: 6, name: 'Saturday' },
  ];

  for (const item of activeDays) {
    await db.run(
      `INSERT INTO availability_slots (day_of_week, start_time, end_time, is_blocked)
       VALUES (?, ?, ?, 0)`,
      [item.day, '06:00', '09:00']
    );
  }
  console.log('  ✅ 5 availability slots created (M, T, TH, F, SAT: 06:00 - 09:00)');

  // 4. Session Rates
  await db.run(
    `INSERT INTO rates (session_type, duration_minutes, price, description, is_package, package_sessions)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Individual Session',
      120,
      300,
      'One-on-one private coaching tailored entirely to your goals. Features detailed stroke analysis, personalized footwork conditioning, and focused technique correction.',
      0,
      1,
    ]
  );

  await db.run(
    `INSERT INTO rates (session_type, duration_minutes, price, description, is_package, package_sessions)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'Group Session',
      120,
      250,
      'Energetic and collaborative group session (2+ players). Focuses on live-ball rallies, partner drills, doubles positioning, situational match tactics, and fun competitive games.',
      1,
      1,
    ]
  );
  console.log('  ✅ Rates created (Individual: ₱300, Group: ₱250)');

  // 5. Initial Trainee Bookings
  const sampleBookings = [
    {
      player_name: 'Mateo Tan',
      player_contact: '09171234567',
      player_email: 'mateo.tan@gmail.com',
      skill_level: 'Beginner',
      message: 'Looking forward to learning proper forehand grip and rally consistency with Coach Zoid!',
      coach_notes: 'First session scheduled at Malaybalay Public Court. Bring water and tennis shoes.',
      status: 'confirmed',
      booking_date: '2026-11-09',
      start_time: '06:00',
      end_time: '08:00',
    },
    {
      player_name: 'Andrea Gomez',
      player_contact: '09289876543',
      player_email: 'andrea.gomez@yahoo.com',
      skill_level: 'Intermediate',
      message: 'Want to prepare for an upcoming local club tournament. Planning group session with a friend.',
      coach_notes: 'Discussed racket tension and baseline footwork.',
      status: 'pending',
      booking_date: '2026-11-10',
      start_time: '06:00',
      end_time: '08:00',
    },
    {
      player_name: 'Chris Valenzuela',
      player_contact: '09154443322',
      player_email: 'cvalenzuela@gmail.com',
      skill_level: 'Advanced',
      message: 'Focus on match play strategy, high topspin backhands, and first serve consistency.',
      coach_notes: 'Advanced drill session confirmed.',
      status: 'confirmed',
      booking_date: '2026-11-12',
      start_time: '07:00',
      end_time: '09:00',
    },
    {
      player_name: 'Bea Santos',
      player_contact: '09391122334',
      player_email: 'bea.santos@outlook.com',
      skill_level: 'Beginner',
      message: 'First time holding a tennis racket! Excited to get started with morning sessions.',
      coach_notes: '',
      status: 'pending',
      booking_date: '2026-11-14',
      start_time: '06:00',
      end_time: '08:00',
    },
  ];

  for (const b of sampleBookings) {
    await db.run(
      `INSERT INTO bookings
         (player_name, player_contact, player_email, skill_level, message, coach_notes, status, booking_date, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.player_name,
        b.player_contact,
        b.player_email,
        b.skill_level,
        b.message,
        b.coach_notes,
        b.status,
        b.booking_date,
        b.start_time,
        b.end_time,
      ]
    );
  }
  console.log('  ✅ 4 sample trainee bookings created (Mateo, Andrea, Chris, Bea)');

  saveDb(db);
  console.log('🎉 Seed complete!');
}

// Run automatically if executed directly via node CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
