/**
 * Email service — provider-abstracted transactional email.
 *
 * Adapter selection by EMAIL_PROVIDER env var:
 *   - 'console' (default in dev): logs emails to stdout
 *   - 'smtp':                     SMTP via nodemailer (Resend/SendGrid SMTP/Mailgun/etc.)
 *   - 'noop':                     silently drops mail (use in CI/tests)
 *
 * Every call is fire-and-forget at the controller layer — never await in a
 * request handler. Errors are logged but do not surface to the user.
 */

const provider = (process.env.EMAIL_PROVIDER || 'console').toLowerCase();
const FROM = process.env.EMAIL_FROM || 'Confer <no-reply@confer.app>';

// --- Console adapter ---------------------------------------------------------
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

// --- SMTP adapter (lazy-loaded) ----------------------------------------------
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
      });
    }
    await smtpTransport.sendMail({ from: FROM, to, subject, html, text });
  },
};

// --- Noop adapter ------------------------------------------------------------
const noopAdapter = { async send() {} };

// --- Adapter selection -------------------------------------------------------
const adapters = { console: consoleAdapter, smtp: smtpAdapter, noop: noopAdapter };
const adapter = adapters[provider] || consoleAdapter;

const stripHtml = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const safeSend = async (payload) => {
  try {
    await adapter.send(payload);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[email] send failed:', err.message);
  }
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
  sendExpertApprovedEmail,
  sendExpertRejectedEmail,
  sendPasswordResetEmail,
  // expose raw for custom messages
  send: safeSend,
};
