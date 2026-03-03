import { useState, useCallback } from 'react'
import type { MessageBoxVariant } from '@/components/ui/MessageBox'

interface MessageBoxState {
  open: boolean
  title: string
  message: string | React.ReactNode
  variant: MessageBoxVariant
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  // Additional props for custom success dialogs
  children?: React.ReactNode
  icon?: React.ReactNode
}

interface UseMessageBoxReturn {
  state: MessageBoxState
  showConfirm: (options: {
    title: string
    message: string | React.ReactNode
    variant?: MessageBoxVariant
    confirmText?: string
    cancelText?: string
    onConfirm: () => void | Promise<void>
    onCancel?: () => void
  }) => void
  showDelete: (options: {
    title?: string
    message?: string | React.ReactNode
    confirmText?: string
    onConfirm: () => void | Promise<void>
  }) => void
  showWarning: (options: {
    title?: string
    message: string | React.ReactNode
    confirmText?: string
    onConfirm: () => void | Promise<void>
  }) => void
  showSuccess: (options: {
    title?: string
    message: string | React.ReactNode
    buttonText?: string
    onClose?: () => void
    icon?: React.ReactNode
    children?: React.ReactNode
  }) => void
  showInfo: (options: {
    title?: string
    message: string | React.ReactNode
    buttonText?: string
    onClose?: () => void
  }) => void
  // New success shortcuts
  showEmailSent: (email: string, type?: 'email' | 'reminder' | 'notification') => void
  showInvoiceSent: (invoiceNumber: string, clientName: string, clientEmail: string) => void
  showPaymentReceived: (amount: string, invoiceNumber: string, method: string) => void
  showInvoiceCreated: (invoiceNumber: string, amount: string, clientName: string) => void
  showInvoiceUpdated: (invoiceNumber: string, changes?: string[]) => void
  showSettingsSaved: (type?: string) => void
  showProfileUpdated: (fields?: string[]) => void
  showTeamMemberInvited: (email: string, role: string, name?: string) => void
  showApiKeyCreated: (keyName: string) => void
  showWebhookCreated: (name: string, url: string, events: string[]) => void
  showBrandingUpdated: () => void
  showPasswordChanged: () => void
  showTemplateSaved: (name: string, isUpdate?: boolean) => void
  showClientCreated: (name: string, email: string) => void
  showDownloadStarted: (type: 'invoice' | 'receipt' | 'report' | 'export', name: string) => void
  showAccountCreated: (userName: string) => void
  showSubscriptionActivated: (planName: string, features?: string[]) => void
  showFileUploaded: (fileName: string, fileType: string, fileSize?: string) => void
  close: () => void
  setLoading: (loading: boolean) => void
}

const initialState: MessageBoxState = {
  open: false,
  title: '',
  message: '',
  variant: 'confirm',
}

