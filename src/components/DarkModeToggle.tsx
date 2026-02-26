'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { useEffect, useState } from 'react'

export default function DarkModeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, actualTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`w-10 h-10 rounded-lg ${className}`} />
    )
  }

  const isDark = actualTheme === 'dark'

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => {
          if (theme === 'light') {
            setTheme('dark')
          } else if (theme === 'dark') {
            setTheme('system')
          } else {
            setTheme('light')
          }
        }}
        className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200
          bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
          text-gray-600 dark:text-gray-300"
        aria-label="Toggle theme"
        title={`Current theme: ${theme}`}
      >
        {theme === 'system' ? (
          <Monitor className="w-5 h-5" />
        ) : isDark ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </button>
    </div>
  )
}
