# Kebun Kecil

Game mini merawat satu bunga dengan ilustrasi pixel-art, dibuat dengan React
dan Vite. Pilih bunga, beri nama, lalu siram satu kali setiap hari. Game
menyimpan progres per akun di MongoDB Atlas. Supabase Auth menangani login dan
registrasi.

## Pengembangan

```sh
npm install
cp .env.example .env.local
# Isi nilai Supabase dan MongoDB di .env.local
npx vercel dev
```

`npx vercel dev` menjalankan aplikasi dan API lokal; ikuti instruksi untuk
menghubungkan proyek Vercel bila diminta. `npm run dev` hanya menjalankan
frontend Vite, sehingga API penyimpanan akun tidak tersedia.

Untuk membuat build frontend produksi, jalankan `npm run build`. Hasilnya ada
di folder `dist/`.

## Konfigurasi akun dan database

1. Buat proyek Supabase dan salin Project URL serta anon key dari pengaturan API proyek.
2. Buat cluster MongoDB Atlas dan database user dengan akses ke database game.
3. Isi variabel berikut di `.env.local` untuk pengembangan lokal dan di Vercel
   **Project Settings → Environment Variables** untuk deployment:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `MONGODB_URI`
   - `MONGODB_DB` (opsional, default `kebun_kecil`)

4. Atur Site URL dan URL aplikasi Vercel di Supabase **Authentication → URL Configuration**,
   lalu deploy ulang setelah mengatur environment variables. Pendaftaran dapat
   memerlukan konfirmasi email sesuai pengaturan Supabase.

Anon key Supabase memang digunakan di frontend, tetapi URI MongoDB hanya
digunakan server. Jangan pernah menambahkan kredensial database ke kode frontend
atau commit file `.env.local`. Jika browser memiliki progres dari versi
sebelumnya, game akan menawarkan untuk mengimpornya ke akun yang pertama kali
digunakan.

## Aturan permainan

- Benih mulai tumbuh pada hari ditanam dan bunga mekar sempurna setelah 15 hari.
- Bunga perlu disiram sekali sehari.
- Dua hari tanpa disiram membuat bunga layu; empat hari membuatnya mati.
- Hanya ada satu bunga aktif. Bunga baru bisa dipilih setelah kebun dimulai ulang.
