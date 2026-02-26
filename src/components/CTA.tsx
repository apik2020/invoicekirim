import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-32 md:py-40">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* CTA Card */}
          <div className="neu-card p-16 md:p-20 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-10 neu-card-md animate-float">
              <span className="text-sm font-bold text-slate">Anti Ribet</span>
            </div>

            {/* Headline */}
            <h2 className="font-display text-extrabold text-4xl md:text-5xl lg:text-6xl text-slate mb-6 tracking-tight">
              Siap Kirim Invoice Pertama?
            </h2>

            {/* Description */}
            <p className="font-body text-lg md:text-xl text-muted mb-12 max-w-2xl mx-auto leading-relaxed">
              Bergabung dengan ratusan freelancer Indonesia yang sudah menggunakan InvoiceKirim.
              Cepat, simpel, langsung pakai.
            </p>

            {/* CTA Button */}
            <Link
              href="/login"
              className="inline-flex items-center gap-3 px-12 py-6 text-snow font-display font-bold text-xl rounded-2xl neu-button-primary hover:-translate-y-1 transition-all duration-300 group focus-ring"
            >
              Mulai Gratis - Sekarang
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>

            {/* Trust Note */}
            <p className="mt-8 font-body text-sm text-muted">
              Data tersimpan di browser • Siap dalam 2 menit
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
