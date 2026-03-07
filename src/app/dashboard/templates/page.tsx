'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { FileText, Plus, Search, Edit, Trash2, Loader2, Copy } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DashboardLayout } from '@/components/DashboardLayout'
import { MessageBox } from '@/components/ui/MessageBox'
import { useMessageBox } from '@/hooks/useMessageBox'

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
  const messageBox = useMessageBox()

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

  const handleDelete = async (template: Template) => {
    messageBox.showDelete({
      title: 'Hapus Template?',
      message: (
        <div className="space-y-2">
          <p>
            Anda akan menghapus template <span className="font-semibold text-brand-500">{template.name}</span>
          </p>
          <p className="text-xs text-text-muted">
            Template yang dihapus tidak dapat dikembalikan.
          </p>
        </div>
      ),
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        setDeletingId(template.id)
        try {
          const res = await fetch(`/api/templates/${template.id}`, {
            method: 'DELETE',
          })

          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || 'Gagal menghapus template')
          }

          setTemplates(templates.filter((t) => t.id !== template.id))
        } catch (error: any) {
          messageBox.showWarning({
            title: 'Gagal Menghapus Template',
            message: error.message,
            confirmText: 'Mengerti',
            onConfirm: () => messageBox.close(),
          })
        } finally {
          setDeletingId(null)
        }
      },
    })
  }

  const handleUseTemplate = async (id: string) => {
    router.push(`/dashboard/invoices/create?template=${id}`)
  }

  if (!mounted || loading || status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Memuat template...</p>
          </div>
        </div>
      </DashboardLayout>
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
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-500 mb-2">Template Invoice</h1>
            <p className="text-text-secondary">
              Simpan dan gunakan ulang invoice yang sering Anda buat
            </p>
          </div>
          <Link
            href="/dashboard/templates/create"
            className="btn-primary px-6 py-3 flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Buat Template</span>
          </Link>
        </div>

        {/* Search */}
        <div className="card p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari template..."
              className="input pl-12"
            />
          </div>
        </div>
      </div>

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-24 h-24 rounded-2xl icon-box-highlight mx-auto mb-6">
            <FileText className="w-12 h-12 text-highlight-600" />
          </div>
          <h3 className="text-xl font-bold text-brand-500 mb-2">
            {searchQuery ? 'Tidak ada template ditemukan' : 'Belum ada template'}
          </h3>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            {searchQuery
              ? 'Coba kata kunci lain'
              : 'Buat template pertamamu untuk mempercepat pembuatan invoice'}
          </p>
          {!searchQuery && (
            <Link
              href="/dashboard/templates/create"
              className="btn-primary px-6 py-3 inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Buat Template Pertama
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="card card-hover p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-highlight-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-highlight-600" />
                    </div>
                    <h3 className="font-bold text-lg text-brand-500">
                      {template.name}
                    </h3>
                  </div>
                  {template.description && (
                    <p className="text-sm text-text-secondary line-clamp-2 ml-10">
                      {template.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Items Preview */}
              <div className="mb-4 ml-10">
                <p className="text-sm font-semibold text-text-primary mb-2">
                  Item ({template.items.length})
                </p>
                <div className="space-y-1">
                  {template.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-text-secondary truncate flex-1">
                        {item.description}
                      </span>
                      <span className="text-text-primary font-medium ml-2">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  ))}
                  {template.items.length > 3 && (
                    <p className="text-sm text-text-muted">
                      +{template.items.length - 3} item lainnya
                    </p>
                  )}
                </div>
              </div>

              {/* Total Preview */}
              <div className="mb-4 p-3 rounded-xl bg-surface-light ml-10">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="font-bold text-text-primary">
                    {formatCurrency(
                      template.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-text-secondary">Pajak ({template.taxRate}%)</span>
                  <span className="font-bold text-text-primary">
                    {formatCurrency(
                      template.items.reduce((sum, item) => sum + item.quantity * item.price, 0) *
                      (template.taxRate / 100)
                    )}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 ml-10">
                <button
                  onClick={() => handleUseTemplate(template.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white font-bold text-sm rounded-xl btn-primary"
                >
                  <Copy size={16} />
                  Gunakan
                </button>
                <Link
                  href={`/dashboard/templates/${template.id}/edit`}
                  className="p-2 text-brand-500 rounded-xl hover:bg-brand-50 transition-colors"
                  title="Edit"
                >
                  <Edit size={18} />
                </Link>
                <button
                  onClick={() => handleDelete(template)}
                  disabled={deletingId === template.id}
                  className="p-2 text-primary-500 rounded-xl hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* MessageBox for notifications */}
      <MessageBox
        open={messageBox.state.open}
        onClose={messageBox.close}
        title={messageBox.state.title}
        message={messageBox.state.message}
        variant={messageBox.state.variant}
        confirmText={messageBox.state.confirmText}
        cancelText={messageBox.state.cancelText}
        onConfirm={messageBox.state.onConfirm}
        onCancel={messageBox.state.onCancel}
        loading={messageBox.state.loading}
      />
    </DashboardLayout>
  )
}
