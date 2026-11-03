/**
 * SMS Notification Service
 *
 * Supports:
 * 1. Semaphore (semaphore.co) — Primary gateway for Philippine mobile numbers (Globe, Smart, DITO)
 * 2. Twilio (twilio.com) — Secondary / global SMS gateway
 * 3. Simulation Mode — Automatic fallback when no API key is configured. Logs the SMS message
 *    to the console without errors, ensuring appointments can always be accepted smoothly.
 */

/**
 * Normalizes phone numbers to standard 11-digit Philippine mobile format (09xxxxxxxxx).
 * Handles numbers with "+63", "63", dashes, spaces, and leading zeroes.
 */
export function formatLocalPhilippineNumber(rawPhone) {
  if (!rawPhone) return '';
  // Strip all non-numeric characters except +
  let cleaned = String(rawPhone).trim().replace(/[^0-9+]/g, '');

  if (cleaned.startsWith('+63')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('63') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  } else if (cleaned.startsWith('9') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}

/**
 * Normalizes phone numbers to international E.164 format (+639xxxxxxxxx).
 */
export function formatE164(rawPhone) {
  const local = formatLocalPhilippineNumber(rawPhone);
  if (local.startsWith('09') && local.length === 11) {
    return '+63' + local.slice(1);
  }
  if (rawPhone && String(rawPhone).startsWith('+')) {
    return String(rawPhone).replace(/[^0-9+]/g, '');
  }
  return local;
}

/**
 * Formats a date string (YYYY-MM-DD) into a friendly human-readable format.
 */
function formatHumanDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats 24-hr time (HH:MM) into 12-hr time (e.g. 6:00 AM).
 */
function formatHumanTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Sends an SMS message to a recipient.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient phone number
 * @param {string} options.message - SMS content
 * @returns {Promise<{ sent: boolean, provider: string, simulated?: boolean, error?: string, raw?: any }>}
 */
export async function sendSms({ to, message }) {
  const localNumber = formatLocalPhilippineNumber(to);
  const e164Number = formatE164(to);

  // -------------------------------------------------------------------------
  // 1. SEMAPHORE (Recommended for Philippines)
  // -------------------------------------------------------------------------
  const semaphoreApiKey = process.env.SEMAPHORE_API_KEY;
  if (semaphoreApiKey) {
    try {
      const senderName = process.env.SEMAPHORE_SENDER_NAME || undefined;
      const payload = {
        apikey: semaphoreApiKey,
        number: localNumber,
        message,
        ...(senderName ? { sendername: senderName } : {}),
      };

      const res = await fetch('https://api.semaphore.co/api/v4/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || (data && data.error)) {
        console.error('Semaphore SMS Error:', data);
        return {
          sent: false,
          provider: 'semaphore',
          error: data.error || `HTTP ${res.status}`,
          raw: data,
        };
      }

      console.log(`[SMS SENT via Semaphore] To: ${localNumber}`);
      return {
        sent: true,
        provider: 'semaphore',
        simulated: false,
        recipient: localNumber,
        raw: data,
      };
    } catch (err) {
      console.error('Semaphore API network exception:', err.message);
      return {
        sent: false,
        provider: 'semaphore',
        error: err.message,
      };
    }
  }

  // -------------------------------------------------------------------------
  // 2. TWILIO (Global Gateway Alternative)
  // -------------------------------------------------------------------------
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuth && twilioPhone) {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');

      const bodyParams = new URLSearchParams();
      bodyParams.append('From', twilioPhone);
      bodyParams.append('To', e164Number);
      bodyParams.append('Body', message);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Twilio SMS Error:', data);
        return {
          sent: false,
          provider: 'twilio',
          error: data.message || `HTTP ${res.status}`,
          raw: data,
        };
      }

      console.log(`[SMS SENT via Twilio] To: ${e164Number}`);
      return {
        sent: true,
        provider: 'twilio',
        simulated: false,
        recipient: e164Number,
        raw: data,
      };
    } catch (err) {
      console.error('Twilio API network exception:', err.message);
      return {
        sent: false,
        provider: 'twilio',
        error: err.message,
      };
    }
  }

  // -------------------------------------------------------------------------
  // 3. SIMULATION MODE (Safe Fallback if API keys are not yet configured)
  // -------------------------------------------------------------------------
  console.log('============================================================');
  console.log('📱 [SMS NOTIFICATION - SIMULATION MODE]');
  console.log(`To: ${localNumber || to}`);
  console.log(`Content: "${message}"`);
  console.log('ℹ️  Tip: To send real live SMS to mobile phones, add SEMAPHORE_API_KEY in your Render Environment Variables.');
  console.log('============================================================');

  return {
    sent: true,
    simulated: true,
    provider: 'simulator',
    recipient: localNumber || to,
    message,
    note: 'SMS simulated successfully. Add SEMAPHORE_API_KEY in Render to send live SMS.',
  };
}

/**
 * Prepares and sends an automated SMS notification when a booking status changes.
 *
 * @param {Object} booking - Booking database object
 * @param {'confirmed' | 'declined' | 'completed'} newStatus - New status
 * @param {Object} [coachProfile] - Optional coach profile info
 * @returns {Promise<Object>} SMS result
 */
export async function sendBookingStatusSms(booking, newStatus, coachProfile = null) {
  if (!booking || !booking.player_contact) {
    return { sent: false, error: 'No contact number provided for booking' };
  }

  const coachName = coachProfile?.name || 'Coach Z';
  const coachPhone = coachProfile?.phone ? ` Coach phone: ${coachProfile.phone}.` : '';
  const dateFormatted = formatHumanDate(booking.booking_date);
  const timeFormatted = `${formatHumanTime(booking.start_time)} - ${formatHumanTime(booking.end_time)}`;
  const playerName = booking.player_name || 'Trainee';

  let smsMessage = '';

  if (newStatus === 'confirmed') {
    smsMessage = `Hi ${playerName}! Your tennis coaching session with ${coachName} on ${dateFormatted} at ${timeFormatted} (Malaybalay Public Court) has been CONFIRMED. See you on the court! Please bring your racket and water.${coachPhone}`;
  } else if (newStatus === 'declined') {
    smsMessage = `Hi ${playerName}, thank you for your booking request on ${dateFormatted} at ${timeFormatted}. Unfortunately, ${coachName} cannot accommodate this schedule at this time. Please visit the website to choose another open morning slot.${coachPhone}`;
  } else if (newStatus === 'completed') {
    smsMessage = `Hi ${playerName}, great session today! Thank you for training with ${coachName}. Keep practicing your strokes and footwork. See you next time!`;
  } else {
    // Other statuses don't trigger automatic SMS
    return { sent: false, error: `No automated SMS configured for status "${newStatus}"` };
  }

  const result = await sendSms({
    to: booking.player_contact,
    message: smsMessage,
  });

  return {
    ...result,
    sms_text: smsMessage,
  };
}

