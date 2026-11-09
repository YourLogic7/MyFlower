# Kebun Kecil

Game mini merawat satu bunga dengan ilustrasi pixel-art, dibuat dengan React
dan Vite. Pilih bunga, beri nama, lalu siram satu kali setiap hari. Game
menyimpan akun, sesi, dan progres kebun di MongoDB Atlas. Pengguna masuk dengan
nama pengguna dan kata sandi; alamat email tidak diperlukan.

## Pengembangan

```sh
npm install
cp .env.example .env.local
# Isi URI MongoDB di .env.local
npx vercel dev
```

`npx vercel dev` menjalankan aplikasi dan API lokal; ikuti instruksi untuk
menghubungkan proyek Vercel bila diminta. `npm run dev` hanya menjalankan
frontend Vite, sehingga API penyimpanan akun tidak tersedia.

Untuk membuat build frontend produksi, jalankan `npm run build`. Hasilnya ada
di folder `dist/`.

## Konfigurasi database

1. Buat cluster MongoDB Atlas dan database user dengan akses ke database game.
2. Isi variabel berikut di `.env.local` untuk pengembangan lokal dan di Vercel
   **Project Settings → Environment Variables** untuk deployment:

   - `MONGODB_URI`
   - `MONGODB_DB` (opsional, default `kebun_kecil`)

Kata sandi disimpan sebagai hash scrypt, bukan teks biasa. Sesi disimpan di
MongoDB dan dikirim melalui cookie HttpOnly. Nama pengguna harus 3–24 karakter
(huruf, angka, titik, garis bawah, atau tanda hubung); kata sandi minimal 12
karakter. Karena tidak menggunakan email, fitur pemulihan kata sandi melalui
email tidak tersedia.

URI MongoDB hanya digunakan server; jangan pernah menambahkan nilainya ke kode
frontend atau commit file `.env.local`. Jika browser memiliki progres dari
versi sebelumnya, game akan menawarkan untuk mengimpornya ke akun yang pertama
kali digunakan.

## Aturan permainan

- Benih mulai tumbuh pada hari ditanam dan bunga mekar sempurna setelah 15 hari.
- Bunga perlu disiram sekali sehari.
- Dua hari tanpa disiram membuat bunga layu; empat hari membuatnya mati.
- Hanya ada satu bunga aktif. Bunga baru bisa dipilih setelah kebun dimulai ulang.
