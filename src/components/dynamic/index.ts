/**
 * Dynamic imports for code splitting large components
 * These components will be loaded only when needed
 */

import { lazy } from 'react'

// Admin components - load only when accessing admin routes
export const AdminAnalytics = lazy(() =>
  import('@/app/admin/page').then(m => ({ default: m.default }))
)

export const AdminUsers = lazy(() =>
  import('@/app/admin/users/page').then(m => ({ default: m.default }))
)

export const AdminEmailTemplates = lazy(() =>
  import('@/app/admin/email-templates/page').then(m => ({ default: m.default }))
)

export const AdminActivityLogs = lazy(() =>
  import('@/app/admin/activity-logs/page').then(m => ({ default: m.default }))
)

// PDF components - load only when generating/viewing PDFs
export const InvoicePDF = lazy(() =>
  import('@/components/pdf/InvoicePDF').then(m => ({ default: m.InvoicePDF }))
)

export const ReceiptPDF = lazy(() =>
  import('@/components/pdf/ReceiptPDF').then(m => ({ default: m.ReceiptPDF }))
)

// Modal components - load only when opened
export const UserDetailModal = lazy(() =>
  import('@/components/admin/UserDetailModal').then(m => ({ default: m.UserDetailModal }))
)

export const EmailTemplateEditor = lazy(() =>
  import('@/components/admin/EmailTemplateEditor').then(m => ({ default: m.EmailTemplateEditor }))
)

// Billing components - load only on billing pages
export const BillingPage = lazy(() =>
  import('@/app/dashboard/billing/page').then(m => ({ default: m.default }))
)
