'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles, Check, ArrowRight, Menu, X, Zap, Shield, TrendingUp,
  FileText, Send, CreditCard, Clock, Users, BarChart3, Bell,
  Briefcase, Wrench, Armchair, Gem, Pencil, Monitor, Sprout,
  Scissors, Package, Gift, Smartphone, HeartPulse, Cog, Laptop,
  UtensilsCrossed, Apple, Truck, Cloud, AlertTriangle,
  MessageCircle, XCircle, ChevronDown, Quote,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import LandingPricing from '@/components/LandingPricing'
import { useLandingLocale } from '@/hooks/useLandingLocale'
import type { Locale } from '@/lib/landing-translations'
import type { LucideIcon } from 'lucide-react'

const businessIcons: { icon: LucideIcon; color: string }[] = [
  { icon: Briefcase, color: 'text-blue-600 bg-blue-100' },
  { icon: Wrench, color: 'text-orange-600 bg-orange-100' },
  { icon: Armchair, color: 'text-amber-600 bg-amber-100' },
  { icon: Sparkles, color: 'text-pink-600 bg-pink-100' },
  { icon: Gem, color: 'text-purple-600 bg-purple-100' },
  { icon: Pencil, color: 'text-teal-600 bg-teal-100' },
  { icon: Monitor, color: 'text-indigo-600 bg-indigo-100' },
  { icon: Sprout, color: 'text-green-600 bg-green-100' },
  { icon: Sprout, color: 'text-lime-600 bg-lime-100' },
  { icon: Scissors, color: 'text-rose-600 bg-rose-100' },
  { icon: Package, color: 'text-slate-600 bg-slate-100' },
  { icon: Gift, color: 'text-fuchsia-600 bg-fuchsia-100' },
  { icon: Smartphone, color: 'text-cyan-600 bg-cyan-100' },
  { icon: HeartPulse, color: 'text-red-600 bg-red-100' },
  { icon: Cog, color: 'text-gray-600 bg-gray-200' },
  { icon: Laptop, color: 'text-brand-600 bg-brand-100' },
  { icon: UtensilsCrossed, color: 'text-yellow-600 bg-yellow-100' },
  { icon: Apple, color: 'text-emerald-600 bg-emerald-100' },
  { icon: Sprout, color: 'text-green-600 bg-green-100' },
  { icon: Truck, color: 'text-sky-600 bg-sky-100' },
]

