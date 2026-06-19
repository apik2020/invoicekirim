# Bug Fixes Log

## 2026-06-19: Fix SKU Unique Constraint Error (P2002)

### Problem
Users encountered `Prisma P2002` error when creating invoices:
```
Invalid `prisma.items.create()` invocation:
Unique constraint failed on the fields: (`sku`)
```

### Root Cause
1. The `sku` field in `items` table had a **global** unique constraint (`@unique`)
2. SKU could be `null` or empty string `""`
3. Multiple items with empty SKU caused duplicate constraint violations
4. Users from different accounts couldn't use the same SKU

### Solution

#### 1. Schema Change
Changed unique constraint from global to per-user:

**Before:**
```prisma
model items {
  sku String? @unique
  // ...
}
```

**After:**
```prisma
model items {
  sku String?
  // ...
  @@unique([userId, sku])
}
```

This allows:
- Different users to have items with the same SKU
- SKU is only unique within a user's item library

#### 2. Data Cleanup
Created script `scripts/fix-duplicate-skus.ts` to:
- Convert empty string SKUs to `null`
- Find and fix duplicate SKU entries per user
- Keep oldest item, nullify SKU on duplicates

#### 3. API Improvements

**[src/app/api/items/route.ts](../src/app/api/items/route.ts):**
- Normalize empty SKU strings to `null` before saving
- Add P2002 error handling with user-friendly message

**[src/app/api/items/[id]/route.ts](../src/app/api/items/[id]/route.ts):**
- Same normalization for update endpoint
- Add P2002 error handling

### Files Changed
- `prisma/schema.prisma` - Changed unique constraint
- `src/app/api/items/route.ts` - SKU normalization + error handling
- `src/app/api/items/[id]/route.ts` - SKU normalization + error handling
- `scripts/fix-duplicate-skus.ts` - Data cleanup script

### Deployment Steps
```bash
# 1. Cleanup existing duplicate data
npx tsx scripts/fix-duplicate-skus.ts

# 2. Apply schema changes
npx prisma db push

# 3. Build and deploy
npm run build
```

### Testing
- ✅ Can create items without SKU
- ✅ Can create items with empty SKU (converted to null)
- ✅ Can create items with duplicate SKU across different users
- ✅ Cannot create items with duplicate SKU for same user
- ✅ Proper error message on duplicate SKU

### Impact
- **Breaking change**: None (only affects internal constraint)
- **Data loss**: None (script preserves oldest item per duplicate group)
- **User experience**: Better - no more mysterious P2002 errors
