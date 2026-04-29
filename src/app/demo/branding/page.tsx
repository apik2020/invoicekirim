'use client'

import Link from 'next/link'
import { Palette, Upload, Save } from 'lucide-react'
import { DemoPageWrapper } from '@/components/demo/DemoLayout'

const brandColors = [
  { name: 'Biru', color: '#0A637D', active: true },
  { name: 'Hijau', color: '#22C55E', active: false },
  { name: 'Ungu', color: '#8B5CF6', active: false },
  { name: 'Merah', color: '#EF4444', active: false },
  { name: 'Oranye', color: '#F97316', active: false },
  { name: 'Teal', color: '#14B8A6', active: false },
]

export default function DemoBrandingPage() {
  return (
    <DemoPageWrapper title="Branding">
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold text-brand-500">Branding Invoice</h2>
          <p className="text-text-secondary text-sm">Kustomisasi tampilan invoice sesuai brand Anda</p>
        </div>

        <div className="card p-6 space-y-6">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Logo di Invoice</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-surface-light">
                <Upload className="w-5 h-5 text-text-muted" />
              </div>
              <button className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-text-secondary hover:bg-surface-light transition-colors">
                Upload Logo
              </button>
            </div>
          </div>

          {/* Brand color */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Warna Utama</label>
            <div className="flex flex-wrap gap-3">
              {brandColors.map((c) => (
                <button
                  key={c.name}
                  className={`w-10 h-10 rounded-xl border-2 transition-all ${
                    c.active ? 'border-gray-800 scale-110 shadow-lg' : 'border-transparent hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
              <button className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-text-muted hover:border-primary-400 transition-colors">
                <Palette className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Preview Invoice</label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="h-2 bg-[#0A637D]" />
              <div className="p-6 bg-white">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-gray-100 mb-2" />
                    <p className="font-bold text-sm text-text-primary">CV Demo Bisnis</p>
                    <p className="text-xs text-text-muted">demo@notabener.id</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-[#0A637D]">INVOICE</p>
                    <p className="text-xs text-text-muted">INV-2026-042</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                  <div>
                    <p className="text-text-muted">Kepada:</p>
                    <p className="font-semibold">PT Maju Jaya Sentosa</p>
                  </div>
                  <div className="text-right">
                    <p className="text-text-muted">Tanggal:</p>
                    <p className="font-semibold">29 April 2026</p>
                  </div>
                </div>
                <hr className="border-gray-100 my-3" />
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span>Jasa Konsultasi IT</span><span>Rp 10.000.000</span></div>
                  <div className="flex justify-between"><span>Maintenance Server</span><span>Rp 5.000.000</span></div>
                </div>
                <hr className="border-gray-100 my-3" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span className="text-[#0A637D]">Rp 15.000.000</span>
                </div>
              </div>
            </div>
          </div>

          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25">
            <Save className="w-4 h-4" />
            Simpan Branding
          </button>
        </div>

        <div className="card p-6 cta-gradient rounded-2xl text-white text-center">
          <h3 className="text-xl font-bold mb-2">Branding profesional untuk invoice Anda!</h3>
          <p className="text-white/90 mb-4">Upload logo, pilih warna brand, tampil beda di mata klien.</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors">
            Daftar Gratis
          </Link>
        </div>
      </div>
    </DemoPageWrapper>
  )
}
