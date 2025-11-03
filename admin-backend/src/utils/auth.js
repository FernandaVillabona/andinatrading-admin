import bcrypt from 'bcryptjs';

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

export const hashPassword = async (plain) => {
  const salt = await bcrypt.genSalt(ROUNDS);
  return bcrypt.hash(plain, salt);
};

export const randomPassword = (len = 12) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};
