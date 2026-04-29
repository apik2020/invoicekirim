'use client'

import Link from 'next/link'
import {
  Plus, Trash2, ChevronDown, Upload, ArrowLeft,
} from 'lucide-react'
import { DemoPageWrapper } from '@/components/demo/DemoLayout'

export default function DemoCreateInvoicePage() {
  return (
    <DemoPageWrapper title="Buat Invoice">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Back link */}
        <Link href="/demo/invoices" className="inline-flex items-center gap-1.5 text-text-secondary hover:text-brand-500 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Invoice
        </Link>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-brand-500">Buat Invoice Baru</h2>
        </div>

        {/* Form */}
        <div className="card p-6 space-y-6">
          {/* Client Section */}
          <div>
            <h3 className="text-lg font-bold text-brand-500 mb-4">Informasi Klien</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Pilih Klien</label>
                <div className="relative">
                  <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                    <option>PT Maju Jaya Sentosa</option>
                    <option>CV Berkah Mandiri</option>
                    <option>Toko Elektronik Jaya</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Nomor Invoice</label>
                <input
                  type="text"
                  value="INV-2026-042"
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Tanggal</label>
                <input
                  type="text"
                  value="29 April 2026"
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Jatuh Tempo</label>
                <input
                  type="text"
                  value="29 Mei 2026"
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Items */}
          <div>
            <h3 className="text-lg font-bold text-brand-500 mb-4">Item Invoice</h3>
            <div className="space-y-3">
              {/* Header */}
              <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-semibold text-text-muted px-4">
                <div className="col-span-5">Deskripsi</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-3">Harga Satuan</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1" />
              </div>

              {/* Item rows */}
              {[
                { desc: 'Jasa Konsultasi IT', qty: 1, price: 10000000, total: 10000000 },
                { desc: 'Maintenance Server Bulanan', qty: 1, price: 5000000, total: 5000000 },
                { desc: 'Training Staff (2 hari)', qty: 1, price: 2500000, total: 2500000 },
              ].map((item, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-xl bg-surface-light items-center">
                  <div className="sm:col-span-5">
                    <input type="text" value={item.desc} readOnly className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white" />
                  </div>
                  <div className="sm:col-span-2">
                    <input type="number" value={item.qty} readOnly className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white text-center" />
                  </div>
                  <div className="sm:col-span-3">
                    <input type="text" value={`Rp ${item.price.toLocaleString('id-ID')}`} readOnly className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white" />
                  </div>
                  <div className="sm:col-span-1 text-right font-bold text-sm text-text-primary">
                    Rp {(item.total / 1000000).toFixed(0)}jt
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-text-muted hover:border-primary-400 hover:text-primary-500 transition-colors w-full justify-center">
                <Plus className="w-4 h-4" />
                Tambah Item
              </button>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="font-medium text-text-primary">Rp 17.500.000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">PPN (11%)</span>
                <span className="font-medium text-text-primary">Rp 1.925.000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Diskon</span>
                <span className="font-medium text-success-600">- Rp 0</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-brand-500">Total</span>
                <span className="text-brand-500">Rp 19.425.000</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Catatan</label>
            <textarea
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="Tambahkan catatan untuk klien..."
              readOnly
              value="Pembayaran dapat dilakukan melalui transfer bank ke rekening CV Demo Bisnis. Terima kasih!"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 text-center">
              Simpan & Kirim via WhatsApp
            </button>
            <button className="flex-1 px-6 py-3 bg-white border-2 border-brand-500 text-brand-500 font-bold rounded-xl text-center hover:bg-brand-50 transition-colors">
              Simpan sebagai Draft
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="card p-6 cta-gradient rounded-2xl text-white text-center">
          <h3 className="text-xl font-bold mb-2">Buat invoice sungguhan dalam 1 menit!</h3>
          <p className="text-white/90 mb-4">Daftar gratis sekarang, tanpa kartu kredit.</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors">
            Daftar Gratis
          </Link>
        </div>
      </div>
    </DemoPageWrapper>
  )
}
