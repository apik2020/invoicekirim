import ExcelJS from 'exceljs'
import { formatCurrency } from './utils'

export interface InvoiceExportData {
  id: string
  invoiceNumber: string
  date: Date | string
  dueDate: Date | string | null
  clientName: string
  clientEmail: string
  clientPhone?: string | null
  clientCompany?: string | null
  status: string
  subtotal: number
  taxRate: number
  taxAmount: number
  discountType?: string | null
  discountValue?: number | null
  discountAmount?: number | null
  total: number
  notes?: string | null
  items: Array<{
    description: string
    quantity: number
    price: number
    total: number
  }>
}

/**
 * Generate CSV content from invoice data
 */
export function generateInvoicesCSV(invoices: InvoiceExportData[]): string {
  const headers = [
    'Invoice Number',
    'Date',
    'Due Date',
    'Client Name',
    'Client Email',
    'Client Phone',
    'Client Company',
    'Status',
    'Subtotal',
    'Tax Rate (%)',
    'Tax Amount',
    'Discount Type',
    'Discount Value',
    'Discount Amount',
    'Total',
    'Notes',
  ]

  const rows = invoices.map((invoice) => [
    invoice.invoiceNumber,
    formatDateForExport(invoice.date),
    invoice.dueDate ? formatDateForExport(invoice.dueDate) : '',
    escapeCsvField(invoice.clientName),
    escapeCsvField(invoice.clientEmail),
    escapeCsvField(invoice.clientPhone || ''),
    escapeCsvField(invoice.clientCompany || ''),
    invoice.status,
    invoice.subtotal.toString(),
    invoice.taxRate.toString(),
    invoice.taxAmount.toString(),
    invoice.discountType || '',
    invoice.discountValue?.toString() || '',
    invoice.discountAmount?.toString() || '',
    invoice.total.toString(),
    escapeCsvField(invoice.notes || ''),
  ])

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
}

/**
 * Generate Excel workbook with 2 sheets (Invoices summary + Items detail)
 */
export async function generateInvoicesExcel(invoices: InvoiceExportData[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'InvoiceKirim'
  workbook.created = new Date()

  // Sheet 1: Invoices Summary
  const summarySheet = workbook.addWorksheet('Invoices', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  // Define columns for summary sheet
  summarySheet.columns = [
    { header: 'Invoice Number', key: 'invoiceNumber', width: 18 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Due Date', key: 'dueDate', width: 14 },
    { header: 'Client Name', key: 'clientName', width: 25 },
    { header: 'Client Email', key: 'clientEmail', width: 30 },
    { header: 'Client Phone', key: 'clientPhone', width: 18 },
    { header: 'Client Company', key: 'clientCompany', width: 25 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Subtotal', key: 'subtotal', width: 18 },
    { header: 'Tax Rate (%)', key: 'taxRate', width: 12 },
    { header: 'Tax Amount', key: 'taxAmount', width: 18 },
    { header: 'Discount', key: 'discountAmount', width: 18 },
    { header: 'Total', key: 'total', width: 20 },
    { header: 'Notes', key: 'notes', width: 30 },
  ]

  // Style header row
  const headerRow = summarySheet.getRow(1)
  headerRow.height = 25
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF276874' }, // Brand teal color
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.eachCell((cell) => {
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF1a4d54' } },
    }
  })

  // Add invoice data to summary sheet
  invoices.forEach((invoice) => {
    const row = summarySheet.addRow({
      invoiceNumber: invoice.invoiceNumber,
      date: formatDateForExport(invoice.date),
      dueDate: invoice.dueDate ? formatDateForExport(invoice.dueDate) : '-',
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      clientPhone: invoice.clientPhone || '-',
      clientCompany: invoice.clientCompany || '-',
      status: invoice.status,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      discountAmount: invoice.discountAmount || 0,
      total: invoice.total,
      notes: invoice.notes || '-',
    })

    // Format currency columns
    row.getCell('subtotal').numFmt = '"Rp"#,##0'
    row.getCell('taxAmount').numFmt = '"Rp"#,##0'
    row.getCell('discountAmount').numFmt = '"Rp"#,##0'
    row.getCell('total').numFmt = '"Rp"#,##0'

    // Add status-based coloring
    const statusCell = row.getCell('status')
    switch (invoice.status) {
      case 'PAID':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC5E151' }, // Success green
        }
        break
      case 'SENT':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF3C7' }, // Yellow
        }
        break
      case 'OVERDUE':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEE2E2' }, // Red
        }
        break
      case 'DRAFT':
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }, // Gray
        }
        break
    }
  })

  // Sheet 2: Items Detail
  const itemsSheet = workbook.addWorksheet('Invoice Items', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  // Define columns for items sheet
  itemsSheet.columns = [
    { header: 'Invoice Number', key: 'invoiceNumber', width: 18 },
    { header: 'Client Name', key: 'clientName', width: 25 },
    { header: 'Item Description', key: 'description', width: 40 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Unit Price', key: 'price', width: 18 },
    { header: 'Item Total', key: 'itemTotal', width: 20 },
  ]

  // Style header row
  const itemsHeaderRow = itemsSheet.getRow(1)
  itemsHeaderRow.height = 25
  itemsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  itemsHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEF3F0A' }, // Primary orange color
  }
  itemsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
  itemsHeaderRow.eachCell((cell) => {
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FFc23509' } },
    }
  })

  // Add items data
  invoices.forEach((invoice) => {
    invoice.items.forEach((item) => {
      const row = itemsSheet.addRow({
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        itemTotal: item.total,
      })

      // Format currency columns
      row.getCell('price').numFmt = '"Rp"#,##0'
      row.getCell('itemTotal').numFmt = '"Rp"#,##0'
    })
  })

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * Helper function to format date for export
 */
function formatDateForExport(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Helper function to escape CSV fields
 */
function escapeCsvField(field: string): string {
  if (!field) return ''
  // If field contains comma, newline, or double quote, wrap in quotes
  if (field.includes(',') || field.includes('\n') || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}
