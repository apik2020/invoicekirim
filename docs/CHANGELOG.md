# Changelog

Semua perubahan penting pada NotaBener akan didokumentasikan di sini.

---

## [v0.1.89] — 2026-05-20

### Added: Confirmation Dialog pada Seluruh Aksi Destructive

Mengganti seluruh `window.confirm()` native browser dengan komponen `MessageBox` kustom yang konsisten dengan desain aplikasi.

#### Logout Confirmation (4 lokasi)

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `DashboardHeader.tsx` | Dropdown menu user → Logout | Konfirmasi sebelum logout dari dashboard |
| `DashboardSidebar.tsx` | Sidebar footer → Logout | Konfirmasi sebelum logout dari sidebar desktop |
| `DashboardSidebar.tsx` | Mobile Bottom Nav → More → Logout | Konfirmasi sebelum logout dari navigasi mobile |
| `ClientDashboardSidebar.tsx` | Sidebar footer → Logout | Konfirmasi sebelum logout dari portal klien |

#### Delete & Destructive Action Confirmation (9 file, 11 aksi)

| File | Aksi | Varian |
|------|------|--------|
| `admin/users/page.tsx` | Hapus user | `danger` |
| `admin/settings/pricing/page.tsx` | Hapus paket pricing | `danger` |
| `admin/announcements/page.tsx` | Hapus pengumuman | `danger` |
| `admin/payments/page.tsx` | Refund pembayaran | `warning` |
| `admin/email-templates/page.tsx` | Hapus template email | `danger` |
| `admin/client-access/page.tsx` | Reset subscription ke Free | `warning` |
| `components/admin/EmailTemplateEditor.tsx` | Reset template ke default | `warning` |
| `components/billing/SubscriptionManager.tsx` | Mulai trial PRO | `confirm` |
| `components/billing/SubscriptionManager.tsx` | Batalkan langganan | `warning` |
| `components/billing/SubscriptionManager.tsx` | Downgrade ke FREE | `warning` |
| `dashboard/invoices/page.tsx` | Hapus invoice | `danger` |

#### Perubahan Teknis

- Semua dialog menggunakan `useMessageBox` hook + komponen `MessageBox` dari `@/components/ui/MessageBox`
- Menghapus seluruh penggunaan `window.confirm()` dan `window.alert()` pada file yang dimodifikasi
- Error handling setelah konfirmasi juga menggunakan `MessageBox` (bukan `alert()`)
- Dialog mendukung loading state untuk operasi async

#### File yang Diubah

```
src/components/DashboardHeader.tsx
src/components/DashboardSidebar.tsx
src/components/ClientDashboardSidebar.tsx
src/app/admin/users/page.tsx
src/app/admin/settings/pricing/page.tsx
src/app/admin/announcements/page.tsx
src/app/admin/payments/page.tsx
src/app/admin/email-templates/page.tsx
src/app/admin/client-access/page.tsx
src/components/admin/EmailTemplateEditor.tsx
src/components/billing/SubscriptionManager.tsx
src/app/dashboard/invoices/page.tsx
```

---

## [v0.1.88] — 2026-05-19

### Fixed
- Security hardening — auth checks, CORS fix, error detail removal

---

## [v0.1.87] — 2026-05-18

### Changed
- Remove Vercel configuration files

---

## [v0.1.86] — 2026-05-17

### Added
- Business address on landing page and dashboard footer

---

## [v0.1.85] — 2026-05-16

### Fixed
- Parse iPaymu v2 transaction status response correctly

---

## [v0.1.84] — 2026-05-15

### Added
- Auto-redirect to dashboard 3 seconds after payment success
