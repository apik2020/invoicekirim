'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Printer, Save, Send, Plus, Trash2, ArrowLeft, FileText } from 'lucide-react'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
}

interface InvoiceData {
  invoiceNumber: string
  date: string
  dueDate: string
  companyName: string
  companyEmail: string
  companyPhone: string
  companyAddress: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  items: InvoiceItem[]
  notes: string
  taxRate: number
}

export default function InvoicePage() {
  const [showPreview, setShowPreview] = useState(false)
  const [savedInvoices, setSavedInvoices] = useState<InvoiceData[]>([])

  const [formData, setFormData] = useState<InvoiceData>({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    items: [{ id: '1', description: '', quantity: 1, price: 0 }],
    notes: '',
    taxRate: 11
  })

  useEffect(() => {
    const saved = localStorage.getItem('invoices')
    if (saved) {
      setSavedInvoices(JSON.parse(saved))
    }
  }, [])

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { id: Date.now().toString(), description: '', quantity: 1, price: 0 }
      ]
    })
  }

  const removeItem = (id: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== id)
    })
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setFormData({
      ...formData,
      items: formData.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    })
  }

  const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  const tax = subtotal * (formData.taxRate / 100)
  const total = subtotal + tax

  const handleSave = () => {
    const updated = [...savedInvoices, formData]
    setSavedInvoices(updated)
    localStorage.setItem('invoices', JSON.stringify(updated))
    alert('Invoice berhasil disimpan!')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleWhatsApp = () => {
    const message = `*INVOICE - ${formData.invoiceNumber}*

Dari: ${formData.companyName}
Kepada: ${formData.clientName}

Total: Rp ${total.toLocaleString('id-ID')}

Terima kasih!`

    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  const loadInvoice = (invoice: InvoiceData) => {
    setFormData(invoice)
  }

  return (
    <div className="min-h-screen bg-gray">
      {/* Header */}
      <header className="border-b border-slate bg-white/50 backdrop-blur-sm sticky top-0 z-50 no-print">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-charcoal flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-dark tracking-tight">InvoiceKirim</span>
              </div>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 text-slate font-medium rounded-xl btn-secondary"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-extrabold text-3xl md:text-4xl text-dark mb-2 tracking-tight">Buat Invoice</h1>
            <p className="text-slate">Invoice profesional dalam hitungan detik</p>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="no-print px-6 py-3 text-white font-bold rounded-xl btn-primary"
          >
            {showPreview ? 'Edit Mode' : 'Preview Mode'}
          </button>
        </div>

        {!showPreview ? (
          <form className="space-y-8">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 no-print">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 text-slate font-bold rounded-xl btn-secondary"
              >
                <Save size={18} />
                Simpan
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 text-slate font-bold rounded-xl btn-secondary"
              >
                <Printer size={18} />
                Print PDF
              </button>
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl"
                style={{
                  background: 'linear-gradient(145deg, #25D366, #128C7E)',
                }}
              >
                <Send size={18} />
                WhatsApp
              </button>
            </div>

            {/* Invoice Info */}
            <div className="card p-8">
              <h2 className="text-xl font-bold text-dark mb-6 pb-3 border-b border-slate">Informasi Invoice</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Nomor Invoice</label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Tanggal</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="card p-8">
              <h2 className="text-xl font-bold text-dark mb-6 pb-3 border-b border-slate">Informasi Perusahaan (Anda)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Nama Perusahaan</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Telepon</label>
                  <input
                    type="tel"
                    value={formData.companyPhone}
                    onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Alamat</label>
                  <input
                    type="text"
                    value={formData.companyAddress}
                    onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="card p-8">
              <h2 className="text-xl font-bold text-dark mb-6 pb-3 border-b border-slate">Informasi Klien</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Nama Klien</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Telepon</label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Alamat</label>
                  <input
                    type="text"
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="card p-8">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate">
                <h2 className="text-xl font-bold text-dark">Item Invoice</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="no-print flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl btn-primary"
                >
                  <Plus size={16} />
                  Tambah Item
                </button>
              </div>
              <div className="space-y-4">
                {formData.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Deskripsi"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Harga"
                        value={item.price || ''}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="col-span-1 text-right py-3 font-bold text-dark">
                      Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="no-print p-2.5 text-dark rounded-xl hover:bg-gray transition-colors"
                        disabled={formData.items.length === 1}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card p-8">
                <h2 className="text-xl font-bold text-dark mb-6 pb-3 border-b border-slate">Catatan</h2>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors resize-none"
                  placeholder="Tambahkan catatan atau syarat pembayaran..."
                />
              </div>
              <div className="card p-8">
                <h2 className="text-xl font-bold text-dark mb-6 pb-3 border-b border-slate">Pajak</h2>
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Tarif Pajak (%)</label>
                  <input
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="card p-8">
              <div className="space-y-3">
                <div className="flex justify-between text-slate">
                  <span>Subtotal</span>
                  <span className="font-bold">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate">
                  <span>Pajak ({formData.taxRate}%)</span>
                  <span className="font-bold">Rp {tax.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-2xl font-extrabold text-dark pt-4 border-t border-slate">
                  <span>Total</span>
                  <span>Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Saved Invoices */}
            {savedInvoices.length > 0 && (
              <div className="card p-8 no-print">
                <h2 className="text-xl font-bold text-dark mb-6 pb-3 border-b border-slate">Invoice Tersimpan ({savedInvoices.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {savedInvoices.map((inv, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => loadInvoice(inv)}
                      className="p-4 rounded-xl bg-white border border-slate hover:bg-gray transition-colors text-left"
                    >
                      <div className="font-bold text-dark">{inv.invoiceNumber}</div>
                      <div className="text-sm text-slate">{inv.clientName || 'Tanpa nama'}</div>
                      <div className="text-sm text-slate/60">{inv.date}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        ) : (
          <div id="invoice-preview" className="bg-white p-10 md:p-14 max-w-4xl mx-auto rounded-[32px]">
            {/* Invoice Header with Branding */}
            <div className="flex justify-between items-start mb-10 pb-8 border-b border-slate">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-charcoal flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-bold text-2xl text-dark tracking-tight">InvoiceKirim</span>
                </div>
                <h1 className="text-5xl font-extrabold text-dark tracking-tight">INVOICE</h1>
                <p className="text-slate mt-2 font-mono">{formData.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-dark">{formData.companyName || 'Nama Perusahaan'}</h2>
                <p className="text-slate">{formData.companyEmail}</p>
                <p className="text-slate">{formData.companyPhone}</p>
                <p className="text-slate">{formData.companyAddress}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-10">
              <div>
                <h3 className="font-bold text-dark mb-4 text-sm uppercase tracking-wide">Kepada:</h3>
                <p className="font-bold text-dark text-xl">{formData.clientName || 'Nama Klien'}</p>
                <p className="text-slate">{formData.clientEmail}</p>
                <p className="text-slate">{formData.clientPhone}</p>
                <p className="text-slate">{formData.clientAddress}</p>
              </div>
              <div className="text-right">
                <div className="mb-4">
                  <span className="text-slate">Tanggal:</span>
                  <span className="ml-4 font-bold text-dark">{formData.date}</span>
                </div>
                <div>
                  <span className="text-slate">Jatuh Tempo:</span>
                  <span className="ml-4 font-bold text-dark">{formData.dueDate}</span>
                </div>
              </div>
            </div>

            <table className="w-full mb-10">
              <thead>
                <tr className="border-b border-slate">
                  <th className="text-left py-4 font-bold text-dark">Deskripsi</th>
                  <th className="text-center py-4 font-bold text-dark">Qty</th>
                  <th className="text-right py-4 font-bold text-dark">Harga</th>
                  <th className="text-right py-4 font-bold text-dark">Total</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate">
                    <td className="py-4 text-dark">{item.description || '-'}</td>
                    <td className="py-4 text-center text-dark">{item.quantity}</td>
                    <td className="py-4 text-right text-dark">Rp {item.price.toLocaleString('id-ID')}</td>
                    <td className="py-4 text-right font-bold text-dark">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-10">
              <div className="w-80">
                <div className="flex justify-between py-3 text-slate">
                  <span>Subtotal</span>
                  <span className="font-bold">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between py-3 text-slate">
                  <span>Pajak ({formData.taxRate}%)</span>
                  <span className="font-bold">Rp {tax.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between py-4 border-t border-slate text-3xl font-extrabold text-dark mt-4">
                  <span>Total</span>
                  <span>Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {formData.notes && (
              <div className="border-t border-slate pt-8">
                <h3 className="font-bold text-dark mb-3 text-sm uppercase tracking-wide">Catatan</h3>
                <p className="text-slate whitespace-pre-line">{formData.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-slate text-center text-sm text-slate">
              <p>Generated by InvoiceKirim - Invoice Generator untuk Freelancer Indonesia</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
