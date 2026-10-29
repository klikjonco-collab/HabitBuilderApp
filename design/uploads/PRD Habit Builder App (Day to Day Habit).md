# PRD: Habit Builder App (Day to Day Habit)

Oct 28, 2026 · @Kanu

## Ringkasan produk

Habit Builder App adalah web app Google Apps Script yang mempertahankan tampilan dan rasa template spreadsheet Habit Builder, tetapi nyaman diisi di HP lewat tombol input cepat. Dijual sekali bayar ke konsumen Indonesia.

Nilai jual dalam satu kalimat: **spreadsheet habit tracker yang akhirnya enak diisi di HP.**

- Platform: web app Apps Script, di-deploy oleh pembeli.
- Data: tersimpan di Google Sheet milik pembeli, tanpa langganan.
- Layout: dashboard desktop tetap, tidak responsif di HP.
- HP: tombol mengambang "Input cepat" untuk mengisi habit, mood, dan jurnal.
- Struktur waktu: pengguna menambah tahun, setiap tahun langsung berisi 12 halaman bulan.
- Bahasa antarmuka: Indonesia (asumsi).

## Masalah, target pengguna, dan prinsip produk

Template spreadsheet enak dipakai di laptop, tetapi mengisi centang, mood, dan jurnal di HP lewat aplikasi Sheets lambat: sel kecil, mudah salah ketuk, dan banyak zoom.

**Target pengguna (hipotesis, belum divalidasi):** pembeli THP Tracker dan Ekosistem Templates, pengguna Google Sheets non-teknis yang mengisi habit setiap hari, sebagian besar lewat HP.

**Prinsip produk**

1. Rasa spreadsheet: grid, sel mentah, tidak ada hari yang dikunci.
2. Pengisian harian di HP secepat mungkin.
3. Data milik pengguna, tersimpan di Sheet mereka.
4. Satu halaman bulan terbaca dalam satu layar, tanpa filter.
5. Tindakan yang menghapus data selalu dikonfirmasi.

**Metrik keberhasilan (usulan, perlu diuji)**

| Metrik | Target |
| --- | --- |
| Waktu mengisi harian di HP (10 habit + mood) | Di bawah 20 detik |
| Setup pertama oleh pembeli tanpa bantuan support | Di bawah 15 menit |
| Pembeli yang masih mengisi di minggu ke-4 | Ditetapkan setelah uji awal |

## Ruang lingkup MVP

MVP mencakup dashboard bulanan sesuai template, input cepat di HP, halaman Jurnal, Statistik tahunan, dan pengelolaan tahun.

**Termasuk**

- Dashboard bulanan dengan komponen yang sama seperti template Habit Builder.
- Pemilih bulan dan tahun; tambah tahun baru (12 bulan sekaligus).
- Setup habit per bulan, dengan opsi salin dari bulan sebelumnya.
- Tombol dan sheet input cepat untuk HP.
- Halaman Jurnal dan kartu jurnal di dashboard.
- Halaman Statistik tahunan.
- Menu hamburger: Dashboard, Jurnal, Statistik, Pengaturan.

**Di luar cakupan**

- Layout responsif penuh untuk dashboard di HP.
- Filter rentang tanggal pada grafik.
- Akun pengguna, login terpisah, atau berbagi antar pengguna.
- Notifikasi dan pengingat.
- Aplikasi native dan PWA penuh (Apps Script tidak mendukungnya sepenuhnya).
- Kotak "Checklist untuk melihat di mana saja kamu bisa mengisi kolom" di template: diganti gaya hover dan fokus pada sel yang bisa diisi.

## Struktur halaman dan navigasi

Aplikasi punya empat halaman yang dibuka lewat menu hamburger, ditambah sheet input cepat khusus HP.

| Halaman | Isi | Cara membuka |
| --- | --- | --- |
| Dashboard | Lembar satu bulan: grafik, grid habit, mood, jurnal terbaru, Top 10 | Halaman awal; menu |
| Jurnal | Semua jurnal, terbaru di atas | Menu; tautan "Lihat semua jurnal" di kartu jurnal |
| Statistik | Tren, donat, tabel, dan evaluasi satu tahun | Menu |
| Pengaturan | Kelola tahun, cadangan, periksa struktur | Menu |
| Input cepat | Habit, mood, dan jurnal satu hari | Tombol mengambang di HP |

**Aturan navigasi**

