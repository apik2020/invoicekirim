'use client'

import { Check } from 'lucide-react'

const layouts = [
  { key: 'professional' as const, label: 'Profesional', accent: '#0F766E', desc: 'Klasik & formal' },
  { key: 'modern' as const, label: 'Modern', accent: '#8B5CF6', desc: 'Warna-warni & elegan' },
  { key: 'minimalist' as const, label: 'Minimalis', accent: '#374151', desc: 'Bersih & sederhana' },
]

interface LayoutPickerProps {
  value: 'professional' | 'modern' | 'minimalist'
  onChange: (v: 'professional' | 'modern' | 'minimalist') => void
}

export function LayoutPicker({ value, onChange }: LayoutPickerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {layouts.map((layout) => {
        const active = value === layout.key
        return (
          <button
            key={layout.key}
            type="button"
            onClick={() => onChange(layout.key)}
            className={`relative flex flex-col rounded-xl border-2 transition-all text-left overflow-hidden ${
              active
                ? 'border-brand-500 bg-brand-50 shadow-md ring-1 ring-brand-500/20'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            {/* Selected badge */}
            {active && (
              <div className="absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shadow-sm">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Preview area */}
            <div className="p-3 pb-2">
              <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                <div style={{ height: '5px', backgroundColor: layout.accent }} />
                <div className="p-3 bg-gray-50/80 min-h-[72px] flex flex-col justify-center">
                  {layout.key === 'professional' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="w-5 h-5 rounded" style={{ backgroundColor: layout.accent }} />
                        <span className="text-[8px] font-bold" style={{ color: layout.accent }}>INVOICE</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="h-1.5 w-8 bg-gray-200 rounded" />
                          <div className="h-1 w-10 bg-gray-100 rounded" />
                          <div className="h-1 w-6 bg-gray-100 rounded" />
                        </div>
                        <div className="flex-1 space-y-1 text-right">
                          <div className="h-1.5 w-8 bg-gray-200 rounded ml-auto" />
                          <div className="h-1 w-10 bg-gray-100 rounded ml-auto" />
                          <div className="h-1 w-6 bg-gray-100 rounded ml-auto" />
                        </div>
                      </div>
                      <div style={{ borderBottom: `1.5px solid ${layout.accent}`, margin: '2px 0' }} />
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <div className="h-1 w-12 bg-gray-100 rounded" />
                          <div className="h-1 w-10 bg-gray-100 rounded" />
                        </div>
                        <div className="flex justify-between">
                          <div className="h-1 w-8 bg-gray-100 rounded" />
                          <div className="h-1 w-14 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </div>
                  )}
                  {layout.key === 'modern' && (
                    <div className="space-y-2">
                      <div className="rounded-md px-2 py-1" style={{ backgroundColor: layout.accent }}>
                        <span className="text-[7px] text-white font-bold tracking-wide">INVOICE</span>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="flex-1 rounded-md border border-purple-100 p-1.5 bg-purple-50 space-y-1">
                          <div className="h-1 w-6 bg-purple-200 rounded" />
                          <div className="h-1 w-8 bg-purple-100 rounded" />
                        </div>
                        <div className="flex-1 rounded-md border border-purple-100 p-1.5 bg-purple-50 space-y-1">
                          <div className="h-1 w-6 bg-purple-200 rounded" />
                          <div className="h-1 w-8 bg-purple-100 rounded" />
                        </div>
                      </div>
                      <div className="rounded-md border border-purple-100 bg-purple-50 p-1.5 space-y-1">
                        <div className="flex justify-between">
                          <div className="h-1 w-8 bg-purple-100 rounded" />
                          <div className="h-1 w-10 bg-purple-200 rounded" />
                        </div>
                        <div className="flex justify-between">
                          <div className="h-1 w-6 bg-purple-100 rounded" />
                          <div className="h-1 w-12 bg-purple-200 rounded" />
                        </div>
                      </div>
                    </div>
                  )}
                  {layout.key === 'minimalist' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[8px] font-bold text-gray-400 tracking-widest">Invoice</span>
                        <div className="h-0.5 w-8 bg-gray-200 rounded" />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="h-1 w-8 bg-gray-200 rounded" />
                          <div className="h-1 w-10 bg-gray-100 rounded" />
                          <div className="h-1 w-6 bg-gray-100 rounded" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="h-1 w-8 bg-gray-200 rounded" />
                          <div className="h-1 w-10 bg-gray-100 rounded" />
                          <div className="h-1 w-6 bg-gray-100 rounded" />
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-1.5 space-y-1">
                        <div className="flex justify-between">
                          <div className="h-1 w-8 bg-gray-100 rounded" />
                          <div className="h-1 w-10 bg-gray-100 rounded" />
                        </div>
                        <div className="flex justify-between">
                          <div className="h-1 w-6 bg-gray-100 rounded" />
                          <div className="h-1 w-12 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Label */}
            <div className="px-3 pb-3 pt-1">
              <h3 className="font-bold text-sm text-text-primary">{layout.label}</h3>
              <p className="text-xs text-text-muted mt-0.5">{layout.desc}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
