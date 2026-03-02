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
  }) => void
  showInfo: (options: {
    title?: string
    message: string | React.ReactNode
    buttonText?: string
    onClose?: () => void
  }) => void
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

  return {
    state,
    showConfirm,
    showDelete,
    showWarning,
    showSuccess,
    showInfo,
    close,
    setLoading,
  }
}

// Export type for use in components
export type { UseMessageBoxReturn, MessageBoxState }
