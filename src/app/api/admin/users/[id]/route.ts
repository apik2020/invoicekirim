import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Get single user with details
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
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
        invoices: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            invoices: true,
            clients: true,
            items: true,
            templates: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's payments
    const payments = await prisma.payment.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Get user's activity logs
    const activityLogs = await prisma.activityLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      user,
      payments,
      activityLogs,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// Update user
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
    const { name, email, companyName, companyEmail, companyPhone, companyAddress } = body

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        companyName,
        companyEmail,
        companyPhone,
        companyAddress,
      },
      include: {
        subscription: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// Delete user
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
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
