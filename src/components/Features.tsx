import { Zap, Palette, Download } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Cepat',
    description: 'Buat invoice dalam hitungan detik. Cukup isi data, preview, dan kirim.',
    highlight: '2 menit jadi'
  },
  {
    icon: Palette,
    title: 'Desain Otomatis Rapi',
    description: 'Invoice tampil profesional dengan format Indonesia standar. Siap cetak PDF.',
    highlight: 'Siap cetak'
  },
  {
    icon: Download,
    title: 'Simpan & Kirim Mudah',
    description: 'Simpan invoice di browser, kirim via WhatsApp, atau download sebagai PDF.',
    highlight: 'Multi-format'
  }
]

export default function Features() {
  return (
    <section id="features" className="py-32 md:py-40 bg-ice-blue/20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="font-display text-extrabold text-4xl md:text-5xl lg:text-6xl text-slate mb-6 tracking-tight">
            Kenapa InvoiceKirim?
          </h2>
          <p className="font-body text-lg md:text-xl text-muted max-w-2xl mx-auto">
            Dibuat khusus untuk freelancer Indonesia yang butuh invoice cepat dan profesional.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="neu-card p-10 hover:-translate-y-2 transition-all duration-300 group"
              >
                {/* Icon Well - Nested Depth */}
                <div className="w-16 h-16 rounded-2xl neu-icon-well flex items-center justify-center mb-8 group">
                  <div className="w-12 h-12 rounded-xl neu-button flex items-center justify-center">
                    <Icon className="w-7 h-7 text-arctic-blue" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-display text-2xl font-bold text-slate mb-4">
                  {feature.title}
                </h3>

                {/* Highlight Badge */}
                <div className="inline-block px-4 py-1.5 bg-cyan-bright/20 text-slate text-sm font-medium mb-5 rounded-2xl shadow-inset-sm">
                  {feature.highlight}
                </div>

                {/* Description */}
                <p className="font-body text-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
