import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,       
  port: Number(process.env.SMTP_PORT),
  secure: String(process.env.SMTP_SECURE) === 'true', 
  auth: {
    user: process.env.SMTP_USER,     
    pass: process.env.SMTP_PASS,      
  },
  tls: { minVersion: 'TLSv1.2' },
  connectionTimeout: 12000,
  socketTimeout: 15000,
  family: 4,        
  logger: true,      
  debug: true,       
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
