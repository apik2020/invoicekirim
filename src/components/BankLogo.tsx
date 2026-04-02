'use client'

import React from 'react'

interface BankLogoProps {
  bankCode: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = {
  sm: { width: 80, height: 40 },
  md: { width: 100, height: 50 },
  lg: { width: 120, height: 60 },
}

// Bank logo SVGs - professional versions with proper aspect ratios
const BANK_LOGOS: Record<string, React.ReactNode> = {
  bca: (
    <svg viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* BCA Logo Background */}
      <rect x="5" y="5" width="40" height="40" rx="6" fill="#005BAC"/>
      {/* BCA Icon Pattern */}
      <rect x="12" y="15" width="26" height="3" rx="1.5" fill="white"/>
      <rect x="12" y="22" width="20" height="3" rx="1.5" fill="white"/>
      <rect x="12" y="29" width="14" height="3" rx="1.5" fill="white"/>
      {/* BCA Text */}
      <text x="52" y="32" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="#005BAC">BCA</text>
    </svg>
  ),
  bni: (
    <svg viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* BNI Logo Background */}
      <rect x="5" y="5" width="40" height="40" rx="6" fill="#F15A22"/>
      {/* BNI Icon - Orange 46 Style */}
      <rect x="15" y="12" width="20" height="26" rx="2" fill="white"/>
      <path d="M25 16L32 25L25 34L18 25Z" fill="#F15A22"/>
      {/* BNI Text */}
      <text x="52" y="32" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="#F15A22">BNI</text>
    </svg>
  ),
  bri: (
    <svg viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* BRI Logo Background */}
      <rect x="5" y="5" width="40" height="40" rx="6" fill="#00529C"/>
      {/* BRI Icon - Circle with text */}
      <circle cx="25" cy="25" r="12" fill="white"/>
      <rect x="19" y="20" width="12" height="2" rx="1" fill="#00529C"/>
      <rect x="19" y="24" width="8" height="2" rx="1" fill="#00529C"/>
      <rect x="19" y="28" width="5" height="2" rx="1" fill="#00529C"/>
      {/* BRI Text */}
      <text x="52" y="32" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="#00529C">BRI</text>
    </svg>
  ),
  mandiri: (
    <svg viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Mandiri Logo Background */}
      <rect x="5" y="5" width="40" height="40" rx="6" fill="#003D79"/>
      {/* Mandiri Icon - Yellow Triangle */}
      <path d="M25 12L35 35H15L25 12Z" fill="#FDD017"/>
      {/* Mandiri Text */}
      <text x="52" y="32" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#003D79">Mandiri</text>
    </svg>
  ),
  permata: (
    <svg viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Permata Logo Background */}
      <rect x="5" y="5" width="40" height="40" rx="6" fill="#ED1C24"/>
      {/* Permata Icon - Diamond */}
      <path d="M25 10L33 20L25 40L17 20Z" fill="white"/>
      {/* Permata Text */}
      <text x="52" y="32" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#ED1C24">Permata</text>
    </svg>
  ),
  cimb: (
    <svg viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* CIMB Logo Background */}
      <rect x="5" y="5" width="40" height="40" rx="6" fill="#7B2D42"/>
      {/* CIMB Icon - Lines */}
      <rect x="12" y="15" width="26" height="3" rx="1.5" fill="white"/>
      <rect x="12" y="22" width="20" height="3" rx="1.5" fill="white"/>
      <rect x="12" y="29" width="14" height="3" rx="1.5" fill="white"/>
      {/* CIMB Text */}
      <text x="52" y="28" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#7B2D42">CIMB</text>
      <text x="52" y="38" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="#7B2D42">Niaga</text>
    </svg>
  ),
}

// Bank colors for backgrounds
export const BANK_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  bca: { bg: 'bg-blue-50', border: 'border-[#005BAC]', text: 'text-[#005BAC]' },
  bni: { bg: 'bg-orange-50', border: 'border-[#F15A22]', text: 'text-[#F15A22]' },
  bri: { bg: 'bg-blue-50', border: 'border-[#00529C]', text: 'text-[#00529C]' },
  mandiri: { bg: 'bg-sky-50', border: 'border-[#003D79]', text: 'text-[#003D79]' },
  permata: { bg: 'bg-red-50', border: 'border-[#ED1C24]', text: 'text-[#ED1C24]' },
  cimb: { bg: 'bg-rose-50', border: 'border-[#7B2D42]', text: 'text-[#7B2D42]' },
}

export function BankLogo({ bankCode, className = '', size = 'md' }: BankLogoProps) {
  const sizeStyle = SIZE_MAP[size]
  const logo = BANK_LOGOS[bankCode.toLowerCase()]

  if (!logo) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ width: sizeStyle.width, height: sizeStyle.height }}
      >
        <span className="text-gray-500 font-bold">{bankCode.toUpperCase()}</span>
      </div>
    )
  }

  return (
    <div className={className} style={{ width: sizeStyle.width, height: sizeStyle.height }}>
      {logo}
    </div>
  )
}

// Bank button with logo only (no text label)
interface BankButtonProps {
  bank: { code: string; name: string; description: string }
  selected: boolean
  onClick: () => void
}

export function BankButton({ bank, selected, onClick }: BankButtonProps) {
  const colors = BANK_COLORS[bank.code.toLowerCase()] || { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700' }

  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
        ${selected
          ? `${colors.bg} border-2 shadow-md`
          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
        }
        group aspect-square
      `}
      title={bank.name}
    >
      {/* Selection checkmark */}
      {selected && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shadow-md">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Bank Logo - Larger */}
      <div className="flex-shrink-0 scale-110">
        <BankLogo bankCode={bank.code} size="md" />
      </div>
    </button>
  )
}

export default BankLogo
