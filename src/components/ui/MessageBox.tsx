'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  Trash2,
  X,
  CheckCircle,
  Info,
  AlertCircle,
  LogOut,
  UserX,
  FileText,
  CreditCard,
  Shield,
  Clock,
  Loader2,
  Mail,
  Send,
  DollarSign,
  Settings,
  User,
  Users,
  UserPlus,
  Key,
  Webhook,
  Palette,
  Lock,
  FilePlus,
  Download,
  Copy,
  Sparkles,
  PartyPopper,
  Rocket,
  CheckCheck,
  BadgeCheck,
  Receipt
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export type MessageBoxVariant =
  | 'danger'      // Untuk aksi destruktif (delete, remove)
  | 'warning'     // Untuk peringatan
  | 'info'        // Untuk informasi umum
  | 'success'     // Untuk konfirmasi sukses
  | 'confirm'     // Untuk konfirmasi umum

export type MessageBoxSize = 'sm' | 'md' | 'lg'

interface ActionButton {
  label: string
  onClick: () => void | Promise<void>
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  loading?: boolean
  disabled?: boolean
}

interface MessageBoxProps {
  open: boolean
  onClose: () => void
  title: string
  message: string | React.ReactNode
  variant?: MessageBoxVariant
  size?: MessageBoxSize
  icon?: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  loading?: boolean
  actions?: ActionButton[]
  className?: string
  children?: React.ReactNode
}

// ============================================
// STYLES CONFIGURATION
// ============================================

