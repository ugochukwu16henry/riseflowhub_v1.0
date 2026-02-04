-- Legal Agreement Digital Signing System
-- Run after: npx prisma migrate dev --name add_agreement_digital_signing
-- Or apply manually if not using Prisma migrate.

-- Extend AgreementType enum (PostgreSQL)
ALTER TYPE "AgreementType" ADD VALUE IF NOT EXISTS 'Partnership';
ALTER TYPE "AgreementType" ADD VALUE IF NOT EXISTS 'Investor';

-- Add enum for document status (PostgreSQL)
DO $$ BEGIN
  CREATE TYPE "AgreementDocumentStatus" AS ENUM ('Pending', 'Completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add new columns to Agreement
ALTER TABLE "Agreement" ADD COLUMN IF NOT EXISTS "content_html" TEXT;
ALTER TABLE "Agreement" ADD COLUMN IF NOT EXISTS "created_by" UUID REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "Agreement" ADD COLUMN IF NOT EXISTS "status" "AgreementDocumentStatus" NOT NULL DEFAULT 'Pending';
ALTER TABLE "Agreement" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Agreement" ADD COLUMN IF NOT EXISTS "pdf_hash" VARCHAR(64);

-- Add new columns to AssignedAgreement (agreement_signers)
ALTER TABLE "AssignedAgreement" ADD COLUMN IF NOT EXISTS "role" VARCHAR(80);
ALTER TABLE "AssignedAgreement" ADD COLUMN IF NOT EXISTS "device_info" VARCHAR(500);

-- Backfill status for existing agreements: set Completed if all assignees have Signed
-- (Optional - run after applying columns)
-- UPDATE "Agreement" a SET status = 'Completed' WHERE EXISTS (
--   SELECT 1 FROM "AssignedAgreement" aa WHERE aa."agreement_id" = a.id
-- ) AND NOT EXISTS (SELECT 1 FROM "AssignedAgreement" aa2 WHERE aa2."agreement_id" = a.id AND aa2.status != 'Signed');
