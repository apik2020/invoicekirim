import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/debug/doku-config
 * Debug endpoint to verify DOKU configuration
 */
export async function GET() {
  const clientId = process.env.DOKU_CLIENT_ID
  const secretKey = process.env.DOKU_SECRET_KEY
  const environment = process.env.DOKU_ENVIRONMENT

  // Check for quotes in values
  const hasQuotesInClientId = clientId?.startsWith('"') || clientId?.endsWith('"')
  const hasQuotesInSecretKey = secretKey?.startsWith('"') || secretKey?.endsWith('"')

  return NextResponse.json({
    dokuConfig: {
      clientId: {
        exists: !!clientId,
        length: clientId?.length || 0,
        preview: clientId ? `${clientId.substring(0, 10)}...` : null,
        hasQuotes: hasQuotesInClientId,
        firstChar: clientId?.charAt(0),
        lastChar: clientId?.charAt(clientId.length - 1),
      },
      secretKey: {
        exists: !!secretKey,
        length: secretKey?.length || 0,
        hasQuotes: hasQuotesInSecretKey,
        firstChar: secretKey?.charAt(0),
        lastChar: secretKey?.charAt(secretKey.length - 1),
      },
      environment: {
        value: environment,
        isSandbox: environment === 'SANDBOX',
        isProduction: environment === 'PRODUCTION',
        hasQuotes: environment?.startsWith('"') || environment?.endsWith('"'),
      },
      apiUrl: environment === 'PRODUCTION'
        ? 'https://api.doku.com'
        : 'https://api-sandbox.doku.com',
    },
    recommendation: {
      hasQuotesInClientId
        ? 'Remove quotes from DOKU_CLIENT_ID in Dokploy environment variables'
        : 'DOKU_CLIENT_ID looks correct',
      hasQuotesInSecretKey
        ? 'Remove quotes from DOKU_SECRET_KEY in Dokploy environment variables'
        : 'DOKU_SECRET_KEY looks correct',
    },
    allEnvVars: Object.keys(process.env).filter(key => key.startsWith('DOKU')),
  })
}
