import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { CACHE_DURATIONS, getCacheHeaders } from '@/lib/cache'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = CACHE_DURATIONS.SHORT

export async function GET(req: NextRequest) {
  try {
    // Verify admin access - NO development mode bypass for security
    const admin = await verifyAdmin()
    if (admin instanceof NextResponse) {
      return admin
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const search = url.searchParams.get('search') || ''
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'
    const planType = url.searchParams.get('planType')
    const status = url.searchParams.get('status')

    const skip = (page - 1) * limit

    const where: any = {}

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filter by subscription
    if (planType || status) {
      where.subscription = {}
      if (planType) {
        where.subscription.planType = planType
      }
      if (status) {
        where.subscription.status = status
      }
    }

    // Get users with subscription data
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          subscription: true,
          _count: {
            select: {
              invoices: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, {
      headers: getCacheHeaders('api-dynamic'),
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin access - NO development mode bypass for security
    const admin = await verifyAdmin()
    if (admin instanceof NextResponse) {
      return admin
    }

    const body = await req.json()
    const { email, name, password, companyName, planType } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Create user (with optional password)
    const userData: any = {
      email,
      name,
      companyName,
    }

    if (password) {
      const bcrypt = require('bcryptjs')
      userData.password = await bcrypt.hash(password, 12)
    }

    const user = await prisma.user.create({
      data: {
        ...userData,
        subscription: {
          create: {
            status: planType === 'PRO' ? 'ACTIVE' : 'FREE',
            planType: planType || 'FREE',
          },
        },
      },
      include: {
        subscription: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
