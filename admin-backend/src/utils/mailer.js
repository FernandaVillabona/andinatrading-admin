// utils/mailer.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,        // smtp.gmail.com
  port: Number(process.env.SMTP_PORT),// 465
  secure: String(process.env.SMTP_SECURE) === 'true', // true
  auth: {
    user: process.env.SMTP_USER,      // tu gmail
    pass: process.env.SMTP_PASS,      // app password (sin espacios)
  },
  tls: { minVersion: 'TLSv1.2' },
  connectionTimeout: 12000,
  socketTimeout: 15000,
  family: 4,          // fuerza IPv4 por si IPv6 da guerra
  logger: true,       // 🔍 logs smtp
  debug: true,        // 🔍 más detalle
});

export const verifyMailer = async () => {
  try {
    await transporter.verify();
    console.log('✉️  SMTP OK: conexión y auth correctas');
  } catch (e) {
    console.error('✉️  SMTP FAIL:', e?.message || e);
  }
};

export const sendMail = async ({ to, subject, html, text }) => {
  if (String(process.env.MAIL_ENABLED || 'true') !== 'true') {
    console.log('✉️ [DEV] MAIL_DISABLED. Simulado ->', to, subject);
    return { accepted: [to], messageId: 'dev-sim' };
  }
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
  return transporter.sendMail({ from, to, subject, html, text });
};
