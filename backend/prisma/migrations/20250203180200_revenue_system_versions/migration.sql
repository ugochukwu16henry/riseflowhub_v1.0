-- CreateTable
CREATE TABLE "revenue_system_versions" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "version_type" VARCHAR(20) NOT NULL,
    "edited_by_id" TEXT,
    "edited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_system_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "revenue_system_versions_edited_at_idx" ON "revenue_system_versions"("edited_at");

-- AddForeignKey
ALTER TABLE "revenue_system_versions" ADD CONSTRAINT "revenue_system_versions_edited_by_id_fkey" FOREIGN KEY ("edited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
