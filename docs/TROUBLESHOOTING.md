# Troubleshooting Guide

## Dashboard Loading Error

### Error Message
```
Gagal mengambil data dashboard. Silakan coba lagi.
```

### Possible Causes

#### 1. Database Connection Issue
**Symptoms:**
- Dashboard fails to load
- Error occurs immediately after login
- Console shows 503 error

**Solution:**
```bash
# Check if database is accessible
npx prisma db pull

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Test database connection
npx prisma studio
```

#### 2. Session/Authentication Issue
**Symptoms:**
- Gets 401 Unauthorized
- Redirected to login repeatedly
- Session cookie not being set

**Solution:**
1. Clear browser cookies for the app domain
2. Check `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in `.env`
3. Verify session middleware in `src/middleware.ts`

**Debug commands:**
```bash
# Check if session cookies are being set
# In browser console:
document.cookie

# Should see 'user_session' or 'next-auth.session-token'
```

#### 3. Missing Database Fields
**Symptoms:**
- Dashboard loads partially then crashes
- Specific Prisma error codes (P2025, P2002)
- Some data appears, others don't

**Solution:**
```bash
# Apply latest schema changes
npx prisma db push

# Or create migration
npx prisma migrate dev

# Regenerate Prisma client
npx prisma generate
```

#### 4. Slow Query Performance
**Symptoms:**
- Dashboard takes >30s to load
- Timeout errors
- Works in development but not production

**Solution:**
The dashboard API fetches all invoices for stats calculation. For users with many invoices, this can be slow.

**Optimize queries:**
```typescript
// Instead of:
const allInvoices = await prisma.invoices.findMany({ where: { userId } })

// Use aggregation:
const stats = await prisma.invoices.aggregate({
  where: { userId },
  _sum: { total: true },
  _count: { id: true }
})
```

### Debugging Steps

#### 1. Check Server Logs (Dokploy)
1. Go to Dokploy dashboard
2. Open your app → Logs tab
3. Look for errors containing:
   - `Error fetching dashboard data`
   - `Prisma error details`
   - Any database connection errors

#### 2. Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for:
   - `Dashboard API error:` with status code
   - Network errors
   - CORS errors

#### 3. Test API Directly
```bash
# Login first to get session cookie
# Then test API endpoint
curl -X GET 'https://your-domain.com/api/user/dashboard-data' \
  -H 'Cookie: user_session=...' \
  -v
```

#### 4. Enable Development Mode Logging
In production, add to `.env`:
```env
NODE_ENV=development
```

This will show detailed error messages including:
- Full error stack traces
- Prisma query details
- Error message details in API responses

**Important:** Remove this after debugging!

### Common Fixes

#### Fix 1: Clear and Regenerate Prisma Client
```bash
rm -rf node_modules/.prisma
npx prisma generate
npm run build
```

#### Fix 2: Reset Database Connection Pool
```bash
# In Dokploy, restart the app
# Or via CLI:
docker restart <container-name>
```

#### Fix 3: Verify Environment Variables
```bash
# Check all required env vars are set
cat .env | grep -E "DATABASE_URL|NEXTAUTH"

# In Dokploy, verify env vars in Settings → Environment
```

#### Fix 4: Check Database Health
```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Check if tables exist
\dt

# Check if user has permissions
SELECT * FROM users LIMIT 1;
SELECT * FROM invoices LIMIT 1;
```

### If Nothing Works

#### Last Resort: Safe Mode Dashboard
Create a minimal dashboard API that doesn't fetch all data:

**File:** `src/app/api/user/dashboard-data-minimal/route.ts`
```typescript
export async function GET() {
  const session = await getUserSession()
  if (!session?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Return minimal data
  return NextResponse.json({
    stats: {
      totalInvoices: 0,
      totalRevenue: 0,
      paidInvoices: 0,
      pendingInvoices: 0,
    },
    invoices: [],
    activityLogs: [],
    message: 'Dashboard running in safe mode'
  })
}
```

Then temporarily change frontend to use this endpoint.

### Getting Help

When reporting this issue, include:
1. **Server logs** from Dokploy (last 100 lines)
2. **Browser console** output
3. **Environment**: Production vs Development
4. **Steps to reproduce**: What you did before error occurred
5. **User info**: Account type, number of invoices/data

Example report:
```
Environment: Production (Dokploy)
User: user@example.com
Error: Dashboard fails to load with 500 error

Server log:
[timestamp] Error fetching dashboard data: ...
[timestamp] Prisma error details: { code: 'P2025', ... }

Browser console:
Dashboard API error: { status: 500, error: "..." }

Steps:
1. Login with Google OAuth
2. Click Dashboard link
3. See loading spinner for 5s
4. Error message appears
```
