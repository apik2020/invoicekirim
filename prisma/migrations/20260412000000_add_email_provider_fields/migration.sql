-- AlterTable: Add email provider fields to `users`
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailProviderMode" TEXT DEFAULT 'default';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailProvider" TEXT DEFAULT 'custom';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailFallbackEnabled" BOOLEAN DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailProviderStatus" TEXT DEFAULT 'untested';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailLastTestedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailTestTarget" TEXT;

-- AlterTable: Add email provider fields to `admins`
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "emailProvider" TEXT DEFAULT 'custom';
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "emailProviderStatus" TEXT DEFAULT 'untested';
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "emailLastTestedAt" TIMESTAMP(3);

-- AlterTable: Add headerImageUrl to `email_templates`
ALTER TABLE "email_templates" ADD COLUMN IF NOT EXISTS "headerImageUrl" TEXT;
