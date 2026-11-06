/**
 * Supabase / Database Connection Test Script
 *
 * Run with:
 *   node server/test-db.js
 * or:
 *   npm --prefix server run test:db
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

import { getDb } from './db/database.js';

async function testConnection() {
  console.log('\n==========================================');
  console.log('🎾 ZTennis Database Connection Test');
  console.log('==========================================\n');

  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

  if (!dbUrl) {
    console.log('⚠️  No DATABASE_URL found in environment or server/.env.');
    console.log('   Testing local SQLite fallback...\n');
  } else if (dbUrl.includes('[YOUR-PASSWORD]')) {
    console.log('❌ ERROR: You still have "[YOUR-PASSWORD]" in your server/.env file!');
    console.log('   Please replace [YOUR-PASSWORD] with the database password you created in Supabase.\n');
    process.exit(1);
  } else {
    // Mask password in logs
    const maskedUrl = dbUrl.replace(/:\/\/(.*?):(.*?)@/, '://$1:******@');
    console.log(`🔗 Target URL: ${maskedUrl}`);
  }

  try {
    const db = await getDb();

    console.log(`\n✅ Successfully connected! Engine: ${db.isPostgres ? 'Supabase (PostgreSQL)' : 'Local SQLite'}`);

    // 1. Verify Coach Profile
    const coach = await db.get('SELECT id, name, phone, email, location FROM coach_profile WHERE id = 1');
    if (coach) {
      console.log(`\n👤 Coach Profile:`);
      console.log(`   - Name: ${coach.name}`);
      console.log(`   - Phone: ${coach.phone}`);
      console.log(`   - Location: ${coach.location}`);
      console.log(`   - Email: ${coach.email}`);
    } else {
      console.log('\n⚠️  No coach profile found. Initializing...');
    }

    // 2. Verify Availability Slots
    const slots = await db.query('SELECT * FROM availability_slots');
    console.log(`\n📅 Availability Slots: ${slots.length} active slot(s) configured`);

    // 3. Verify Rates
    const rates = await db.query('SELECT session_type, price FROM rates');
    console.log(`\n💰 Pricing Rates: ${rates.length} rate option(s)`);
    rates.forEach((r) => console.log(`   - ${r.session_type}: ₱${r.price}`));

    // 4. Verify Bookings
    const bookings = await db.query('SELECT * FROM bookings');
    console.log(`\n📋 Bookings: ${bookings.length} record(s) in database`);

    console.log('\n🎉 ALL CHECKS PASSED: Your database is ready and working smoothly!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Connection failed with error:');
    console.error('  ', err.message);

    if (err.message.includes('password authentication failed')) {
      console.log('\n💡 Tip: The password in your DATABASE_URL does not match your Supabase database password.');
      console.log('   Go to Supabase -> Project Settings -> Database -> Click "Reset password" to set a known password, then update server/.env.');
    } else if (err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT')) {
      console.log('\n💡 Tip: Could not reach the host. Double check the project reference URL from Supabase.');
    }

    process.exit(1);
  }
}

testConnection();
