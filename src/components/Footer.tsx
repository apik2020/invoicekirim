import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate/10 py-16 bg-ice-blue/10">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Logo & Tagline */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-lime-500 flex items-center justify-center group-hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-orange-200">
                <span className="font-bold text-white text-base tracking-tight">[iK]</span>
              </div>
              <span className="font-display text-2xl font-bold text-slate tracking-tight">InvoiceKirim</span>
            </Link>
            <p className="font-body text-muted max-w-sm leading-relaxed">
              Generator invoice Indonesia untuk freelancer. Buat invoice profesional dalam hitungan detik.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-display font-bold text-slate mb-6">Produk</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/login" className="font-body text-muted hover:text-arctic-blue transition-all duration-300">
                  Buat Invoice
                </Link>
              </li>
              <li>
                <a href="#features" className="font-body text-muted hover:text-arctic-blue transition-all duration-300">
                  Fitur
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="font-body text-muted hover:text-arctic-blue transition-all duration-300">
                  Cara Pakai
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-display font-bold text-slate mb-6">Perusahaan</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="font-body text-muted hover:text-arctic-blue transition-all duration-300">
                  Tentang
                </a>
              </li>
              <li>
                <a href="#" className="font-body text-muted hover:text-arctic-blue transition-all duration-300">
                  Kontak
                </a>
              </li>
              <li>
                <a href="#" className="font-body text-muted hover:text-arctic-blue transition-all duration-300">
                  Privasi
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-sm text-muted">
            &copy; {currentYear} InvoiceKirim. Dibuat dengan ❤️ untuk freelancer Indonesia.
          </p>
          <div className="flex items-center gap-6 font-body text-sm text-muted">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-grapefruit rounded-full" />
              Data Tersimpan Lokal
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
