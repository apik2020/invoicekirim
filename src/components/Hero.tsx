import Link from 'next/link'
import { Zap, FileText, ArrowRight, Clock, FileCheck } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-32 md:py-40">
      {/* Dotted pattern background */}
      <div className="absolute inset-0 retro-dotted" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-7xl mx-auto">
          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-10 neu-card-md animate-float">
                <Zap className="w-4 h-4 text-cyan-bright" />
                <span className="text-sm font-medium text-slate">Super Simple & Fast</span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-extrabold text-5xl md:text-6xl lg:text-7xl text-slate mb-6 leading-tight tracking-tight">
                Bikin Invoice{' '}
                <span className="text-arctic-blue">Profesional</span>
                <br />
                dalam <span className="text-arctic-blue">30 Detik</span>
              </h1>

              {/* Sub-headline */}
              <p className="font-body text-lg md:text-xl text-muted mb-10 leading-relaxed max-w-xl">
                Nggak perlu Excel, nggak perlu template ribet.
                <span className="block">Isi form, klik kirim, selesai.</span>
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 text-snow font-bold text-lg rounded-2xl neu-button-primary hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group focus-ring"
                >
                  Mulai Gratis
                  <span className="text-sm opacity-80">— Tanpa Kartu Kredit</span>
                </Link>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto px-8 py-4 text-slate font-bold text-lg rounded-2xl neu-button hover:text-arctic-blue hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 focus-ring"
                >
                  Lihat Cara Pakai
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-8">
                <div className="flex items-center gap-2 text-muted">
                  <div className="w-10 h-10 rounded-xl neu-icon-well-sm flex items-center justify-center">
                    <Clock className="w-5 h-5 text-navy" />
                  </div>
                  <span className="text-sm font-medium">30 detik</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <div className="w-10 h-10 rounded-xl neu-icon-well-sm flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-navy" />
                  </div>
                  <span className="text-sm font-medium">Siap pakai</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <div className="w-10 h-10 rounded-xl neu-icon-well-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-grapefruit rounded-full" />
                  </div>
                  <span className="text-sm font-medium">500+ invoice</span>
                </div>
              </div>
            </div>

            {/* Right Column - Mockup */}
            <div className="relative">
              {/* Invoice Mockup */}
              <div className="bg-white neu-card p-8 md:p-10 transform rotate-2 hover:rotate-0 hover:-translate-y-2 transition-all duration-500 rounded-[32px]">
                {/* Mockup Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate/10">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-2xl neu-icon-well flex items-center justify-center">
                        <FileText className="w-5 h-5 text-arctic-blue" />
                      </div>
                      <span className="font-display font-bold text-slate text-xl">InvoiceKirim</span>
                    </div>
                    <div className="font-display text-3xl font-extrabold text-slate tracking-tight">INVOICE</div>
                    <div className="text-sm text-muted font-mono">INV-2024-001</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted">Total</div>
                    <div className="font-display text-3xl font-extrabold text-arctic-blue tracking-tight">Rp 2.500.000</div>
                  </div>
                </div>

                {/* Mockup Content */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-slate/10">
                    <div>
                      <div className="font-body font-semibold text-slate">Web Design Services</div>
                      <div className="text-sm text-muted">Desain UI/UX website</div>
                    </div>
                    <div className="font-display font-bold text-slate">Rp 2.500.000</div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate/10">
                    <div>
                      <div className="font-body font-medium text-muted">Consultation</div>
                      <div className="text-sm text-slate/40">Diskusi project</div>
                    </div>
                    <div className="font-body font-medium text-muted">Rp 500.000</div>
                  </div>
                </div>

                {/* Mockup Footer */}
                <div className="mt-6 pt-4 border-t border-slate/10 flex justify-between items-center">
                  <div className="text-sm text-muted">Generated by InvoiceKirim</div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-xl shadow-inset-sm" />
                    <div className="w-8 h-8 bg-arctic-blue/20 rounded-xl shadow-inset-sm" />
                  </div>
                </div>
              </div>

              {/* Decorative Elements - Concentric Circles */}
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full shadow-extruded hidden md:block animate-float" style={{ animationDelay: '0.5s' }} />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full shadow-inset hidden md:block animate-float" style={{ animationDelay: '1s' }} />

              {/* Floating Badge */}
              <div className="absolute -top-3 -right-3 md:top-6 md:-right-6 bg-cyan-bright text-slate text-xs font-bold px-4 py-2 rounded-2xl neu-button rotate-12 animate-scale-pulse">
                Ready in 30s!
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-24 h-24 rounded-full shadow-extruded-sm hidden lg:block animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-20 right-10 w-20 h-20 rounded-full shadow-inset-sm hidden lg:block animate-float" style={{ animationDelay: '2s' }} />
      </div>
    </section>
  )
}
