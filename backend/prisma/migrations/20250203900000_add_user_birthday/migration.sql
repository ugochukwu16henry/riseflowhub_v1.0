-- Add User.birthday if missing (schema was ahead of production DB)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birthday" DATE;
