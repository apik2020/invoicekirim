# Feature Access Control System - Documentation

## Overview

This document explains the complete Feature-Based Access Control (FBAC) system implemented in InvoiceKirim. The system controls user access to features based on their subscription plan.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
└─────┬───────┘     └──────┬───────┘     └────────┬────────┘
      │                    │                       │
      ▼                    ▼                       ▼
   User Action        Feature Key          Access Check
      │                    │                       │
      └────────────────────┼───────────────────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │ canAccess()     │
                    │ (Backend Check)  │
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
         [ALLOWED]                    [DENIED]
              │                             │
              ▼                             ▼
       Show Feature                Show Upgrade
       Execute Action              Lock UI
```

## Database Schema

### Tables

```sql
-- Master list of all features
pricing_features:
  - id (text, PK)
  - key (text, unique) -- e.g., 'PDF_EXPORT', 'ANALYTICS_VIEW'
  - name (text)
  - description (text)
  - sort_order (int)
  - is_active (boolean)

-- Available plans
pricing_plans:
  - id (text, PK)
  - name (text)
  - slug (text, unique) -- e.g., 'plan-free', 'plan-pro'
  - price (decimal)
  - trial_days (int)
  - is_active (boolean)

-- Link plans to features
pricing_plan_features:
  - plan_id (FK → pricing_plans)
  - feature_id (FK → pricing_features)
  - included (boolean) -- whether plan has this feature
  - limit_value (int, nullable) -- null = unlimited

-- User subscriptions
subscriptions:
  - id (text, PK)
  - user_id (text, unique)
  - status (text) -- FREE, TRIALING, ACTIVE, CANCELED
  - plan_type (text) -- FREE, PRO
  - pricing_plan_id (FK → pricing_plans)
  - trial_starts_at (timestamp)
  - trial_ends_at (timestamp)
```

## Backend API

### Core Function: `checkFeatureAccess()`

**Location:** `src/lib/feature-access.ts`

```typescript
export async function checkFeatureAccess(
  userId: string,
  featureKey: string
): Promise<FeatureAccessResult>

