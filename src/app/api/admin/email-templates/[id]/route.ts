import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Get single email template
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access - NO development mode bypass for security
    const admin = await verifyAdmin()
    if (admin instanceof NextResponse) {
      return admin
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching email template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email template' },
      { status: 500 }
    )
  }
}

// Update email template
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access - NO development mode bypass for security
    const admin = await verifyAdmin()
    if (admin instanceof NextResponse) {
      return admin
    }

    const body = await req.json()
    const { subject, body: templateBody, variables, isActive } = body

    const template = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(templateBody !== undefined && { body: templateBody }),
        ...(variables !== undefined && { variables }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating email template:', error)
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    )
  }
}

// Delete email template
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access - NO development mode bypass for security
    const admin = await verifyAdmin()
    if (admin instanceof NextResponse) {
      return admin
    }

    await prisma.emailTemplate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error deleting email template:', error)
    return NextResponse.json(
      { error: 'Failed to delete email template' },
      { status: 500 }
    )
  }
}
