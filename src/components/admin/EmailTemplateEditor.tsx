'use client'

import { useState, useEffect } from 'react'
import { Mail, Save, Eye, Send, RotateCcw, Code, Plus, X } from 'lucide-react'

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

interface EmailTemplateEditorProps {
  templateId: string | null
  onClose: () => void
  onSave: () => void
}

// Default template variables
const DEFAULT_VARIABLES = {
  INVOICE_SENT: ['clientName', 'invoiceNumber', 'amount', 'dueDate', 'companyName'],
  PAYMENT_REMINDER: ['clientName', 'invoiceNumber', 'amount', 'dueDate', 'daysUntilDue'],
  OVERDUE_NOTICE: ['clientName', 'invoiceNumber', 'amount', 'daysOverdue', 'companyName'],
  PAYMENT_CONFIRMATION: ['clientName', 'amount', 'paymentDate', 'receiptNumber'],
  WELCOME_EMAIL: ['userName', 'email', 'companyName'],
}

const TEMPLATE_NAMES: Record<string, string> = {
  INVOICE_SENT: 'Invoice Terkirim',
  PAYMENT_REMINDER: 'Pengingat Pembayaran',
  OVERDUE_NOTICE: 'Notice Overdue',
  PAYMENT_CONFIRMATION: 'Konfirmasi Pembayaran',
  WELCOME_EMAIL: 'Email Selamat Datang',
}

const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  INVOICE_SENT: {
    subject: 'Invoice {{invoiceNumber}} dari {{companyName}}',
    body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316, #ec4899); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invoice Baru</h1>
    </div>
    <div class="content">
      <p>Halo {{clientName}},</p>
      <p>Invoice baru telah dibuat untuk Anda:</p>
      <ul>
        <li><strong>No. Invoice:</strong> {{invoiceNumber}}</li>
        <li><strong>Jumlah:</strong> {{amount}}</li>
        <li><strong>Jatuh Tempo:</strong> {{dueDate}}</li>
      </ul>
      <a href="#" class="button">Lihat Invoice</a>
    </div>
    <div class="footer">
      <p>Invoice dikirim oleh {{companyName}} melalui InvoiceKirim</p>
    </div>
  </div>
</body>
</html>`,
  },
  PAYMENT_REMINDER: {
    subject: 'Pengingat: Invoice {{invoiceNumber}} jatuh tempo dalam {{daysUntilDue}} hari',
    body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #eab308, #f97316); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #fffbeb; padding: 30px; border: 1px solid #fde68a; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Pengingat Pembayaran</h1>
    </div>
    <div class="content">
      <p>Halo {{clientName}},</p>
      <p>Invoice <strong>{{invoiceNumber}}</strong> akan jatuh tempo dalam <strong>{{daysUntilDue}} hari</strong>.</p>
      <p><strong>Jumlah:</strong> {{amount}}</p>
      <p><strong>Jatuh Tempo:</strong> {{dueDate}}</p>
      <p>Silakan selesaikan pembayaran sebelum tanggal jatuh tempo.</p>
    </div>
    <div class="footer">
      <p>Terima kasih atas kerja samanya dengan {{companyName}}</p>
    </div>
  </div>
</body>
</html>`,
  },
}

