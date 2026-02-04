-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('login_failed', 'login_suspicious', 'rate_limit_exceeded', 'ip_blocked', 'anomaly_detected', 'mfa_challenge_failed', 'mfa_required');

-- CreateEnum
CREATE TYPE "SecuritySeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "SupportBannerEventType" AS ENUM ('shown', 'clicked_support', 'closed', 'dont_show_again');

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(255),
    "event_type" "SecurityEventType" NOT NULL,
    "severity" "SecuritySeverity" NOT NULL DEFAULT 'medium',
    "message" VARCHAR(500) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "auto_blocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_ips" (
    "id" TEXT NOT NULL,
    "ip" VARCHAR(64) NOT NULL,
    "reason" VARCHAR(255),
    "source" VARCHAR(60) NOT NULL,
    "blocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_by_id" TEXT,

    CONSTRAINT "blocked_ips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_banner_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" "SupportBannerEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_banner_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_events_user_id_created_at_idx" ON "security_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "security_events_ip_created_at_idx" ON "security_events"("ip", "created_at");

-- CreateIndex
CREATE INDEX "blocked_ips_ip_idx" ON "blocked_ips"("ip");

-- CreateIndex
CREATE INDEX "support_banner_events_user_id_created_at_idx" ON "support_banner_events"("user_id", "created_at");

-- Add columns to contact_messages if they don't exist (safe for existing DBs)
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(50);
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "attachment_url" VARCHAR(500);
ALTER TABLE "contact_messages" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'unread';

-- AddForeignKey (security_events -> users)
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey (blocked_ips -> users)
ALTER TABLE "blocked_ips" ADD CONSTRAINT "blocked_ips_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey (support_banner_events -> users)
ALTER TABLE "support_banner_events" ADD CONSTRAINT "support_banner_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
