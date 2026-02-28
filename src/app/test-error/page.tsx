'use client'

import { useState } from 'react'
import { AlertTriangle, Bug, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function TestErrorPage() {
  const router = useRouter()

  const triggerError = () => {
    throw new Error('This is a test error!')
  }

  const triggerAsyncError = async () => {
    await new Promise((resolve) => setTimeout(resolve, 100))
    throw new Error('This is an async test error!')
  }

  return (
    <div className="min-h-screen bg-fresh-bg flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="card p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Bug className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Test Error Pages</h1>
              <p className="text-gray-600">Halaman untuk testing error handling</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">Development Mode</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Halaman ini hanya untuk testing. Jangan gunakan di production.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Test Error Types:</h2>

            {/* Test Client-Side Error */}
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <h3 className="font-semibold text-red-900 mb-3">Client-Side Error (React Error Boundary)</h3>
              <p className="text-sm text-red-700 mb-4">
                Akan memicu React component error dan menampilkan Error Boundary
              </p>
              <button
                onClick={triggerError}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Trigger Error
              </button>
            </div>

            {/* Test Async Error */}
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-3">Async Client Error</h3>
              <p className="text-sm text-orange-700 mb-4">
                Akan memicu async error di component
              </p>
              <button
                onClick={triggerAsyncError}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Trigger Async Error
              </button>
            </div>

            {/* Test API Error */}
            <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
              <h3 className="font-semibold text-pink-900 mb-3">Server-Side Error (500 Error)</h3>
              <p className="text-sm text-pink-700 mb-4">
                Akan memanggil API endpoint yang sengaja error
              </p>
              <button
                onClick={async () => {
                  const res = await fetch('/api/test-error')
                  const data = await res.json()
                  alert(data.error || 'Server error triggered!')
                }}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                Trigger Server Error
              </button>
            </div>

            {/* Test Not Found */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">404 Not Found</h3>
              <p className="text-sm text-gray-700 mb-4">
                Akan navigate ke halaman yang tidak ada
              </p>
              <Link
                href="/dashboard/halaman-yang-tidak-jelas-ada"
                className="inline-block px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Test 404 Page
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions:</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Home className="w-4 h-4" />
              ke Dashboard
            </Link>
            <Link
              href="/admin/halaman-tidak-ada"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Test Admin 404
            </Link>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
