import { getUserSession } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { templateSchema } from '@/lib/validations/invoice'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const template = await prisma.invoice_templates.findFirst({
      where: {
        id,
        userId: session.id,
      },
      include: { template_items: true },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 })
    }

    // Transform template_items to items for frontend compatibility
    const transformedTemplate = {
      ...template,
      items: template.template_items,
    }

    return NextResponse.json(transformedTemplate)
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
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Check if template exists and belongs to user
    const existingTemplate = await prisma.invoice_templates.findFirst({
      where: {
        id,
        userId: session.id,
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

    const {
      items,
      settings,
      defaultClientId,
      termsAndConditions,
      signatureUrl,
      signatoryName,
      signatoryTitle,
      discountType,
      discountValue,
      additionalDiscountType,
      additionalDiscountValue,
      ...data
    } = validation.data

    // Delete existing items
    await prisma.template_items.deleteMany({
      where: { templateId: id },
    })

    // Update template
    const template = await prisma.invoice_templates.update({
      where: { id },
      data: {
        ...data,
        settings: settings ? JSON.parse(JSON.stringify(settings)) : {
          showClientInfo: true,
          showDiscount: false,
          showAdditionalDiscount: false,
          showTax: true,
          showSignature: false,
        },
        ...(defaultClientId !== undefined && { defaultClientId: defaultClientId || null }),
        ...(termsAndConditions !== undefined && { termsAndConditions: termsAndConditions || null }),
        ...(signatureUrl !== undefined && { signatureUrl: signatureUrl || null }),
        ...(signatoryName !== undefined && { signatoryName: signatoryName || null }),
        ...(signatoryTitle !== undefined && { signatoryTitle: signatoryTitle || null }),
        ...(discountType !== undefined && { discountType: discountType || null }),
        ...(discountValue !== undefined && discountValue !== null && { discountValue }),
        ...(additionalDiscountType !== undefined && { additionalDiscountType: additionalDiscountType || null }),
        ...(additionalDiscountValue !== undefined && additionalDiscountValue !== null && { additionalDiscountValue }),
        updatedAt: new Date(),
        template_items: {
          create: items.map((item) => ({
            id: crypto.randomUUID(),
            description: item.description,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { template_items: true },
    })

    // Transform template_items to items for frontend compatibility
    const transformedTemplate = {
      ...template,
      items: template.template_items,
    }

    return NextResponse.json(transformedTemplate)
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
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Check if template exists and belongs to user
    const template = await prisma.invoice_templates.findFirst({
      where: {
        id,
        userId: session.id,
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 })
    }

    // Delete template (cascade will delete items)
    await prisma.invoice_templates.delete({
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
