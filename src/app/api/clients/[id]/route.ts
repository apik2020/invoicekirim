import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// PUT - Update client
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, email, phone, address, company } = body

    // Check if email is being changed and if it conflicts with another client
    if (email && email !== client.email) {
      const existingClient = await prisma.client.findFirst({
        where: {
          userId: session.user.id,
          email,
          id: { not: id },
        },
      })

      if (existingClient) {
        return NextResponse.json(
          { error: 'Email sudah digunakan oleh klien lain' },
          { status: 400 }
        )
      }
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        address,
        company,
      },
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Update client error:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

// DELETE - Delete client
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check if client is used in any invoice
    const invoiceCount = await prisma.invoice.count({
      where: { clientId: id },
    })

    if (invoiceCount > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus klien yang sudah memiliki ${invoiceCount} invoice` },
        { status: 400 }
      )
    }

    await prisma.client.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Delete client error:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}
