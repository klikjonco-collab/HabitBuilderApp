# Habit Builder (Day to Day Habit)

Google Apps Script web app: `app/Code.gs` (server, Google Sheet) + `app/Index.html` (seluruh UI, CSS, JS inline).
Desain/wireframe ada di `design/` dan `design-v2/`, kebutuhan di `PRD Habit Builder App (Day to Day Habit).md`.

## Git = backup riwayat project

Repo: https://github.com/klikjonco-collab/HabitJournal (private, branch `main`). Mac ini sudah login lewat `gh` sebagai klikjonco-collab.

- **Setiap selesai mengerjakan permintaan yang mengubah file, langsung commit lalu `git push`** — tanpa perlu diminta. Satu permintaan = satu commit (atau beberapa kalau perubahannya memang terpisah).
- Pesan commit dalam bahasa Inggris, baris pertama ringkas (≤ 72 karakter) menjelaskan perubahan dari sisi pengguna, isi menjelaskan detail bila perlu.
- Sebelum commit, cek `git status`: jangan ikutkan `.DS_Store`, file zip, atau file berisi kredensial/token.
- Kalau push gagal (mis. login kedaluwarsa), beri tahu pengguna dan minta mereka menjalankan `gh auth login` sendiri — jangan memasukkan token.
- Saat pengguna bilang sudah deploy versi baru di Apps Script, buat tag `deploy-vN` (N = nomor versi deployment) di commit yang sedang live, lalu `git push --tags`.
- Jangan rewrite riwayat (`push --force`, `reset --hard` pada commit yang sudah di-push) kecuali pengguna memintanya secara eksplisit. Untuk kembali ke versi lama, ambil file dari riwayat dan buat commit baru.

## Catatan teknis

- Uji di mock lokal: server statis di folder `app/`, buka `Index.html?demo` (`?reset` mengosongkan data mock di localStorage).
- Setelah `Code.gs` atau `Index.html` berubah, ingatkan pengguna untuk menempelnya ke editor Apps Script dan deploy versi baru.
- Data pengguna (Google Sheet) tidak ada di repo; backup data lewat fitur Save ke Drive di aplikasi.
