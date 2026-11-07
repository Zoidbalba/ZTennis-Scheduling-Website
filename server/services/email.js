/**
 * Email Notification Service — ZTennis
 *
 * Handles automated email confirmations and notifications:
 * 1. Booking Confirmation Email (sent to trainee when coach accepts/confirms or updates schedule)
 * 2. Booking Submission Receipt Email (sent to trainee when they submit a booking request)
 * 3. Trainee Follow-Up Notification Email (sent to coach when trainee follows up on a pending schedule)
 *
 * Supports:
 * - Gmail (via GMAIL_USER + GMAIL_APP_PASSWORD in .env)
 * - Standard SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 * - Safe Simulation Mode: Automatically runs when no SMTP credentials are configured,
 *   logging the formatted message and preview without breaking app flows.
 */

import nodemailer from 'nodemailer';

/**
 * Normalizes phone numbers to standard 11-digit Philippine mobile format (09xxxxxxxxx).
 */
function formatLocalPhone(raw) {
  if (!raw) return '';
  let cleaned = String(raw).trim().replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+63')) cleaned = '0' + cleaned.slice(3);
  else if (cleaned.startsWith('63') && cleaned.length === 12) cleaned = '0' + cleaned.slice(2);
  else if (cleaned.startsWith('9') && cleaned.length === 10) cleaned = '0' + cleaned;
  return cleaned;
}

/**
 * Formats a date string (YYYY-MM-DD) into a friendly human-readable format.
 */
export function formatHumanDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats 24-hr time (HH:MM) into 12-hr time (e.g. 6:00 AM).
 */
export function formatHumanTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Creates a Nodemailer transport instance.
 */
function getTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  return null;
}

/**
 * HTML Email wrapper template with official ZTennis branding:
 * - Rose: #E0749A
 * - Ink: #1A1118
 * - Court Green: #1F7A5A
 */
