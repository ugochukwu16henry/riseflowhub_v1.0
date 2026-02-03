#!/usr/bin/env node
'use strict';
require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });

// Prisma expects DATABASE_URL; Supabase may provide POSTGRES_PRISMA_URL, etc.
const url = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!url || url.includes('HOST')) {
  console.error('FAIL: No valid DATABASE_URL found. Set DATABASE_URL (or POSTGRES_PRISMA_URL) in .env or .env.local to your Supabase connection string (no placeholder HOST).');
  process.exit(1);
}
process.env.DATABASE_URL = url;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    console.log('OK: App is connected to the database (Supabase).');
    return prisma.$queryRaw`SELECT 1 as ok`;
  })
  .then((rows) => {
    console.log('Query test:', rows);
    process.exit(0);
  })
  .catch((e) => {
    console.error('FAIL: Not connected to Supabase.');
    console.error('Error:', e.message);
    if (e.message && e.message.includes('HOST')) {
      console.error('Tip: Set DATABASE_URL in .env or .env.local to your Supabase connection string (no placeholder HOST).');
    }
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
