'use client'

import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Printer } from 'lucide-react'

interface PrintWrapperProps {
  children: React.ReactNode
  contentRef?: React.RefObject<HTMLDivElement | null>
  documentTitle?: string
  buttonClassName?: string
  buttonText?: string
}

// Component that wraps content and provides print functionality
export function PrintableContent({
  children,
  contentRef,
}: {
  children: React.ReactNode
  contentRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div ref={contentRef}>
      {children}
    </div>
  )
}

// Print button component
export function PrintButton({
  contentRef,
  documentTitle = 'InvoiceKirim',
  buttonClassName = 'inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg',
  buttonText = '🖨️ Cetak',
}: {
  contentRef: React.RefObject<HTMLDivElement | null>
  documentTitle?: string
  buttonClassName?: string
  buttonText?: string
}) {
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle,
  })

  return (
    <button onClick={handlePrint} className={buttonClassName}>
      {buttonText}
    </button>
  )
}

// Hook for custom print implementations
export function usePrintContent(contentRef: React.RefObject<HTMLDivElement | null>, documentTitle = 'InvoiceKirim') {
  return useReactToPrint({
    contentRef,
    documentTitle,
  })
}