const variantStyles = {
  danger: {
    overlay: 'bg-red-900/20 backdrop-blur-sm',
    container: 'bg-white border-2 border-red-100',
    iconWrapper: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200',
    icon: 'text-white',
    title: 'text-gray-900',
    message: 'text-gray-600',
    confirmBtn: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300',
    cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    defaultIcon: Trash2,
    defaultConfirmText: 'Hapus',
  },
  warning: {
    overlay: 'bg-amber-900/20 backdrop-blur-sm',
    container: 'bg-white border-2 border-amber-100',
    iconWrapper: 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-200',
    icon: 'text-white',
    title: 'text-gray-900',
    message: 'text-gray-600',
    confirmBtn: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300',
    cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    defaultIcon: AlertTriangle,
    defaultConfirmText: 'Lanjutkan',
  },
  info: {
    overlay: 'bg-blue-900/20 backdrop-blur-sm',
    container: 'bg-white border-2 border-blue-100',
    iconWrapper: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200',
    icon: 'text-white',
    title: 'text-gray-900',
    message: 'text-gray-600',
    confirmBtn: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300',
    cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    defaultIcon: Info,
    defaultConfirmText: 'Mengerti',
  },
  success: {
    overlay: 'bg-green-900/20 backdrop-blur-sm',
    container: 'bg-white border-2 border-green-100',
    iconWrapper: 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-200',
    icon: 'text-white',
    title: 'text-gray-900',
    message: 'text-gray-600',
    confirmBtn: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300',
    cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    defaultIcon: CheckCircle,
    defaultConfirmText: 'Selesai',
  },
  confirm: {
    overlay: 'bg-gray-900/20 backdrop-blur-sm',
    container: 'bg-white border-2 border-gray-100',
    iconWrapper: 'bg-gradient-to-br from-orange-500 to-pink-600 shadow-lg shadow-orange-200',
    icon: 'text-white',
    title: 'text-gray-900',
    message: 'text-gray-600',
    confirmBtn: 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300',
    cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    defaultIcon: AlertCircle,
    defaultConfirmText: 'Ya, Lanjutkan',
  },
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MessageBox({
  open,
  onClose,
  title,
  message,
  variant = 'confirm',
  size = 'md',
  icon,
  confirmText,
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  loading = false,
  actions,
  className,
  children,
}: MessageBoxProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const styles = variantStyles[variant]
  const DefaultIcon = styles.defaultIcon

  // Handle mount for portal
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Handle open/close animation
  useEffect(() => {
    if (open) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, closeOnEscape, onClose])

  const handleConfirm = useCallback(async () => {
    if (onConfirm) {
      setIsLoading(true)
      try {
        await onConfirm()
        onClose()
      } catch (error) {
        console.error('Confirm action failed:', error)
      } finally {
        setIsLoading(false)
      }
    } else {
      onClose()
    }
  }, [onConfirm, onClose])

  const handleCancel = useCallback(() => {
    onCancel?.()
    onClose()
  }, [onCancel, onClose])

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }, [closeOnOverlayClick, onClose])

  if (!mounted || !open) return null

  const content = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'transition-all duration-300',
        isVisible ? 'opacity-100' : 'opacity-0',
        styles.overlay
      )}
      onClick={handleOverlayClick}
    >
      {/* Dialog Container */}
      <div
        className={cn(
          'relative w-full rounded-2xl shadow-2xl',
          'transform transition-all duration-300',
          sizeStyles[size],
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          styles.container,
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="messagebox-title"
      >
        {/* Close Button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center',
              'transform transition-transform duration-300',
              isVisible ? 'scale-100 rotate-0' : 'scale-50 -rotate-12',
              styles.iconWrapper
            )}>
              {icon || <DefaultIcon className={cn('w-8 h-8', styles.icon)} />}
            </div>
          </div>

          {/* Title */}
          <h2
            id="messagebox-title"
            className={cn(
              'text-xl font-bold text-center mb-2',
              styles.title
            )}
          >
            {title}
          </h2>

          {/* Message */}
          <div className={cn(
            'text-center mb-6 text-sm leading-relaxed',
            styles.message
          )}>
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>

          {/* Children (for custom content) */}
          {children && (
            <div className="mb-6">
              {children}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Custom Actions or Default */}
            {actions ? (
              actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                  className={cn(
                    'flex-1 px-5 py-3 rounded-xl font-semibold text-sm',
                    'transition-all duration-200 transform hover:scale-[1.02]',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
                    'flex items-center justify-center gap-2',
                    action.variant === 'primary' && 'bg-orange-500 text-white hover:bg-orange-600',
                    action.variant === 'danger' && styles.confirmBtn,
                    action.variant === 'secondary' && styles.cancelBtn,
                    action.variant === 'ghost' && 'text-gray-600 hover:bg-gray-100',
                    !action.variant && styles.cancelBtn
                  )}
                >
                  {action.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {action.label}
                </button>
              ))
            ) : (
              <>
                {/* Cancel Button */}
                {(variant !== 'success' || onCancel) && (
                  <button
                    onClick={handleCancel}
                    disabled={loading || isLoading}
                    className={cn(
                      'flex-1 px-5 py-3 rounded-xl font-semibold text-sm',
                      'transition-all duration-200 transform hover:scale-[1.02]',
                      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
                      styles.cancelBtn
                    )}
                  >
                    {cancelText}
                  </button>
                )}

                {/* Confirm Button */}
                {onConfirm && (
                  <button
                    onClick={handleConfirm}
                    disabled={loading || isLoading}
                    className={cn(
                      'flex-1 px-5 py-3 rounded-xl font-semibold text-sm',
                      'transition-all duration-200 transform hover:scale-[1.02]',
                      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
                      'flex items-center justify-center gap-2',
                      styles.confirmBtn
                    )}
                  >
                    {(loading || isLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
                    {confirmText || styles.defaultConfirmText}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

// ============================================
// PRESET COMPONENTS
// ============================================

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  message: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

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

// ============================================
// SUCCESS DIALOGS - Untuk Proses Berhasil
// ============================================

// Base Success Dialog dengan animasi
interface SuccessDialogBaseProps {
  open: boolean
  onClose: () => void
  title?: string
  message: string | React.ReactNode
  buttonText?: string
  icon?: React.ReactNode
  iconBgClass?: string
  children?: React.ReactNode
}

function SuccessDialogBase({
  open,
  onClose,
  title = 'Berhasil!',
  message,
  buttonText = 'Selesai',
  icon,
  iconBgClass,
  children,
}: SuccessDialogBaseProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (open) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Pre-generated confetti positions to avoid Math.random() during render
  const confettiPositions = [
    { left: 12, top: 45, delay: 0.1 },
    { left: 78, top: 23, delay: 0.2 },
    { left: 34, top: 67, delay: 0.15 },
    { left: 89, top: 12, delay: 0.3 },
    { left: 56, top: 89, delay: 0.05 },
    { left: 23, top: 34, delay: 0.25 },
    { left: 67, top: 78, delay: 0.35 },
    { left: 45, top: 15, delay: 0.18 },
    { left: 91, top: 56, delay: 0.22 },
    { left: 8, top: 91, delay: 0.12 },
    { left: 52, top: 38, delay: 0.28 },
    { left: 19, top: 72, delay: 0.08 },
    { left: 73, top: 5, delay: 0.32 },
    { left: 36, top: 54, delay: 0.16 },
    { left: 84, top: 41, delay: 0.24 },
    { left: 61, top: 83, delay: 0.14 },
    { left: 27, top: 19, delay: 0.26 },
    { left: 95, top: 65, delay: 0.11 },
    { left: 42, top: 97, delay: 0.19 },
    { left: 15, top: 28, delay: 0.33 },
  ]
  const confettiColors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6']

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
      icon={icon}
      className={iconBgClass}
    >
      {children}
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confettiPositions.map((pos, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-ping"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                backgroundColor: confettiColors[i % 5],
                animationDelay: `${pos.delay}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      )}
    </MessageBox>
  )
}

// 1. Email Terkirim
export function EmailSentDialog({
  open,
  onClose,
  recipientEmail,
  emailType = 'email',
}: {
  open: boolean
  onClose: () => void
  recipientEmail: string
  emailType?: 'email' | 'reminder' | 'notification'
}) {
  const titles = {
    email: 'Email Terkirim!',
    reminder: 'Pengingat Terkirim!',
    notification: 'Notifikasi Terkirim!',
  }

  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title={titles[emailType]}
      message={
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-gray-600">
            Berhasil dikirim ke:
          </p>
          <p className="font-semibold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg inline-block">
            {recipientEmail}
          </p>
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
      icon={<Send className="w-8 h-8 text-white" />}
    />
  )
}

// 2. Invoice Terkirim
export function InvoiceSentDialog({
  open,
  onClose,
  invoiceNumber,
  clientName,
  clientEmail,
  onViewInvoice,
}: {
  open: boolean
  onClose: () => void
  invoiceNumber: string
  clientName: string
  clientEmail: string
  onViewInvoice?: () => void
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Invoice Berhasil Dikirim!"
      message={
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Nomor Invoice</span>
              <span className="font-bold text-gray-900">#{invoiceNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Klien</span>
              <span className="font-semibold text-gray-900">{clientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm text-gray-700">{clientEmail}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCheck className="w-5 h-5" />
            <span className="text-sm font-medium">Email terkirim ke klien</span>
          </div>
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
      icon={<FileText className="w-8 h-8 text-white" />}
    >
      {onViewInvoice && (
        <button
          onClick={onViewInvoice}
          className="w-full mt-2 px-4 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
        >
          Lihat Invoice →
        </button>
      )}
    </MessageBox>
  )
}

// 3. Pembayaran Diterima
export function PaymentReceivedDialog({
  open,
  onClose,
  amount,
  invoiceNumber,
  paymentMethod,
  receiptNumber,
  onViewReceipt,
}: {
  open: boolean
  onClose: () => void
  amount: string
  invoiceNumber: string
  paymentMethod: string
  receiptNumber?: string
  onViewReceipt?: () => void
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Pembayaran Diterima!"
      message={
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {amount}
            </div>
            <p className="text-sm text-gray-500">
              dari Invoice #{invoiceNumber}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Metode Pembayaran</span>
              <span className="font-medium text-gray-900">{paymentMethod}</span>
            </div>
            {receiptNumber && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">No. Receipt</span>
                <span className="font-medium text-gray-900">#{receiptNumber}</span>
              </div>
            )}
          </div>
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
      icon={<DollarSign className="w-8 h-8 text-white" />}
    >
      {onViewReceipt && (
        <button
          onClick={onViewReceipt}
          className="w-full mt-3 px-4 py-2.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Receipt className="w-4 h-4" />
          Lihat Receipt
        </button>
      )}
    </MessageBox>
  )
}

// 4. Invoice Dibuat
export function InvoiceCreatedDialog({
  open,
  onClose,
  invoiceNumber,
  totalAmount,
  clientName,
  onSend,
  onView,
}: {
  open: boolean
  onClose: () => void
  invoiceNumber: string
  totalAmount: string
  clientName: string
  onSend?: () => void
  onView?: () => void
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Invoice Berhasil Dibuat!"
      message={
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
              <FilePlus className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Invoice</span>
              <span className="font-bold text-gray-900">#{invoiceNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Klien</span>
              <span className="font-semibold text-gray-900">{clientName}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-orange-100">
              <span className="text-sm text-gray-500">Total</span>
              <span className="font-bold text-orange-600">{totalAmount}</span>
            </div>
          </div>
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
    >
      <div className="flex gap-2 mt-4">
        {onView && (
          <button
            onClick={onView}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-colors"
          >
            Lihat Invoice
          </button>
        )}
        {onSend && (
          <button
            onClick={onSend}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Kirim Sekarang
          </button>
        )}
      </div>
    </MessageBox>
  )
}

// 5. Invoice Diperbarui
export function InvoiceUpdatedDialog({
  open,
  onClose,
  invoiceNumber,
  changes,
}: {
  open: boolean
  onClose: () => void
  invoiceNumber: string
  changes?: string[]
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Invoice Diperbarui!"
      message={
        <div className="space-y-3">
          <p className="text-gray-600">
            Invoice <span className="font-semibold text-gray-900">#{invoiceNumber}</span> berhasil diperbarui.
          </p>
          {changes && changes.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium mb-2">Perubahan:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                {changes.map((change, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3" />
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
    />
  )
}

// 6. Pengaturan Disimpan
export function SettingsSavedDialog({
  open,
  onClose,
  settingsType = 'pengaturan',
}: {
  open: boolean
  onClose: () => void
  settingsType?: string
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Pengaturan Disimpan!"
      message={
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200">
              <Settings className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-gray-600">
            {settingsType.charAt(0).toUpperCase() + settingsType.slice(1)} berhasil disimpan dan akan diterapkan segera.
          </p>
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
    />
  )
}

// 7. Profil Diperbarui
export function ProfileUpdatedDialog({
  open,
  onClose,
  updatedFields,
}: {
  open: boolean
  onClose: () => void
  updatedFields?: string[]
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Profil Diperbarui!"
      message={
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          {updatedFields && updatedFields.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {updatedFields.map((field, i) => (
                <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                  {field}
                </span>
              ))}
            </div>
          )}
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
    />
  )
}

// 8. Anggota Tim Diundang
export function TeamMemberInvitedDialog({
  open,
  onClose,
  memberEmail,
  role,
  memberName,
}: {
  open: boolean
  onClose: () => void
  memberEmail: string
  role: string
  memberName?: string
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Undangan Terkirim!"
      message={
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow animate-bounce">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 space-y-2">
            {memberName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Nama</span>
                <span className="font-semibold text-gray-900">{memberName}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{memberEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Peran</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium capitalize">
                {role}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Undangan akan dikirim ke email tersebut. Anggota dapat bergabung setelah menerima undangan.
          </p>
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
    />
  )
}

// 9. API Key Dibuat
export function ApiKeyCreatedDialog({
  open,
  onClose,
  keyName,
  apiKey,
  onCopy,
}: {
  open: boolean
  onClose: () => void
  keyName: string
  apiKey: string
  onCopy?: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    onCopy?.()
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="API Key Dibuat!"
      message={
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-200">
              <Key className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Nama Key</span>
              <span className="font-semibold text-gray-900">{keyName}</span>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-gray-500">API Key</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-900 text-green-400 rounded-lg text-xs font-mono overflow-x-auto">
                  {apiKey}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copied ? (
                    <CheckCheck className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-600">
              Simpan API key ini dengan aman. Key hanya akan ditampilkan sekali ini saja.
            </p>
          </div>
        </div>
      }
      variant="success"
      confirmText="Saya Sudah Menyimpan"
      cancelText=""
      showCloseButton={false}
    />
  )
}

// 10. Webhook Dibuat
export function WebhookCreatedDialog({
  open,
  onClose,
  webhookName,
  webhookUrl,
  events,
}: {
  open: boolean
  onClose: () => void
  webhookName: string
  webhookUrl: string
  events: string[]
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Webhook Dibuat!"
      message={
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-200">
              <Webhook className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="bg-cyan-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Nama</span>
              <span className="font-semibold text-gray-900">{webhookName}</span>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-gray-500">URL</span>
              <code className="block px-3 py-2 bg-white rounded-lg text-xs text-gray-700 break-all">
                {webhookUrl}
              </code>
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm text-gray-500">Events:</span>
            <div className="flex flex-wrap gap-1">
              {events.map((event, i) => (
                <span key={i} className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs">
                  {event}
                </span>
              ))}
            </div>
          </div>
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
    />
  )
}

// 11. Branding Diperbarui
export function BrandingUpdatedDialog({
  open,
  onClose,
  previewUrl,
}: {
  open: boolean
  onClose: () => void
  previewUrl?: string
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Branding Diperbarui!"
      message={
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-200">
              <Palette className="w-7 h-7 text-white" />
            </div>
          </div>
          <p className="text-gray-600 text-center">
            Tampilan brand Anda telah diperbarui. Perubahan akan terlihat pada invoice dan halaman publik.
          </p>
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-sm text-pink-600 hover:text-pink-700"
            >
              Lihat Preview →
            </a>
          )}
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
    />
  )
}

// 12. Password Berhasil Diubah
export function PasswordChangedDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Password Diubah!"
      message={
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-sm text-green-700">
              Password akun Anda telah berhasil diubah.
            </p>
            <p className="text-xs text-green-600 mt-2">
              Gunakan password baru untuk login berikutnya.
            </p>
          </div>
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
    />
  )
}

// 13. Template Dibuat/Diperbarui
export function TemplateSavedDialog({
  open,
  onClose,
  templateName,
  isUpdate = false,
}: {
  open: boolean
  onClose: () => void
  templateName: string
  isUpdate?: boolean
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title={isUpdate ? 'Template Diperbarui!' : 'Template Dibuat!'}
      message={
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="bg-violet-50 rounded-xl p-4 text-center">
            <p className="font-semibold text-violet-900">{templateName}</p>
            <p className="text-sm text-violet-600 mt-1">
              {isUpdate
                ? 'Template berhasil diperbarui dan siap digunakan.'
                : 'Template baru telah dibuat dan siap digunakan.'}
            </p>
          </div>
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
    />
  )
}

// 14. Klien Dibuat
export function ClientCreatedDialog({
  open,
  onClose,
  clientName,
  clientEmail,
  onCreateInvoice,
}: {
  open: boolean
  onClose: () => void
  clientName: string
  clientEmail: string
  onCreateInvoice?: () => void
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Klien Ditambahkan!"
      message={
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
              <User className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="bg-teal-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Nama</span>
              <span className="font-semibold text-gray-900">{clientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm text-gray-700">{clientEmail}</span>
            </div>
          </div>
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
    >
      {onCreateInvoice && (
        <button
          onClick={onCreateInvoice}
          className="w-full mt-3 px-4 py-2.5 bg-teal-500 text-white hover:bg-teal-600 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <FilePlus className="w-4 h-4" />
          Buat Invoice untuk Klien Ini
        </button>
      )}
    </MessageBox>
  )
}

// 15. Dokumen Diunduh
export function DocumentDownloadedDialog({
  open,
  onClose,
  documentType,
  documentName,
}: {
  open: boolean
  onClose: () => void
  documentType: 'invoice' | 'receipt' | 'report' | 'export'
  documentName: string
}) {
  const typeConfig = {
    invoice: { icon: FileText, color: 'from-orange-500 to-pink-500', label: 'Invoice' },
    receipt: { icon: Receipt, color: 'from-green-500 to-emerald-500', label: 'Receipt' },
    report: { icon: FileText, color: 'from-blue-500 to-indigo-500', label: 'Laporan' },
    export: { icon: Download, color: 'from-purple-500 to-violet-500', label: 'Export' },
  }

  const config = typeConfig[documentType]
  const Icon = config.icon

  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Download Dimulai!"
      message={
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}>
              <Download className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="font-semibold text-gray-900">{documentName}</p>
            <p className="text-sm text-gray-500 mt-1">
              {config.label} sedang diunduh...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Memproses...</span>
          </div>
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
    />
  )
}

// 16. Akun Berhasil Dibuat (Welcome)
export function AccountCreatedDialog({
  open,
  onClose,
  userName,
  onSetup,
}: {
  open: boolean
  onClose: () => void
  userName: string
  onSetup?: () => void
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Selamat Datang!"
      message={
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500 flex items-center justify-center shadow-xl">
                <PartyPopper className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg text-gray-700">
              Halo, <span className="font-bold text-gray-900">{userName}</span>!
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Akun Anda telah berhasil dibuat. Mari mulai perjalanan invoicing Anda!
            </p>
          </div>
        </div>
      }
      variant="success"
      confirmText={onSetup ? "Mulai Setup" : "Mulai Sekarang"}
      cancelText=""
      showCloseButton={false}
    />
  )
}

// 17. Langganan Berhasil
export function SubscriptionActivatedDialog({
  open,
  onClose,
  planName,
  features,
  endDate,
}: {
  open: boolean
  onClose: () => void
  planName: string
  features?: string[]
  endDate?: string
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Langganan Aktif!"
      message={
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-xl">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <BadgeCheck className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 text-center">
            <p className="font-bold text-lg text-gray-900">{planName}</p>
            <p className="text-sm text-gray-500 mt-1">Sekarang Aktif</p>
          </div>
          {features && features.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Fitur yang tersedia:</p>
              <ul className="space-y-1">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {endDate && (
            <p className="text-xs text-center text-gray-500">
              Berlaku hingga: {endDate}
            </p>
          )}
        </div>
      }
      variant="success"
      confirmText="Mulai Gunakan"
      cancelText=""
      showCloseButton={false}
    />
  )
}

// 18. File/Logo Diupload
export function FileUploadedDialog({
  open,
  onClose,
  fileName,
  fileType,
  fileSize,
}: {
  open: boolean
  onClose: () => void
  fileName: string
  fileType: string
  fileSize?: string
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="File Berhasil Diupload!"
      message={
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Nama File</span>
              <span className="font-medium text-gray-900 truncate max-w-[150px]">{fileName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Tipe</span>
              <span className="text-sm text-gray-700">{fileType}</span>
            </div>
            {fileSize && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Ukuran</span>
                <span className="text-sm text-gray-700">{fileSize}</span>
              </div>
            )}
          </div>
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
    />
  )
}

// 19. Team Created Successfully
export function TeamCreatedDialog({
  open,
  onClose,
  teamName,
  onInviteMembers,
}: {
  open: boolean
  onClose: () => void
  teamName: string
  onInviteMembers?: () => void
}) {
  return (
    <MessageBox
      open={open}
      onClose={onClose}
      title="Tim Dibuat!"
      message={
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="font-bold text-indigo-900">{teamName}</p>
            <p className="text-sm text-indigo-600 mt-1">
              Tim Anda telah berhasil dibuat
            </p>
          </div>
        </div>
      }
      variant="success"
      confirmText="Selesai"
      cancelText=""
      showCloseButton={false}
    >
      {onInviteMembers && (
        <button
          onClick={onInviteMembers}
          className="w-full mt-3 px-4 py-2.5 bg-indigo-500 text-white hover:bg-indigo-600 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Undang Anggota
        </button>
      )}
    </MessageBox>
  )
}

// Export default
export default MessageBox
