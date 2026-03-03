'use client'

import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

interface UsePrintOptions {
  documentTitle?: string
  onBeforePrint?: () => Promise<void> | void
  onAfterPrint?: () => Promise<void> | void
}

export function usePrint(options: UsePrintOptions = {}) {
  const contentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: options.documentTitle || 'InvoiceKirim',
    onBeforePrint: async () => {
      if (options.onBeforePrint) {
        await options.onBeforePrint()
      }
    },
    onAfterPrint: async () => {
      if (options.onAfterPrint) {
        await options.onAfterPrint()
      }
    },
  })

  return {
    contentRef,
    handlePrint,
  }
}
