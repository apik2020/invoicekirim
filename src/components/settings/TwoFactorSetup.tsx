'use client'

import { useState, useCallback } from 'react'
import { Shield, ShieldCheck, Loader2, Copy, Check, AlertTriangle, Key, ArrowRight } from 'lucide-react'

interface TwoFactorSetupProps {
  isEnabled: boolean
  onStatusChange?: (enabled: boolean) => void
}

export function TwoFactorSetup({ isEnabled: initialEnabled, onStatusChange }: TwoFactorSetupProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled)
  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'backup'>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Setup state
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false)

  // Verify state
  const [verifyCode, setVerifyCode] = useState('')

  // Disable state
  const [disableCode, setDisableCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')

  const handleStartSetup = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/user/2fa/setup', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal memulai setup 2FA')
      }
      const data = await res.json()
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setBackupCodes(data.backupCodes)
      setStep('setup')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memulai setup 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleContinueToVerify = () => {
    setStep('verify')
  }

  const handleVerify = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setError('Masukkan kode 6 digit dari aplikasi authenticator')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/user/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: verifyCode,
          secret,
          backupCodes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kode tidak valid')
      }

      setStep('backup')
      setIsEnabled(true)
      onStatusChange?.(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kode tidak valid')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyBackupCodes = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'))
      setCopiedBackupCodes(true)
      setTimeout(() => setCopiedBackupCodes(false), 2000)
    } catch {
      setError('Gagal menyalin kode')
    }
  }, [backupCodes])

  const handleFinishSetup = () => {
    setStep('idle')
    setQrCode('')
    setSecret('')
    setVerifyCode('')
    setBackupCodes([])
  }

  const handleDisable = async () => {
    if (!disableCode && !disablePassword) {
      setError('Masukkan kode 2FA atau password untuk menonaktifkan')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/user/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: disableCode || undefined,
          password: disablePassword || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menonaktifkan 2FA')
      }

      setIsEnabled(false)
      setDisableCode('')
      setDisablePassword('')
      onStatusChange?.(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menonaktifkan 2FA')
    } finally {
      setLoading(false)
    }
  }

  // Render enabled state
  if (isEnabled && step === 'idle') {
    return (
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-success-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-brand-500 mb-1">
              Two-Factor Authentication Aktif
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              Akun Anda dilindungi dengan autentikasi dua faktor. Anda akan diminta memasukkan kode dari aplikasi authenticator saat login.
            </p>

            {/* Disable Form */}
            <div className="p-4 rounded-xl bg-surface-light border border-gray-200">
              <p className="text-sm text-text-secondary mb-3">
                Untuk menonaktifkan 2FA, masukkan kode dari aplikasi authenticator atau password Anda:
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Kode 6 digit"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input w-full max-w-xs"
                  maxLength={6}
                />
                <div className="flex items-center gap-3">
                  <span className="text-text-muted">atau</span>
                  <input
                    type="password"
                    placeholder="Password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="input flex-1 max-w-xs"
                  />
                </div>
                {error && (
                  <p className="text-sm text-primary-500">{error}</p>
                )}
                <button
                  onClick={handleDisable}
                  disabled={loading}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Nonaktifkan 2FA'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render setup steps
  if (step === 'setup') {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-bold text-brand-500 mb-4">
          Step 1: Scan QR Code
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="p-4 bg-white rounded-xl border border-gray-200 mb-4">
              {qrCode && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              )}
            </div>
            <p className="text-sm text-text-secondary text-center">
              Scan QR code ini dengan aplikasi authenticator seperti Google Authenticator atau Authy
            </p>
          </div>

          {/* Manual Entry */}
          <div>
            <h4 className="font-medium text-text-primary mb-2">
              Tidak bisa scan? Masukkan manual:
            </h4>
            <div className="p-3 bg-surface-light rounded-lg font-mono text-sm break-all mb-4">
              {secret}
            </div>

            <div className="space-y-2 text-sm text-text-secondary">
              <p><strong>1.</strong> Buka aplikasi authenticator Anda</p>
              <p><strong>2.</strong> Tambahkan akun baru</p>
              <p><strong>3.</strong> Scan QR code atau masukkan kode manual</p>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-primary-500 mt-4">{error}</p>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={handleContinueToVerify}
            className="btn-primary px-6 py-2.5 flex items-center gap-2"
          >
            Lanjutkan
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-bold text-brand-500 mb-4">
          Step 2: Verifikasi Kode
        </h3>

        <p className="text-text-secondary mb-4">
          Masukkan kode 6 digit dari aplikasi authenticator Anda:
        </p>

        <input
          type="text"
          placeholder="000000"
          value={verifyCode}
          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="input w-full max-w-xs text-center text-2xl tracking-widest font-mono"
          maxLength={6}
        />

        {error && (
          <p className="text-sm text-primary-500 mt-2">{error}</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setStep('setup')}
            className="btn-secondary px-6 py-2.5"
          >
            Kembali
          </button>
          <button
            onClick={handleVerify}
            disabled={loading || verifyCode.length !== 6}
            className="btn-primary px-6 py-2.5 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Verifikasi'
            )}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'backup') {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-bold text-brand-500 mb-2">
          2FA Berhasil Diaktifkan!
        </h3>
        <p className="text-text-secondary mb-4">
          Simpan kode backup berikut di tempat yang aman. Kode ini dapat digunakan untuk mengakses akun Anda jika kehilangan akses ke aplikasi authenticator.
        </p>

        <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl mb-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-primary-700">
            <strong>Penting:</strong> Setiap kode backup hanya dapat digunakan satu kali. Simpan dengan aman!
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {backupCodes.map((code, index) => (
            <div
              key={index}
              className="p-2 bg-surface-light rounded-lg font-mono text-sm text-center"
            >
              {code}
            </div>
          ))}
        </div>

        <button
          onClick={handleCopyBackupCodes}
          className="btn-secondary px-4 py-2 flex items-center gap-2 mb-6"
        >
          {copiedBackupCodes ? (
            <>
              <Check className="w-4 h-4" />
              Tersalin!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Salin Semua Kode
            </>
          )}
        </button>

        <button
          onClick={handleFinishSetup}
          className="btn-primary px-6 py-2.5"
        >
          Selesai
        </button>
      </div>
    )
  }

  // Render disabled/initial state
  return (
    <div className="card p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-gray-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-brand-500 mb-1">
            Two-Factor Authentication
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            Tambahkan lapisan keamanan ekstra ke akun Anda. Saat 2FA aktif, Anda perlu memasukkan kode dari aplikasi authenticator saat login.
          </p>

          {error && (
            <p className="text-sm text-primary-500 mb-4">{error}</p>
          )}

          <button
            onClick={handleStartSetup}
            disabled={loading}
            className="btn-primary px-6 py-2.5 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Key className="w-4 h-4" />
                Aktifkan 2FA
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