1. Saat dibuka, aplikasi menampilkan bulan dan tahun berjalan.
2. Pemilih Bulan (12 pilihan) dan Tahun ada di header dashboard. Mengganti salah satunya memuat ulang isi dashboard tanpa memuat ulang halaman.
3. Pemilih Tahun berisi tahun yang sudah dibuat, ditambah pilihan "Tambah tahun".
4. Jika tahun berjalan belum dibuat, dashboard menampilkan satu tombol "Buat lembar \[tahun\]".
5. Halaman Statistik punya pemilih tahun sendiri; defaultnya tahun berjalan.

## Dashboard bulanan

Dashboard meniru template Habit Builder: tiga kolom dalam satu halaman, tanpa filter. Kiri berisi judul, daftar habit, dan jurnal; tengah berisi grafik, grid, dan mood; kanan berisi ringkasan progres dan Top 10.

| Komponen | Perilaku |
| --- | --- |
| Header | Judul "HABIT BUILDER" dan nama bulan besar. Pemilih Bulan dan Tahun di bawahnya. |
| Daily percentage progress | Satu batang per hari. Tinggi batang = habit tercentang hari itu dibagi jumlah habit. Label persentase (bilangan bulat) di bawah tiap batang. Hari tanpa centang tampil 0%. |
| Progress | Persentase total (1 desimal) dan donat "Habits n / total". Contoh template: 226 / 300 = 75,3%. |
| My Habits | Daftar bernomor. Nama boleh berisi emoji yang diketik pengguna. Tambah, ubah nama, urutkan (seret), dan hapus habit. Tidak ada batas jumlah. |
| Grid mingguan | Baris = habit, kolom = tanggal, dikelompokkan Week 1 sampai Week 5. Inisial hari dan tanggal otomatis sesuai bulan dan tahun. Satu ketukan = centang atau batal centang. Semua sel bisa diisi, termasuk tanggal yang belum tiba. |
| Habits Progress | Per habit: Goal (default = jumlah hari bulan, bisa diubah), Percentage dengan bar horizontal, dan Count "n / goal". Bar berubah hijau saat 100%. |
| Journal Today | Menampilkan jurnal terbaru di bulan itu. Klik ikon jurnal pada baris mood untuk menampilkan jurnal tanggal tersebut. Bisa diedit langsung, simpan otomatis. Kosong: teks panduan. |
| Mood Tracker | Header minggu, hari, dan tanggal sama dengan grid. Grafik garis tren mood. Baris skor 1 sampai 5 berwarna. Baris ikon jurnal. |
| Top 10 Most Consistent Habits | Peringkat, nama habit, dan persentase. Urut persentase menurun; sama besar diurutkan dari count lebih tinggi. Jika habit kurang dari 10, tampilkan sebanyak yang ada. |

**Detail yang mengikuti template**

