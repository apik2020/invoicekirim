import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Get all email templates
export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    )
  }
}

// Create new email template
export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const result = await requireAdminAuth()
    if (result.error || !result.admin) {
      return NextResponse.json({ error: result.error || 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, subject, body: templateBody, variables, isActive } = body

    if (!name || !subject || !templateBody) {
      return NextResponse.json(
        { error: 'Name, subject, and body are required' },
        { status: 400 }
      )
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body: templateBody,
        variables,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating email template:', error)
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    )
  }
}
