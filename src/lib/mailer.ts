import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Single email sender for the whole app (Gmail SMTP via SMTP_USER / SMTP_PASS).

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials not configured. Set SMTP_USER and SMTP_PASS.');
  }
  transporter ??= nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export async function sendMail(opts: { to: string; subject: string; html: string }): Promise<void> {
  await getTransporter().sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    ...opts,
  });
}
