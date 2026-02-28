'use client'

import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

interface UsePrintOptions {
  documentTitle?: string
  onBeforePrint?: () => void
  onAfterPrint?: () => void
}

export function usePrint(options: UsePrintOptions = {}) {
  const contentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: options.documentTitle || 'InvoiceKirim',
    onBeforePrint: options.onBeforePrint,
    onAfterPrint: options.onAfterPrint,
  })

  return {
    contentRef,
    handlePrint,
  }
}
