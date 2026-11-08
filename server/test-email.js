/**
 * ZTennis — Email Connection Diagnostics Script
 * Run with: node server/test-email.js [optional_recipient_email]
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

async function runEmailTest() {
  console.log('\n======================================================');
  console.log('🎾 ZTennis — Website Server Email Diagnostics');
  console.log('======================================================\n');

  const user = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : null;
  const rawPass = process.env.GMAIL_APP_PASSWORD;
  const pass = rawPass ? rawPass.replace(/\s+/g, '').trim() : null;
  const recipient = process.argv[2] || user || 'test@example.com';

  console.log('1. Checking Environment Variables:');
  console.log(`   - GMAIL_USER: ${user ? `✅ Found (${user})` : '❌ MISSING'}`);
  console.log(`   - GMAIL_APP_PASSWORD: ${pass ? `✅ Found (${pass.length} chars)` : '❌ MISSING'}`);

  if (!user || !pass) {
    console.log('\n❌ SETUP REQUIRED:');
    console.log('   To enable the website server to send real emails to trainees:');
    console.log('   1. Open: https://myaccount.google.com/apppasswords');
    console.log('   2. Create an App Password named "ZTennis" (16 letters).');
    console.log('   3. Add GMAIL_USER and GMAIL_APP_PASSWORD to server/.env or Render Environment.');
    console.log('\n======================================================\n');
    process.exit(1);
  }

  console.log('\n2. Testing connection to Google Mail Servers (smtp.gmail.com)...');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });

  try {
    await transporter.verify();
    console.log('   ✅ SMTP Handshake Successful! Google authenticated your account.');
  } catch (verifyErr) {
    console.error('\n❌ Google Authentication Failed:');
    console.error('   ', verifyErr.message);
    if (verifyErr.message.includes('535') || verifyErr.message.includes('BadCredentials')) {
      console.log('\n💡 Tip: Google rejected the password.');
      console.log('   - You must use a 16-character GOOGLE APP PASSWORD, not your personal Gmail password.');
      console.log('   - Generate one at: https://myaccount.google.com/apppasswords');
    }
    process.exit(1);
  }

  console.log(`\n3. Sending Test Email to ${recipient}...`);

  try {
    const info = await transporter.sendMail({
      from: `"ZTennis • Coach Zoid" <${user}>`,
      to: recipient,
      subject: '🎾 ZTennis Server Email Test — It Works!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 25px; border-radius: 16px; border: 1px solid #E2E8F0; background: #FFFFFF;">
          <h2 style="color: #E0749A; margin-top: 0;">🎾 ZTennis Email System Active!</h2>
          <p style="color: #1A1118; font-size: 14px; line-height: 1.6;">
            Congratulations Coach Zoid! Your website server is now successfully connected to Gmail SMTP.
          </p>
          <div style="background: #F8FAFC; padding: 14px; border-radius: 10px; margin: 15px 0; font-size: 13px; color: #475569;">
            <strong>Sender:</strong> ${user}<br/>
            <strong>Message ID:</strong> ${info.messageId}
          </div>
          <p style="color: #64748B; font-size: 12px; margin-bottom: 0;">
            All lesson confirmations and custom trainee messages sent from your website will now deliver directly to inboxes.
          </p>
        </div>
      `,
      text: `Congratulations Coach Zoid! Your ZTennis website server email system is working smoothly. Sent from: ${user}`,
    });

    console.log(`\n🎉 SUCCESS! Real email dispatched (Message ID: ${info.messageId})`);
    console.log(`   Check the inbox of ${recipient} to view your test email!\n`);
    console.log('======================================================\n');
    process.exit(0);
  } catch (sendErr) {
    console.error('\n❌ Error sending email:');
    console.error('   ', sendErr.message);
    process.exit(1);
  }
}

runEmailTest();
