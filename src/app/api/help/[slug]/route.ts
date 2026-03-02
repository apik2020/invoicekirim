import { NextRequest, NextResponse } from 'next/server'
import { getHelpArticleBySlug } from '@/lib/help-center'

// GET /api/help/[slug] - Get a specific help article
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const article = getHelpArticleBySlug(slug)

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}
