'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  Loader2,
  HelpCircle,
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'

const categoryOptions = [
  { value: 'general', label: 'Pertanyaan Umum' },
  { value: 'billing', label: 'Pembayaran & Tagihan' },
  { value: 'technical', label: 'Masalah Teknis' },
  { value: 'feature_request', label: 'Permintaan Fitur' },
]

const priorityOptions = [
  { value: 'low', label: 'Rendah' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Tinggi' },
  { value: 'urgent', label: 'Penting' },
]

export default function NewTicketPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'normal',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.subject.trim() || !formData.description.trim()) {
      setError('Subjek dan deskripsi harus diisi')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/user/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        router.push(`/dashboard/bantuan/${data.id}`)
      } else {
        setError(data.error || 'Gagal membuat tiket')
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Buat Tiket Baru">
      {/* Back Button */}
      <Link
        href="/dashboard/bantuan"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Daftar Tiket
      </Link>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Buat Tiket Bantuan</h2>
            <p className="text-sm text-gray-500">Isi form di bawah untuk mengirim pertanyaan atau laporan masalah</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subjek <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Judul pertanyaan atau masalah Anda"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              maxLength={200}
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioritas
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan pertanyaan atau masalah Anda secara detail..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Semakin detail penjelasan Anda, semakin cepat kami dapat membantu
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Link
              href="/dashboard/bantuan"
              className="px-6 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Kirim Tiket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
