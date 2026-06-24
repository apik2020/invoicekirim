-- Migrate DOKU columns to gateway columns
-- This migration script copies data from dokuOrderId and dokuTransactionId to gatewayOrderId and gatewayTransactionId

BEGIN;

-- Add new gateway columns if not exist
ALTER TABLE payments ADD COLUMN IF NOT EXISTS "gatewayOrderId" TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS "gatewayTransactionId" TEXT;

-- Copy data from dokuOrderId to gatewayOrderId
UPDATE payments
SET "gatewayOrderId" = "dokuOrderId"
WHERE "dokuOrderId" IS NOT NULL AND "gatewayOrderId" IS NULL;

-- Copy data from dokuTransactionId to gatewayTransactionId
UPDATE payments
SET "gatewayTransactionId" = "dokuTransactionId"
WHERE "dokuTransactionId" IS NOT NULL AND "gatewayTransactionId" IS NULL;

-- Create unique index on gatewayOrderId
CREATE UNIQUE INDEX IF NOT EXISTS "payments_gatewayOrderId_key" ON payments("gatewayOrderId");

-- Create index on gatewayOrderId
CREATE INDEX IF NOT EXISTS "payments_gatewayOrderId_idx" ON payments("gatewayOrderId");

-- Drop old indexes
DROP INDEX IF EXISTS "payments_dokuOrderId_key";
DROP INDEX IF EXISTS "payments_dokuOrderId_idx";

-- Drop old columns
ALTER TABLE payments DROP COLUMN IF EXISTS "dokuOrderId";
ALTER TABLE payments DROP COLUMN IF EXISTS "dokuTransactionId";

COMMIT;
