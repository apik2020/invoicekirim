import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan - NotaBener',
  description: 'Syarat dan Ketentuan penggunaan layanan NotaBener - Platform Invoice untuk UMKM & Freelancer Indonesia',
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0A637D] text-white">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="text-white/80 hover:text-white text-sm">
              &larr; Kembali ke Beranda
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Syarat &amp; Ketentuan</h1>
          <p className="mt-2 text-white/80">NotaBener - Platform Invoice untuk UMKM &amp; Freelancer Indonesia</p>
          <div className="mt-4 flex gap-4">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
              Syarat &amp; Ketentuan
            </span>
            <Link
              href="/privacy"
              className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-sm font-medium transition-colors"
            >
              Kebijakan Privasi &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm text-gray-500 mb-8">
          Terakhir Diperbarui: 8 April 2026
        </p>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10 space-y-8 text-gray-700 text-sm leading-relaxed">

          {/* Pasal 1 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pasal 1. Definisi Layanan</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>&quot;NotaBener&quot;</strong> (&quot;Platform&quot;) adalah layanan berbasis web yang disediakan oleh <strong>[NAMA_PT/CV]</strong> (&quot;Penyedia&quot;) yang memungkinkan Pengguna untuk membuat, mengelola, dan mengirimkan dokumen penagihan (invoice/faktur) secara digital melalui email dan WhatsApp.
              </li>
              <li>
                <strong>&quot;Pengguna&quot;</strong> adalah individu atau badan usaha yang mendaftar dan menggunakan layanan NotaBener, termasuk UMKM, freelancer, dan pebisnis pemula di Indonesia.
              </li>
              <li>
                <strong>&quot;Klien&quot;</strong> adalah pihak ketiga yang menerima invoice dari Pengguna melalui Platform. Klien bukan merupakan pengguna layanan NotaBener.
              </li>
              <li>
                NotaBener bertindak sebagai <strong>penyedia infrastruktur teknis (tool)</strong> dalam pembuatan dan pengiriman dokumen penagihan. Segala isi, akurasi, keabsahan data, nilai nominal, dan detail transaksi yang tercantum dalam dokumen yang dibuat melalui NotaBener adalah <strong>tanggung jawab penuh Pengguna</strong>.
              </li>
            </ol>
          </section>

          {/* Pasal 2 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pasal 2. Ketentuan Akun dan Pendaftaran</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Pengguna wajib memberikan informasi yang benar, akurat, dan terkini saat melakukan pendaftaran akun.</li>
              <li>Pengguna bertanggung jawab atas kerahasiaan akun dan password yang digunakan.</li>
              <li>Pengguna dilarang menggunakan akun untuk tujuan yang melanggar hukum Indonesia, termasuk namun tidak terbatas pada penipuan, pencucian uang, atau pengiriman dokumen fiktif.</li>
              <li>NotaBener berhak menangguhkan atau menutup akun Pengguna yang melanggar ketentuan ini tanpa pemberitahuan sebelumnya.</li>
              <li>Setiap Pengguna hanya diperbolehkan memiliki satu akun aktif, kecuali untuk keperluan tim yang disediakan dalam fitur kolaborasi.</li>
            </ol>
          </section>

          {/* Pasal 3 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pasal 3. Ketentuan Langganan (Subscription)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>NotaBener menyediakan paket layanan berlangganan dengan fitur dan kuota yang berbeda-beda, antara lain:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li><strong>FREE:</strong> Kuota terbatas (maksimal 3 invoice per bulan), tanpa fitur tim dan laporan lanjutan.</li>
                  <li><strong>PRO:</strong> Invoice unlimited, fitur tim &amp; kolaborasi, laporan &amp; analitik lanjutan, integrasi email SMTP.</li>
                </ul>
              </li>
              <li>Langganan berlaku sesuai periode yang dipilih Pengguna (bulanan atau tahunan).</li>
              <li><strong>Jika langganan berhenti atau berakhir:</strong> Pengguna masih dapat mengakses dan mengunduh data invoice lama selama <strong>30 (tiga puluh) hari</strong> kalender setelah masa langganan berakhir. Setelah periode tersebut, NotaBener berhak menghapus data secara permanen sesuai dengan kebijakan retensi data.</li>
              <li>NotaBener berhak mengubah harga langganan dengan pemberitahuan minimal 14 (empat belas) hari sebelumnya melalui email atau notifikasi di Platform.</li>
            </ol>
          </section>

          {/* Pasal 4 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pasal 4. Kebijakan Pembayaran dan Pengembalian Dana (Refund)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Pembayaran langganan diproses melalui payment gateway pihak ketiga yang terintegrasi dengan Platform, mendukung metode pembayaran meliputi:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Transfer bank (BCA, Mandiri, BNI, CIMB, Permata, Danamon)</li>
                  <li>QRIS (scan QR melalui aplikasi e-wallet atau mobile banking)</li>
                  <li>E-wallet dan metode pembayaran digital lainnya</li>
                </ul>
              </li>
              <li><strong>Kebijakan Pengembalian Dana:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Pengembalian dana dapat diajukan dalam waktu <strong>7 (tujuh) hari kalender</strong> setelah pembayaran berhasil dilakukan.</li>
                  <li>Pengembalian dana hanya berlaku jika Pengguna belum menggunakan fitur premium secara signifikan (misalnya: membuat lebih dari 5 invoice premium).</li>
                  <li>Pengembalian dana akan diproses dalam waktu 14 (empat belas) hari kerja melalui metode pembayaran asli.</li>
                  <li>Pengembalian dana tidak berlaku untuk paket FREE.</li>
                </ul>
              </li>
              <li>NotaBener berhak menolak permintaan pengembalian dana yang tidak memenuhi ketentuan di atas.</li>
            </ol>
          </section>

          {/* Pasal 5 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pasal 5. Kebijakan Pengiriman Dokumen (Email &amp; WhatsApp)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>NotaBener menyediakan infrastruktur pengiriman dokumen invoice melalui Email dan WhatsApp API.</li>
              <li><strong>Kegagalan Teknis:</strong> NotaBener berupaya maksimal memastikan dokumen terkirim ke alamat email atau nomor WhatsApp yang dituju. Namun, NotaBener <strong>tidak menjamin keberhasilan pengiriman</strong> yang disebabkan oleh faktor di luar kendali, termasuk namun tidak terbatas pada:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Kebijakan filter spam atau blacklist pada penyedia layanan email penerima.</li>
                  <li>Nomor WhatsApp penerima yang tidak aktif, diblokir, atau memiliki pengaturan privasi yang membatasi pesan.</li>
                  <li>Gangguan koneksi internet atau hambatan pada infrastruktur pihak ketiga (WhatsApp API / Email Gateway).</li>
                </ul>
              </li>
              <li><strong>Status Pengiriman:</strong> Notifikasi &quot;terkirim&quot; dalam sistem NotaBener hanya merujuk pada keberhasilan sistem dalam meneruskan data ke API pihak ketiga. NotaBener tidak bertanggung jawab atas apakah penerima telah membuka, membaca, atau menyetujui isi invoice tersebut.</li>
            </ol>
          </section>

          {/* Pasal 6 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pasal 6. Kebijakan Anti-Spam dan Etika Penggunaan</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Pengguna <strong>dilarang keras</strong> menggunakan sistem NotaBener untuk mengirimkan pesan yang tidak diminta (unsolicited messages), pesan penagihan fiktif, atau pesan dalam skala masif yang dikategorikan sebagai spam.</li>
              <li>Pengguna wajib memastikan bahwa Pengguna telah memperoleh <strong>persetujuan (consent) yang sah</strong> dari klien mereka untuk memproses dan mengirimkan data klien (termasuk nomor WhatsApp dan alamat email) melalui platform pihak ketiga yang digunakan oleh NotaBener, sesuai dengan ketentuan UU Pelindungan Data Pribadi.</li>
              <li>NotaBener berhak, tanpa pemberitahuan sebelumnya, untuk menangguhkan atau menghentikan akses akun Pengguna jika ditemukan bukti bahwa fitur pengiriman digunakan untuk tujuan yang melanggar kebijakan penggunaan WhatsApp (WhatsApp Business Policy) atau menyebabkan akun NotaBener terkena penalti/blokir dari penyedia layanan pihak ketiga.</li>
              <li>Pelanggaran terhadap kebijakan anti-spam ini dapat mengakibatkan <strong>pemblokiran akun secara permanen</strong>.</li>
            </ol>
          </section>

          {/* Pasal 7 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pasal 7. Batasan Tanggung Jawab (Limitation of Liability)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>NotaBener <strong>tidak bertanggung jawab</strong> atas kerugian finansial Pengguna jika klien mereka tidak membayar invoice yang telah dikirimkan melalui Platform.</li>
              <li>NotaBener <strong>tidak bertanggung jawab</strong> atas kesalahan ketik (typo), kesalahan nominal, atau ketidakakuratan data yang diinput oleh Pengguna dalam invoice.</li>
              <li>NotaBener <strong>tidak bertanggung jawab</strong> atas keabsahan nilai pajak, detail barang/jasa, dan kesepakatan nilai dalam invoice. Semua hal tersebut adalah tanggung jawab penuh Pengguna.</li>
              <li><strong>Pembebasan Tanggung Jawab (Indemnification):</strong> Pengguna setuju untuk membebaskan NotaBener (termasuk direksi, karyawan, dan mitra) dari segala klaim, tuntutan, kerugian, atau biaya hukum yang timbul akibat:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Ketidakakuratan data yang diinput oleh Pengguna dalam invoice.</li>
                  <li>Perselisihan bisnis antara Pengguna dan klien terkait tagihan yang dibuat.</li>
                  <li>Penyalahgunaan data klien oleh Pengguna melalui Platform NotaBener.</li>
                </ul>
              </li>
              <li>Total tanggung jawab NotaBener terhadap Pengguna tidak akan melebihi jumlah yang telah dibayarkan oleh Pengguna kepada NotaBener dalam 12 (dua belas) bulan terakhir.</li>
            </ol>
          </section>

          {/* Pasal 8 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pasal 8. Hak Kekayaan Intelektual</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Seluruh konten, desain, logo, merek dagang, kode sumber, dan fitur-fitur pada Platform merupakan hak kekayaan intelektual milik <strong>[NAMA_PT/CV]</strong> yang dilindungi oleh hukum hak cipta dan merek dagang yang berlaku di Indonesia.</li>
              <li>Pengguna dilarang menyalin, memodifikasi, mendistribusikan, atau menggunakan bagian dari Platform untuk tujuan komersial tanpa izin tertulis dari Penyedia.</li>
              <li>Konten invoice yang dibuat oleh Pengguna melalui Platform tetap menjadi hak milik Pengguna. NotaBener tidak mengklaim kepemilikan atas konten tersebut.</li>
            </ol>
          </section>

          {/* Pasal 9 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pasal 9. Kerahasiaan Data Invoicing</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>NotaBener menegaskan bahwa Platform <strong>tidak akan mengakses, memanfaatkan, atau menjual</strong> data nominal transaksi Pengguna untuk tujuan di luar penyediaan layanan.</li>
              <li>Penggunaan data secara anonim dan teragregasi untuk keperluan statistik internal (seperti jumlah invoice yang diproses oleh sistem) diperbolehkan tanpa identifikasi Pengguna.</li>
              <li>NotaBener menerapkan standar enkripsi untuk menjaga agar invoice hanya dapat diakses oleh pihak yang memiliki tautan (link) resmi yang diberikan oleh sistem.</li>
            </ol>
          </section>

          {/* Pasal 10 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pasal 10. Penyelesaian Sengketa</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Setiap sengketa yang timbul dari atau sehubungan dengan Syarat &amp; Ketentuan ini akan diselesaikan terlebih dahulu melalui musyawarah untuk mufakat antara para pihak.</li>
              <li>Apabila musyawarah tidak mencapai kesepakatan dalam waktu 30 (tiga puluh) hari, maka sengketa akan diselesaikan melalui:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li><strong>Pengadilan Negeri Jakarta</strong> sebagai forum hukum yang dipilih; atau</li>
                  <li><strong>Arbitrase</strong> melalui Badan Arbitrase Nasional Indonesia (BANI) sesuai dengan ketentuan dan prosedur yang berlaku.</li>
                </ul>
              </li>
              <li>Syarat &amp; Ketentuan ini tunduk pada dan ditafsirkan berdasarkan hukum Negara Republik Indonesia.</li>
            </ol>
          </section>

          {/* Pasal 11 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pasal 11. Perubahan Syarat &amp; Ketentuan</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>NotaBener berhak mengubah Syarat &amp; Ketentuan ini sewaktu-waktu dengan pemberitahuan melalui Platform atau email.</li>
              <li>Penggunaan Platform setelah perubahan berlaku dianggap sebagai persetujuan terhadap Syarat &amp; Ketentuan yang telah diperbarui.</li>
              <li>Pengguna yang tidak menyetujui perubahan berhak menghentikan penggunaan layanan dan menutup akunnya.</li>
            </ol>
          </section>

          {/* Contact */}
          <section className="bg-gray-50 rounded-xl p-6 mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Kontak</h2>
            <p className="mb-2">
              Untuk pertanyaan terkait Syarat &amp; Ketentuan ini, silakan hubungi kami:
            </p>
            <ul className="space-y-1">
              <li><strong>Email:</strong> <a href="mailto:[EMAIL_SUPPORT]" className="text-[#0A637D] hover:underline">[EMAIL_SUPPORT]</a></li>
              <li><strong>Alamat:</strong> [ALAMAT_LENGKAP]</li>
              <li><strong>Website:</strong> <a href="[URL_WEBSITE]" className="text-[#0A637D] hover:underline">[URL_WEBSITE]</a></li>
            </ul>
          </section>

        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <Link href="/" className="text-[#0A637D] hover:underline text-sm">
            &larr; Kembali ke Beranda
          </Link>
          <Link href="/privacy" className="bg-[#0A637D] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#085668] transition-colors">
            Baca Kebijakan Privasi &rarr;
          </Link>
        </div>
      </main>
    </div>
  )
}
