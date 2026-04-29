'use client'

import Link from 'next/link'
import { Plus, Eye, FileText, Star } from 'lucide-react'
import { DemoPageWrapper } from '@/components/demo/DemoLayout'

const demoTemplates = [
  { id: 'tpl-1', name: 'Invoice Profesional', desc: 'Template standar dengan layout bersih dan profesional', isDefault: true, color: 'from-blue-500 to-blue-600' },
  { id: 'tpl-2', name: 'Invoice Modern', desc: 'Desain modern dengan aksen warna gradient', isDefault: false, color: 'from-purple-500 to-purple-600' },
  { id: 'tpl-3', name: 'Invoice Minimalis', desc: 'Template sederhana fokus pada informasi inti', isDefault: false, color: 'from-brand-500 to-brand-600' },
]

export default function DemoTemplatesPage() {
  return (
    <DemoPageWrapper title="Template">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-500">Template Invoice</h2>
            <p className="text-text-secondary text-sm">Pilih dan kustomisasi tampilan invoice Anda</p>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25">
            <Plus className="w-5 h-5" />
            Buat Template
          </button>
        </div>

        {/* Template Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {demoTemplates.map((tpl) => (
            <div key={tpl.id} className="card overflow-hidden group hover:shadow-lg transition-shadow">
              {/* Preview area */}
              <div className={`h-48 bg-gradient-to-br ${tpl.color} p-6 flex items-center justify-center relative`}>
                <div className="bg-white/90 rounded-xl p-4 w-full max-w-[200px] space-y-2">
                  <div className="h-2 bg-gray-300 rounded w-3/4" />
                  <div className="h-1.5 bg-gray-200 rounded w-full" />
                  <div className="h-1.5 bg-gray-200 rounded w-5/6" />
                  <hr className="border-gray-300" />
                  <div className="h-1.5 bg-gray-200 rounded w-full" />
                  <div className="h-1.5 bg-gray-200 rounded w-4/5" />
                  <hr className="border-gray-300" />
                  <div className="flex justify-between">
                    <div className="h-1.5 bg-gray-300 rounded w-1/3" />
                    <div className="h-2 bg-primary-400 rounded w-2/5" />
                  </div>
                </div>
                {tpl.isDefault && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold text-white">
                    <Star className="w-3 h-3" />
                    Default
                  </span>
                )}
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-text-primary mb-1">{tpl.name}</h3>
                <p className="text-xs text-text-muted mb-3">{tpl.desc}</p>
                <div className="flex items-center gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary-50 text-primary-600 text-xs font-semibold hover:bg-primary-100 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-50 text-brand-600 text-xs font-semibold hover:bg-brand-100 transition-colors">
                    <FileText className="w-3.5 h-3.5" />
                    Gunakan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom branding note */}
        <div className="card p-6 border-2 border-dashed border-primary-200 bg-primary-50/50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h3 className="font-bold text-brand-500 mb-1">Kustomisasi dengan Branding Anda</h3>
              <p className="text-sm text-text-secondary">
                Upload logo bisnis, pilih warna template, dan buat invoice yang sesuai dengan identitas brand Anda.
                Tersedia di paket Basic dan Profesional.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="card p-6 cta-gradient rounded-2xl text-white text-center">
          <h3 className="text-xl font-bold mb-2">Buat invoice dengan brand Anda!</h3>
          <p className="text-white/90 mb-4">Upload logo, pilih warna, kirim invoice profesional.</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors">
            Daftar Gratis
          </Link>
        </div>
      </div>
    </DemoPageWrapper>
  )
}