function LocaleToggle({ locale, setLocale }: { locale: Locale; setLocale: (l: Locale) => void }) {
  return (
    <div className="inline-flex items-center rounded-full bg-white/10 p-0.5">
      {(['id', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
            locale === l
              ? 'bg-white text-brand-500 shadow-sm'
              : 'text-white/70 hover:text-white'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { locale, setLocale, t, loaded } = useLandingLocale()

  useEffect(() => { setMounted(true) }, [])

  // Build business types with translated labels
  const businessTypes = businessIcons.map((b, i) => ({
    ...b,
    label: t.marquee.businesses[i],
  }))

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A637D] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo textClassName="!text-white" />

            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-white/80 hover:text-white transition-colors font-medium">
                {t.nav.features}
              </Link>
              <Link href="#pricing" className="text-white/80 hover:text-white transition-colors font-medium">
                {t.nav.pricing}
              </Link>
              <Link href="#faq" className="text-white/80 hover:text-white transition-colors font-medium">
                {t.nav.faq}
              </Link>
              {mounted && <LocaleToggle locale={locale} setLocale={setLocale} />}
              <Link href="/login" className="px-6 py-2.5 btn-primary">
                {t.nav.cta}
              </Link>
            </nav>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 animate-slide-in-right">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <Logo size="sm" />
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-text-primary" />
                </button>
              </div>

              <nav className="space-y-2">
                <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-brand-50 hover:text-brand-600 transition-colors font-medium">
                  <Zap className="w-5 h-5" /> {t.nav.features}
                </Link>
                <Link href="#pricing" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-brand-50 hover:text-brand-600 transition-colors font-medium">
                  <CreditCard className="w-5 h-5" /> {t.nav.pricing}
                </Link>
                <Link href="#faq" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-brand-50 hover:text-brand-600 transition-colors font-medium">
                  <MessageCircle className="w-5 h-5" /> {t.nav.faq}
                </Link>
              </nav>

              <div className="mt-6 flex justify-center">
                {mounted && <LocaleToggle locale={locale} setLocale={setLocale} />}
              </div>

              <div className="mt-8 space-y-3">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-6 py-3 border-2 border-brand-500 text-brand-500 font-bold rounded-xl hover:bg-brand-50 transition-colors">
                  {t.nav.login}
                </Link>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-6 py-3 bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30">
                  {t.nav.cta}
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* A. Hero Section */}
      <section className="py-20 md:py-28 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <div className="badge badge-brand mb-6 inline-flex items-center gap-2 animate-pulse-soft">
                <Sparkles className="w-4 h-4" />
                <span>{t.hero.badge}</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-500 mb-6 leading-tight">
                {t.hero.headline1}
                <span className="text-primary-500">{t.hero.headlineHighlight1}</span>
                {t.hero.headline2}
                <span className="text-primary-500 font-extrabold">{t.hero.headlineHighlight2}</span>
                {t.hero.headlineEnd}
              </h1>

              <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed">
                {t.hero.subheadline}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8">
                <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 btn-primary font-semibold text-lg">
                  {t.hero.cta1}
                </Link>
                <Link href="#features" className="inline-flex items-center justify-center gap-2 px-8 py-4 btn-secondary font-semibold">
                  {t.hero.cta2}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <div className="w-5 h-5 rounded-full bg-success-400 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span>{t.hero.trust1}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <div className="w-5 h-5 rounded-full bg-success-400 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span>{t.hero.trust2}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <div className="w-5 h-5 rounded-full bg-success-400 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span>{t.hero.trust3}</span>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              <div className="relative w-full max-w-lg mx-auto">
                <img
                  src="/images/hero-illustration.jpg"
                  alt="NotaBener - Invoice Platform"
                  className="w-full h-auto rounded-2xl"
                />
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 md:top-4 md:-right-8 bg-white rounded-2xl shadow-card p-4 animate-float" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                    <Send className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">{t.hero.invoiceSent}</p>
                    <p className="text-sm font-bold text-text-primary">{t.hero.toWhatsApp}</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 md:bottom-8 md:-left-8 bg-white rounded-2xl shadow-card p-4 animate-float" style={{ animationDelay: '0.6s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">{t.hero.targetReached}</p>
                    <p className="text-sm font-bold text-success-600">+125%</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-brand flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {t.hero.dataSecure}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Types Marquee */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-brand-500">
            {t.marquee.title}
          </h2>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          {mounted ? (
            <div className="flex animate-marquee w-max">
              {businessTypes.map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="marquee-card mx-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{item.label}</span>
                  </div>
                )
              })}
              {businessTypes.map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={`dup-${i}`} className="marquee-card mx-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{item.label}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex overflow-hidden">
              {businessTypes.map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="marquee-card mx-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{item.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* B. Problem & Solution */}
      <section className="py-20 bg-surface-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-500 mb-4">{t.problem.title}</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">{t.problem.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="bg-white rounded-3xl p-8 shadow-card border border-red-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-600">{t.problem.painTitle}</h3>
              </div>
              <ul className="space-y-5">
                {t.problem.pains.map((pain, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <XCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="text-text-secondary leading-relaxed">{pain}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-card border border-green-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-700">{t.problem.cureTitle}</h3>
              </div>
              <ul className="space-y-5">
                {t.problem.cures.map((cure, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary">{cure.title}</span>
                      <p className="text-text-secondary text-sm">{cure.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* C. Features & Benefits */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-500 mb-4">{t.features.title}</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">{t.features.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.features.items.map((feature, i) => {
              const icons: LucideIcon[] = [Zap, Send, BarChart3, Bell, FileText, Cloud]
              const colors = [
                'text-primary-500 bg-primary-50',
                'text-green-600 bg-green-50',
                'text-blue-600 bg-blue-50',
                'text-amber-600 bg-amber-50',
                'text-purple-600 bg-purple-50',
                'text-brand-600 bg-brand-50',
              ]
              const Icon = icons[i]
              const [iconColor, iconBg] = colors[i].split(' ')
              return (
                <div key={i} className="card card-hover p-8">
                  <div className={`icon-box ${iconBg} mb-6`}>
                    <Icon className={`w-7 h-7 ${iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-brand-500 mb-3">{feature.title}</h3>
                  <p className="text-text-secondary leading-relaxed mb-4">{feature.desc}</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-600">
                    <Zap className="w-3 h-3" />
                    {feature.benefit}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-surface-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-500 mb-4">{t.howItWorks.title}</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">{t.howItWorks.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {t.howItWorks.steps.map((step, i) => {
              const icons: LucideIcon[] = [FileText, Send, BarChart3]
              const colors = [
                'from-primary-500 to-primary-600',
                'from-green-500 to-green-600',
                'from-brand-500 to-brand-600',
              ]
              const Icon = icons[i]
              return (
                <div key={i} className="relative text-center">
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${colors[i]} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-bold mb-3">
                    Step {step.number}
                  </span>
                  <h3 className="text-xl font-bold text-brand-500 mb-3">{step.title}</h3>
                  <p className="text-text-secondary leading-relaxed">{step.desc}</p>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 -right-4 w-8 text-primary-300">
                      <ArrowRight className="w-8 h-8" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* D. Social Proof */}
      <section className="py-20 bg-surface-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary-500 font-semibold mb-2 uppercase tracking-wide text-sm">{t.social.label}</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-500 mb-4">{t.social.title}</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">{t.social.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {t.social.testimonials.map((testimonial, i) => {
              const colors = ['bg-blue-500', 'bg-primary-500', 'bg-brand-500']
              return (
                <div key={i} className="card p-8">
                  <Quote className="w-10 h-10 text-primary-200 mb-4" />
                  <p className="text-text-secondary leading-relaxed mb-6">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full ${colors[i]} flex items-center justify-center text-white font-bold text-sm`}>
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{testimonial.name}</p>
                      <p className="text-sm text-text-muted">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* E. Pricing */}
      <LandingPricing locale={locale} t={t.pricing} />

      {/* F. FAQ */}
      {mounted && (
        <section id="faq" className="py-20 bg-surface-light">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-500 mb-4">{t.faq.title}</h2>
              <p className="text-lg text-text-secondary">{t.faq.subtitle}</p>
            </div>
            <div className="space-y-4">
              {t.faq.items.map((faq, i) => (
                <div key={i} className="card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="font-semibold text-brand-500 pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-primary-500 flex-shrink-0 transition-transform duration-200 ${
                        openFaq === i ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-text-secondary leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <p className="text-text-secondary">
                {t.faq.stillHave}{' '}
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 font-semibold hover:text-primary-600 transition-colors"
                >
                  {t.faq.contactWhatsApp}
                </a>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* G. CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="cta-gradient rounded-3xl p-12 md:p-16 text-center shadow-brand-lg">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">{t.cta.headline}</h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">{t.cta.subheadline}</p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-[#EF3F0A] text-white rounded-xl font-bold text-lg hover:bg-[#d43608] shadow-lg transition-all"
            >
              {t.cta.button}
            </Link>
            <p className="mt-6 text-white text-sm opacity-90">{t.cta.badge}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="mb-4">
                <Logo size="sm" textClassName="!text-white" />
              </div>
              <p className="text-white/80 max-w-sm leading-relaxed">{t.footer.description}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg text-white">{t.footer.product}</h4>
              <ul className="space-y-2">
                <li><Link href="/login" className="text-white/80 hover:text-white transition-colors">{t.footer.createInvoice}</Link></li>
                <li><a href="#features" className="text-white/80 hover:text-white transition-colors">{t.footer.features}</a></li>
                <li><a href="#pricing" className="text-white/80 hover:text-white transition-colors">{t.footer.pricing}</a></li>
                <li><a href="#faq" className="text-white/80 hover:text-white transition-colors">{t.footer.faq}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lg text-white">{t.footer.company}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/80 hover:text-white transition-colors">{t.footer.about}</a></li>
                <li><a href="#" className="text-white/80 hover:text-white transition-colors">{t.footer.contact}</a></li>
                <li><a href="/terms" className="text-white/80 hover:text-white transition-colors">{t.footer.terms}</a></li>
                <li><a href="/privacy" className="text-white/80 hover:text-white transition-colors">{t.footer.privacy}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/20 text-center text-sm">
            <p className="text-white/80">{t.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
