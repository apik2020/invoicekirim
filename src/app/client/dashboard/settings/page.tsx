'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings,
  Bell,
  Mail,
  Loader2,
  Save,
  Check,
} from 'lucide-react'
import { ClientDashboardLayout } from '@/components/ClientDashboardLayout'

interface Preferences {
  emailNotification: boolean
  invoiceSent: boolean
  paymentReminder: boolean
  paymentReceived: boolean
  overdueAlert: boolean
  newMessage: boolean
}

export default function ClientSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [preferences, setPreferences] = useState<Preferences>({
    emailNotification: true,
    invoiceSent: true,
    paymentReminder: true,
    paymentReceived: true,
    overdueAlert: true,
    newMessage: true,
  })

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/client/preferences')

      if (res.status === 401) {
        router.push('/client/auth/login')
        return
      }

      if (res.ok) {
        const data = await res.json()
        if (data.preferences) {
          setPreferences(data.preferences)
        }
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/client/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const togglePreference = (key: keyof Preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const ToggleSwitch = ({
    enabled,
    onChange,
    label,
    description,
  }: {
    enabled: boolean
    onChange: () => void
    label: string
    description: string
  }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-brand-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )

  if (loading) {
    return (
      <ClientDashboardLayout title="Pengaturan">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </ClientDashboardLayout>
    )
  }

  return (
    <ClientDashboardLayout title="Pengaturan">
      <div className="max-w-2xl">
        {/* Notification Preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <Bell className="w-5 h-5 text-brand-500" />
            <h2 className="font-semibold text-gray-900">Preferensi Notifikasi</h2>
          </div>

          <div className="px-6 divide-y divide-gray-100">
            <ToggleSwitch
              enabled={preferences.emailNotification}
              onChange={() => togglePreference('emailNotification')}
              label="Notifikasi Email"
              description="Terima notifikasi melalui email"
            />

            <div className={!preferences.emailNotification ? 'opacity-50 pointer-events-none' : ''}>
              <ToggleSwitch
                enabled={preferences.invoiceSent}
                onChange={() => togglePreference('invoiceSent')}
                label="Invoice Baru"
                description="Notifikasi saat ada invoice baru dikirim"
              />

              <ToggleSwitch
                enabled={preferences.paymentReminder}
                onChange={() => togglePreference('paymentReminder')}
                label="Pengingat Pembayaran"
                description="Pengingat sebelum jatuh tempo"
              />

              <ToggleSwitch
                enabled={preferences.paymentReceived}
                onChange={() => togglePreference('paymentReceived')}
                label="Konfirmasi Pembayaran"
                description="Notifikasi saat pembayaran diterima"
              />

              <ToggleSwitch
                enabled={preferences.overdueAlert}
                onChange={() => togglePreference('overdueAlert')}
                label="Invoice Terlambat"
                description="Peringatan saat invoice melewati jatuh tempo"
              />

              <ToggleSwitch
                enabled={preferences.newMessage}
                onChange={() => togglePreference('newMessage')}
                label="Pesan Baru"
                description="Notifikasi saat ada pesan dari vendor"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Simpan Pengaturan
              </>
            )}
          </button>

          {saved && (
            <span className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              Tersimpan
            </span>
          )}
        </div>
      </div>
    </ClientDashboardLayout>
  )
}
