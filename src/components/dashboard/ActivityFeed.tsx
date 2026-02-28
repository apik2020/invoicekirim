'use client'

import { Bell, PlusCircle, Send, CheckCircle, AlertCircle, Edit, Trash2, XCircle, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

interface Activity {
  id: string
  action: string
  title: string
  description?: string | null
  createdAt: string | Date
}

interface ActivityFeedProps {
  activities: Activity[]
}

const actionIcons = {
  CREATED: PlusCircle,
  SENT: Send,
  PAID: CheckCircle,
  OVERDUE: AlertCircle,
  UPDATED: Edit,
  DELETED: Trash2,
  CANCELED: XCircle,
  REMINDED: Bell,
  VIEWED: Eye,
}

const actionColors = {
  CREATED: 'text-lime-600 bg-lime-50',
  SENT: 'text-blue-600 bg-blue-50',
  PAID: 'text-green-600 bg-green-50',
  OVERDUE: 'text-pink-600 bg-pink-50',
  UPDATED: 'text-orange-600 bg-orange-50',
  DELETED: 'text-gray-600 bg-gray-50',
  CANCELED: 'text-gray-600 bg-gray-50',
  REMINDED: 'text-purple-600 bg-purple-50',
  VIEWED: 'text-teal-600 bg-teal-50',
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="font-bold text-gray-900 mb-2">Belum ada aktivitas</h3>
        <p className="text-gray-600">Aktivitasmu akan muncul di sini</p>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Aktivitas Terbaru</h2>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = actionIcons[activity.action as keyof typeof actionIcons] || Bell
          const colorClass = actionColors[activity.action as keyof typeof actionColors] || 'text-gray-600 bg-gray-50'

          return (
            <div key={activity.id} className="flex gap-4">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{activity.title}</p>
                {activity.description && (
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                    locale: id,
                  })}
                </p>
              </div>

              {/* Timeline line (except last item) */}
              {index < activities.length - 1 && (
                <div className="absolute left-5 mt-12 w-0.5 h-full bg-gray-200" />
              )}
            </div>
          )
        })}
      </div>

      {activities.length >= 10 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button className="text-sm font-bold text-orange-600 hover:text-orange-700">
            Lihat Semua Aktivitas →
          </button>
        </div>
      )}
    </div>
  )
}
