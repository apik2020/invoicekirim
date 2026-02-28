'use client'

import { FileText, Send, CheckCircle, AlertCircle, Edit2, X } from 'lucide-react'

interface StatusFilterProps {
  currentFilter: string
  onFilterChange: (filter: string) => void
  counts?: {
    ALL: number
    DRAFT: number
    SENT: number
    PAID: number
    OVERDUE: number
    CANCELED: number
  }
}

const STATUS_CONFIG = [
  { value: 'ALL', label: 'Semua', icon: FileText, color: 'text-gray-600' },
  { value: 'DRAFT', label: 'Draft', icon: Edit2, color: 'text-orange-600' },
  { value: 'SENT', label: 'Terkirim', icon: Send, color: 'text-yellow-600' },
  { value: 'PAID', label: 'Lunas', icon: CheckCircle, color: 'text-lime-600' },
  { value: 'OVERDUE', label: 'Terlambat', icon: AlertCircle, color: 'text-pink-600' },
  { value: 'CANCELED', label: 'Batal', icon: X, color: 'text-gray-500' },
]

export function StatusFilter({ currentFilter, onFilterChange, counts }: StatusFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {STATUS_CONFIG.map((status) => {
        const Icon = status.icon
        const isActive = currentFilter === status.value
        const count = counts?.[status.value as keyof typeof counts] || 0

        return (
          <button
            key={status.value}
            onClick={() => onFilterChange(status.value)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all
              ${isActive
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-white text-gray-700 hover:bg-orange-50 border border-orange-200'
              }
            `}
          >
            <Icon size={16} />
            <span>{status.label}</span>
            {count > 0 && (
              <span
                className={`
                  px-2 py-0.5 rounded-lg text-xs font-bold
                  ${isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-orange-100 text-orange-700'
                  }
                `}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
