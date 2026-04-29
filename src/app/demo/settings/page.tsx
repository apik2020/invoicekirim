'use client'

import Link from 'next/link'
import { Upload, Save } from 'lucide-react'
import { DemoPageWrapper } from '@/components/demo/DemoLayout'

export default function DemoSettingsPage() {
  return (
    <DemoPageWrapper title="Profil">
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold text-brand-500">Pengaturan Profil</h2>
          <p className="text-text-secondary text-sm">Informasi bisnis Anda yang tampil di invoice</p>
        </div>

        <div className="card p-6 space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Logo Bisnis</label>
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors bg-surface-light">
              <div className="text-center">
                <Upload className="w-6 h-6 text-text-muted mx-auto mb-1" />
                <span className="text-[10px] text-text-muted">Upload</span>
              </div>
            </div>
          </div>

          {/* Business info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Nama Bisnis</label>
              <input type="text" value="CV Demo Bisnis" readOnly className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Nama Pemilik</label>
              <input type="text" value="Demo User" readOnly className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <input type="email" value="demo@notabener.id" readOnly className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">No. Telepon</label>
              <input type="text" value="+62 812-3456-7890" readOnly className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Alamat Bisnis</label>
            <textarea rows={3} value="Jl. Demo Raya No. 123, Jakarta Selatan, DKI Jakarta 12345" readOnly className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">NPWP (Opsional)</label>
            <input type="text" value="12.345.678.9-012.000" readOnly className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white" />
          </div>

          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25">
            <Save className="w-4 h-4" />
            Simpan Perubahan
          </button>
        </div>

        {/* CTA */}
        <div className="card p-6 cta-gradient rounded-2xl text-white text-center">
          <h3 className="text-xl font-bold mb-2">Atur profil bisnis Anda!</h3>
          <p className="text-white/90 mb-4">Informasi ini akan otomatis tampil di setiap invoice.</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors">
            Daftar Gratis
          </Link>
        </div>
      </div>
    </DemoPageWrapper>
  )
}
