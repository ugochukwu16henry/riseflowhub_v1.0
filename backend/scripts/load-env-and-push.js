#!/usr/bin/env node
'use strict';
// Load .env then .env.local (e.g. Supabase DATABASE_URL) so Prisma CLI sees them
require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });
const { execSync } = require('child_process');
execSync('npx prisma db push', { stdio: 'inherit', env: process.env });
