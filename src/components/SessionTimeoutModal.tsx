'use client'

import { LogOut, Clock } from 'lucide-react'

interface SessionTimeoutModalProps {
  show: boolean
  timeRemaining: number
  onStayLoggedIn: () => void
  onLogout: () => void
}

export function SessionTimeoutModal({
  show,
  timeRemaining,
  onStayLoggedIn,
  onLogout,
}: SessionTimeoutModalProps) {
  if (!show) return null

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const timeString = minutes > 0
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : `${seconds} detik`

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Sesi Akan Berakhir
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-2">
            Tidak ada aktivitas selama beberapa waktu.
          </p>
          <p className="text-gray-900 font-semibold mb-6">
            Anda akan logout otomatis dalam{' '}
            <span className="text-orange-600 text-lg">{timeString}</span>
          </p>

          {/* Countdown indicator */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${Math.max(0, (timeRemaining / 60) * 100)}%`,
              }}
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onStayLoggedIn}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
            >
              Tetap Login
            </button>
            <button
              onClick={onLogout}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
