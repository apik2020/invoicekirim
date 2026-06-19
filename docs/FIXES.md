# Bug Fixes Log

## 2026-06-19: Fix Template Loading Error - `.find()` is not a function

### Problem
Users encountered JavaScript error when clicking "Gunakan" button on invoice templates:
```
Error loading template: TypeError: (intermediate value).find is not a function
```

### Root Cause
The `/api/clients` endpoint returns a **paginated response** with structure:
```json
{
  "data": [...],
  "pagination": {...}
}
```

But frontend code was treating the response as a plain array and calling `.find()` directly on it, which failed because the response object doesn't have a `.find()` method.

### Solution
Updated all pages that fetch `/api/clients` to properly handle the paginated response structure:

**Before:**
```typescript
const clients = await res.json()
const client = clients.find(...) // ❌ Error: clients is an object, not array
```

**After:**
```typescript
const data = await res.json()
const clients = Array.isArray(data) ? data : (data.data || data.clients || [])
const client = clients.find(...) // ✅ Works correctly
```

### Files Changed
- [src/app/dashboard/invoices/create/page.tsx](../src/app/dashboard/invoices/create/page.tsx) - Fixed `loadClients()` and template loading
- [src/app/dashboard/invoices/[id]/edit/page.tsx](../src/app/dashboard/invoices/[id]/edit/page.tsx) - Fixed `fetchClients()`
- [src/app/dashboard/templates/create/page.tsx](../src/app/dashboard/templates/create/page.tsx) - Fixed `loadClients()`
- [src/app/dashboard/clients/page.tsx](../src/app/dashboard/clients/page.tsx) - Fixed `fetchClients()`

### Testing
- ✅ Can click "Gunakan" button on templates
- ✅ Template loads correctly with all fields
- ✅ Client dropdown works in invoice create/edit pages
- ✅ No console errors when loading clients

### Impact
- **Breaking change**: None
- **User experience**: Templates now work correctly

---

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
