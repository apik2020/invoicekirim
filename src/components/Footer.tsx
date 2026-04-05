import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate/10 py-16 bg-ice-blue/10">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Logo & Tagline */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center mb-6 group">
              <Image
                src="/images/notabener-logo.png"
                alt="NotaBener"
                width={180}
                height={34}
                className="h-8 w-auto group-hover:-translate-y-0.5 transition-all duration-300"
                priority
              />
            </Link>
            <p className="font-body text-muted max-w-sm leading-relaxed">
              Platform invoice gratis untuk UMKM dan freelancer Indonesia. Bikin invoice tanpa ribet!
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
            &copy; {currentYear} NotaBener. Dibuat dengan ❤️ untuk UMKM Indonesia.
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
