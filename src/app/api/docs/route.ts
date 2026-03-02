import { NextResponse } from 'next/server'
import { openApiSpec } from '@/lib/openapi'

// GET /api/docs - Get OpenAPI specification
export async function GET() {
  return NextResponse.json(openApiSpec)
}
