'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Mail, Plus, Loader2, LogOut, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react'
import { EmailTemplateEditor } from '@/components/admin/EmailTemplateEditor'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: any
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const TEMPLATE_NAMES: Record<string, string> = {
  INVOICE_SENT: 'Invoice Terkirim',
  PAYMENT_REMINDER: 'Pengingat Pembayaran',
  OVERDUE_NOTICE: 'Notice Overdue',
  PAYMENT_CONFIRMATION: 'Konfirmasi Pembayaran',
  WELCOME_EMAIL: 'Email Selamat Datang',
}

export default function AdminEmailTemplatesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
    if (status === 'authenticated') {
      setLoading(false)
      fetchTemplates()
    }
  }, [status, router])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/email-templates')
      const data = await res.json()

      if (res.ok) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTemplateStatus = async (template: EmailTemplate) => {
    try {
      const res = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !template.isActive,
        }),
      })

      if (res.ok) {
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error toggling template status:', error)
    }
  }

  const deleteTemplate = async (template: EmailTemplate) => {
    if (!confirm(`Hapus template "${TEMPLATE_NAMES[template.name] || template.name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-fresh-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (selectedTemplateId !== null || isCreating) {
    return (
      <div className="min-h-screen bg-fresh-bg">

        {/* Header */}
        <div className="bg-white border-b border-orange-100 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-orange-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  {isCreating ? 'Template Baru' : 'Edit Template'}
                </h1>
              </div>
              <button
                onClick={() => {
                  setSelectedTemplateId(null)
                  setIsCreating(false)
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="card p-6">
            <EmailTemplateEditor
              templateId={selectedTemplateId}
              onClose={() => {
                setSelectedTemplateId(null)
                setIsCreating(false)
              }}
              onSave={() => {
                setSelectedTemplateId(null)
                setIsCreating(false)
                fetchTemplates()
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fresh-bg">

      {/* Header */}
      <div className="bg-white border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin - Email Templates</h1>
              <p className="text-gray-600 text-sm">Kelola template email sistem</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/admin/payments')}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Payments
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Template Email</h2>
            <p className="text-gray-600">Kelola template untuk notifikasi email otomatis</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Template Baru
          </button>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="card p-12 text-center">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Belum ada template email</p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Buat Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`card p-6 ${
                  !template.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      template.isActive ? 'bg-orange-100' : 'bg-gray-100'
                    }`}>
                      <Mail className={`w-6 h-6 ${
                        template.isActive ? 'text-orange-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {TEMPLATE_NAMES[template.name] || template.name}
                      </h3>
                      <p className="text-xs text-gray-500">{template.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleTemplateStatus(template)}
                    className={`p-2 rounded-lg transition-colors ${
                      template.isActive
                        ? 'bg-lime-100 text-lime-600 hover:bg-lime-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={template.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {template.isActive ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-1">
                    <strong>Subject:</strong> {template.subject}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTemplateId(template.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTemplate(template)}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    title="Hapus Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Update: {new Date(template.updatedAt).toLocaleDateString('id-ID')}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-lg font-bold ${
                        template.isActive
                          ? 'bg-lime-100 text-lime-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {template.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
