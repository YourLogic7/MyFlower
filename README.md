# Kebun Kecil

Game mini merawat satu bunga dengan ilustrasi pixel-art. Pilih bunga, beri nama,
lalu siram satu kali setiap hari. Game menyimpan progres di `localStorage`
browser—tidak perlu server atau database.

## Menjalankan

Buka `index.html` di browser, atau jalankan server statis dari direktori ini,
misalnya `python3 -m http.server 8000`.

## Aturan permainan

- Benih mulai tumbuh pada hari ditanam dan bunga mekar sempurna setelah 15 hari.
- Bunga perlu disiram sekali sehari.
- Dua hari tanpa disiram membuat bunga layu; empat hari membuatnya mati.
- Hanya ada satu bunga aktif. Bunga baru bisa dipilih setelah kebun dimulai ulang.
