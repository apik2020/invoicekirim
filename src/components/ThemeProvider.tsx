'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Get stored theme preference
    const storedTheme = localStorage.getItem('theme') as Theme | null
    const initialTheme = storedTheme || 'light'
    setTheme(initialTheme)

    // Get system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const systemTheme = mediaQuery.matches ? 'dark' : 'light'
    const effectiveTheme = initialTheme === 'system' ? systemTheme : initialTheme

    // Apply theme immediately
    const root = document.documentElement
    if (effectiveTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    setActualTheme(effectiveTheme as 'light' | 'dark')

    // Listen for system changes
    const handleChange = (e: MediaQueryListEvent) => {
      const currentStoredTheme = localStorage.getItem('theme') as Theme
      if (currentStoredTheme === 'system') {
        const newTheme = e.matches ? 'dark' : 'light'
        if (newTheme === 'dark') {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
        setActualTheme(newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const effectiveTheme = theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme

    if (effectiveTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    setActualTheme(effectiveTheme as 'light' | 'dark')
  }, [theme, mounted])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
