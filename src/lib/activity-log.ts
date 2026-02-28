import { prisma } from '@/lib/prisma'
import { ActivityAction } from '@prisma/client'

export async function logActivity(params: {
  userId: string
  action: ActivityAction
  entityType: string
  entityId: string
  title: string
  description?: string
  metadata?: any
}) {
  return await prisma.activityLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      title: params.title,
      description: params.description,
      metadata: params.metadata,
    },
  })
}

// Helper functions untuk common actions
export async function logInvoiceCreated(userId: string, invoiceNumber: string, total: number) {
  return logActivity({
    userId,
    action: 'CREATED',
    entityType: 'Invoice',
    entityId: invoiceNumber,
    title: `Invoice ${invoiceNumber} dibuat`,
    description: `Total: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total)}`,
    metadata: { total },
  })
}

export async function logInvoiceSent(userId: string, invoiceNumber: string, clientEmail: string) {
  return logActivity({
    userId,
    action: 'SENT',
    entityType: 'Invoice',
    entityId: invoiceNumber,
    title: `Invoice ${invoiceNumber} dikirim`,
    description: `Dikirim ke ${clientEmail}`,
    metadata: { clientEmail },
  })
}

export async function logInvoicePaid(userId: string, invoiceNumber: string, amount: number) {
  return logActivity({
    userId,
    action: 'PAID',
    entityType: 'Invoice',
    entityId: invoiceNumber,
    title: `Invoice ${invoiceNumber} lunas`,
    description: `Pembayaran: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)}`,
    metadata: { amount },
  })
}

export async function logInvoiceUpdated(userId: string, invoiceNumber: string, changes: string[]) {
  return logActivity({
    userId,
    action: 'UPDATED',
    entityType: 'Invoice',
    entityId: invoiceNumber,
    title: `Invoice ${invoiceNumber} diupdate`,
    description: changes.join(', '),
    metadata: { changes },
  })
}

export async function logInvoiceDeleted(userId: string, invoiceNumber: string) {
  return logActivity({
    userId,
    action: 'DELETED',
    entityType: 'Invoice',
    entityId: invoiceNumber,
    title: `Invoice ${invoiceNumber} dihapus`,
    description: 'Invoice telah dihapus permanen',
  })
}

export async function logInvoiceOverdue(userId: string, invoiceNumber: string, dueDate: Date) {
  return logActivity({
    userId,
    action: 'OVERDUE',
    entityType: 'Invoice',
    entityId: invoiceNumber,
    title: `Invoice ${invoiceNumber} jatuh tempo`,
    description: `Jatuh tempo pada ${dueDate.toLocaleDateString('id-ID')}`,
    metadata: { dueDate },
  })
}

export async function logClientCreated(userId: string, clientName: string) {
  return logActivity({
    userId,
    action: 'CREATED',
    entityType: 'Client',
    entityId: clientName,
    title: `Klien ${clientName} ditambahkan`,
    description: 'Klien baru berhasil ditambahkan',
  })
}

export async function logItemCreated(userId: string, itemName: string, price: number) {
  return logActivity({
    userId,
    action: 'CREATED',
    entityType: 'Item',
    entityId: itemName,
    title: `Item ${itemName} ditambahkan`,
    description: `Harga: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price)}`,
    metadata: { price },
  })
}

export async function logClientDeleted(userId: string, clientName: string) {
  return logActivity({
    userId,
    action: 'DELETED',
    entityType: 'Client',
    entityId: clientName,
    title: `Klien ${clientName} dihapus`,
    description: 'Klien telah dihapus permanen',
  })
}

export async function logItemDeleted(userId: string, itemName: string) {
  return logActivity({
    userId,
    action: 'DELETED',
    entityType: 'Item',
    entityId: itemName,
    title: `Item ${itemName} dihapus`,
    description: 'Item telah dihapus permanen',
  })
}
