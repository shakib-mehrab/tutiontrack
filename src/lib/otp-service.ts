import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import nodemailer from 'nodemailer';

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_SENDS_PER_HOUR = 5;

/** Cryptographically secure 6-digit code. */
export function generateOTP(): string {
  return randomInt(100000, 1000000).toString();
}

export function getOTPExpiry(): Date {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

/**
 * Codes are stored only as a keyed hash, so a leaked user document does not reveal a usable code.
 * The key is NEXTAUTH_SECRET, which the app already requires.
 */
export function hashOTP(otp: string, email: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET is not set');
  return createHmac('sha256', secret).update(`${email.toLowerCase()}:${otp}`).digest('hex');
}

/** Constant-time comparison of a submitted code against the stored hash. */
export function verifyOTPCode(providedOTP: string, email: string, storedHash: string): boolean {
  if (!/^\d{6}$/.test(providedOTP)) return false;
  const a = Buffer.from(hashOTP(providedOTP, email), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isOTPExpired(expiryTime: Date): boolean {
  return new Date() > expiryTime;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export async function sendOTPEmail(
  email: string,
  name: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: 'Your TuitionTrack verification code',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Verify your email</h2>
          <p>Hello ${escapeHtml(name)},</p>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 2px;">${otp}</h1>
          <p>This code is valid for ${OTP_TTL_MINUTES} minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
    return { success: true, message: 'OTP sent via email' };
  } catch (error) {
    console.error('OTP email error:', error);
    return { success: false, message: 'Failed to send OTP email' };
  }
}
