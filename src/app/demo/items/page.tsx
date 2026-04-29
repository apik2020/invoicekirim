'use client'

import Link from 'next/link'
import { Search, Plus, Package, Edit, Trash2 } from 'lucide-react'
import { DemoPageWrapper } from '@/components/demo/DemoLayout'
import { formatCurrency } from '@/lib/utils'

const demoItems = [
  { id: 'it-1', name: 'Jasa Konsultasi IT', category: 'Jasa', price: 10000000, unit: 'Project' },
  { id: 'it-2', name: 'Maintenance Server', category: 'Jasa', price: 5000000, unit: 'Bulan' },
  { id: 'it-3', name: 'Desain Website', category: 'Jasa', price: 8750000, unit: 'Project' },
  { id: 'it-4', name: 'Servis Laptop', category: 'Jasa', price: 640000, unit: 'Unit' },
  { id: 'it-5', name: 'Sistem Informasi', category: 'Produk', price: 20000000, unit: 'Project' },
  { id: 'it-6', name: 'Training Staff', category: 'Jasa', price: 2500000, unit: 'Hari' },
  { id: 'it-7', name: 'POS System', category: 'Produk', price: 4500000, unit: 'Unit' },
  { id: 'it-8', name: 'Cloud Hosting', category: 'Jasa', price: 5000000, unit: 'Tahun' },
]

export default function DemoItemsPage() {
  return (
    <DemoPageWrapper title="Item">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-500">Katalog Item</h2>
            <p className="text-text-secondary text-sm">Produk dan jasa yang sering Anda tagih</p>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25">
            <Plus className="w-5 h-5" />
            Tambah Item
          </button>
        </div>

        {/* Search */}
        <div className="card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Cari item..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              readOnly
            />
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {demoItems.map((item) => (
            <div key={item.id} className="card p-4 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Package className="w-5 h-5 text-brand-500" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-lg text-text-muted hover:text-brand-500 hover:bg-brand-50 transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-text-primary text-sm mb-1">{item.name}</h3>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary-50 text-secondary-600 mb-2">
                {item.category}
              </span>
              <div className="flex items-end justify-between mt-auto">
                <p className="text-lg font-bold text-brand-500">{formatCurrency(item.price)}</p>
                <span className="text-xs text-text-muted">/{item.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="card p-6 cta-gradient rounded-2xl text-white text-center">
          <h3 className="text-xl font-bold mb-2">Buat katalog item sendiri!</h3>
          <p className="text-white/90 mb-4">Simpan produk/jasa agar pembuatan invoice lebih cepat.</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors">
            Daftar Gratis
          </Link>
        </div>
      </div>
    </DemoPageWrapper>
  )
}