export function EmailTemplateEditor({ templateId, onClose, onSave }: EmailTemplateEditorProps) {
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedVariable, setSelectedVariable] = useState('')
  const [newTemplateName, setNewTemplateName] = useState('')

  useEffect(() => {
    if (templateId) {
      fetchTemplate()
    } else {
      // Default to new template
      setTemplate(null)
      setIsActive(true)
    }
  }, [templateId])

  const fetchTemplate = async () => {
    if (!templateId) return

    try {
      setLoading(true)
      const res = await fetch(`/api/admin/email-templates/${templateId}`)
      const data = await res.json()

      if (res.ok) {
        setTemplate(data)
        setSubject(data.subject)
        setBody(data.body)
        setIsActive(data.isActive)
      }
    } catch (error) {
      console.error('Error fetching template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const url = templateId
        ? `/api/admin/email-templates/${templateId}`
        : '/api/admin/email-templates'

      const method = templateId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template?.name || newTemplateName,
          subject,
          body,
          isActive,
        }),
      })

      if (res.ok) {
        alert('Template berhasil disimpan')
        onSave()
      } else {
        const data = await res.json()
        alert(`Gagal menyimpan template: ${data.error}`)
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Terjadi kesalahan saat menyimpan template')
    } finally {
      setSaving(false)
    }
  }

  const insertVariable = (variable: string) => {
    const insertion = `{{${variable}}}`
    setBody((prev) => prev + insertion)
  }

  const resetToDefault = () => {
    if (!template) return

    const defaultTemplate = DEFAULT_TEMPLATES[template.name]
    if (defaultTemplate && confirm('Reset template ke default? Perubahan Anda akan hilang.')) {
      setSubject(defaultTemplate.subject)
      setBody(defaultTemplate.body)
    }
  }

  const getTemplateVariables = () => {
    if (!template) return []
    return DEFAULT_VARIABLES[template.name] || []
  }

  const getPreviewHTML = () => {
    let previewBody = body
    const variables = getTemplateVariables()

    variables.forEach((v) => {
      const regex = new RegExp(`\\{\\{${v}\\}\\}`, 'g')
      const sampleValue: Record<string, string> = {
        clientName: 'John Doe',
        invoiceNumber: 'INV-2024-001',
        amount: 'Rp 1.500.000',
        dueDate: '30 Desember 2024',
        companyName: 'PT ABC',
        daysUntilDue: '3',
        daysOverdue: '5',
        paymentDate: '25 Desember 2024',
        receiptNumber: 'RCP-20241225-0001',
        userName: 'Jane Smith',
        email: 'jane@example.com',
      }
      previewBody = previewBody.replace(regex, sampleValue[v] || `[${v}]`)
    })

    return previewBody
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {template ? TEMPLATE_NAMES[template.name] || template.name : 'Template Baru'}
            </h2>
            {template && (
              <p className="text-sm text-gray-500">{template.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {template && DEFAULT_TEMPLATES[template.name] && (
            <button
              onClick={resetToDefault}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Default
            </button>
          )}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!showPreview ? (
        <>
          {/* New Template Name (if creating) */}
          {!template && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Template
              </label>
              <select
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-orange-200 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Pilih jenis template...</option>
                {Object.entries(TEMPLATE_NAMES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Email
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-orange-200 focus:border-orange-500 focus:outline-none"
              placeholder="Masukkan subject email..."
            />
          </div>

          {/* Variables Helper */}
          {template && getTemplateVariables().length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variabel Tersedia
              </label>
              <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border">
                {getTemplateVariables().map((variable) => (
                  <button
                    key={variable}
                    onClick={() => insertVariable(variable)}
                    className="px-3 py-1 rounded-lg bg-white border border-orange-200 text-sm text-orange-600 hover:bg-orange-50 transition-colors font-mono"
                  >
                    + {'{{'}{variable}{'}}'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Isi Email (HTML)
            </label>
            <div className="relative">
              <Code className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full h-96 pl-10 pr-4 py-3 rounded-lg border border-orange-200 focus:border-orange-500 focus:outline-none font-mono text-sm"
                placeholder="Masukkan HTML email..."
              />
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Status Template</p>
              <p className="text-sm text-gray-500">
                Template aktif akan digunakan untuk mengirim email
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        </>
      ) : (
        /* Preview Mode */
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
            <span className="text-sm text-gray-600">Preview</span>
          </div>
          <div className="p-4 bg-white">
            <iframe
              srcDoc={getPreviewHTML()}
              className="w-full h-96 border-0"
              title="Email Preview"
            />
          </div>
        </div>
      )}
    </div>
  )
}
