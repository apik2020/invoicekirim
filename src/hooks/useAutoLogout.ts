'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface UseAutoLogoutOptions {
  timeout?: number // Timeout in milliseconds (default: 30 minutes)
  warningTime?: number // Show warning before logout in milliseconds (default: 1 minute before)
  onLogout?: () => void
  redirectPath?: string
}

export function useAutoLogout({
  timeout = 30 * 60 * 1000, // 30 minutes default
  warningTime = 1 * 60 * 1000, // 1 minute warning
  onLogout,
  redirectPath = '/login',
}: UseAutoLogoutOptions = {}) {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const logout = useCallback(async () => {
    setShowWarning(false)
    if (onLogout) {
      onLogout()
    }
    await signOut({ redirect: false })
    router.push(redirectPath)
    router.refresh()
  }, [onLogout, router, redirectPath])

  const resetTimers = useCallback(() => {
    setShowWarning(false)

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
    }

    // Set warning timer
    const warningDelay = timeout - warningTime
    if (warningDelay > 0) {
      warningRef.current = setTimeout(() => {
        setShowWarning(true)
        setTimeRemaining(Math.floor(warningTime / 1000))

        // Start countdown
        countdownRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              if (countdownRef.current) {
                clearInterval(countdownRef.current)
              }
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }, warningDelay)
    }

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      logout()
    }, timeout)
  }, [timeout, warningTime, logout])

  const extendSession = useCallback(() => {
    resetTimers()
  }, [resetTimers])

  const stayLoggedIn = useCallback(() => {
    resetTimers()
  }, [resetTimers])

  useEffect(() => {
    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ]

    // Reset timers on user activity
    const handleActivity = () => {
      resetTimers()
    }

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Initialize timers
    resetTimers()

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }
  }, [resetTimers])

  return {
    showWarning,
    timeRemaining,
    stayLoggedIn,
    logout,
    extendSession,
  }
}
