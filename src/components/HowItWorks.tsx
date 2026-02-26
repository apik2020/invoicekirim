import { Edit3, Eye, Send } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Edit3,
    title: 'Isi Data',
    description: 'Masukkan detail invoice: informasi perusahaan, klien, dan item pekerjaan.'
  },
  {
    number: '02',
    icon: Eye,
    title: 'Preview',
    description: 'Lihat tampilan invoice yang sudah diformat otomatis. Edit jika perlu.'
  },
  {
    number: '03',
    icon: Send,
    title: 'Kirim',
    description: 'Download PDF, kirim via WhatsApp, atau simpan untuk nanti.'
  }
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 md:py-40">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="font-display text-extrabold text-4xl md:text-5xl lg:text-6xl text-slate mb-6 tracking-tight">
            Cara Pakai
          </h2>
          <p className="font-body text-lg md:text-xl text-muted max-w-2xl mx-auto">
            Tiga langkah mudah untuk membuat invoice profesional.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="relative">
                  {/* Step Number - Large Background */}
                  <div className="font-display text-extrabold text-9xl text-ice-blue absolute -top-6 -left-4 opacity-40 select-none -z-10">
                    {step.number}
                  </div>

                  {/* Card */}
                  <div className="relative neu-card p-10 hover:-translate-y-2 transition-all duration-300 min-h-[320px]">
                    {/* Icon Well */}
                    <div className="w-20 h-20 rounded-3xl neu-icon-well flex items-center justify-center mb-8">
                      <Icon className="w-10 h-10 text-cyan-bright" />
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-2xl font-bold text-slate mb-4">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="font-body text-muted leading-relaxed">
                      {step.description}
                    </p>

                    {/* Connector Arrow (hidden on last item) */}
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 text-cyan-bright/30">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-20">
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-10 py-5 text-snow font-display font-bold text-xl rounded-2xl neu-button-primary hover:-translate-y-1 transition-all duration-300 focus-ring"
          >
            Coba Sekarang - Gratis
          </a>
        </div>
      </div>
    </section>
  )
}
