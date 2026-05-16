/**
 * Email service — provider-abstracted transactional email.
 *
 * Adapter selection by EMAIL_PROVIDER env var:
 *   - 'console' (default in dev): logs emails to stdout
 *   - 'smtp':                     SMTP via nodemailer (Resend/SendGrid SMTP/Mailgun/etc.)
 *   - 'noop':                     silently drops mail (use in CI/tests)
 *
 * Reliability improvements:
 *   - Retry with exponential backoff (up to 3 attempts)
 *   - Structured logging for every send/failure
 *   - Duplicate prevention via in-memory dedup window
 *   - Connection pooling and keepAlive for SMTP
 *   - Timeout protection on SMTP transport
 */

const provider = (process.env.EMAIL_PROVIDER || 'console').toLowerCase();
const FROM = process.env.EMAIL_FROM || 'Confer <no-reply@confer.app>';

// ── Retry config ────────────────────────────────────────────────────────────
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 800;        // 800ms → 1600ms → 3200ms
const SMTP_TIMEOUT_MS = 15_000;   // 15 s per attempt
const DEDUP_WINDOW_MS = 60_000;   // 60 s dedup window

// ── Dedup cache ─────────────────────────────────────────────────────────────
const recentSends = new Map();

function dedupKey(to, subject) {
  return `${to}::${subject}`;
}

function isDuplicate(to, subject) {
  const key = dedupKey(to, subject);
  const last = recentSends.get(key);
  if (last && Date.now() - last < DEDUP_WINDOW_MS) {
    return true;
  }
  recentSends.set(key, Date.now());
  // Prune old entries periodically
  if (recentSends.size > 500) {
    const cutoff = Date.now() - DEDUP_WINDOW_MS;
    for (const [k, v] of recentSends) {
      if (v < cutoff) recentSends.delete(k);
    }
  }
  return false;
}

// ── Console adapter ─────────────────────────────────────────────────────────
const consoleAdapter = {
  async send({ to, subject, html, text }) {
    // eslint-disable-next-line no-console
    console.log(
      [
        '\n— Confer email (console adapter) —',
        `From:    ${FROM}`,
        `To:      ${to}`,
        `Subject: ${subject}`,
        '',
        text || stripHtml(html),
        '———————————————————————\n',
      ].join('\n')
    );
  },
};

// ── SMTP adapter (lazy-loaded, with connection pooling) ─────────────────────
let smtpTransport = null;
const smtpAdapter = {
  async send({ to, subject, html, text }) {
    if (!smtpTransport) {
      // eslint-disable-next-line global-require
      const { default: nodemailer } = await import('nodemailer');
      smtpTransport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        // Connection reliability
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: SMTP_TIMEOUT_MS,
      });

      // Verify transport on first creation
      try {
        await smtpTransport.verify();
        // eslint-disable-next-line no-console
        console.log('[email] SMTP transport verified successfully');
      } catch (verifyErr) {
        // eslint-disable-next-line no-console
        console.warn('[email] SMTP transport verify failed:', verifyErr.message);
        // Don't throw — we'll retry on actual send
      }
    }
    await smtpTransport.sendMail({ from: FROM, to, subject, html, text });
  },
};

// ── Noop adapter ────────────────────────────────────────────────────────────
const noopAdapter = { async send() {} };

// ── Adapter selection ───────────────────────────────────────────────────────
const adapters = { console: consoleAdapter, smtp: smtpAdapter, noop: noopAdapter };
const adapter = adapters[provider] || consoleAdapter;

const stripHtml = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// ── Sleep helper ────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send with retry + exponential backoff.
 * Logs structured info for every attempt and failure.
 * Prevents duplicate sends within the dedup window.
 */
const safeSend = async (payload) => {
  const { to, subject } = payload;

  // Guard: prevent duplicate sends within window
  if (isDuplicate(to, subject)) {
    // eslint-disable-next-line no-console
    console.warn(`[email] DEDUP — skipping duplicate send to="${to}" subject="${subject}"`);
    return;
  }

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await adapter.send(payload);
      // eslint-disable-next-line no-console
      console.log(`[email] OK — to="${to}" subject="${subject}" attempt=${attempt}/${MAX_RETRIES}`);
      return; // success — done
    } catch (err) {
      lastError = err;
      // eslint-disable-next-line no-console
      console.error(
        `[email] FAIL — to="${to}" subject="${subject}" attempt=${attempt}/${MAX_RETRIES} error="${err.message}"`
      );

      // Reset SMTP transport on connection errors to force reconnect
      if (
        provider === 'smtp' &&
        smtpTransport &&
        (err.code === 'ECONNRESET' ||
          err.code === 'ECONNREFUSED' ||
          err.code === 'ETIMEDOUT' ||
          err.code === 'ESOCKET' ||
          err.responseCode >= 500)
      ) {
        try { smtpTransport.close(); } catch (_) { /* ignore */ }
        smtpTransport = null;
        // eslint-disable-next-line no-console
        console.warn('[email] SMTP transport reset due to connection error');
      }

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  // All retries exhausted — log final failure
  // eslint-disable-next-line no-console
  console.error(
    `[email] EXHAUSTED — all ${MAX_RETRIES} attempts failed for to="${to}" subject="${subject}" lastError="${lastError?.message}"`
  );
};

