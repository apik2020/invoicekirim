import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invoiceUpdateSchema } from '@/lib/validations/invoice'
import { logInvoiceUpdated, logInvoiceDeleted } from '@/lib/activity-log'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: { items: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Get invoice error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil invoice' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Check if invoice exists and belongs to user
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    // Cannot update paid or canceled invoices
    if (existingInvoice.status === 'PAID' || existingInvoice.status === 'CANCELED') {
      return NextResponse.json(
        { error: 'Tidak dapat mengubah invoice yang sudah lunas atau dibatalkan' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validation = invoiceUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { items, invoiceNumber, ...data } = validation.data

    // Track changes
    const changes: string[] = []
    if (data.clientName && data.clientName !== existingInvoice.clientName) changes.push('Nama klien')
    if (data.clientEmail && data.clientEmail !== existingInvoice.clientEmail) changes.push('Email klien')
    if (invoiceNumber && invoiceNumber !== existingInvoice.invoiceNumber) changes.push('Nomor invoice')
    if (data.dueDate !== undefined && new Date(data.dueDate).toISOString() !== new Date(existingInvoice.dueDate || 0).toISOString()) changes.push('Jatuh tempo')
    if (data.taxRate !== undefined && data.taxRate !== existingInvoice.taxRate) changes.push('Tarif pajak')
    if (data.notes !== undefined && data.notes !== existingInvoice.notes) changes.push('Catatan')
    if (items && items.length > 0) changes.push('Item invoice')

    // Calculate totals if items are provided
    let subtotal = existingInvoice.subtotal
    let taxAmount = existingInvoice.taxAmount
    let total = existingInvoice.total

    if (items && items.length > 0) {
      subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
      taxAmount = subtotal * ((data.taxRate ?? existingInvoice.taxRate) / 100)
      total = subtotal + taxAmount
    }

    // Check if invoice number is unique
    if (invoiceNumber && invoiceNumber !== existingInvoice.invoiceNumber) {
      const duplicateInvoice = await prisma.invoice.findUnique({
        where: { invoiceNumber },
      })

      if (duplicateInvoice) {
        return NextResponse.json(
          { error: 'Nomor invoice sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Delete existing items if new items are provided
    if (items && items.length > 0) {
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      })
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...data,
        ...(invoiceNumber && { invoiceNumber }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        subtotal,
        taxAmount,
        total,
        ...(items && {
          items: {
            create: items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        }),
      },
      include: { items: true },
    })

    // Log activity
    if (changes.length > 0) {
      await logInvoiceUpdated(session.user.id, existingInvoice.invoiceNumber, changes)
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Update invoice error:', error)
    return NextResponse.json(
      { error: 'Gagal mengubah invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Check if invoice exists and belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    // Only allow deletion of DRAFT and CANCELED invoices
    if (invoice.status !== 'DRAFT' && invoice.status !== 'CANCELED') {
      const statusMessages: Record<string, string> = {
        SENT: 'Invoice sudah dikirim ke klien',
        PAID: 'Invoice sudah lunas',
        OVERDUE: 'Invoice sudah jatuh tempo',
      }
      return NextResponse.json(
        {
          error: `Tidak dapat menghapus invoice. ${statusMessages[invoice.status] || 'Status invoice tidak memperbolehkan penghapusan'}.`,
        },
        { status: 400 }
      )
    }

    // Delete invoice (cascade will delete items)
    await prisma.invoice.delete({
      where: { id },
    })

    // Log activity
    await logInvoiceDeleted(session.user.id, invoice.invoiceNumber)

    return NextResponse.json({ message: 'Invoice berhasil dihapus' })
  } catch (error) {
    console.error('Delete invoice error:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus invoice' },
      { status: 500 }
    )
  }
}
