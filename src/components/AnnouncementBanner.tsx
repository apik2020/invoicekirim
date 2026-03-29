'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Info, AlertTriangle, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Announcement {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error' | 'promo'
  targetType: string
  displayType: 'banner' | 'modal' | 'toast'
  isDismissible: boolean
  read: boolean
  dismissed: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string
}

interface AnnouncementBannerProps {
  displayType?: 'banner' | 'modal' | 'toast' | 'all'
  autoRefresh?: boolean
  refreshInterval?: number // in seconds
  onAnnouncementRead?: (announcementId: string) => void
}

export function AnnouncementBanner({
  displayType = 'banner',
  autoRefresh = true,
  refreshInterval = 60,
  onAnnouncementRead,
}: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [currentModalIndex, setCurrentModalIndex] = useState(0)
  const [currentToastIndex, setCurrentToastIndex] = useState(0)

  const fetchAnnouncements = useCallback(async () => {
    try {
      const params = new URLSearchParams()

      const res = await fetch(`/api/announcements?${params.toString()}`)

      if (res.ok) {
        const data = await res.json()
        // Filter out dismissed announcements
        // For banner: don't show if already read
        // For modal/toast: show regardless of read status (only filter dismissed)
        const visibleAnnouncements = data.announcements.filter(
          (a: Announcement) => !a.dismissed && (
            displayType === 'all' ||
            (displayType === 'banner' && a.displayType === 'banner' && !a.read) ||
            (displayType === 'modal' && a.displayType === 'modal') ||
            (displayType === 'toast' && a.displayType === 'toast') ||
            (a.displayType === 'modal' && displayType === 'modal') ||
            (a.displayType === 'toast' && displayType === 'toast')
          )
        )
        setAnnouncements(visibleAnnouncements)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }, [displayType])

  const markAsRead = async (announcementId: string, dismissed = false) => {
    try {
      await fetch(`/api/announcements/${announcementId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismissed }),
      })

      // Update local state
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === announcementId
            ? { ...a, read: true, dismissed }
            : a
        )
      )

      // Move to next modal/toast if this was dismissed
      if (dismissed) {
        if (displayType === 'modal' || (announcements.find(a => a.id === announcementId)?.displayType === 'modal')) {
          setCurrentModalIndex((prev) => prev + 1)
        } else if (displayType === 'toast' || (announcements.find(a => a.id === announcementId)?.displayType === 'toast')) {
          setCurrentToastIndex((prev) => prev + 1)
        }
      }

      onAnnouncementRead?.(announcementId)
    } catch (error) {
      console.error('Error marking announcement as read:', error)
    }
  }

  useEffect(() => {
    fetchAnnouncements()

    if (autoRefresh) {
      const interval = setInterval(fetchAnnouncements, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [fetchAnnouncements, autoRefresh, refreshInterval])

  if (loading) {
    return null
  }

  // No announcements to show
  if (announcements.length === 0) {
    return null
  }

  // Separate by display type - but only show the ones that match current displayType
  // For banner: only show actual banners
  // For modal: only show actual modals
  // For toast: only show actual toasts
  const items = announcements.filter((a) => {
    if (displayType === 'all') return true
    return a.displayType === displayType
  })

  const getIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      case 'promo':
        return <Sparkles className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getStyles = (type: Announcement['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'promo':
        return 'bg-gradient-to-r from-orange-50 to-pink-50 border-orange-200 text-orange-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <>
      {/* Banner Announcements */}
      {displayType === 'banner' || displayType === 'all' ? (
        items.filter(a => a.displayType === 'banner').length > 0 && (
          <div className="space-y-2">
            {items.filter(a => a.displayType === 'banner').slice(0, 3).map((announcement) => (
              <div
                key={announcement.id}
                className={cn(
                  'relative border-2 rounded-xl px-4 py-3',
                  getStyles(announcement.type)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(announcement.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{announcement.title}</p>
                    <p className="text-sm opacity-90 mt-0.5">{announcement.message}</p>
                  </div>
                  {announcement.isDismissible && (
                    <button
                      onClick={() => markAsRead(announcement.id, true)}
                      className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors"
                      aria-label="Tutup pengumuman"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}

      {/* Modal Announcements */}
      {displayType === 'modal' ? (
        items.filter(a => a.displayType === 'modal').length > 0 && currentModalIndex < items.filter(a => a.displayType === 'modal').length && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-start gap-4">
                <div className={cn(
                  'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
                  items.filter(a => a.displayType === 'modal')[currentModalIndex].type === 'success' && 'bg-green-100 text-green-600',
                  items.filter(a => a.displayType === 'modal')[currentModalIndex].type === 'warning' && 'bg-amber-100 text-amber-600',
                  items.filter(a => a.displayType === 'modal')[currentModalIndex].type === 'error' && 'bg-red-100 text-red-600',
                  items.filter(a => a.displayType === 'modal')[currentModalIndex].type === 'promo' && 'bg-gradient-to-br from-orange-100 to-pink-100 text-orange-600',
                  !items.filter(a => a.displayType === 'modal')[currentModalIndex].type || items.filter(a => a.displayType === 'modal')[currentModalIndex].type === 'info' && 'bg-blue-100 text-blue-600'
                )}>
                  {getIcon(items.filter(a => a.displayType === 'modal')[currentModalIndex].type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {items.filter(a => a.displayType === 'modal')[currentModalIndex].title}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    {items.filter(a => a.displayType === 'modal')[currentModalIndex].message}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => markAsRead(items.filter(a => a.displayType === 'modal')[currentModalIndex].id, false)}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Tutup
                </button>
                {items.filter(a => a.displayType === 'modal')[currentModalIndex].isDismissible && (
                  <button
                    onClick={() => markAsRead(items.filter(a => a.displayType === 'modal')[currentModalIndex].id, true)}
                    className="px-4 py-2 bg-brand-500 text-white font-medium hover:bg-brand-600 rounded-lg transition-colors"
                  >
                    Jangan Tampilkan Lagi
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      ) : null}

      {/* Toast Announcements */}
      {displayType === 'toast' ? (
        items.filter(a => a.displayType === 'toast').length > 0 && currentToastIndex < items.filter(a => a.displayType === 'toast').length && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <div
              className={cn(
                'border-2 rounded-xl shadow-lg p-4 animate-in slide-in-from-right duration-300',
                getStyles(items.filter(a => a.displayType === 'toast')[currentToastIndex].type)
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {getIcon(items.filter(a => a.displayType === 'toast')[currentToastIndex].type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{items.filter(a => a.displayType === 'toast')[currentToastIndex].title}</p>
                  <p className="text-sm opacity-90 mt-0.5">{items.filter(a => a.displayType === 'toast')[currentToastIndex].message}</p>
                </div>
                {items.filter(a => a.displayType === 'toast')[currentToastIndex].isDismissible && (
                  <button
                    onClick={() => markAsRead(items.filter(a => a.displayType === 'toast')[currentToastIndex].id, true)}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      ) : null}
    </>
  )
}
