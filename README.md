# 🛍️ Lumina Store — Single-Vendor D2C Brand Store

Toko online modern untuk **satu brand** (bukan marketplace multi-penjual), dibangun dengan **HTML5, CSS3, Vanilla JavaScript (ES6 Modular)**, dan **Supabase** sebagai Backend-as-a-Service.

## ✨ Fitur Utama

- 🏠 Header sticky minimalis: logo brand, navigasi (Beranda/Produk/Tentang Kami/Kontak), search bar, tombol drawer cart
- 🎯 Hero section dengan CTA "Belanja Sekarang"
- 🛡️ Section "Keunggulan Brand" (gratis ongkir, garansi original, quick support, rating)
- 🗂️ Filter kategori produk (pill tabs) & pencarian
- 🖼️ Modal Quick View: galeri gambar, deskripsi, pilihan ukuran, qty, tambah ke keranjang / beli langsung via WhatsApp
- 🛒 Slide-over Cart Drawer (muncul dari samping, tanpa reload halaman)
- 💬 Checkout via WhatsApp (drawer maupun halaman checkout penuh) sebagai alternatif checkout standar
- ⭐ Section testimoni pelanggan
- 📞 Tombol melayang WhatsApp Support
- 🔐 Login/Register opsional (Supabase Auth) — tetap bisa checkout sebagai tamu
- 💾 Fallback keranjang via LocalStorage untuk guest, sinkron otomatis ke Supabase setelah login (tanpa `location.reload()`)
- 📱 Desain 100% responsif, mobile-first

## 📁 Struktur Project

```
ecommerce-shopee-clone/
├── index.html       # Homepage: hero, trust signals, produk, testimoni
├── checkout.html    # Halaman checkout: form pengiriman, metode bayar, ringkasan
├── styles.css       # Styling: neutral + emerald accent, font Plus Jakarta Sans
├── app.js           # State management, quick view, cart drawer, search
├── supabase.js      # Konfigurasi client Supabase & database helpers
├── schema.sql       # SQL DDL untuk membuat tabel di Supabase
└── README.md        # Dokumen ini
```

---

## 🚀 Panduan Setup

### 1. Ganti Identitas Brand & Kontak

Buka `app.js`, di bagian paling atas ubah:
```js
const BRAND_NAME = 'Lumina Store';       // Nama brand Anda
const WHATSAPP_NUMBER = '6281234567890'; // Nomor WhatsApp toko (format 62xxx, tanpa +/spasi)
```
Lalu sesuaikan juga nomor WhatsApp yang di-hardcode pada tombol melayang di `index.html` dan `checkout.html` (elemen `.wa-float`) dan `SAMPLE_PRODUCTS` sesuai katalog Anda.

### 2. Setup Supabase

1. Buat project di [supabase.com](https://supabase.com).
2. Jalankan isi [`schema.sql`](./schema.sql) di **SQL Editor** dashboard Supabase (tabel `profiles`, `products`, `cart_items` + RLS).
3. Salin `Project URL` & `anon public key` dari **Project Settings > API**.
4. Tempel ke `supabase.js`:
   ```js
   const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR-SUPABASE-ANON-KEY';
   ```
5. Isi tabel `products` dengan katalog brand Anda (atau biarkan kosong — aplikasi otomatis memakai `SAMPLE_PRODUCTS` di `app.js` sebagai fallback demo).

### 3. Menjalankan Secara Lokal

Karena `app.js` memakai ES6 Modules, wajib dijalankan lewat local server (bukan `file://`):
```bash
python3 -m http.server 5500
# atau
npx http-server -p 5500
```
Buka `http://localhost:5500`.

### 4. GitHub & Vercel

```bash
git init && git add . && git commit -m "Initial commit: Lumina Store"
git remote add origin https://github.com/USERNAME/lumina-store.git
git branch -M main && git push -u origin main
```
Di Vercel: **Add New Project** → pilih repo → Framework Preset `Other` → Build Command kosong → Output Directory `.` → Deploy.

---

## 🗄️ Skema Database

Lihat [`schema.sql`](./schema.sql). Ringkasan tabel: `profiles` (data user), `products` (katalog brand), `cart_items` (keranjang per user), semua dengan Row Level Security.

## 🛠️ Kustomisasi

- **Kategori produk:** array `CATEGORIES` di `app.js`.
- **Testimoni:** array `TESTIMONIALS` di `app.js`.
- **Warna brand:** variabel `--brand`, `--brand-dark`, `--charcoal` di `:root` pada `styles.css`.
- **Font:** ganti import Google Fonts di baris pertama `styles.css` dan variabel `--font-sans`.

---

Dibuat untuk tujuan pembelajaran / template awal toko online single-brand.
