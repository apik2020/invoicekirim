'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail,
  Plus,
  Loader2,
  LogOut,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  DollarSign,
  Activity,
  LayoutDashboard,
} from 'lucide-react'
import { EmailTemplateEditor } from '@/components/admin/EmailTemplateEditor'
import { AdminLogo } from '@/components/Logo'
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

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Payments', href: '/admin/payments', icon: DollarSign },
  { name: 'Email Templates', href: '/admin/email-templates', icon: Mail },
  { name: 'Activity Logs', href: '/admin/activity-logs', icon: Activity },
]

export default function AdminEmailTemplatesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    checkAdminSession()
  }, [])

  const checkAdminSession = async () => {
    try {
      const res = await fetch('/api/admin/me')
      if (res.ok) {
        fetchTemplates()
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Error checking admin session:', error)
      router.push('/admin/login')
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-16 h-16 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Memuat...</p>
        </div>
      </div>
    )
  }

  if (selectedTemplateId !== null || isCreating) {
    return (
      <div className="min-h-screen bg-surface-light">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-brand-600" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-text-primary">
                  {isCreating ? 'Template Baru' : 'Edit Template'}
                </h1>
              </div>
              <button
                onClick={() => {
                  setSelectedTemplateId(null)
                  setIsCreating(false)
                }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-text-secondary hover:bg-gray-50 transition-all text-sm"
              >
                Kembali
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="card p-5 sm:p-6 animate-fade-in-up">
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
    <div className="min-h-screen bg-surface-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <AdminLogo size="lg" linkToHome={false} />
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  await fetch('/api/admin/logout', { method: 'POST' })
                  router.push('/admin/login')
                  router.refresh()
                }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all font-medium text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Admin Navigation */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
          {navItems.map((item) => {
            const isActive = item.href === '/admin/email-templates'
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={cn(
                  'flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-sm transition-all',
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'border border-gray-200 text-text-secondary hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.name}</span>
              </button>
            )
          })}
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Template Email</h1>
            <p className="text-text-secondary text-sm sm:text-base">Kelola template untuk notifikasi email otomatis</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl btn-primary text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Template Baru
          </button>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="card p-8 sm:p-12 text-center animate-fade-in-up">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {templates.map((template, index) => (
              <div
                key={template.id}
                className={cn(
                  'card p-5 sm:p-6 animate-fade-in-up',
                  !template.isActive && 'opacity-60'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
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
                      <h3 className="text-base sm:text-lg font-bold text-text-primary">
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
    </div>
  )
}
