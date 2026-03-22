'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  image?: string | null
  isAdmin: boolean
}

interface SessionData {
  authenticated: boolean
  user: User | null
}

interface UseAppSessionReturn {
  data: SessionData | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  update: () => Promise<void>
}

export function useAppSession(): UseAppSessionReturn {
  const router = useRouter()
  const [data, setData] = useState<SessionData | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch('/api/session', {
        credentials: 'include',
      })

      if (response.ok) {
        const sessionData = await response.json()
        setData(sessionData)
        setStatus(sessionData.authenticated ? 'authenticated' : 'unauthenticated')
      } else {
        setData({ authenticated: false, user: null })
        setStatus('unauthenticated')
      }
    } catch (error) {
      console.error('[useAppSession] Error:', error)
      setData({ authenticated: false, user: null })
      setStatus('unauthenticated')
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const update = useCallback(async () => {
    setStatus('loading')
    await fetchSession()
  }, [fetchSession])

  return {
    data,
    status,
    update,
  }
}
