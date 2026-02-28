import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'

export async function GET(req: NextRequest) {
  const result = await requireAdminAuth()

  if (result.error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    id: result.admin.id,
    email: result.admin.email,
    name: result.admin.name,
  })
}
