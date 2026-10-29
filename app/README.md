# Habit Builder · Apps Script

Implementasi dari `design-v2/Habit Builder Dashboard.dc.html` (wireframe Claude Design, revisi terbaru) dan PRD.

| File | Isi |
| --- | --- |
| `Code.gs` | Server: baca/tulis Google Sheet, buat tahun, Save/Load cadangan ke Drive, periksa & perbaiki struktur |
| `Index.html` | Seluruh aplikasi (CSS + JS, tanpa build step): dashboard, input cepat, form & detail habit, Jurnal, Statistik, Pengaturan, versi HP |
| `appsscript.json` | Manifest web app: jalankan sebagai pemilik, akses hanya pemilik |

## Pasang ke template sheet

1. Buka Google Sheet template → **Ekstensi → Apps Script**.
2. Tempel `Code.gs`, buat file HTML bernama `Index` dan tempel `Index.html`, lalu ganti isi `appsscript.json` (aktifkan "Show appsscript.json" di Project Settings).
3. **Terapkan → Deployment baru → Aplikasi web**, Jalankan sebagai *Saya*, akses *Hanya saya*.

Tab `_config`, `_habits`, `_journal`, dan tab tahun (`2026`, …) dibuat otomatis saat pertama dipakai.

## Pratinjau lokal

`Index.html` bisa dibuka langsung di browser. Di luar Apps Script ia memakai server tiruan di `localStorage`:

- `Index.html?demo` → isi data contoh tahun berjalan
- `Index.html?reset` → mulai dari kosong (alur pengguna baru)
- `Index.html?fail` → simulasi gagal simpan (status "Belum tersimpan" → "Gagal")
