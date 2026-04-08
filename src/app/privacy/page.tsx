import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi - NotaBener',
  description: 'Kebijakan Privasi NotaBener - Komitmen kami dalam melindungi data pribadi Anda sesuai UU PDP dan UU ITE',
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold">Kebijakan Privasi</h1>
          <p className="mt-2 text-white/80">NotaBener - Komitmen Kami dalam Melindungi Data Pribadi Anda</p>
          <div className="mt-4 flex gap-4">
            <Link
              href="/terms"
              className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-sm font-medium transition-colors"
            >
              &larr; Syarat &amp; Ketentuan
            </Link>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
              Kebijakan Privasi
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm text-gray-500 mb-8">
          Terakhir Diperbarui: 8 April 2026
        </p>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10 space-y-8 text-gray-700 text-sm leading-relaxed">

          {/* Intro */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pendahuluan</h2>
            <p className="mb-2">
              <strong>TRUST Solusi Digital</strong> (&quot;Kami&quot;), selaku penyedia layanan <strong>NotaBener</strong> (&quot;Platform&quot;), berkomitmen untuk melindungi privasi dan data pribadi Pengguna sesuai dengan ketentuan <strong>Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</strong> dan peraturan perundang-undangan terkait lainnya.
            </p>
            <p>
              Kebijakan Privasi ini menjelaskan jenis data yang kami kumpulkan, tujuan pemrosesan, dasar hukum, hak-hak Pengguna sebagai subjek data, serta langkah-langkah keamanan yang kami terapkan.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Jenis Data yang Dikumpulkan</h2>
            <p className="mb-3">Kami mengumpulkan dan memproses data pribadi dalam kategori berikut:</p>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">a. Data Identitas Pengguna</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Nama lengkap</li>
                  <li>Alamat email</li>
                  <li>Nomor telepon / WhatsApp (opsional)</li>
                  <li>Nama perusahaan (untuk keperluan bisnis)</li>
                  <li>NPWP (untuk keperluan perpajakan, jika diberikan)</li>
                  <li>Foto profil (opsional)</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">b. Data Finansial Pengguna</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Informasi rekening bank (untuk ditampilkan di invoice, misalnya: nama bank, nomor rekening, nama pemilik rekening)</li>
                  <li>Data transaksi langganan (riwayat pembayaran paket layanan)</li>
                </ul>
                <p className="mt-2 text-gray-500 text-xs">*NotaBener tidak menyimpan data kartu kredit/debit. Pembayaran diproses melalui payment gateway pihak ketiga (Duitku).</p>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">c. Data Pihak Ketiga (Data Klien Pengguna)</h3>
                <p className="mb-2">NotaBener menyimpan data klien Pengguna yang diinput untuk keperluan pembuatan dan pengiriman invoice, meliputi:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Nama klien</li>
                  <li>Alamat email klien</li>
                  <li>Nomor WhatsApp / telepon klien</li>
                  <li>Alamat klien</li>
                </ul>
                <p className="mt-2 text-gray-600">
                  <strong>Penting:</strong> Pengguna menjamin bahwa Pengguna telah memperoleh <strong>persetujuan (consent) yang sah</strong> dari klien mereka untuk memproses dan mengirimkan data klien (termasuk nomor WhatsApp) melalui platform pihak ketiga yang digunakan oleh NotaBener, sesuai dengan ketentuan UU Pelindungan Data Pribadi.
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">d. Data Teknis</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Alamat IP (Internet Protocol)</li>
                  <li>Jenis dan versi browser</li>
                  <li>Tipe dan model perangkat</li>
                  <li>Sistem operasi</li>
                  <li>Log aktivitas (tanggal dan waktu akses, halaman yang dikunjungi)</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">e. Data Transaksi</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Data invoice yang dibuat (nomor invoice, nominal, item barang/jasa, tanggal jatuh tempo)</li>
                  <li>Status pembayaran invoice</li>
                  <li>Riwayat pengiriman invoice (metode pengiriman, waktu pengiriman, status terkirim)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Tujuan Pemrosesan Data</h2>
            <p className="mb-3">Data pribadi yang dikumpulkan diproses untuk tujuan berikut:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>Penyediaan Layanan:</strong> Membuat, mengelola, dan mengirimkan invoice melalui email dan WhatsApp.</li>
              <li><strong>Pengelolaan Akun:</strong> Verifikasi identitas, pemulihan password, dan pengelolaan profil Pengguna.</li>
              <li><strong>Pemrosesan Pembayaran:</strong> Memproses pembayaran langganan melalui payment gateway pihak ketiga.</li>
              <li><strong>Komunikasi:</strong> Mengirimkan notifikasi, pengingat pembayaran, dan informasi penting terkait layanan.</li>
              <li><strong>Peningkatan Layanan:</strong> Menganalisis penggunaan Platform untuk meningkatkan fitur dan pengalaman Pengguna.</li>
              <li><strong>Keamanan:</strong> Mendeteksi dan mencegah aktivitas penipuan, spam, atau penyalahgunaan Platform.</li>
              <li><strong>Kepatuhan Hukum:</strong> Memenuhi kewajiban hukum sesuai peraturan perundang-undangan yang berlaku.</li>
            </ol>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Dasar Hukum Pemrosesan Data</h2>
            <p className="mb-3">Pemrosesan data pribadi dilakukan berdasarkan:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>Persetujuan Subjek Data (Pasal 22 UU PDP):</strong> Pengguna memberikan persetujuan secara sukarela saat mendaftar dan menggunakan layanan Platform.</li>
              <li><strong>Pelaksanaan Kontrak (Pasal 20 ayat 1 huruf b UU PDP):</strong> Pemrosesan diperlukan untuk melaksanakan perjanjian layanan antara Pengguna dan NotaBener.</li>
              <li><strong>Kepatuhan terhadap Kewajiban Hukum (Pasal 20 ayat 1 huruf c UU PDP):</strong> Pemrosesan diperlukan untuk memenuhi kewajiban hukum sesuai peraturan perundang-undangan.</li>
              <li><strong>Kepentingan yang Sah (Pasal 20 ayat 1 huruf d UU PDP):</strong> Pemrosesan diperlukan untuk kepentingan yang sah dari Pengendali Data, dengan tetap memperhatikan hak-hak Subjek Data.</li>
            </ol>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Pemrosesan Data melalui Pihak Ketiga</h2>
            <p className="mb-3">Untuk menyediakan layanan pengiriman invoice, NotaBener menggunakan layanan pihak ketiga:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>WhatsApp API:</strong> Untuk mengirimkan invoice melalui WhatsApp kepada klien Pengguna.</li>
              <li><strong>Email SMTP / Gateway:</strong> Untuk mengirimkan invoice melalui email kepada klien Pengguna.</li>
              <li><strong>Payment Gateway (Duitku):</strong> Untuk memproses pembayaran langganan.</li>
              <li><strong>Cloud Hosting:</strong> Untuk penyimpanan data Platform.</li>
            </ul>
            <p className="mt-3">
              Semua pihak ketiga tersebut telah mematuhi standar keamanan data yang memadai dan hanya memproses data sesuai dengan instruksi NotaBener untuk tujuan penyediaan layanan.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Hak-Hak Subjek Data</h2>
            <p className="mb-3">Sesuai dengan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, Pengguna memiliki hak-hak berikut:</p>

            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="bg-[#0A637D] text-white w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <div>
                  <strong>Hak Akses (Pasal 34 UU PDP):</strong>
                  <p className="mt-1">Pengguna berhak mendapatkan salinan data pribadi yang sedang diproses oleh NotaBener.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="bg-[#0A637D] text-white w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <div>
                  <strong>Hak Perbaikan dan Pembaruan (Pasal 35 UU PDP):</strong>
                  <p className="mt-1">Pengguna berhak memperbaiki kesalahan atau memperbarui data pribadi yang tidak akurat.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="bg-[#0A637D] text-white w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <div>
                  <strong>Hak Penghapusan (Pasal 36 UU PDP):</strong>
                  <p className="mt-1">Pengguna berhak meminta penghapusan data pribadi yang diproses secara tidak sah, kecuali pemrosesan tersebut diperlukan untuk memenuhi kewajiban hukum.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="bg-[#0A637D] text-white w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                <div>
                  <strong>Hak Penghentian Pemrosesan (Pasal 37 UU PDP):</strong>
                  <p className="mt-1">Pengguna berhak meminta penghentian pemrosesan data pribadi dalam keadaan tertentu.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="bg-[#0A637D] text-white w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
                <div>
                  <strong>Hak Pemindahan Data (Pasal 38 UU PDP):</strong>
                  <p className="mt-1">Pengguna berhak meminta pemindahan data pribadi ke Pengendali Data lain.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="bg-[#0A637D] text-white w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">6</span>
                <div>
                  <strong>Hak Menarik Persetujuan:</strong>
                  <p className="mt-1">Pengguna berhak menarik kembali persetujuan yang telah diberikan sebelumnya. Penarikan persetujuan tidak mengurangi keabsahan pemrosesan sebelumnya.</p>
                </div>
              </div>
            </div>

            <p className="mt-4">
              Untuk mengajukan permintaan terkait hak-hak di atas, silakan hubungi <strong>Petugas Pelindungan Data (DPO)</strong> kami melalui kontak yang tercantum di bagian bawah halaman ini.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Keamanan Data</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>Enkripsi:</strong> Data ditransmisikan melalui koneksi terenkripsi (TLS/SSL) untuk melindungi data saat dalam pengirikan (in transit).</li>
              <li><strong>Akses Terbatas:</strong> Akses ke data pribadi dibatasi hanya kepada personil yang berwenang dan memerlukan akses untuk menjalankan tugasnya.</li>
              <li><strong>Keamanan Invoice:</strong> Invoice dilindungi melalui tautan unik yang hanya dapat diakses oleh pihak yang memiliki link resmi. NotaBener menerapkan langkah-langkah teknis untuk mencegah akses tidak sah.</li>
              <li><strong>Pemantauan:</strong> Kami melakukan pemantauan berkelanjutan terhadap potensi ancaman keamanan dan kerentanan sistem.</li>
              <li><strong>Keamanan Infrastruktur:</strong> Data disimpan di infrastruktur cloud yang telah tersertifikasi keamanan dan dilengkapi dengan backup data berkala.</li>
            </ol>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Retensi Data</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>Data Akun Aktif:</strong> Data pribadi Pengguna disimpan selama akun masih aktif dan berlangganan layanan.</li>
              <li><strong>Data Pasca Langganan:</strong> Setelah langganan berakhir, data invoice dapat diakses selama <strong>30 (tiga puluh) hari kalender</strong>. Setelah itu, data akan dihapus secara permanen.</li>
              <li><strong>Data Akun yang Dihapus:</strong> Jika Pengguna menghapus akun, data pribadi akan dihapus dalam waktu <strong>14 (empat belas) hari kerja</strong>, kecuali data yang wajib disimpan berdasarkan kewajiban hukum (misalnya: data transaksi keuangan untuk keperluan perpajakan selama 5 tahun).</li>
              <li><strong>Log Teknis:</strong> Log aktivitas teknis disimpan selama <strong>90 hari</strong> dan dihapus secara otomatis setelahnya.</li>
            </ol>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Kerahasiaan Data Invoicing</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>NotaBener menegaskan bahwa Platform <strong>tidak akan mengakses, memanfaatkan, atau menjual</strong> data nominal transaksi Pengguna untuk tujuan di luar penyediaan layanan.</li>
              <li>Penggunaan data secara anonim dan teragregasi untuk keperluan statistik internal (seperti jumlah invoice yang diproses oleh sistem) diperbolehkan tanpa identifikasi Pengguna.</li>
              <li>NotaBener tidak akan mengintip atau menggunakan data transaksi Pengguna untuk keperluan pemasaran, analisis kompetitif, atau keuntungan pribadi.</li>
            </ol>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Perubahan Kebijakan Privasi</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Kami berhak memperbarui Kebijakan Privasi ini dari waktu ke waktu untuk mencerminkan perubahan dalam praktik kami atau persyaratan hukum.</li>
              <li>Perubahan akan diinformasikan melalui Platform atau email minimal <strong>14 (empat belas) hari</strong> sebelum berlaku efektif.</li>
              <li>Penggunaan Platform setelah perubahan berlaku dianggap sebagai persetujuan terhadap Kebijakan Privasi yang telah diperbarui.</li>
            </ol>
          </section>

          {/* DPO Contact */}
          <section className="bg-[#0A637D]/5 border border-[#0A637D]/20 rounded-xl p-6 mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Kontak Petugas Pelindungan Data (DPO)</h2>
            <p className="mb-3">
              Untuk pertanyaan, permintaan, atau keluhan terkait pemrosesan data pribadi Anda, silakan hubungi Petugas Pelindungan Data (DPO) kami:
            </p>
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="font-semibold min-w-[80px]">Nama:</span>
                <span>TRUST Solusi Digital - Petugas Pelindungan Data</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-[80px]">Email:</span>
                <a href="mailto:support@notabener.com" className="text-[#0A637D] hover:underline">support@notabener.com</a>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-[80px]">Alamat:</span>
                <span>Kabupaten Garut</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-[80px]">Website:</span>
                <a href="https://notabener.com" className="text-[#0A637D] hover:underline">https://notabener.com</a>
              </li>
            </ul>
          </section>

        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <Link href="/terms" className="bg-[#0A637D] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#085668] transition-colors">
            &larr; Baca Syarat &amp; Ketentuan
          </Link>
          <Link href="/" className="text-[#0A637D] hover:underline text-sm">
            Kembali ke Beranda &rarr;
          </Link>
        </div>
      </main>
    </div>
  )
}
