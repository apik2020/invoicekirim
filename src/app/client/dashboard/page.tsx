'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function ClientDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login - client portal is disabled
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-surface-light flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Mengalihkan...</p>
      </div>
    </div>
  )
}
