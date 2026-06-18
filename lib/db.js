// Lazy, build-safe Prisma singleton.
// PrismaClient is only constructed on first use AND only when DATABASE_URL is set,
// so `next build` and local mode never crash on a missing database connection.
import { PrismaClient } from '@prisma/client';
import { hasDatabase } from './config';

const globalForPrisma = globalThis;

/** @returns {import('@prisma/client').PrismaClient | null} */
export function getDb() {
  if (!hasDatabase) return null;
  if (!globalForPrisma.__prisma) {
    globalForPrisma.__prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return globalForPrisma.__prisma;
}