// Returns:
{
  allowed: boolean
  reason?: 'plan_limit' | 'feature_locked' | 'usage_exceeded' | 'trial_expired'
  limit?: number | null
  currentUsage?: number
  upgradeUrl?: string
  planName?: string
}
```

### Feature Check API Endpoint

**Endpoint:** `GET /api/features/:featureKey/check`

**Example Request:**
```bash
curl /api/features/ANALYTICS_VIEW/check
```

**Success Response (200):**
```json
{
  "allowed": true,
  "planName": "Pro",
  "limit": null,
  "currentUsage": 5
}
```

**Locked Response (403):**
```json
{
  "allowed": false,
  "reason": "feature_locked",
  "message": "Analytics is available in Pro plan. Upgrade now.",
  "upgradeUrl": "/checkout",
  "planName": "Free"
}
```

### Protected API Route Example

```typescript
// src/app/api/analytics/route.ts
import { checkFeatureAccess } from '@/lib/feature-access'
import { getUserSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getUserSession()
  if (!session?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 🔒 FEATURE CHECK
  const access = await checkFeatureAccess(session.id, 'ANALYTICS_VIEW')
  if (!access.allowed) {
    return NextResponse.json(
      {
        error: 'FEATURE_LOCKED',
        message: 'Upgrade to Pro for analytics access.',
        upgradeUrl: '/checkout'
      },
      { status: 403 }
    )
  }

  // Proceed with analytics logic...
}
```

## Frontend Usage

### React Hook: `useFeatureAccess()`

**Location:** `src/hooks/useFeatureAccess.ts`

```typescript
const {
  hasAccess,      // boolean
  isLoading,      // boolean
  limit,          // number | null
  usage,          // number | undefined
  reason,         // string | undefined
  showUpgradeModal,
  refresh
} = useFeatureAccess('ANALYTICS_VIEW')

if (isLoading) return <Spinner />
if (!hasAccess) return <LockedFeatureCard />
return <AnalyticsContent />
```

### Feature Gate Component

**Location:** `src/components/FeatureGate.tsx`

```typescript
<FeatureGate featureKey="ANALYTICS_VIEW">
  <AnalyticsDashboard />
</FeatureGate>

// With custom fallback:
<FeatureGate
  featureKey="ANALYTICS_VIEW"
  fallback={<CustomLockedState />}
>
  <AnalyticsDashboard />
</FeatureGate>
```

### Protected Button Component

**Location:** `src/components/buttons/FeatureProtectedButton.tsx`

```typescript
<FeatureProtectedButton
  featureKey="PDF_EXPORT"
  onClick={handleExport}
  icon={<Download />}
>
  Export PDF
</FeatureProtectedButton>

// When user doesn't have access:
// - Button is disabled
// - Shows lock icon
// - "PRO" badge
// - Opens upgrade modal on click
```

## Feature Keys Reference

| Key | Name | Description | Limited |
|-----|------|-------------|---------|
| `invoice_limit` | Batas Invoice | Jumlah invoice per bulan | Yes (Free: 10) |
| `templates` | Template Invoice | Akses template dasar | No |
| `INVOICE_TEMPLATE` | Template Custom | Template invoice kustom | No |
| `cloud_storage` | Simpan di Cloud | Penyimpanan cloud | No |
| `pdf_export` | Ekspor PDF | Export invoice ke PDF | Yes |
| `whatsapp` | Kirim via WhatsApp | Kirim via WhatsApp | No |
| `branding` | Custom Branding | Logo dan warna kustom | No |
| `EMAIL_SEND` | Kirim Email | Kirim invoice via email | Yes |
| `CLIENT_MANAGEMENT` | Klien | Manage client database | No |
| `ANALYTICS_VIEW` | Analitik | Lihat analitik bisnis | No |
| `TEAM_MEMBERS` | Tim | Kolaborasi dengan tim | No |
| `API_ACCESS` | Akses API | Akses API untuk integrasi | No |
| `priority_support` | Priority Support | Dukungan prioritas | No |

## Usage Tracking

### Track Feature Usage

```typescript
import { trackPdfExport, trackEmailSend } from '@/lib/feature-access'

// After successful export
await trackPdfExport(userId)

// After email sent
await trackEmailSend(userId)
```

### Current Tracking

Features tracked via `activity_logs`:
- **PDF Export**: Tracked when user exports invoice to PDF
- **Email Send**: Tracked when invoice sent via email
- **Invoice Create**: Tracked via `invoices.count()` (no explicit tracking needed)

## Security Best Practices

### ✅ DO

1. **Always validate on backend** - Never trust frontend
2. **Use middleware for routes** - Protect API endpoints
3. **Log denied access** - Track suspicious behavior
4. **Rate limit checks** - Prevent abuse
5. **Cache access decisions** - Improve performance

### ❌ DON'T

1. **Don't hide locked features** - Show them disabled
2. **Don't use client-only checks** - Backend must validate
3. **Don't hardcode features** - Use database
4. **Don't expose internal logic** - User-friendly messages

## Common Patterns

### Pattern 1: Feature-Gated Button

```typescript
<FeatureProtectedButton
  featureKey="PDF_EXPORT"
  onClick={handleExport}
>
  Export PDF
</FeatureProtectedButton>
```

### Pattern 2: Feature-Gated Section

```typescript
<FeatureSection featureKey="ANALYTICS_VIEW" title="Analytics">
  <AnalyticsDashboard />
</FeatureSection>
```

### Pattern 3: Conditional Rendering

```typescript
const { hasAccess } = useFeatureAccess('TEAM_MEMBERS')

return (
  <>
    <h2>Tim</h2>
    {hasAccess ? <TeamMembersList /> : <LockedTeamCard />}
  </>
)
```

### Pattern 4: API Route Protection

```typescript
const access = await checkFeatureAccess(userId, 'PDF_EXPORT')
if (!access.allowed) {
  return NextResponse.json(
    { error: 'FEATURE_LOCKED', upgradeUrl: '/checkout' },
    { status: 403 }
  )
}
```

## Testing

### Test Feature Access

```typescript
// Test user with Free plan
const result = await checkFeatureAccess(freeUserId, 'ANALYTICS_VIEW')
// Expected: { allowed: false, reason: 'feature_locked' }

// Test user with Pro plan
const result = await checkFeatureAccess(proUserId, 'ANALYTICS_VIEW')
// Expected: { allowed: true }

// Test user with expired trial
const result = await checkFeatureAccess(expiredTrialUserId, 'ANALYTICS_VIEW')
// Expected: { allowed: false, reason: 'trial_expired' }
```

### Mock Hook for Testing

```typescript
jest.mock('@/hooks/useFeatureAccess', () => ({
  useFeatureAccess: (featureKey) => ({
    hasAccess: false,
    isLoading: false,
    reason: 'feature_locked',
    showUpgradeModal: mockFn,
    refresh: async () => {}
  })
}))
```

## Troubleshooting

### Feature Always Returns "Not Allowed"

1. Check if user has subscription
2. Verify plan has feature: `SELECT * FROM pricing_plan_features WHERE plan_id = ? AND feature_id = ?`
3. Check feature is active: `SELECT * FROM pricing_features WHERE key = ? AND is_active = true`
4. Verify plan slug matches

### Usage Limit Not Working

1. Check `getFeatureUsage()` function in `feature-access.ts`
2. Ensure tracking functions are called: `trackPdfExport()`, etc.
3. Verify activity_logs entries exist

### Upgrade Modal Not Showing

1. Check `upgradeModalCallback` is set
2. Verify `UpgradeModal` component is rendered
3. Check `showUpgradeModal()` is being called

## Files Reference

| File | Purpose |
|------|---------|
| `src/lib/feature-access.ts` | Core access logic |
| `src/hooks/useFeatureAccess.ts` | React hook |
| `src/components/FeatureGate.tsx` | Wrapper component |
| `src/components/LockedFeatureCard.tsx` | Locked state UI |
| `src/components/UpgradeModal.tsx` | Upgrade modal |
| `src/app/api/features/[featureKey]/check/route.ts` | Check API |
| `scripts/seed-pricing.ts` | Seed data |

## Migration Guide

### Adding a New Feature

1. **Add to database:**
   ```sql
   INSERT INTO pricing_features (id, key, name, description, sort_order)
   VALUES ('feat-new-feature', 'NEW_FEATURE', 'New Feature', '...', 99);
   ```

2. **Add to plans:**
   ```sql
   INSERT INTO pricing_plan_features (plan_id, feature_id, included, limit_value)
   VALUES ('plan-pro', 'feat-new-feature', true, NULL);
   ```

3. **Use in components:**
   ```typescript
   const { hasAccess } = useFeatureAccess('NEW_FEATURE')
   ```

### Changing Feature Limits

```sql
-- Update limit for Free plan
UPDATE pricing_plan_features
SET limit_value = 20
WHERE plan_id = 'plan-free' AND feature_id = 'feat-invoice-limit';
```

---

**Last Updated:** 2025-03-28
**Version:** 1.0.0
