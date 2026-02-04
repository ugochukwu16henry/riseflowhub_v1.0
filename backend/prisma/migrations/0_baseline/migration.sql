-- Baseline: production DB already had schema before Prisma Migrate was introduced.
-- This migration must be marked as applied once (do not run the SQL):
--   pnpm prisma migrate resolve --applied "0_baseline"
-- Run that with DATABASE_URL pointing at production. Then deploy will apply later migrations.
SELECT 1;
