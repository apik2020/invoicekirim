'use client'

import { useState, useEffect } from 'react'
import { translations, type Locale } from '@/lib/landing-translations'

export { type Locale }

export function useLandingLocale() {
  const [locale, setLocaleState] = useState<Locale>('id')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('landing-locale')
    if (saved === 'en' || saved === 'id') {
      setLocaleState(saved)
    }
    setLoaded(true)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('landing-locale', l)
  }

  const t = translations[locale]

  return { locale, setLocale, t, loaded }
}
