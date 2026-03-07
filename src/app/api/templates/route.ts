import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { templateSchema } from '@/lib/validations/invoice'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await prisma.invoiceTemplate.findMany({
      where: { userId: session.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(templates)
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

    const template = await prisma.invoiceTemplate.create({
      data: {
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

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json(
      { error: 'Gagal membuat template' },
      { status: 500 }
    )
  }
}
