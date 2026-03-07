import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { InvoicePrintView } from '@/components/InvoicePrintView'

// Disable static generation for this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ token: string }>
}

interface InvoiceSettings {
  showClientInfo?: boolean
  showDiscount?: boolean
  showAdditionalDiscount?: boolean
  showTax?: boolean
  showSignature?: boolean
}

export default async function InvoicePage({ params }: PageProps) {
  const { token } = await params

  const invoice = await prisma.invoice.findUnique({
    where: { accessToken: token },
    include: { items: true },
  })

  if (!invoice) {
    notFound()
  }

  // Parse settings from JSON
  const settings = invoice.settings as InvoiceSettings | null

  // Convert dates and serialize for client component
  const invoiceData = {
    ...invoice,
    date: invoice.date,
    dueDate: invoice.dueDate,
    settings,
    items: invoice.items.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
    })),
  }

  return <InvoicePrintView invoice={invoiceData} />
}
