import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { templateSchema } from '@/lib/validations/invoice'

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
    const template = await prisma.invoiceTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: { items: true },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Get template error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil template' },
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
    // Check if template exists and belongs to user
    const existingTemplate = await prisma.invoiceTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 })
    }

    const body = await req.json()
    const validation = templateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { items, ...data } = validation.data

    // Delete existing items
    await prisma.templateItem.deleteMany({
      where: { templateId: id },
    })

    // Update template
    const template = await prisma.invoiceTemplate.update({
      where: { id },
      data: {
        ...data,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Update template error:', error)
    return NextResponse.json(
      { error: 'Gagal mengubah template' },
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
    // Check if template exists and belongs to user
    const template = await prisma.invoiceTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 })
    }

    // Delete template (cascade will delete items)
    await prisma.invoiceTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Template berhasil dihapus' })
  } catch (error) {
    console.error('Delete template error:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus template' },
      { status: 500 }
    )
  }
}
