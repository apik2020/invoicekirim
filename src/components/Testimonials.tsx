import { Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Andi Pratama',
    role: 'Freelance Designer',
    content: 'Akhirnya ada tool invoice Indonesia yang simpel banget. Cuma butuh 2 menit buat kirim invoice ke klien.',
    initials: 'AP'
  },
  {
    name: 'Siti Rahayu',
    role: 'Content Writer',
    content: 'Suka banget sama desainnya yang otomatis rapi. Klien saya langsung bayar karena invoice terlihat profesional.',
    initials: 'SR'
  },
  {
    name: 'Budi Santoso',
    role: 'Web Developer',
    content: 'Fitur kirim via WhatsApp sangat membantu. Respons klien jauh lebih cepat dibanding email.',
    initials: 'BS'
  }
]

export default function Testimonials() {
  return (
    <section className="py-32 md:py-40 bg-ice-blue/20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="font-display text-extrabold text-4xl md:text-5xl lg:text-6xl text-slate mb-6 tracking-tight">
            Apa Kata Freelancer?
          </h2>
          <p className="font-body text-lg md:text-xl text-muted max-w-2xl mx-auto">
            Sudah digunakan oleh ratusan freelancer di Indonesia.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto mb-20">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="neu-card p-10 relative hover:-translate-y-2 transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute top-8 right-8 text-cyan-bright/20">
                <Quote className="w-12 h-12" />
              </div>

              {/* Avatar Initials - Icon Well */}
              <div className="w-16 h-16 rounded-2xl neu-icon-well flex items-center justify-center mb-6">
                <span className="font-display font-bold text-arctic-blue text-xl">{testimonial.initials}</span>
              </div>

              {/* Content */}
              <p className="font-body text-slate/80 mb-6 leading-relaxed relative">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div>
                <div className="font-display font-bold text-slate text-lg">{testimonial.name}</div>
                <div className="font-body text-sm text-muted">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-12 max-w-4xl mx-auto">
          <div className="neu-card-md p-8 text-center hover:-translate-y-1 transition-all duration-300">
            <div className="font-display text-5xl font-extrabold text-arctic-blue tracking-tight mb-2">500+</div>
            <div className="font-body text-sm text-muted">Invoice Dibuat</div>
          </div>
          <div className="neu-card-md p-8 text-center hover:-translate-y-1 transition-all duration-300">
            <div className="font-display text-5xl font-extrabold text-arctic-blue tracking-tight mb-2">200+</div>
            <div className="font-body text-sm text-muted">Freelancer</div>
          </div>
          <div className="neu-card-md p-8 text-center hover:-translate-y-1 transition-all duration-300">
            <div className="font-display text-5xl font-extrabold text-arctic-blue tracking-tight mb-2">4.8</div>
            <div className="font-body text-sm text-muted">Rating</div>
          </div>
        </div>
      </div>
    </section>
  )
}
