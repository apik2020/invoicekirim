'use client'

import { useState } from 'react'
import { Users, UserPlus, Key, Webhook, Palette, Lock, FilePlus, Download, Copy, Sparkles, PartyPopper, Rocket, CheckCheck, CheckCircle, BadgeCheck, Receipt, FileText, User, AlertTriangle, Loader2 } from 'lucide-react'
import { MessageBox } from './core'

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

