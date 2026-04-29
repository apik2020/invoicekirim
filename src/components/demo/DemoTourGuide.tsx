'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X, ChevronLeft, ChevronRight, Play, Sparkles, Monitor, MousePointerClick,
} from 'lucide-react'

export interface TourStep {
  targetId: string
  title: string
  description: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

interface DemoTourGuideProps {
  steps: TourStep[]
  onComplete: () => void
  onSkip: () => void
}

export function DemoTourGuide({ steps, onComplete, onSkip }: DemoTourGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({})

  const step = steps[currentStep]

  const updatePosition = useCallback(() => {
    if (!step) return

    const el = document.getElementById(step.targetId)
    if (!el) {
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
      })
      return
    }

    const rect = el.getBoundingClientRect()
    const padding = 8
    const tooltipWidth = 380
    const tooltipHeight = 220

    setHighlightStyle({
      position: 'fixed',
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      zIndex: 10000,
      pointerEvents: 'none',
    })

    let top = 0
    let left = 0

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + padding + 8
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case 'top':
        top = rect.top - padding - tooltipHeight - 8
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.right + padding + 8
        break
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.left - padding - tooltipWidth - 8
        break
    }

    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16))
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16))

    setTooltipStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 10001,
    })
  }, [step])

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [updatePosition, currentStep])

  useEffect(() => {
    if (!step) return
    const el = document.getElementById(step.targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [step])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!isVisible || !step) return null

  return (
    <>
      {/* No dark overlay — dashboard stays fully visible and clear */}
      {/* Highlight border around target element */}
      <div
        style={highlightStyle}
        className="rounded-xl border-2 border-primary-400 shadow-[0_0_24px_4px_rgba(59,130,246,0.3)] transition-all duration-500 bg-primary-400/5"
      />

      {/* Tooltip card */}
      <div
        style={tooltipStyle}
        className="bg-white rounded-2xl shadow-2xl border border-primary-100 transition-all duration-500"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-primary-600">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-brand-500 mb-2">{step.title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
        </div>

        {/* Progress dots */}
        <div className="px-5 pb-2">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-primary-500' : i < currentStep ? 'w-1.5 bg-primary-300' : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentStep === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all"
          >
            {currentStep === steps.length - 1 ? 'Mulai Sekarang!' : 'Lanjut'}
            {currentStep < steps.length - 1 ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </>
  )
}

// Welcome overlay — uses semi-transparent bg but no blur so dashboard is visible underneath
export function DemoWelcomeOverlay({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 500)
    return () => clearTimeout(t)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-[10002] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-[scaleIn_0.4s_ease-out]">
        {/* Top gradient */}
        <div className="cta-gradient p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
            <Monitor className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Selamat Datang di Demo!
          </h2>
          <p className="text-white/90">
            Ini adalah tampilan Dashboard Profesional Plan NotaBener
          </p>
        </div>

        <div className="p-6 md:p-8">
          <p className="text-gray-600 text-center mb-6 leading-relaxed">
            Kami akan menunjukkan fitur-fitur utama yang akan Anda dapatkan.
            Ikuti tur singkat ini untuk melihat bagaimana NotaBener bisa membantu bisnis Anda.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-3 rounded-xl bg-brand-50">
              <MousePointerClick className="w-6 h-6 text-brand-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-brand-600">Interaktif</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-primary-50">
              <Play className="w-6 h-6 text-primary-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-primary-600">2 Menit</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-success-50">
              <Sparkles className="w-6 h-6 text-success-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-success-600">Lengkap</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onStart}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all"
            >
              <Play className="w-5 h-5" />
              Mulai Tur Demo
            </button>
            <button
              onClick={onSkip}
              className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors"
            >
              Lewati, jelajahi sendiri
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Completion overlay — same, no blur
export function DemoCompleteOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[10002] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[scaleIn_0.4s_ease-out]">
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-success-400 to-success-500 rounded-full flex items-center justify-center shadow-lg shadow-success-500/30">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-brand-500 mb-3">
            Keren, kan?
          </h2>
          <p className="text-gray-600 mb-2 leading-relaxed">
            Semua fitur yang baru Anda lihat tersedia di NotaBener.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Mulai dari <span className="font-bold text-brand-500">Rp 19.000/bulan</span> atau coba gratis dulu!
          </p>

          <div className="flex flex-col gap-3">
            <a
              href="/register"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all"
            >
              Daftar Gratis Sekarang
              <Sparkles className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors"
            >
              Tetap di Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
