'use client'

import { useState, useEffect } from 'react'
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { EmailTemplateEditor } from '@/components/admin/EmailTemplateEditor'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { cn } from '@/lib/utils'

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
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

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

  // Editor View
  if (selectedTemplateId !== null || isCreating) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => {
              setSelectedTemplateId(null)
              setIsCreating(false)
            }}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Kembali ke daftar template
          </button>

          {/* Editor Card */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                <Mail className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  {isCreating ? 'Template Baru' : 'Edit Template'}
                </h1>
                <p className="text-sm text-text-secondary">Konfigurasi konten email</p>
              </div>
            </div>

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
      </AdminLayout>
    )
  }

  // List View
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Template Email</h1>
            <p className="text-text-secondary">Kelola template untuk notifikasi email otomatis</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Template Baru
          </button>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-text-secondary mb-4">Belum ada template email</p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-primary font-semibold"
            >
              <Plus className="w-4 h-4" />
              Buat Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template, index) => (
              <div
                key={template.id}
                className={cn(
                  'card p-5',
                  !template.isActive && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      template.isActive ? 'bg-brand-100' : 'bg-gray-100'
                    )}>
                      <Mail className={cn(
                        'w-6 h-6',
                        template.isActive ? 'text-brand-600' : 'text-text-muted'
                      )} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        {TEMPLATE_NAMES[template.name] || template.name}
                      </h3>
                      <p className="text-xs text-text-muted">{template.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleTemplateStatus(template)}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      template.isActive
                        ? 'bg-success-100 text-success-600 hover:bg-success-200'
                        : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                    )}
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
                  <p className="text-sm text-text-secondary line-clamp-1">
                    <strong>Subject:</strong> {template.subject}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTemplateId(template.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-brand-200 text-brand-600 hover:bg-brand-50 transition-all text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTemplate(template)}
                    className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                    title="Hapus Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>
                      Update: {new Date(template.updatedAt).toLocaleDateString('id-ID')}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-lg font-bold',
                        template.isActive
                          ? 'badge-paid'
                          : 'badge-draft'
                      )}
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
    </AdminLayout>
  )
}
