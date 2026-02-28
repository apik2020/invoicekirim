'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useReactToPrint } from 'react-to-print'
import { Printer, Save, Send, Plus, Trash2, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/Logo'

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
  const printRef = useRef<HTMLDivElement>(null)

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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${formData.invoiceNumber}`,
  })

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
    <div className="min-h-screen bg-fresh-bg">
      {/* Header */}
      <header className="border-b border-slate bg-white/50 backdrop-blur-sm sticky top-0 z-50 no-print">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Logo size="lg" />

            <Link
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 text-gray-600 font-medium rounded-xl btn-secondary"
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
            <h1 className="text-extrabold text-3xl md:text-4xl text-gray-900 mb-2 tracking-tight">Buat Invoice</h1>
            <p className="text-gray-600">Invoice profesional dalam hitungan detik</p>
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
                className="flex items-center gap-2 px-6 py-3 text-gray-600 font-bold rounded-xl btn-secondary"
              >
                <Save size={18} />
                Simpan
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 text-gray-600 font-bold rounded-xl btn-secondary"
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
              <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-slate">Informasi Invoice</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Nomor Invoice</label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Tanggal</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="card p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-slate">Informasi Perusahaan (Anda)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Nama Perusahaan</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Telepon</label>
                  <input
                    type="tel"
                    value={formData.companyPhone}
                    onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Alamat</label>
                  <input
                    type="text"
                    value={formData.companyAddress}
                    onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="card p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-slate">Informasi Klien</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Nama Klien</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Telepon</label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Alamat</label>
                  <input
                    type="text"
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="card p-8">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate">
                <h2 className="text-xl font-bold text-gray-900">Item Invoice</h2>
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
                        className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Harga"
                        value={item.price || ''}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="col-span-1 text-right py-3 font-bold text-gray-900">
                      Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="no-print p-2.5 text-gray-900 rounded-xl hover:bg-gray transition-colors"
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
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-slate">Catatan</h2>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-gray border border-slate focus:border-dark focus:outline-none transition-colors resize-none"
                  placeholder="Tambahkan catatan atau syarat pembayaran..."
                />
              </div>
              <div className="card p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-slate">Pajak</h2>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Tarif Pajak (%)</label>
                  <input
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-orange-200 text-black focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="card p-8">
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Pajak ({formData.taxRate}%)</span>
                  <span className="font-bold">Rp {tax.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-2xl font-extrabold text-gray-900 pt-4 border-t border-slate">
                  <span>Total</span>
                  <span>Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Saved Invoices */}
            {savedInvoices.length > 0 && (
              <div className="card p-8 no-print">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-slate">Invoice Tersimpan ({savedInvoices.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {savedInvoices.map((inv, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => loadInvoice(inv)}
                      className="p-4 rounded-xl bg-white border border-slate hover:bg-gray transition-colors text-left"
                    >
                      <div className="font-bold text-gray-900">{inv.invoiceNumber}</div>
                      <div className="text-sm text-gray-600">{inv.clientName || 'Tanpa nama'}</div>
                      <div className="text-sm text-gray-600/60">{inv.date}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        ) : (
          <div ref={printRef} id="invoice-preview" className="bg-white p-10 md:p-14 max-w-4xl mx-auto rounded-[32px]">
            {/* Invoice Header with Branding */}
            <div className="flex justify-between items-start mb-10 pb-8 border-b border-slate">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-lime-500 flex items-center justify-center shadow-lg">
                    <span className="font-bold text-white text-lg tracking-tight">[iK]</span>
                  </div>
                  <span className="font-bold text-2xl text-gray-900 tracking-tight">InvoiceKirim</span>
                </div>
                <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">INVOICE</h1>
                <p className="text-gray-600 mt-2 font-mono">{formData.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-gray-900">{formData.companyName || 'Nama Perusahaan'}</h2>
                <p className="text-gray-600">{formData.companyEmail}</p>
                <p className="text-gray-600">{formData.companyPhone}</p>
                <p className="text-gray-600">{formData.companyAddress}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-10">
              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Kepada:</h3>
                <p className="font-bold text-gray-900 text-xl">{formData.clientName || 'Nama Klien'}</p>
                <p className="text-gray-600">{formData.clientEmail}</p>
                <p className="text-gray-600">{formData.clientPhone}</p>
                <p className="text-gray-600">{formData.clientAddress}</p>
              </div>
              <div className="text-right">
                <div className="mb-4">
                  <span className="text-gray-600">Tanggal:</span>
                  <span className="ml-4 font-bold text-gray-900">{formData.date}</span>
                </div>
                <div>
                  <span className="text-gray-600">Jatuh Tempo:</span>
                  <span className="ml-4 font-bold text-gray-900">{formData.dueDate}</span>
                </div>
              </div>
            </div>

            <table className="w-full mb-10">
              <thead>
                <tr className="border-b border-slate">
                  <th className="text-left py-4 font-bold text-gray-900">Deskripsi</th>
                  <th className="text-center py-4 font-bold text-gray-900">Qty</th>
                  <th className="text-right py-4 font-bold text-gray-900">Harga</th>
                  <th className="text-right py-4 font-bold text-gray-900">Total</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate">
                    <td className="py-4 text-gray-900">{item.description || '-'}</td>
                    <td className="py-4 text-center text-gray-900">{item.quantity}</td>
                    <td className="py-4 text-right text-gray-900">Rp {item.price.toLocaleString('id-ID')}</td>
                    <td className="py-4 text-right font-bold text-gray-900">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-10">
              <div className="w-80">
                <div className="flex justify-between py-3 text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between py-3 text-gray-600">
                  <span>Pajak ({formData.taxRate}%)</span>
                  <span className="font-bold">Rp {tax.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between py-4 border-t border-slate text-3xl font-extrabold text-gray-900 mt-4">
                  <span>Total</span>
                  <span>Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {formData.notes && (
              <div className="border-t border-slate pt-8">
                <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Catatan</h3>
                <p className="text-gray-600 whitespace-pre-line">{formData.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-slate text-center text-sm text-gray-600">
              <p>Generated by InvoiceKirim - Invoice Generator untuk Freelancer Indonesia</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
