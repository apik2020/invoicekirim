// This file is only used at runtime, not during build
// The PDF generation requires browser-like environment which isn't available during build

interface ReceiptData {
  receiptNumber: string
  date: Date
  amount: number
  currency: string
  paymentMethod: string
  description: string
  customerName: string
  customerEmail: string
  invoiceNumber?: string
}

// Generate receipt PDF using @react-pdf/renderer
// This function should only be called at runtime
export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  // Dynamic imports to avoid build-time evaluation
  const [{ pdf }, React] = await Promise.all([
    import('@react-pdf/renderer'),
    import('react'),
  ])

  try {
    // Dynamic import of the component
    const { ReceiptPDF } = await import('@/components/pdf/ReceiptPDF')

    // Create the PDF document using React.createElement
    const doc = React.createElement(ReceiptPDF, data)

    // Generate PDF as a blob and convert to buffer
    const blob = await pdf(doc as any).toBlob()
    const arrayBuffer = await blob.arrayBuffer()

    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('Error generating receipt PDF:', error)
    throw new Error('Failed to generate receipt PDF')
  }
}
