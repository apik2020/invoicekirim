'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { FileText, Plus, Search, Edit, Trash2, Loader2, Copy } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import DashboardHeader from '@/components/DashboardHeader'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface TemplateItem {
  id: string
  description: string
  quantity: number
  price: number
}

interface Template {
  id: string
  name: string
  description: string | null
  taxRate: number
  notes: string | null
  items: TemplateItem[]
  createdAt: string
  updatedAt: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchTemplates()
    }
  }, [status, router])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates')
      if (!res.ok) throw new Error('Gagal mengambil template')

      const data = await res.json()
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template ini?')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus template')
      }

      setTemplates(templates.filter((t) => t.id !== id))
    } catch (error: any) {
      alert(error.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleUseTemplate = async (id: string) => {
    router.push(`/dashboard/invoices/create?template=${id}`)
  }

  if (!mounted || loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-dark animate-spin mx-auto mb-4" />
          <p className="text-slate">Memuat template...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray">
      <DashboardHeader
        title="Template Invoice"
        showBackButton={true}
        actions={
          <Link
            href="/dashboard/templates/create"
            className="flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl btn-primary"
          >
            <Plus size={18} />
            Buat Template
          </Link>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="font-bold text-3xl md:text-4xl text-dark mb-2 tracking-tight">
            Template Invoice
          </h1>
          <p className="text-slate">
            Simpol dan gunakan ulang invoice yang sering Anda buat
          </p>
        </div>

        {/* Search */}
        <div className="card p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari template..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Templates List */}
        {filteredTemplates.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-24 h-24 rounded-2xl icon-box mx-auto mb-6">
              <FileText className="w-12 h-12 text-slate" />
            </div>
            <h3 className="text-2xl font-bold text-dark mb-3">
              {searchQuery ? 'Tidak ada template ditemukan' : 'Belum ada template'}
            </h3>
            <p className="text-slate mb-8">
              {searchQuery
                ? 'Coba kata kunci lain'
                : 'Buat template pertamamu untuk mempercepat pembuatan invoice'
              }
            </p>
            {!searchQuery && (
              <Link
                href="/dashboard/templates/create"
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl btn-primary"
              >
                <Plus size={18} />
                Buat Template Pertama
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="card p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-dark mb-1">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-slate line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items Preview */}
                <div className="mb-4">
                  <p className="text-sm font-bold text-dark mb-2">
                    Item ({template.items.length})
                  </p>
                  <div className="space-y-1">
                    {template.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate truncate flex-1">
                          {item.description}
                        </span>
                        <span className="text-dark font-medium ml-2">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    ))}
                    {template.items.length > 3 && (
                      <p className="text-sm text-slate">
                        +{template.items.length - 3} item lainnya
                      </p>
                    )}
                  </div>
                </div>

                {/* Total Preview */}
                <div className="mb-4 p-3 rounded-xl bg-gray">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate">Subtotal</span>
                    <span className="font-bold text-dark">
                      {formatCurrency(
                        template.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate">Pajak ({template.taxRate}%)</span>
                    <span className="font-bold text-dark">
                      {formatCurrency(
                        template.items.reduce((sum, item) => sum + item.quantity * item.price, 0) *
                        (template.taxRate / 100)
                      )}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUseTemplate(template.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white font-bold text-sm rounded-xl btn-primary"
                  >
                    <Copy size={16} />
                    Gunakan
                  </button>
                  <Link
                    href={`/dashboard/templates/${template.id}/edit`}
                    className="p-2 text-slate rounded-xl hover:bg-gray transition-colors"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </Link>
                  <button
                    onClick={() => handleDelete(template.id)}
                    disabled={deletingId === template.id}
                    className="p-2 text-teal-light rounded-xl hover:bg-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Hapus"
                  >
                    {deletingId === template.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