- Satu minggu = blok 7 hari dihitung dari tanggal 1 (Week 1 = tanggal 1 sampai 7, dan seterusnya). Week 5 bisa berisi 1 sampai 3 hari. Tidak ada pengaturan awal pekan.
- Skala warna skor mood: 1 merah muda, 2 oranye muda, 3 kuning, 4 hijau muda, 5 hijau tua.
- Gaya visual hitam dan putih; hijau (#5CB85C) dipakai untuk capaian 100% dan aksi utama.
- Jumlah hari, inisial hari, dan tahun kabisat dihitung otomatis. Februari 2028 menampilkan 29 hari.

**Perilaku centang**

1. Tampilan berubah seketika saat sel diketuk: kotak terisi, batang harian, progres, donat, dan Habits Progress ikut bergerak.
2. Perubahan dikirim ke Sheet di latar belakang dan digabung dalam satu panggilan.
3. Jika gagal, sel menandai "belum tersimpan" dan mencoba lagi; input tidak hilang.

## Input cepat di HP

Input cepat adalah fitur utama untuk pengguna HP: satu sheet untuk mengisi habit, mood, dan jurnal satu hari dengan satu kali Simpan.

| Elemen | Spesifikasi |
| --- | --- |
| Pemicu | Tombol mengambang "Input cepat" di pojok kanan bawah. Muncul pada lebar layar di bawah 768 px (asumsi). Di desktop tidak muncul. |
| Pemilih tanggal | Default hari ini. Panah kiri dan kanan untuk pindah hari dalam tahun yang aktif. |
| Habit | Satu baris besar per habit (tinggi minimal 44 px), diketuk untuk centang. Penghitung "n/total" di judul bagian. |
| Mood | Lima tombol skor 1 sampai 5 dengan label pendamping (Buruk, Kurang, Biasa, Baik, Hebat). Satu ketukan. |
| Jurnal | Kolom teks dengan teks panduan "Apa yang berjalan baik? Apa yang diperbaiki besok?". |
| Simpan | Mengirim semua perubahan sekaligus dalam satu panggilan. Setelah berhasil menampilkan "Tersimpan". |

**Aturan perilaku**

1. Hasil Simpan langsung terlihat di dashboard di belakang sheet.
2. Jika simpan gagal, sheet tetap terbuka dengan isian utuh dan pesan "Gagal menyimpan. Coba lagi."
3. Jika tahun atau bulan yang dipilih belum dibuat, sheet menampilkan tombol "Buat lembar \[tahun\]" lebih dulu.
4. Dashboard di HP tampil apa adanya (layout desktop diperkecil, bisa di-zoom). Tidak ada adaptasi layout.
5. Panduan setup menyarankan "Add to Home Screen" agar aplikasi terbuka seperti aplikasi biasa.

## Halaman Jurnal

Halaman Jurnal menyimpan semua jurnal secara otomatis; kartu di dashboard hanya menampilkan yang terbaru.

- Satu jurnal per tanggal.
- Daftar diurutkan dari terbaru, dikelompokkan per bulan, dengan pemilih tahun.
- Tiap kartu menampilkan tanggal, skor mood hari itu, dan cuplikan teks.
- Klik kartu untuk membuka dan mengedit; perubahan tersimpan otomatis.
- Hapus jurnal selalu meminta konfirmasi.
- Pencarian teks sederhana: kandidat rilis berikutnya, bukan MVP.

## Halaman Statistik

Statistik merangkum satu tahun dalam satu halaman, dengan urutan komponen dari atas ke bawah seperti di bawah.

| Urutan | Komponen | Spesifikasi |
| --- | --- | --- |
| 1 | Pemilih tahun | Tahun yang sudah dibuat; default tahun berjalan. |
| 2 | Grafik tren tahunan | Garis 12 titik (satu per bulan). Filter di halaman ini saja: Semua habit (rata-rata persentase), satu habit, atau Mood (rata-rata skor). |
| 3 | Donat per habit | Porsi tiap habit dari total centang setahun. Tampilkan 8 teratas, sisanya digabung "Lainnya". |
| 4 | Donat per mood | Jumlah hari untuk tiap skor 1 sampai 5. |
| 5 | Tabel statistik per habit | Habit, goal total, persentase, count, dan jumlah bulan aktif. |
| 6 | Top 10 most consistent habits | Di kanan tabel statistik. Urut persentase setahun. |
| 7 | Kartu evaluasi tahunan | Isi belum diputuskan (lihat pertanyaan terbuka). |

**Catatan**

- Statistik membaca ringkasan tersimpan, bukan 12 bulan data mentah, agar halaman cepat terbuka.
- Bulan tanpa data habit tidak dihitung sebagai kegagalan.
- Untuk pembeli yang mulai di tengah tahun, grafik hanya menggambar bulan yang punya data.

## Pengaturan dan manajemen tahun

Pengguna menambah tahun baru kapan saja dan langsung mendapat 12 bulan; data tahun sebelumnya tidak berubah.

**Alur tambah tahun**

1. Buka pemilih Tahun, pilih "Tambah tahun".
2. Pilih tahun. Tahun yang sudah ada tidak muncul di pilihan. Tahun lampau boleh ditambah.
3. Aplikasi membuat 12 bulan dengan penanggalan otomatis.
4. Daftar habit disalin dari bulan terakhir tahun terdekat sebelumnya, jika ada. Pengguna bisa mengubahnya.
5. Di bulan Desember, dashboard menampilkan saran "Tambah lembar \[tahun berikutnya\]".

**Setup habit tiap bulan**

- Saat bulan kosong pertama kali dibuka, habit disalin dari bulan sebelumnya. Pengguna bisa memilih "Mulai kosong".
- Menghapus habit menghapus baris habit dan seluruh centangnya di bulan itu saja. Konfirmasi menyebut nama habit dan jumlah centang yang hilang.

**Menu Pengaturan**

| Item | Fungsi | Status |
| --- | --- | --- |
| Daftar tahun | Melihat tahun yang sudah dibuat | MVP |
| Periksa dan perbaiki struktur | Mendeteksi baris atau kolom Sheet yang rusak akibat edit manual dan memperbaikinya | MVP |
| Unduh cadangan | Mengunduh data tahun terpilih | Usulan, setelah MVP |
| Hapus tahun | Menghapus satu tahun; konfirmasi dengan mengetik tahunnya | Usulan, setelah MVP |

## Aturan perhitungan dan data

Angka di dashboard mengikuti rumus template; Statistik memakai rumus yang sama dengan satu penyesuaian untuk bulan berjalan.

| Metrik | Rumus | Catatan |
| --- | --- | --- |
| Persentase harian | Habit tercentang pada hari itu / jumlah habit | Label dibulatkan ke bilangan bulat |
| Progres bulan | Total centang / (jumlah habit × hari dalam bulan) | 1 desimal. Contoh: 226 / 300 = 75,3% |
| Persentase habit (dashboard) | Count / goal | Goal default = hari dalam bulan. Tampilan dibatasi 100% |
| Skor mood bulan | Rata-rata skor pada hari yang terisi | Hari tanpa skor tidak dihitung |
| Persentase habit (Statistik) | Total centang / total goal bulan yang memiliki habit itu | Bulan berjalan memakai jumlah hari yang sudah lewat sebagai pembagi (usulan) |
| Top 10 | Urut persentase menurun, lalu count menurun | Tampilkan sebanyak habit yang ada jika kurang dari 10 |

**Aturan data**

- **Identitas habit:** setiap habit punya ID internal yang tetap saat diganti nama dan ikut tersalin ke bulan berikutnya. Habit yang dibuat ulang manual dengan nama sama dicocokkan lewat nama sebagai cadangan.
- **Hapus habit:** hanya data bulan itu yang hilang; bulan lain tidak berubah.
- **Hari yang belum tiba:** tidak dikunci dan bisa dicentang. Batang harian hari kosong tampil 0%.
- **Penanggalan:** jumlah hari, inisial hari, dan tahun kabisat dihitung dari kalender, bukan disimpan.
- **Jurnal dan mood:** satu entri per tanggal.

## Struktur Google Sheet

Usulan awal: satu tab per tahun yang bisa dibaca seperti spreadsheet, ditambah beberapa tab tersembunyi untuk konfigurasi, jurnal, dan ringkasan statistik.

| Tab | Isi | Terlihat |
| --- | --- | --- |
| `_config` | Versi skema, daftar tahun yang dibuat, pengaturan | Tersembunyi |
| `_habits` | HabitID, nama terakhir, tanggal dibuat | Tersembunyi |
| `2026` (satu per tahun) | 12 blok bulan tersusun vertikal. Tiap blok: baris habit (HabitID, nama, goal, kolom tanggal) dan baris mood | Terlihat |
| `_journal` | Tanggal (YYYY-MM-DD), teks, waktu diubah | Tersembunyi |
| `_stats` | Tahun, bulan, HabitID, goal, count; diperbarui setiap Simpan | Tersembunyi |

**Alasan memilih satu tab per tahun**

- Jumlah tab tetap kecil walau pengguna memakai aplikasi bertahun-tahun (tab per bulan menghasilkan 60 tab setelah 5 tahun).
- Pembeli masih bisa membuka dan mengedit data langsung di Sheet, sesuai konsep "rasa spreadsheet".

Struktur ini belum final: diuji dengan data simulasi 5 tahun sebelum dikunci.

## Persyaratan non-fungsional dan teknis

Kecepatan respons centang adalah syarat teknis terpenting, karena inti produk adalah pengalaman mencentang yang terasa seketika.

| Area | Persyaratan |
| --- | --- |
| Respons UI | Centang, batang, progres, dan donat berubah seketika di layar sebelum data tersimpan (optimistic UI) |
| Sinkronisasi | Perubahan digabung dan dikirim dalam satu panggilan (jeda sekitar 1 sampai 2 detik di dashboard; satu panggilan per Simpan di input cepat) |
| Waktu muat | Dashboard terbuka di bawah 3 detik di HP kelas menengah setelah login (target; start dingin Apps Script bisa lebih lambat dan harus diuji) |
| Penulisan data | Memakai penguncian agar dua penulisan bersamaan tidak saling menimpa |
| Ketahanan | Gagal simpan menampilkan status "belum tersimpan" dan input tidak hilang |
| Edit manual di Sheet | Perubahan manual terbaca setelah muat ulang; struktur rusak ditangani "Periksa dan perbaiki" |
| Akses | Web app hanya untuk pemilik Sheet; data hanya berada di Drive pembeli |
| Instalasi | Salin template, deploy sebagai web app, setujui otorisasi Google. Panduan video dan skrip setup disediakan |
| Browser | Dibuka lewat Chrome atau Safari; browser dalam aplikasi (misalnya dari Instagram) sering bermasalah dengan login Google |
| Tampilan | Font Open Sauce; latar #FAFAFA, teks #111111, aksen #5CB85C; tanpa emoji pada elemen antarmuka |
| Sentuh | Target ketuk di input cepat minimal 44 px |

**Batasan Apps Script yang perlu diuji sebelum build**

- Latensi tiap panggilan server dan waktu start dingin.
- Kuota eksekusi harian untuk akun Google biasa.
- Layar peringatan "Google hasn't verified this app" saat pembeli pertama kali menyetujui otorisasi.

## Kriteria penerimaan MVP

MVP siap rilis jika seluruh butir berikut lolos diuji dengan data contoh dan di HP sungguhan.

- [ ] Mengganti bulan atau tahun mengubah tanggal, inisial hari, dan jumlah kolom (Februari 2028 = 29 hari).
- [ ] Menambah tahun 2027 membuat 12 bulan; data 2026 tidak berubah.
- [ ] Mencentang sel langsung menggerakkan batang harian, progres, donat, Habits Progress, dan Top 10 tanpa memuat ulang halaman.
- [ ] Menambah habit ke-25 tidak merusak grid, Habits Progress, atau Top 10.
- [ ] Menghapus habit hanya menghapus data bulan itu; bulan lain utuh.
- [ ] Input cepat menyimpan 10 habit, mood, dan jurnal dalam satu Simpan, dan hasilnya tampil di dashboard.
- [ ] Kartu jurnal menampilkan jurnal terbaru; klik ikon jurnal menampilkan jurnal tanggal itu.
- [ ] Angka Statistik (tren, donat, tabel, Top 10) sama dengan hitungan manual dari data contoh.
- [ ] Mengisi sel langsung di Sheet terbaca di aplikasi setelah muat ulang; "Periksa dan perbaiki" memulihkan baris habit yang rusak.
- [ ] Lima pembeli uji menyelesaikan setup di bawah 15 menit tanpa bantuan.

## Risiko, pertanyaan terbuka, dan tahap rilis

Risiko terbesar bukan fitur, tetapi apakah Apps Script cukup cepat di HP dan apakah pembeli mau melewati proses instalasi.

**Risiko**

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Latensi Apps Script di HP | Pengalaman "satisfying" rusak, pengguna kembali ke Sheets | Optimistic UI, sinkronisasi gabungan, uji di HP kelas menengah sebelum build |
| Instalasi dan peringatan otorisasi Google | Konversi turun, tiket support naik | Skrip setup, panduan video, pembuka lewat Chrome atau Safari |
| Alternatif gratis (aplikasi Sheets, Google Form) | Pembeli tidak melihat nilai tambah | Ukur jumlah ketukan dan detik dibanding Sheets biasa |
| Tumpang tindih dengan template Habit Builder yang sudah dijual | Pembeli lama bingung atau menolak membayar lagi | Posisikan sebagai solusi mobile; pertimbangkan harga upgrade |
| Habit tanpa batas | Grid dan Statistik melambat | Header dan kolom nama sticky; donat 8 teratas; uji dengan 50 habit |
| Edit manual merusak struktur Sheet | Data salah atau aplikasi error | Validasi struktur dan "Periksa dan perbaiki" |

**Pertanyaan terbuka**

- [ ] Garis hitam dan hijau pada grafik mood di template: apa masing-masing? Asumsi PRD: hitam = skor mood, hijau = persentase habit harian.
- [ ] Kartu evaluasi tahunan: ditulis sendiri oleh pengguna, atau dibuat otomatis dari data (habit terbaik, bulan terbaik, rata-rata mood)?
- [ ] Donat "persentase per habit": porsi tiap habit dari total centang, atau persentase pencapaian masing-masing habit? Asumsi PRD: porsi dari total centang.
- [ ] Goal per habit boleh diubah (misalnya gym 12 kali sebulan)? Asumsi PRD: boleh.
- [ ] Mood di input cepat wajib atau opsional? Mockup sebelumnya: wajib.
- [ ] Persentase habit bulan berjalan di Statistik: pembagi hari yang sudah lewat atau goal penuh? Asumsi PRD: hari yang sudah lewat.
- [ ] Satu tab per tahun atau tab data panjang? Diputuskan setelah uji beban 5 tahun.
- [ ] Harga dan skema upgrade untuk pembeli template Habit Builder.

**Tahap rilis (usulan)**

1. Uji kelayakan: prototipe centang dan Simpan di HP untuk mengukur latensi Apps Script.
2. Rilis 1: struktur Sheet, dashboard bulanan, input cepat, tambah tahun, Jurnal.
3. Rilis 2: Statistik tahunan dan Pengaturan lanjutan (unduh cadangan, hapus tahun).
