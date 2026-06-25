import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromEmail = process.env.SMTP_FROM || "noreply@optima.app";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
  }

  return transporter;
}

export async function sendEmail(to: string, subject: string, body: string) {
  const t = getTransporter();

  if (t) {
    try {
      await t.sendMail({
        from: fromEmail,
        to,
        subject,
        text: body,
      });
      console.log(`[EMAIL] Sent to ${to}: ${subject}`);
      return true;
    } catch (err) {
      console.error(`[EMAIL] Failed to send to ${to}:`, err);
      return false;
    }
  }

  // Fallback: log to console
  console.log("=".repeat(60));
  console.log(`[EMAIL FALLBACK] To: ${to}`);
  console.log(`[EMAIL FALLBACK] Subject: ${subject}`);
  console.log(`[EMAIL FALLBACK] Body:\n${body}`);
  console.log("=".repeat(60));
  return true;
}

export function isEmailConfigured() {
  return !!(smtpHost && smtpUser && smtpPass);
}
