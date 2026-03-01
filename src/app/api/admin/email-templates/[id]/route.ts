import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Get single email template
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { subject, body: templateBody, variables, isActive } = body

    const template = await prisma.emailTemplate.update({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await prisma.emailTemplate.delete({
      where: { id },
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
