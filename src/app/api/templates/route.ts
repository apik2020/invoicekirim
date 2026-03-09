import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { templateSchema } from '@/lib/validations/invoice'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await prisma.invoice_templates.findMany({
      where: { userId: session.user.id },
      include: { template_items: true },
      orderBy: { createdAt: 'desc' },
    })

    // Transform template_items to items for frontend compatibility
    const transformedTemplates = templates.map((template) => ({
      ...template,
      items: template.template_items,
    }))

    return NextResponse.json(transformedTemplates)
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil template' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const template = await prisma.invoice_templates.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
        userId: session.user.id,
        settings: settings ? JSON.parse(JSON.stringify(settings)) : {
          showClientInfo: true,
          showDiscount: false,
          showAdditionalDiscount: false,
          showTax: true,
          showSignature: false,
        },
        ...(defaultClientId && { defaultClientId }),
        ...(termsAndConditions && { termsAndConditions }),
        ...(signatureUrl && { signatureUrl }),
        ...(signatoryName && { signatoryName }),
        ...(signatoryTitle && { signatoryTitle }),
        ...(discountType && { discountType }),
        ...(discountValue !== undefined && discountValue !== null && { discountValue }),
        ...(additionalDiscountType && { additionalDiscountType }),
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

    return NextResponse.json(transformedTemplate, { status: 201 })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json(
      { error: 'Gagal membuat template' },
      { status: 500 }
    )
  }
}
