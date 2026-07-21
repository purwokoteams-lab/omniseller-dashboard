# 🛍️ ShopeeClone - E-commerce Modern

Website e-commerce dengan tampilan & fitur utama terinspirasi dari Shopee, dibangun dengan **HTML5, CSS3, Vanilla JavaScript (ES6 Modular)**, dan **Supabase** sebagai Backend-as-a-Service.

## ✨ Fitur Utama

- 🔍 Header dengan search bar, ikon keranjang (badge counter), login/register
- 🎠 Banner slider promo (carousel otomatis)
- 🗂️ Grid kategori produk
- ⚡ Flash Sale dengan countdown timer real-time
- 🛒 Grid produk (gambar, judul, harga, rating, terjual, tombol tambah ke keranjang)
- 🔐 Autentikasi via Supabase Auth (login & register)
- 🧾 Halaman keranjang & checkout dengan kalkulasi subtotal otomatis
- 💾 Fallback keranjang belanja via **LocalStorage** untuk guest (belum login)
- 📱 Desain 100% responsif (mobile, tablet, desktop)

## 📁 Struktur Project

```
ecommerce-shopee-clone/
├── index.html       # Halaman utama (homepage)
├── checkout.html    # Halaman cart & checkout
├── styles.css        # Styling terpadu (Shopee look & feel)
├── app.js            # Frontend logic, rendering produk, search, cart
├── supabase.js       # Konfigurasi client Supabase & database helpers
├── schema.sql         # SQL DDL untuk membuat tabel di Supabase
└── README.md          # Dokumen ini
```

---

## 🚀 Panduan Setup

### 1. Setup Supabase

1. Buat akun & project baru di [supabase.com](https://supabase.com).
2. Setelah project dibuat, buka **SQL Editor** di sidebar dashboard.
3. Copy seluruh isi file [`schema.sql`](./schema.sql), paste ke SQL Editor, lalu klik **Run**.
   - Script ini akan membuat tabel `profiles`, `products`, `cart_items`, lengkap dengan Row Level Security (RLS) dan trigger otomatis.
   - Beberapa data produk contoh juga akan otomatis diisi (bisa dihapus/disesuaikan).
4. Buka **Project Settings > API**, lalu salin:
   - `Project URL`
   - `anon public` key
5. Buka file `supabase.js`, lalu ganti:
   ```js
   const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR-SUPABASE-ANON-KEY';
   ```
   dengan nilai yang sudah disalin.
6. Pastikan **Email Auth Provider** aktif di **Authentication > Providers** (biasanya sudah aktif secara default).
   - Jika ingin skip verifikasi email saat testing, non-aktifkan "Confirm Email" di **Authentication > Settings**.

### 2. Menjalankan Secara Lokal

Karena `app.js` menggunakan ES6 Modules (`import`/`export`), file **tidak bisa dibuka langsung** via `file://` — harus melalui local web server. Beberapa opsi:

```bash
# Opsi 1: Menggunakan Python
python3 -m http.server 5500

# Opsi 2: Menggunakan Node.js (http-server)
npx http-server -p 5500

# Opsi 3: Menggunakan VSCode Live Server extension
```

Lalu buka `http://localhost:5500` di browser.

### 3. Setup GitHub (Version Control)

```bash
cd ecommerce-shopee-clone
git init
git add .
git commit -m "Initial commit: ShopeeClone e-commerce website"

# Buat repository baru di GitHub, lalu:
git remote add origin https://github.com/USERNAME/ecommerce-shopee-clone.git
git branch -M main
git push -u origin main
```

> ⚠️ **Penting:** Jangan commit `SUPABASE_ANON_KEY` project produksi ke repository publik jika project bersifat sensitif. Untuk kebutuhan produksi nyata, pertimbangkan menyimpan konfigurasi di environment variable dan inject saat build (misalnya via Vercel Environment Variables + build step sederhana), karena project vanilla JS statis ini tidak memiliki proses build secara default.

### 4. Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com) dan login (bisa menggunakan akun GitHub).
2. Klik **Add New Project**, lalu pilih repository `ecommerce-shopee-clone` yang sudah di-push.
3. Pada konfigurasi build:
   - **Framework Preset:** `Other` (karena project ini statis/vanilla JS, tanpa build step)
   - **Build Command:** (kosongkan)
   - **Output Directory:** `.` (root folder)
4. Klik **Deploy**.
5. Setelah selesai, Vercel akan memberikan URL publik seperti `https://ecommerce-shopee-clone.vercel.app`.
6. Setiap kali Anda `git push` ke branch `main`, Vercel akan otomatis melakukan redeploy (CI/CD otomatis).

### 5. Konfigurasi CORS Supabase (jika diperlukan)

Secara default, Supabase API dapat diakses dari domain manapun (dibatasi oleh RLS, bukan CORS domain-based), sehingga tidak perlu konfigurasi tambahan khusus untuk domain Vercel Anda.

---

## 🗄️ Skema Database

Lihat detail lengkap di [`schema.sql`](./schema.sql). Ringkasan tabel:

| Tabel | Deskripsi |
|---|---|
| `profiles` | Data profil tambahan user, terhubung 1-ke-1 dengan `auth.users` |
| `products` | Katalog produk (nama, harga, gambar, kategori, rating, stok, flash sale) |
| `cart_items` | Item keranjang belanja per user (relasi ke `products`) |

Semua tabel sudah dilengkapi **Row Level Security (RLS)** agar user hanya bisa mengakses/mengubah data miliknya sendiri, sementara data produk bisa dibaca publik.

---

## 🛠️ Kustomisasi

- **Mengganti data produk:** Edit langsung di tabel `products` melalui Supabase Table Editor, atau melalui SQL `insert` tambahan.
- **Mengubah warna tema:** Edit variabel CSS di bagian atas `styles.css` (`:root { --primary: ... }`).
- **Menambah kategori:** Edit array `CATEGORIES` di `app.js`.
- **Fallback offline:** Jika tabel `products` kosong / koneksi Supabase gagal, aplikasi otomatis menampilkan `SAMPLE_PRODUCTS` (data dummy) yang didefinisikan di `app.js`, sehingga UI tetap bisa didemokan.

## 📌 Catatan Teknis

- Cart untuk **user yang belum login** disimpan di `localStorage` (key: `shopee_clone_guest_cart`), dan otomatis menggunakan Supabase (`cart_items`) begitu user login.
- Proses checkout pada versi ini bersifat simulasi (mengosongkan cart setelah klik "Checkout Sekarang"). Untuk implementasi order sungguhan, aktifkan bagian tabel `orders` & `order_items` yang sudah disediakan (dalam bentuk komentar) di `schema.sql`.

---

Dibuat untuk tujuan pembelajaran. Bukan produk resmi atau afiliasi dari Shopee.
