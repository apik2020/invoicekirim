'use client'

import { useState, useEffect } from 'react'
import { Mail, Send, FileText, DollarSign, Receipt, CheckCheck, CheckCircle, Settings, User, FilePlus } from 'lucide-react'
import { MessageBox } from './core'

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
