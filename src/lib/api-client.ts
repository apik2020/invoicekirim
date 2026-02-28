/**
 * Client-side API wrapper with error handling
 * Provides consistent API calls with automatic error handling
 */

interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
  code?: string
  message?: string
}

interface ApiRequestOptions extends RequestInit {
  timeout?: number
}

/**
 * Fetch wrapper with timeout and error handling
 */
async function fetchWithTimeout(
  url: string,
  options: ApiRequestOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Silakan coba lagi.')
    }
    throw error
  }
}

/**
 * API client with consistent error handling
 */
export const apiClient = {
  async get<T = any>(
    url: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      ...options,
    })

    if (!response.ok) {
      const data: ApiResponse = await response.json().catch(() => ({}))
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  },

  async post<T = any>(
    url: string,
    body?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    if (!response.ok) {
      const data: ApiResponse = await response.json().catch(() => ({}))
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  },

  async put<T = any>(
    url: string,
    body?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    const response = await fetchWithTimeout(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    if (!response.ok) {
      const data: ApiResponse = await response.json().catch(() => ({}))
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  },

  async patch<T = any>(
    url: string,
    body?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    const response = await fetchWithTimeout(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    if (!response.ok) {
      const data: ApiResponse = await response.json().catch(() => ({}))
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  },

  async delete<T = any>(
    url: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    const response = await fetchWithTimeout(url, {
      method: 'DELETE',
      ...options,
    })

    if (!response.ok) {
      const data: ApiResponse = await response.json().catch(() => ({}))
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  },
}

/**
 * React hook for API calls with loading and error states
 */
export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(async <T,>(
    apiCall: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiCall()
      return result
    } catch (err: any) {
      const errorMessage = err.message || 'Terjadi kesalahan. Silakan coba lagi.'
      setError(errorMessage)
      // Optionally show toast notification here
      console.error('API Error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, request }
}

import { useState, useCallback } from 'react'
