'use client'

import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { DemoPageWrapper } from '@/components/demo/DemoLayout'

export default function DemoTemplatesPage() {
  return (
    <DemoPageWrapper title="Template">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-500">Template Invoice</h2>
            <p className="text-text-secondary text-sm">Buat dan simpan template untuk mempercepat pembuatan invoice</p>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25">
            <Plus className="w-5 h-5" />
            Buat Template
          </button>
        </div>

        {/* Default Layout Info */}
        <div className="card overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 p-6 flex items-center justify-center">
            <div className="bg-white/90 rounded-xl p-4 w-full max-w-[200px] space-y-2">
              <div className="h-2 bg-blue-600 rounded w-3/4" />
              <div className="h-1.5 bg-gray-200 rounded w-full" />
              <div className="h-1.5 bg-gray-200 rounded w-5/6" />
              <hr className="border-gray-300" />
              <div className="h-1.5 bg-gray-200 rounded w-full" />
              <div className="h-1.5 bg-gray-200 rounded w-4/5" />
              <hr className="border-gray-300" />
              <div className="flex justify-between">
                <div className="h-1.5 bg-gray-300 rounded w-1/3" />
                <div className="h-2 bg-blue-400 rounded w-2/5" />
              </div>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-text-primary mb-1">Invoice Profesional</h3>
            <p className="text-xs text-text-muted">Template standar dengan layout bersih dan profesional</p>
          </div>
        </div>

        {/* Custom branding note */}
        <div className="card p-6 border-2 border-dashed border-primary-200 bg-primary-50/50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h3 className="font-bold text-brand-500 mb-1">Buat Template Kustom</h3>
              <p className="text-sm text-text-secondary">
                Simpan item, catatan, dan pengaturan yang sering digunakan ke dalam template.
                Percepat pembuatan invoice Anda dengan template yang bisa digunakan kembali.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="card p-6 cta-gradient rounded-2xl text-white text-center">
          <h3 className="text-xl font-bold mb-2">Mulai buat invoice profesional!</h3>
          <p className="text-white/90 mb-4">Buat, kirim, dan lacak pembayaran invoice dengan mudah.</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors">
            Daftar Gratis
          </Link>
        </div>
      </div>
    </DemoPageWrapper>
  )
}
