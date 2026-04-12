-- AlterTable: Add headerImageUrl to `email_templates`
ALTER TABLE IF EXISTS "email_templates" ADD COLUMN IF NOT EXISTS "headerImageUrl" TEXT;
