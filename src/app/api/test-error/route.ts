import { NextResponse } from 'next/server'

export async function GET() {
  // Simulate various types of errors
  const errorType = new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    .searchParams.get('type') || 'generic'

  switch (errorType) {
    case 'database':
      // Simulate database error
      return NextResponse.json(
        { error: 'Database connection failed. Please try again.' },
        { status: 503 }
      )

    case 'timeout':
      // Simulate timeout
      await new Promise(resolve => setTimeout(resolve, 10000))
      return NextResponse.json({ error: 'Request timeout' }, { status: 504 })

    case 'validation':
      // Simulate validation error
      return NextResponse.json(
        { error: 'Validation failed: Invalid input data', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )

    case 'unauthorized':
      return NextResponse.json(
        { error: 'You are not authorized to access this resource', code: 'UNAUTHORIZED' },
        { status: 401 }
      )

    case 'forbidden':
      return NextResponse.json(
        { error: 'Access forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      )

    case 'notfound':
      return NextResponse.json(
        { error: 'Resource not found', code: 'NOT_FOUND' },
        { status: 404 }
      )

    default:
      // Generic server error
      throw new Error('This is a test server error from /api/test-error')
  }
}

export async function POST() {
  // Test POST request error
  return NextResponse.json(
    { error: 'Test POST error - method not implemented' },
    { status: 501 }
  )
}
