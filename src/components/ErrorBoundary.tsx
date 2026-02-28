'use client'

import { Component, ReactNode } from 'react'
import { FileQuestion, RefreshCw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-fresh-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200">
              <FileQuestion className="w-10 h-10 text-white" />
            </div>

            {/* Error Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Oops! Terjadi Kesalahan
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 mb-8">
              Maaf, terjadi kesalahan saat memuat halaman ini.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200 text-left">
                <p className="text-sm text-red-800 font-mono break-words">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-red-700 mt-2 overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false })
                  window.location.reload()
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 transition-colors font-medium shadow-lg shadow-orange-200"
              >
                <RefreshCw className="w-5 h-5" />
                Muat Ulang
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false })
                  window.location.href = '/dashboard'
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                <Home className="w-5 h-5" />
                ke Dashboard
              </button>
            </div>

            {/* Additional Help */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Masih mengalami masalah?{' '}
                <a href="mailto:support@invoicekirim.com" className="text-orange-600 hover:text-orange-700 font-medium">
                  Hubungi Support
                </a>
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
import { useState, useEffect } from 'react'

export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return setError
}

// HOC version
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
