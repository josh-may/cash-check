import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

process.loadEnvFile('.env');
const email = process.env.SETUP_EMAIL?.trim().toLowerCase();
const password = process.env.SETUP_PASSWORD;
if (!email?.includes('@') || !password || password.length < 12) {
  throw new Error('Set SETUP_EMAIL and SETUP_PASSWORD (at least 12 characters) in .env.');
}
const prisma = new PrismaClient();
try {
  await prisma.user.create({ data: {
    email,
    password: await bcrypt.hash(password, 12),
    firstName: process.env.SETUP_NAME?.trim() || 'User',
    lastName: '',
    isSuperAdmin: true,
  } });
  console.log('Account created. Remove SETUP_* values from .env and sign in.');
} finally {
  await prisma.$disconnect();
}
