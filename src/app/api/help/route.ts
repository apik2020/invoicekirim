import { NextRequest, NextResponse } from 'next/server'
import {
  getHelpCategories,
  getHelpArticlesByCategory,
  searchHelpArticles,
} from '@/lib/help-center'

// GET /api/help - Get help center content
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    if (search) {
      const articles = searchHelpArticles(search)
      return NextResponse.json({ articles })
    }

    if (category) {
      const articles = getHelpArticlesByCategory(category)
      return NextResponse.json({ articles })
    }

    const categories = getHelpCategories()
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching help content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch help content' },
      { status: 500 }
    )
  }
}
