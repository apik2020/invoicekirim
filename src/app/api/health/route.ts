import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  // Simple public health check — no sensitive data exposed
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 503 })
  }
}
