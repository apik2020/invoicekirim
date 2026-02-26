import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ClientInvoicePage from './ClientInvoicePage'

interface PageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/client/invoices/${token}`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      return {
        title: 'Invoice Tidak Ditemukan - InvoiceKirim',
      }
    }

    const invoice = await res.json()

    return {
      title: `Invoice ${invoice.invoiceNumber} dari ${invoice.companyName}`,
      description: `Invoice sebesar ${new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(invoice.total)}`,
    }
  } catch {
    return {
      title: 'Invoice - InvoiceKirim',
    }
  }
}

export default function Page({ params }: PageProps) {
  return <ClientInvoicePage params={params} />
}