export function useMessageBox(): UseMessageBoxReturn {
  const [state, setState] = useState<MessageBoxState>(initialState)

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }))
  }, [])

  const showConfirm = useCallback((options: {
    title: string
    message: string | React.ReactNode
    variant?: MessageBoxVariant
    confirmText?: string
    cancelText?: string
    onConfirm: () => void | Promise<void>
    onCancel?: () => void
  }) => {
    setState({
      open: true,
      title: options.title,
      message: options.message,
      variant: options.variant || 'confirm',
      confirmText: options.confirmText,
      cancelText: options.cancelText || 'Batal',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      loading: false,
    })
  }, [])

  const showDelete = useCallback((options: {
    title?: string
    message?: string | React.ReactNode
    confirmText?: string
    onConfirm: () => void | Promise<void>
  }) => {
    setState({
      open: true,
      title: options.title || 'Hapus Item?',
      message: options.message || 'Tindakan ini tidak dapat dibatalkan. Data yang dihapus tidak dapat dikembalikan.',
      variant: 'danger',
      confirmText: options.confirmText || 'Ya, Hapus',
      cancelText: 'Batal',
      onConfirm: options.onConfirm,
      loading: false,
    })
  }, [])

  const showWarning = useCallback((options: {
    title?: string
    message: string | React.ReactNode
    confirmText?: string
    onConfirm: () => void | Promise<void>
  }) => {
    setState({
      open: true,
      title: options.title || 'Perhatian!',
      message: options.message,
      variant: 'warning',
      confirmText: options.confirmText || 'Ya, Lanjutkan',
      cancelText: 'Batal',
      onConfirm: options.onConfirm,
      loading: false,
    })
  }, [])

  const showSuccess = useCallback((options: {
    title?: string
    message: string | React.ReactNode
    buttonText?: string
    onClose?: () => void
    icon?: React.ReactNode
    children?: React.ReactNode
  }) => {
    setState({
      open: true,
      title: options.title || 'Berhasil!',
      message: options.message,
      variant: 'success',
      confirmText: options.buttonText || 'Selesai',
      cancelText: '',
      onConfirm: options.onClose || close,
      loading: false,
      icon: options.icon,
      children: options.children,
    })
  }, [close])

  const showInfo = useCallback((options: {
    title?: string
    message: string | React.ReactNode
    buttonText?: string
    onClose?: () => void
  }) => {
    setState({
      open: true,
      title: options.title || 'Informasi',
      message: options.message,
      variant: 'info',
      confirmText: options.buttonText || 'Mengerti',
      cancelText: '',
      onConfirm: options.onClose || close,
      loading: false,
    })
  }, [close])

  // ============================================
  // SUCCESS SHORTCUT METHODS
  // ============================================

  const showEmailSent = useCallback((email: string, type: 'email' | 'reminder' | 'notification' = 'email') => {
    const titles = {
      email: 'Email Terkirim!',
      reminder: 'Pengingat Terkirim!',
      notification: 'Notifikasi Terkirim!',
    }
    setState({
      open: true,
      title: titles[type],
      message: (
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600">Berhasil dikirim ke:</p>
          <p className="font-semibold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg inline-block">
            {email}
          </p>
        </div>
      ),
      variant: 'success',
      confirmText: 'Selesai',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showInvoiceSent = useCallback((invoiceNumber: string, clientName: string, clientEmail: string) => {
    setState({
      open: true,
      title: 'Invoice Berhasil Dikirim!',
      message: (
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Email terkirim ke klien</span>
          </div>
        </div>
      ),
      variant: 'success',
      confirmText: 'Selesai',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showPaymentReceived = useCallback((amount: string, invoiceNumber: string, method: string) => {
    setState({
      open: true,
      title: 'Pembayaran Diterima!',
      message: (
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
              <span className="font-medium text-gray-900">{method}</span>
            </div>
          </div>
        </div>
      ),
      variant: 'success',
      confirmText: 'Selesai',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showInvoiceCreated = useCallback((invoiceNumber: string, amount: string, clientName: string) => {
    setState({
      open: true,
      title: 'Invoice Berhasil Dibuat!',
      message: (
        <div className="space-y-4">
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
              <span className="font-bold text-orange-600">{amount}</span>
            </div>
          </div>
        </div>
      ),
      variant: 'success',
      confirmText: 'Selesai',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showInvoiceUpdated = useCallback((invoiceNumber: string, changes?: string[]) => {
    setState({
      open: true,
      title: 'Invoice Diperbarui!',
      message: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 text-center">
            Invoice <span className="font-semibold text-gray-900">#{invoiceNumber}</span> berhasil diperbarui.
          </p>
          {changes && changes.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-600 font-medium mb-2">Perubahan:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                {changes.map((change, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
      variant: 'success',
      confirmText: 'Selesai',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showSettingsSaved = useCallback((type: string = 'pengaturan') => {
    setState({
      open: true,
      title: 'Pengaturan Disimpan!',
      message: (
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600">
            {type.charAt(0).toUpperCase() + type.slice(1)} berhasil disimpan dan akan diterapkan segera.
          </p>
        </div>
      ),
      variant: 'success',
      confirmText: 'Selesai',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showProfileUpdated = useCallback((fields?: string[]) => {
    setState({
      open: true,
      title: 'Profil Diperbarui!',
      message: (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          {fields && fields.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {fields.map((field, i) => (
                <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                  {field}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
      variant: 'success',
      confirmText: 'Selesai',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showTeamMemberInvited = useCallback((email: string, role: string, name?: string) => {
    setState({
      open: true,
      title: 'Undangan Terkirim!',
      message: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow animate-bounce">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 space-y-2">
            {name && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Nama</span>
                <span className="font-semibold text-gray-900">{name}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{email}</span>
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
      ),
      variant: 'success',
      confirmText: 'Selesai',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showApiKeyCreated = useCallback((keyName: string) => {
    setState({
      open: true,
      title: 'API Key Dibuat!',
      message: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <p className="font-semibold text-gray-900">{keyName}</p>
            <p className="text-sm text-gray-500 mt-1">
              API key telah dibuat. Lihat detail di halaman API Keys.
            </p>
          </div>
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-red-600">
              Simpan API key dengan aman. Key hanya ditampilkan sekali saat pembuatan.
            </p>
          </div>
        </div>
      ),
      variant: 'success',
      confirmText: 'Saya Mengerti',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showWebhookCreated = useCallback((name: string, url: string, events: string[]) => {
    setState({
      open: true,
      title: 'Webhook Dibuat!',
      message: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          </div>
          <div className="bg-cyan-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Nama</span>
              <span className="font-semibold text-gray-900">{name}</span>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-gray-500">URL</span>
              <code className="block px-3 py-2 bg-white rounded-lg text-xs text-gray-700 break-all">
                {url}
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
      ),
      variant: 'success',
      confirmText: 'Selesai',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showBrandingUpdated = useCallback(() => {
    setState({
      open: true,
      title: 'Branding Diperbarui!',
      message: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 text-center">
            Tampilan brand Anda telah diperbarui. Perubahan akan terlihat pada invoice dan halaman publik.
          </p>
        </div>
      ),
      variant: 'success',
      confirmText: 'Selesai',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showPasswordChanged = useCallback(() => {
    setState({
      open: true,
      title: 'Password Diubah!',
      message: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
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
      ),
      variant: 'success',
      confirmText: 'Selesai',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showTemplateSaved = useCallback((name: string, isUpdate: boolean = false) => {
    setState({
      open: true,
      title: isUpdate ? 'Template Diperbarui!' : 'Template Dibuat!',
      message: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          <div className="bg-violet-50 rounded-xl p-4 text-center">
            <p className="font-semibold text-violet-900">{name}</p>
            <p className="text-sm text-violet-600 mt-1">
              {isUpdate
                ? 'Template berhasil diperbarui dan siap digunakan.'
                : 'Template baru telah dibuat dan siap digunakan.'}
            </p>
          </div>
        </div>
      ),
      variant: 'success',
      confirmText: 'Selesai',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showClientCreated = useCallback((name: string, email: string) => {
    setState({
      open: true,
      title: 'Klien Ditambahkan!',
      message: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="bg-teal-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Nama</span>
              <span className="font-semibold text-gray-900">{name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm text-gray-700">{email}</span>
            </div>
          </div>
        </div>
      ),
      variant: 'success',
      confirmText: 'Selesai',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showDownloadStarted = useCallback((type: 'invoice' | 'receipt' | 'report' | 'export', name: string) => {
    const typeLabels = {
      invoice: 'Invoice',
      receipt: 'Receipt',
      report: 'Laporan',
      export: 'Export',
    }

    setState({
      open: true,
      title: 'Download Dimulai!',
      message: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="font-semibold text-gray-900">{name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {typeLabels[type]} sedang diunduh...
            </p>
          </div>
        </div>
      ),
      variant: 'success',
      confirmText: 'Selesai',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showAccountCreated = useCallback((userName: string) => {
    setState({
      open: true,
      title: 'Selamat Datang!',
      message: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500 flex items-center justify-center shadow-xl">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
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
      ),
      variant: 'success',
      confirmText: 'Mulai Sekarang',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showSubscriptionActivated = useCallback((planName: string, features?: string[]) => {
    setState({
      open: true,
      title: 'Langganan Aktif!',
      message: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
      variant: 'success',
      confirmText: 'Mulai Gunakan',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  const showFileUploaded = useCallback((fileName: string, fileType: string, fileSize?: string) => {
    setState({
      open: true,
      title: 'File Berhasil Diupload!',
      message: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
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
      ),
      variant: 'success',
      confirmText: 'Selesai',
      cancelText: '',
      onConfirm: close,
      loading: false,
    })
  }, [close])

  return {
    state,
    showConfirm,
    showDelete,
    showWarning,
    showSuccess,
    showInfo,
    showEmailSent,
    showInvoiceSent,
    showPaymentReceived,
    showInvoiceCreated,
    showInvoiceUpdated,
    showSettingsSaved,
    showProfileUpdated,
    showTeamMemberInvited,
    showApiKeyCreated,
    showWebhookCreated,
    showBrandingUpdated,
    showPasswordChanged,
    showTemplateSaved,
    showClientCreated,
    showDownloadStarted,
    showAccountCreated,
    showSubscriptionActivated,
    showFileUploaded,
    close,
    setLoading,
  }
}

// Export type for use in components
export type { UseMessageBoxReturn, MessageBoxState }