function wrapHtmlEmail({ preheader, title, content, ctaUrl, ctaText }) {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const targetCtaUrl = ctaUrl || `${appUrl}/my-bookings`;
  const targetCtaText = ctaText || 'View My Schedule & Bookings →';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1A1118; }
    .email-container { max-width: 600px; margin: 30px auto; background: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #F1F5F9; }
    .email-header { background: #1A1118; padding: 32px 30px; text-align: center; }
    .email-logo-ball { display: inline-block; width: 44px; height: 44px; background: #E0749A; border-radius: 50%; color: #1A1118; font-weight: 900; font-size: 22px; line-height: 44px; text-align: center; margin-bottom: 8px; vertical-align: middle; }
    .email-logo-text { font-size: 24px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px; margin: 0; }
    .email-logo-tagline { font-size: 9px; font-weight: 800; color: #1F7A5A; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; display: block; }
    .email-body { padding: 36px 32px; }
    .session-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 18px; padding: 22px; margin: 24px 0; }
    .session-card-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
    .session-label { color: #64748B; font-weight: 600; }
    .session-value { color: #0F172A; font-weight: 800; text-align: right; }
    .btn-primary { display: inline-block; background-color: #E0749A; color: #FFFFFF !important; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 14px; box-shadow: 0 4px 12px rgba(224, 116, 154, 0.35); text-align: center; }
    .email-footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 30px; text-align: center; font-size: 12px; color: #94A3B8; }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <div class="email-logo-ball">Z</div>
      <h1 class="email-logo-text">ZTennis</h1>
      <span class="email-logo-tagline">COACHING, SCHEDULED.</span>
    </div>

    <!-- Body -->
    <div class="email-body">
      ${content}

      <div style="text-align: center; margin-top: 32px; margin-bottom: 8px;">
        <a href="${targetCtaUrl}" class="btn-primary" target="_blank">${targetCtaText}</a>
      </div>
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <p style="margin: 0 0 6px 0; font-weight: 700; color: #64748B;">ZTennis Coaching • Coach Zoid</p>
      <p style="margin: 0 0 6px 0;">Malaybalay City Public Tennis Court, Bukidnon</p>
      <p style="margin: 0; font-size: 11px;">You received this email because of your booking request at ZTennis.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatches an email with automatic fallback to simulation mode.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!to || !to.includes('@')) {
    console.warn(`[EMAIL SKIPPED] Invalid recipient email: "${to}"`);
    return { sent: false, error: 'Invalid recipient email address' };
  }

  const transporter = getTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GMAIL_USER || 'notifications@ztennis.com';
  const senderName = 'ZTennis • Coach Zoid';

  if (!transporter) {
    console.log(`\n================================================================`);
    console.log(`[EMAIL SIMULATED — NO SMTP CREDENTIALS CONFIGURED]`);
    console.log(`To: ${to}`);
    console.log(`From: "${senderName}" <${senderEmail}>`);
    console.log(`Subject: ${subject}`);
    console.log(`(Configure GMAIL_USER + GMAIL_APP_PASSWORD in server/.env for live delivery)`);
    console.log(`================================================================\n`);

    return {
      sent: true,
      simulated: true,
      recipient: to,
      subject,
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      text: text || subject,
      html,
    });

    console.log(`[EMAIL SENT via SMTP] To: ${to} (MessageId: ${info.messageId})`);
    return {
      sent: true,
      simulated: false,
      messageId: info.messageId,
      recipient: to,
    };
  } catch (err) {
    console.error('[EMAIL ERROR] Failed to send via transporter:', err.message);
    return {
      sent: false,
      error: err.message,
    };
  }
}

/**
 * 1. Booking Confirmation Email
 * Sent to trainee when the coach marks an appointment as confirmed, completed, or updated.
 */
export async function sendBookingConfirmationEmail({ booking, coachProfile, status = 'confirmed' }) {
  if (!booking?.player_email) {
    return { sent: false, error: 'No player email provided in booking' };
  }

  const formattedDate = formatHumanDate(booking.booking_date);
  const formattedStart = formatHumanTime(booking.start_time);
  const formattedEnd = formatHumanTime(booking.end_time);

  const isGroup = (booking.session_type || '').toLowerCase().includes('group');
  const count = booking.member_count || (isGroup ? 2 : 1);
  const fee = isGroup ? 250 * count : 300;
  const sessionTitle = isGroup ? `Group Session (${count} players)` : 'Individual 1-on-1 Session';

  const coachName = coachProfile?.name ? `Coach ${coachProfile.name}` : 'Coach Zoid';
  const coachPhone = formatLocalPhone(coachProfile?.phone || '09350034792');

  const isConfirmed = status === 'confirmed';
  const isCompleted = status === 'completed';
  const isDeclined = status === 'declined';

  const badgeColor = isConfirmed ? '#1F7A5A' : isCompleted ? '#2563EB' : isDeclined ? '#E11D48' : '#E0749A';
  const badgeText = isConfirmed ? 'CONFIRMED & SCHEDULED' : isCompleted ? 'SESSION COMPLETED' : isDeclined ? 'SESSION DECLINED' : status.toUpperCase();

  const headline = isConfirmed
    ? 'Your Tennis Session is Confirmed!'
    : isCompleted
    ? 'Great Session! Session Completed'
    : isDeclined
    ? 'Coaching Session Update'
    : 'Schedule Status Update';

  const introText = isConfirmed
    ? `Great news, <strong>${booking.player_name}</strong>! ${coachName} has reviewed and accepted your coaching request. Your court time is locked in.`
    : isCompleted
    ? `Thank you for training with ${coachName}, <strong>${booking.player_name}</strong>! Your session on ${formattedDate} has been marked as completed.`
    : isDeclined
    ? `Hi <strong>${booking.player_name}</strong>, ${coachName} was unable to accept this specific schedule slot. Please view the calendar to pick another open morning.`
    : `Hi <strong>${booking.player_name}</strong>, your coaching booking status has been updated.`;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: ${badgeColor}; color: #ffffff; font-size: 11px; font-weight: 900; letter-spacing: 1px; padding: 6px 16px; border-radius: 999px; text-transform: uppercase;">
        ${badgeText}
      </span>
      <h2 style="font-size: 24px; font-weight: 900; color: #1A1118; margin: 14px 0 6px 0; letter-spacing: -0.5px;">${headline}</h2>
      <p style="font-size: 14px; color: #64748B; margin: 0; line-height: 1.6;">${introText}</p>
    </div>

    <div class="session-card">
      <div style="border-bottom: 1px solid #E2E8F0; padding-bottom: 12px; margin-bottom: 14px;">
        <span style="font-size: 10px; font-weight: 800; color: #E0749A; text-transform: uppercase; letter-spacing: 1px;">SCHEDULE DETAILS</span>
      </div>
      <div class="session-card-row">
        <span class="session-label">Date</span>
        <span class="session-value">${formattedDate}</span>
      </div>
      <div class="session-card-row">
        <span class="session-label">Morning Time</span>
        <span class="session-value">${formattedStart} – ${formattedEnd}</span>
      </div>
      <div class="session-card-row">
        <span class="session-label">Session Type</span>
        <span class="session-value">${sessionTitle}</span>
      </div>
      <div class="session-card-row">
        <span class="session-label">Coaching Fee</span>
        <span class="session-value" style="color: #1F7A5A; font-size: 16px;">₱${fee}</span>
      </div>
      <div class="session-card-row" style="margin-bottom: 0;">
        <span class="session-label">Court Location</span>
        <span class="session-value">Malaybalay City Public Court</span>
      </div>
      ${booking.coach_notes ? `
        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #CBD5E1;">
          <span class="session-label" style="display: block; margin-bottom: 4px;">Coach's Note:</span>
          <p style="margin: 0; font-size: 13px; font-style: italic; color: #334155;">"${booking.coach_notes}"</p>
        </div>
      ` : ''}
    </div>

    ${isConfirmed ? `
      <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 14px; padding: 14px 18px; margin-top: 20px; font-size: 13px; color: #065F46; line-height: 1.5;">
        <strong>💡 Preparation Tip:</strong> Bring your tennis racket, water bottle, and proper athletic footwear. Please arrive 10 minutes early at the Malaybalay City Public Court!
      </div>
    ` : ''}

    <div style="margin-top: 24px; text-align: center; font-size: 13px; color: #64748B;">
      Need to adjust or have questions? Contact ${coachName} directly at <strong style="color: #0F172A;">${coachPhone}</strong>.
    </div>
  `;

  const html = wrapHtmlEmail({
    preheader: `Your tennis session on ${formattedDate} is ${status}!`,
    title: `Coaching Session ${badgeText}`,
    content,
    ctaText: 'View My Bookings & Schedule →',
  });

  return sendEmail({
    to: booking.player_email,
    subject: `🎾 Coaching Session ${badgeText} — ZTennis (${formattedDate})`,
    html,
    text: `${headline}\nDate: ${formattedDate}\nTime: ${formattedStart} - ${formattedEnd}\nSession: ${sessionTitle}\nFee: ₱${fee}\nLocation: Malaybalay City Public Court`,
  });
}

/**
 * 2. Booking Submission Receipt Email
 * Sent to trainee immediately when they submit a new booking request.
 */
export async function sendBookingSubmittedEmail({ booking, coachProfile }) {
  if (!booking?.player_email) return { sent: false, error: 'No player email' };

  const formattedDate = formatHumanDate(booking.booking_date);
  const formattedStart = formatHumanTime(booking.start_time);
  const formattedEnd = formatHumanTime(booking.end_time);

  const isGroup = (booking.session_type || '').toLowerCase().includes('group');
  const count = booking.member_count || (isGroup ? 2 : 1);
  const fee = isGroup ? 250 * count : 300;
  const sessionTitle = isGroup ? `Group Session (${count} players)` : 'Individual 1-on-1 Session';

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #FFF0F5; color: #E0749A; font-size: 11px; font-weight: 900; letter-spacing: 1px; padding: 6px 16px; border-radius: 999px; text-transform: uppercase;">
        REQUEST RECEIVED • PENDING REVIEW
      </span>
      <h2 style="font-size: 24px; font-weight: 900; color: #1A1118; margin: 14px 0 6px 0;">We Got Your Booking Request!</h2>
      <p style="font-size: 14px; color: #64748B; margin: 0; line-height: 1.6;">
        Hi <strong>${booking.player_name}</strong>, Coach Zoid has received your request and will review court availability shortly. You'll receive another email the moment it is confirmed!
      </p>
    </div>

    <div class="session-card">
      <div class="session-card-row">
        <span class="session-label">Requested Date</span>
        <span class="session-value">${formattedDate}</span>
      </div>
      <div class="session-card-row">
        <span class="session-label">Morning Slot</span>
        <span class="session-value">${formattedStart} – ${formattedEnd}</span>
      </div>
      <div class="session-card-row">
        <span class="session-label">Session</span>
        <span class="session-value">${sessionTitle}</span>
      </div>
      <div class="session-card-row" style="margin-bottom: 0;">
        <span class="session-label">Estimated Fee</span>
        <span class="session-value" style="color: #1F7A5A; font-weight: 800;">₱${fee}</span>
      </div>
    </div>

    <p style="font-size: 13px; color: #64748B; text-align: center; line-height: 1.5;">
      You can track whether your schedule got accepted anytime in your Trainee Portal, or send a personal follow-up message to the coach if needed.
    </p>
  `;

  const html = wrapHtmlEmail({
    preheader: `Booking request received for ${formattedDate} at ZTennis`,
    title: 'Booking Request Received',
    content,
    ctaText: 'Track My Booking Status →',
  });

  return sendEmail({
    to: booking.player_email,
    subject: `🎾 Booking Request Received — ZTennis Malaybalay (${formattedDate})`,
    html,
  });
}

/**
 * 3. Follow-Up Notification to Coach
 * Sent to Coach Zoid when a trainee submits a personal follow-up message regarding their pending schedule.
 */
export async function sendFollowUpNotificationToCoach({ booking, followUpMessage, coachProfile }) {
  const coachEmail = coachProfile?.email || process.env.COACH_EMAIL || 'coachzoid@gmail.com';
  const formattedDate = formatHumanDate(booking.booking_date);
  const formattedStart = formatHumanTime(booking.start_time);
  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #E0749A; color: #ffffff; font-size: 11px; font-weight: 900; letter-spacing: 1px; padding: 6px 16px; border-radius: 999px; text-transform: uppercase;">
        🔔 TRAINEE FOLLOW-UP MESSAGE
      </span>
      <h2 style="font-size: 24px; font-weight: 900; color: #1A1118; margin: 14px 0 6px 0;">New Follow-Up from ${booking.player_name}</h2>
      <p style="font-size: 14px; color: #64748B; margin: 0;">
        A trainee has sent a follow-up inquiry regarding their pending morning session request.
      </p>
    </div>

    <div style="background-color: #FFF0F5; border-left: 4px solid #E0749A; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
      <span style="font-size: 11px; font-weight: 800; color: #E0749A; text-transform: uppercase;">MESSAGE FROM TRAINEE:</span>
      <p style="font-size: 15px; font-style: italic; color: #1A1118; margin: 8px 0 0 0; line-height: 1.5;">
        "${followUpMessage}"
      </p>
    </div>

    <div class="session-card">
      <div class="session-card-row">
        <span class="session-label">Trainee Name</span>
        <span class="session-value">${booking.player_name}</span>
      </div>
      <div class="session-card-row">
        <span class="session-label">Contact</span>
        <span class="session-value">${booking.player_contact}</span>
      </div>
      <div class="session-card-row">
        <span class="session-label">Email</span>
        <span class="session-value">${booking.player_email || '—'}</span>
      </div>
      <div class="session-card-row">
        <span class="session-label">Booking Date</span>
        <span class="session-value">${formattedDate} (${formattedStart})</span>
      </div>
      <div class="session-card-row" style="margin-bottom: 0;">
        <span class="session-label">Status</span>
        <span class="session-value" style="color: #E0749A; text-transform: uppercase;">${booking.status || 'Pending'}</span>
      </div>
    </div>
  `;

  const html = wrapHtmlEmail({
    preheader: `Follow-up from ${booking.player_name}: "${followUpMessage.substring(0, 50)}..."`,
    title: 'Trainee Follow-Up Notification',
    content,
    ctaUrl: `${appUrl}/dashboard/bookings`,
    ctaText: 'Open Coach Dashboard to Respond / Accept →',
  });

  return sendEmail({
    to: coachEmail,
    subject: `🔔 Follow-Up: ${booking.player_name} regarding ${formattedDate} schedule`,
    html,
  });
}

/**
 * 4. Custom Direct Email from Coach to Trainee
 * Sent when Coach writes a personal update/note to a trainee from the Admin Dashboard.
 */
export async function sendCustomCoachEmail({ booking, coachProfile, subject, message }) {
  if (!booking?.player_email) {
    return { sent: false, error: 'Trainee has no registered email address' };
  }

  const coachName = coachProfile?.name ? `Coach ${coachProfile.name}` : 'Coach Zoid';
  const coachPhone = formatLocalPhone(coachProfile?.phone || '09350034792');
  const formattedDate = formatHumanDate(booking.booking_date);
  const formattedStart = formatHumanTime(booking.start_time);
  const emailSubject = subject || `🎾 Note from ${coachName} — ZTennis (${formattedDate})`;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #E0749A; color: #ffffff; font-size: 11px; font-weight: 900; letter-spacing: 1px; padding: 6px 16px; border-radius: 999px; text-transform: uppercase;">
        COACH UPDATE
      </span>
      <h2 style="font-size: 24px; font-weight: 900; color: #1A1118; margin: 14px 0 6px 0;">Message from ${coachName}</h2>
      <p style="font-size: 14px; color: #64748B; margin: 0;">
        Regarding your session on <strong>${formattedDate} at ${formattedStart}</strong>
      </p>
    </div>

    <div style="background-color: #F8FAFC; border-left: 4px solid #E0749A; border-radius: 14px; padding: 20px 22px; margin: 24px 0;">
      <p style="font-size: 15px; color: #0F172A; margin: 0; line-height: 1.6; white-space: pre-wrap;">
${message}
      </p>
    </div>

    <div style="margin-top: 24px; text-align: center; font-size: 13px; color: #64748B;">
      Have questions or need to reply? You can reach ${coachName} at <strong style="color: #0F172A;">${coachPhone}</strong> or visit your trainee portal.
    </div>
  `;

  const html = wrapHtmlEmail({
    preheader: `${coachName}: "${message.substring(0, 60)}..."`,
    title: emailSubject,
    content,
    ctaText: 'View My Booking Portal →',
  });

  return sendEmail({
    to: booking.player_email,
    subject: emailSubject,
    html,
    text: `Message from ${coachName}:\n\n${message}\n\nSession: ${formattedDate} at ${formattedStart}`,
  });
}
