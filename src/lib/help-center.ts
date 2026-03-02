/**
 * Help Center Articles
 * Static documentation for the help center
 */

export interface HelpArticle {
  id: string
  slug: string
  title: string
  category: string
  excerpt: string
  content: string
  keywords: string[]
  lastUpdated: string
}

export interface HelpCategory {
  id: string
  name: string
  description: string
  icon: string
  articles: string[] // Article IDs
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Learn the basics of InvoiceKirim',
    icon: 'Rocket',
    articles: ['what-is-invoicekirim', 'creating-first-invoice', 'setting-up-profile'],
  },
  {
    id: 'invoices',
    name: 'Invoices',
    description: 'Everything about creating and managing invoices',
    icon: 'FileText',
    articles: ['creating-invoices', 'sending-invoices', 'invoice-statuses', 'invoice-templates'],
  },
  {
    id: 'clients',
    name: 'Clients',
    description: 'Managing your clients',
    icon: 'Users',
    articles: ['adding-clients', 'client-portal'],
  },
  {
    id: 'payments',
    name: 'Payments',
    description: 'Payment processing and management',
    icon: 'CreditCard',
    articles: ['payment-methods', 'stripe-integration', 'midtrans-integration'],
  },
  {
    id: 'teams',
    name: 'Teams',
    description: 'Collaboration and team management',
    icon: 'Users',
    articles: ['creating-teams', 'inviting-members', 'team-roles'],
  },
  {
    id: 'api',
    name: 'API',
    description: 'Developer documentation',
    icon: 'Code',
    articles: ['api-authentication', 'api-invoices', 'api-webhooks'],
  },
  {
    id: 'billing',
    name: 'Billing',
    description: 'Subscription and billing management',
    icon: 'Receipt',
    articles: ['subscription-plans', 'upgrading-plan', 'canceling-subscription'],
  },
]

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'what-is-invoicekirim',
    slug: 'what-is-invoicekirim',
    title: 'What is InvoiceKirim?',
    category: 'getting-started',
    excerpt: 'Introduction to InvoiceKirim and its features',
    content: `
# What is InvoiceKirim?

InvoiceKirim is a modern invoicing platform designed for Indonesian businesses and freelancers.

## Key Features

- **Easy Invoice Creation**: Create professional invoices in minutes
- **Multiple Payment Methods**: Support for Stripe and Midtrans (VA, QRIS, E-wallet)
- **Client Portal**: Let your clients view and pay invoices online
- **Templates**: Save time with reusable invoice templates
- **Team Collaboration**: Work together with your team
- **API Access**: Integrate with your existing systems

## Getting Started

1. Sign up for a free account
2. Complete your profile with company information
3. Create your first invoice
4. Send it to your client

Need help? Contact our support team at support@invoicekirim.com
    `,
    keywords: ['introduction', 'features', 'getting started'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'creating-first-invoice',
    slug: 'creating-first-invoice',
    title: 'Creating Your First Invoice',
    category: 'getting-started',
    excerpt: 'Step-by-step guide to create your first invoice',
    content: `
# Creating Your First Invoice

Follow these steps to create your first invoice:

## Step 1: Go to Invoices

Navigate to **Dashboard > Invoices** and click **Create Invoice**.

## Step 2: Fill in Client Details

Enter your client's information:
- Client name
- Email address
- Phone number (optional)
- Address (optional)

## Step 3: Add Invoice Items

Add line items to your invoice:
1. Click **Add Item**
2. Enter description
3. Set quantity and price
4. Repeat for additional items

## Step 4: Set Dates

- **Invoice Date**: When the invoice is issued
- **Due Date**: When payment is expected

## Step 5: Review and Save

Review your invoice details and click **Save as Draft** or **Send Invoice**.

## Tips

- Use templates for recurring invoices
- Add notes for special terms
- Preview before sending
    `,
    keywords: ['invoice', 'create', 'first invoice', 'tutorial'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'creating-teams',
    slug: 'creating-teams',
    title: 'Creating and Managing Teams',
    category: 'teams',
    excerpt: 'How to create a team and invite members',
    content: `
# Creating and Managing Teams

Teams allow you to collaborate with others on invoices and clients.

## Creating a Team

1. Go to **Dashboard > Teams**
2. Click **Create Team**
3. Enter team name and description
4. Click **Create**

## Inviting Members

1. Open your team
2. Click **Invite Member**
3. Enter email address
4. Select role (Admin, Member, Viewer)
5. Click **Send Invitation**

## Team Roles

- **Owner**: Full access, can delete team
- **Admin**: Can manage members and settings
- **Member**: Can create and edit invoices
- **Viewer**: Read-only access

## Managing Members

- Change roles from the members list
- Remove members who no longer need access
- View pending invitations
    `,
    keywords: ['team', 'collaboration', 'members', 'roles'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'api-authentication',
    slug: 'api-authentication',
    title: 'API Authentication',
    category: 'api',
    excerpt: 'How to authenticate with the InvoiceKirim API',
    content: `
# API Authentication

InvoiceKirim uses API keys for authentication.

## Creating an API Key

1. Go to **Dashboard > Settings > API Keys**
2. Click **Create API Key**
3. Enter a name for your key
4. Select scopes (permissions)
5. Click **Create**
6. **Copy the key immediately** - it won't be shown again

## Using Your API Key

Include your API key in the Authorization header:

\`\`\`
Authorization: Bearer ik_live_xxxxxxxxxxxx
\`\`\`

## Example Request

\`\`\`bash
curl -X GET "https://invoicekirim.com/api/invoices" \\
  -H "Authorization: Bearer ik_live_xxxxxxxxxxxx" \\
  -H "Content-Type: application/json"
\`\`\`

## Scopes

- \`invoices:read\` - View invoices
- \`invoices:write\` - Create and update invoices
- \`clients:read\` - View clients
- \`clients:write\` - Create and update clients

## Rate Limits

- 1000 requests per hour per API key
- Rate limit headers are included in responses
    `,
    keywords: ['api', 'authentication', 'api key', 'security'],
    lastUpdated: '2024-01-15',
  },
]

/**
 * Get all help categories
 */
export function getHelpCategories(): HelpCategory[] {
  return HELP_CATEGORIES
}

/**
 * Get help article by slug
 */
export function getHelpArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((article) => article.slug === slug)
}

/**
 * Get help articles by category
 */
export function getHelpArticlesByCategory(categoryId: string): HelpArticle[] {
  return HELP_ARTICLES.filter((article) => article.category === categoryId)
}

/**
 * Search help articles
 */
export function searchHelpArticles(query: string): HelpArticle[] {
  const lowerQuery = query.toLowerCase()

  return HELP_ARTICLES.filter((article) => {
    const titleMatch = article.title.toLowerCase().includes(lowerQuery)
    const excerptMatch = article.excerpt.toLowerCase().includes(lowerQuery)
    const keywordMatch = article.keywords.some((k) => k.toLowerCase().includes(lowerQuery))

    return titleMatch || excerptMatch || keywordMatch
  })
}
