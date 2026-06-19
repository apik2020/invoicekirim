# Bug Fixes Log

## 2026-06-19: Fix Dashboard 401 Unauthorized Error

### Problem
After successful login, users could access the dashboard page but got error:
```
Unauthorized
```

The dashboard would not load data, showing "Gagal mengambil data dashboard" error.

### Root Cause
**Session Format Mismatch** between frontend and API:

After security hardening (v0.1.91), session cookies were encrypted as **JWT tokens** for security. However, the dashboard API endpoint still tried to parse cookies as **plain JSON**:

```typescript
// Old code in dashboard API (WRONG)
const session = JSON.parse(userSessionCookie.value) // ❌ JWT can't be parsed as JSON
```

This caused:
1. ✅ User login works → JWT session cookie set
2. ✅ Dashboard page loads → Uses `getUserSession()` which decrypts JWT
3. ❌ Dashboard API fails → Uses plain `JSON.parse()` which can't decrypt JWT
4. ❌ Result: 401 Unauthorized error

### Solution
**Use centralized `getUserSession()` function** that properly handles:
- ✅ JWT encrypted sessions (new secure format)
- ✅ Plain JSON sessions (legacy backward compatibility)
- ✅ NextAuth sessions (OAuth login with Google, etc)

**Before:**
```typescript
// Custom function with plain JSON parse
const session = JSON.parse(userSessionCookie.value)
```

**After:**
```typescript
// Centralized function with JWT decryption
import { getUserSession } from '@/lib/session'
const session = await getUserSession()
```

### Files Changed
- [src/app/api/user/dashboard-data/route.ts](../src/app/api/user/dashboard-data/route.ts) - Use getUserSession()

### Code Cleanup
- Removed duplicate `getAuthenticatedUser()` function (70 lines)
- Simplified imports (removed unused dependencies)
- Added admin user detection with 403 response
- Enhanced logging with [Dashboard API] prefix

### Testing
- ✅ Login with email/password → Dashboard loads
- ✅ Login with Google OAuth → Dashboard loads
- ✅ Admin users get 403 redirect to /admin
- ✅ Legacy plain JSON sessions still work (backward compatible)

### Impact
- **Breaking change**: None (backward compatible)
- **User experience**: Dashboard now works after login
- **Security**: Maintains JWT encryption for sessions

---

## 2026-06-19: Improve Dashboard Error Handling and Logging

### Problem
Users encountered generic error message when dashboard fails to load:
```
Gagal mengambil data dashboard. Silakan coba lagi.
```

With no detailed information about what went wrong, making it difficult to diagnose:
- Database connection issues
- Session/authentication problems
- Missing data or schema mismatches
- Slow query performance

### Root Cause
The dashboard API had minimal error handling and logging:
- Caught all errors with generic message
- No specific handling for different Prisma error codes
- No development vs production error separation
- Session parsing errors were silent
- No logging to help debug production issues

### Solution

#### 1. Enhanced API Error Handling
Added specific handling for Prisma error codes:
- **P1001**: Database connection failed → 503 error with clear message
- **P2002**: Unique constraint violation
- **P2025**: Record not found → 404 error

Added development mode error details in responses while keeping production secure.

#### 2. Improved Session Handling
Added try-catch blocks in `getAuthenticatedUser()`:
- Graceful JSON parsing for session cookies
- Logging when admin users are detected
- Error logging without breaking the flow

#### 3. Better Frontend Error Handling
- Automatic redirect to `/login` on 401 errors
- Display detailed error messages in development
- Console logging with status codes and error data

#### 4. Comprehensive Logging
Added logging at key points:
- User ID when fetching dashboard data
- Session validation failures
- Prisma error details (code and message)
- Full error stack in development mode

### Files Changed
- [src/app/api/user/dashboard-data/route.ts](../src/app/api/user/dashboard-data/route.ts) - Enhanced error handling
- [src/app/dashboard/page.tsx](../src/app/dashboard/page.tsx) - Better error display
- [docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md) - New troubleshooting guide

### Debugging Features
- Development mode shows full error details in API responses
- Console logs track request flow
- Specific error messages for different failure modes
- Troubleshooting guide with common solutions

### Impact
- **Breaking change**: None
- **User experience**: Better error messages, faster diagnosis
- **Developer experience**: Much easier to debug production issues

---

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
