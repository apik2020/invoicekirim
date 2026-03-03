import ClientInvoicePage from './ClientInvoicePage'

interface PageProps {
  params: Promise<{ token: string }>
}

export default function Page({ params }: PageProps) {
  return <ClientInvoicePage params={params} />
}