// --- Reusable wrapper -------------------------------------------------------
const wrap = (title, body, cta) => `
<!doctype html>
<html><body style="margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f7f8fa;color:#13161c;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:32px;">Confer</div>
    <div style="background:white;border:1px solid #e2e6ed;border-radius:12px;padding:32px;">
      <h1 style="font-size:22px;font-weight:700;margin:0 0 16px;letter-spacing:-0.02em;">${title}</h1>
      <div style="font-size:15px;line-height:1.6;color:#3a4051;">${body}</div>
      ${cta ? `<div style="margin-top:24px;"><a href="${cta.url}" style="display:inline-block;background:#13161c;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${cta.label}</a></div>` : ''}
    </div>
    <div style="margin-top:24px;font-size:12px;color:#8a92a2;text-align:center;">
      Confer · Premium expert marketplace
    </div>
  </div>
</body></html>`;

// --- Public template helpers -------------------------------------------------
export const sendWelcomeEmail = (user) =>
  safeSend({
    to: user.email,
    subject: 'Welcome to Confer',
    html: wrap(
      `Welcome, ${user.name}`,
      `<p>You're all set. Confer is where you can book real conversations with vetted experts across India.</p>
       <p>Start by exploring categories — career, design, engineering, AI, fitness — or apply to become an expert yourself.</p>`,
      { url: `${process.env.PUBLIC_APP_URL || ''}/`, label: 'Browse experts' }
    ),
  });

export const sendBookingConfirmedEmail = (user, booking) =>
  safeSend({
    to: user.email,
    subject: `Your session is confirmed — ${booking.serviceName}`,
    html: wrap(
      'Your session is confirmed',
      `<p>Hi ${user.name},</p>
       <p>Your session <strong>${booking.serviceName}</strong> is locked in for <strong>${booking.date} at ${booking.timeSlot}</strong>.</p>
       <p>You can review and manage the session from your dashboard.</p>`,
      { url: `${process.env.PUBLIC_APP_URL || ''}/dashboard`, label: 'View booking' }
    ),
  });

export const sendBookingCancelledEmail = (user, booking) =>
  safeSend({
    to: user.email,
    subject: 'Session cancelled',
    html: wrap(
      'Your session was cancelled',
      `<p>The session <strong>${booking.serviceName}</strong> on ${booking.date} at ${booking.timeSlot} has been cancelled. Any payment will be refunded according to our policy.</p>`
    ),
  });

export const sendBookingReminderEmail = (user, booking, expert) =>
  safeSend({
    to: user.email || booking.email,
    subject: `Reminder: ${booking.serviceName} starts in 1 hour`,
    html: wrap(
      'Your session starts soon',
      `<p>Hi ${user.name || booking.name},</p>
       <p>This is a quick reminder that your session with <strong>${expert?.name || 'your expert'}</strong> starts in about 1 hour.</p>
       <p><strong>Date:</strong> ${booking.date}<br>
       <strong>Time:</strong> ${booking.timeSlot}<br>
       <strong>Duration:</strong> ${booking.serviceDuration || 60} minutes<br>
       <strong>Expert:</strong> ${expert?.name || 'Expert'}</p>
       <p>You can review the details from your dashboard.</p>`,
      { url: `${process.env.PUBLIC_APP_URL || ''}/dashboard`, label: 'View booking' }
    ),
  });

export const sendExpertApprovedEmail = (user) =>
  safeSend({
    to: user.email,
    subject: 'You\'re live on Confer',
    html: wrap(
      'You\'re now an expert on Confer',
      `<p>Hi ${user.name}, congratulations — your application has been approved. Your profile is live and clients can start booking sessions immediately.</p>
       <p>Head to your expert dashboard to fine-tune availability, services, and pricing.</p>`,
      { url: `${process.env.PUBLIC_APP_URL || ''}/expert-dashboard`, label: 'Open expert dashboard' }
    ),
  });

export const sendExpertRejectedEmail = (user, reason) =>
  safeSend({
    to: user.email,
    subject: 'Update on your Confer expert application',
    html: wrap(
      'Your application was not approved',
      `<p>Hi ${user.name}, thanks again for applying. After review, we're not able to approve your expert application at this time.</p>
       ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
       <p>You're welcome to reapply in the future as your experience grows.</p>`
    ),
  });

export const sendPasswordResetEmail = (user, resetUrl) =>
  safeSend({
    to: user.email,
    subject: 'Reset your Confer password',
    html: wrap(
      'Reset your password',
      `<p>Hi ${user.name},</p>
       <p>We received a request to reset your password. The link below expires in 60 minutes.</p>
       <p>If you didn't request this, you can safely ignore this email.</p>`,
      { url: resetUrl, label: 'Reset password' }
    ),
  });

export default {
  sendWelcomeEmail,
  sendBookingConfirmedEmail,
  sendBookingCancelledEmail,
  sendBookingReminderEmail,
  sendExpertApprovedEmail,
  sendExpertRejectedEmail,
  sendPasswordResetEmail,
  // expose raw for custom messages
  send: safeSend,
};
