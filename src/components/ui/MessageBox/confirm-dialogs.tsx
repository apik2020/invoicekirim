'use client'

import { LogOut, UserX, CreditCard, FileText, Clock } from 'lucide-react'
import { MessageBox } from './core'
import type { ConfirmDialogProps } from './core'

// Delete Confirmation
export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Hapus Item?',
  message = 'Tindakan ini tidak dapat dibatalkan. Data yang dihapus tidak dapat dikembalikan.',
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  loading,
}: ConfirmDialogProps) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={message}
      variant="danger"
      confirmText={confirmText}
      cancelText={cancelText}
      loading={loading}
    />
  )
}

// Warning Confirmation
export function WarningConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Perhatian!',
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  loading,
}: ConfirmDialogProps) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={message}
      variant="warning"
      confirmText={confirmText}
      cancelText={cancelText}
      loading={loading}
    />
  )
}

// Logout Confirmation
export function LogoutConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Keluar dari Akun?',
  message = 'Anda yakin ingin keluar dari akun Anda? Anda perlu login kembali untuk mengakses dashboard.',
  confirmText = 'Ya, Keluar',
  cancelText = 'Tetap Di Sini',
  loading,
}: ConfirmDialogProps) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={message}
      variant="confirm"
      confirmText={confirmText}
      cancelText={cancelText}
      icon={<LogOut className="w-8 h-8 text-white" />}
      loading={loading}
    />
  )
}

// Remove Team Member
export function RemoveMemberDialog({
  open,
  onClose,
  onConfirm,
  memberName,
  loading,
}: ConfirmDialogProps & { memberName: string }) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Hapus Anggota Tim?"
      message={
        <div className="space-y-2">
          <p>
            Anda akan menghapus <span className="font-semibold text-gray-900">{memberName}</span> dari tim.
          </p>
          <p className="text-xs text-gray-500">
            Anggota yang dihapus tidak akan dapat mengakses data tim lagi.
          </p>
        </div>
      }
      variant="danger"
      confirmText="Ya, Hapus Anggota"
      cancelText="Batal"
      icon={<UserX className="w-8 h-8 text-white" />}
      loading={loading}
    />
  )
}

// Cancel Subscription
export function CancelSubscriptionDialog({
  open,
  onClose,
  onConfirm,
  planName,
  loading,
}: ConfirmDialogProps & { planName: string }) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Batalkan Langganan?"
      message={
        <div className="space-y-2">
          <p>
            Anda akan membatalkan langganan <span className="font-semibold text-gray-900">{planName}</span>.
          </p>
          <p className="text-xs text-gray-500">
            Anda dapat terus menggunakan fitur hingga periode berlangganan berakhir.
          </p>
        </div>
      }
      variant="warning"
      confirmText="Ya, Batalkan"
      cancelText="Tetap Berlangganan"
      icon={<CreditCard className="w-8 h-8 text-white" />}
      loading={loading}
    />
  )
}

// Send Invoice Confirmation
export function SendInvoiceDialog({
  open,
  onClose,
  onConfirm,
  clientName,
  invoiceNumber,
  loading,
}: ConfirmDialogProps & { clientName: string; invoiceNumber: string }) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Kirim Invoice?"
      message={
        <div className="space-y-2">
          <p>
            Invoice <span className="font-semibold text-gray-900">#{invoiceNumber}</span> akan dikirim ke:
          </p>
          <p className="font-semibold text-orange-600">{clientName}</p>
        </div>
      }
      variant="confirm"
      confirmText="Ya, Kirim Sekarang"
      cancelText="Batal"
      icon={<FileText className="w-8 h-8 text-white" />}
      loading={loading}
    />
  )
}

// Success Dialog
export function SuccessDialog({
  open,
  onClose,
  title = 'Berhasil!',
  message,
  buttonText = 'Selesai',
}: {
  open: boolean
  onClose: () => void
  title?: string
  message: string | React.ReactNode
  buttonText?: string
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title={title}
      message={message}
      variant="success"
      confirmText={buttonText}
      cancelText=""
      showCloseButton={false}
    />
  )
}

// Info Dialog
export function InfoDialog({
  open,
  onClose,
  title = 'Informasi',
  message,
  buttonText = 'Mengerti',
}: {
  open: boolean
  onClose: () => void
  title?: string
  message: string | React.ReactNode
  buttonText?: string
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title={title}
      message={message}
      variant="info"
      confirmText={buttonText}
      cancelText=""
      showCloseButton={false}
    />
  )
}

// Change Plan Dialog
export function ChangePlanDialog({
  open,
  onClose,
  onConfirm,
  currentPlan,
  newPlan,
  loading,
}: ConfirmDialogProps & { currentPlan: string; newPlan: string }) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Ganti Paket?"
      message={
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-gray-500">Saat ini:</span>
              <span className="font-semibold text-gray-900 ml-1">{currentPlan}</span>
            </div>
            <span className="text-gray-400">→</span>
            <div className="px-3 py-1.5 bg-orange-50 rounded-lg">
              <span className="text-orange-600">Baru:</span>
              <span className="font-semibold text-orange-700 ml-1">{newPlan}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Perubahan paket akan diterapkan segera.
          </p>
        </div>
      }
      variant="confirm"
      confirmText="Ya, Ganti Paket"
      cancelText="Batal"
      loading={loading}
    />
  )
}

// Unsaved Changes Dialog
export function UnsavedChangesDialog({
  open,
  onClose,
  onDiscard,
  onSave,
  loading,
}: {
  open: boolean
  onClose: () => void
  onDiscard: () => void
  onSave: () => void | Promise<void>
  loading?: boolean
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Perubahan Belum Disimpan"
      message="Anda memiliki perubahan yang belum disimpan. Apa yang ingin Anda lakukan?"
      variant="warning"
      showCloseButton={false}
      closeOnOverlayClick={false}
      actions={[
        {
          label: 'Buang Perubahan',
          onClick: onDiscard,
          variant: 'ghost',
        },
        {
          label: 'Simpan',
          onClick: onSave,
          variant: 'primary',
          loading,
        },
      ]}
    />
  )
}

// Session Timeout Warning
export function SessionTimeoutDialog({
  open,
  onClose,
  onExtend,
  remainingSeconds,
}: {
  open: boolean
  onClose: () => void
  onExtend: () => void
  remainingSeconds: number
}) {
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Sesi Akan Berakhir"
      message={
        <div className="space-y-2">
          <p>Sesi Anda akan berakhir dalam:</p>
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-orange-600">
            <Clock className="w-6 h-6" />
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Klik &ldquo;Perpanjang Sesi&rdquo; untuk tetap masuk.
          </p>
        </div>
      }
      variant="warning"
      confirmText="Perpanjang Sesi"
      cancelText="Keluar"
      onConfirm={onExtend}
      icon={<Clock className="w-8 h-8 text-white" />}
    />
  )
}
