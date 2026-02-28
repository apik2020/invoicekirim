import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { InvoicePrintView } from '@/components/InvoicePrintView'

interface PageProps {
  params: Promise<{ token: string }>
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

  // Convert dates and serialize for client component
  const invoiceData = {
    ...invoice,
    date: invoice.date,
    dueDate: invoice.dueDate,
    items: invoice.items.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
    })),
  }

  return <InvoicePrintView invoice={invoiceData} />
}
