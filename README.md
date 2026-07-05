# OmniSeller Dashboard
### Dashboard Penjualan, Stok & Inventory Multi-Marketplace — dengan Login, Role/Hak Akses, dan Kasir

Panduan ini menuntun Anda dari **nol sampai online**: menyiapkan database
(Supabase), menyimpan kode (GitHub), lalu men-deploy jadi website hidup
(Vercel). Ikuti urut dari atas ke bawah — jangan lompat langkah.

---

## 📋 Daftar Isi

1. [Gambaran Aplikasi](#1-gambaran-aplikasi)
2. [Yang Anda Butuhkan](#2-yang-anda-butuhkan)
3. [Langkah 1 — Setup Database di Supabase](#langkah-1--setup-database-di-supabase)
4. [Langkah 2 — Isi Kredensial Supabase ke Kode](#langkah-2--isi-kredensial-supabase-ke-kode)
5. [Langkah 3 — Upload Kode ke GitHub](#langkah-3--upload-kode-ke-github)
6. [Langkah 4 — Deploy ke Vercel](#langkah-4--deploy-ke-vercel)
7. [Langkah 5 — Daftar Akun Owner Pertama](#langkah-5--daftar-akun-owner-pertama)
8. [Struktur File Project](#struktur-file-project)
9. [Fitur & Cara Pakai](#fitur--cara-pakai)
10. [Sistem Role / Hak Akses](#sistem-role--hak-akses)
11. [Update Kode di Kemudian Hari](#update-kode-di-kemudian-hari)
12. [Troubleshooting](#troubleshooting)

---

## 1. Gambaran Aplikasi

OmniSeller adalah dashboard untuk toko online yang jualan di banyak
marketplace (Shopee, Tokopedia, TikTok Shop, Lazada, dll). Fitur utama:

- 🔐 Login admin (Supabase Auth) + sistem **role**: Owner, Staff, Kasir, Viewer
- 🧾 Input pesanan **multi-item** (1 pesanan bisa berisi banyak barang)
- 📦 Manajemen stok/gudang per SKU
- 🏷 Kategori & marketplace custom (bisa tambah sendiri)
- 💰 Laporan laba per produk (omzet − HPP − biaya admin)
- 🛒 Inventory: pencatatan pembelian barang & penggajian karyawan
- 🧑‍💻 Halaman khusus **Kasir** (`kasir.html`) — tampilan ringkas untuk komputer kasir
- 🖼 Logo toko custom
- ☁️ Semua data tersimpan di database Supabase (bukan cuma di browser)

**Cara kerja teknis:** ini adalah aplikasi *static* (HTML/CSS/JS biasa, tanpa
backend server sendiri). Semua logika jalan di browser, dan langsung
bicara ke Supabase (database + auth) lewat API. Karena itu, hosting-nya
bisa di Vercel (gratis, cepat, auto-deploy dari GitHub).

---

## 2. Yang Anda Butuhkan

Siapkan dulu 3 akun ini (semuanya gratis untuk skala UMKM):

| Layanan | Fungsi | Daftar di |
|---|---|---|
| **Supabase** | Database + sistem login | https://supabase.com |
| **GitHub** | Tempat menyimpan kode | https://github.com |
| **Vercel** | Hosting/menjalankan website | https://vercel.com |

> 💡 Anda bisa daftar Vercel & Supabase langsung pakai akun GitHub (tombol
> "Continue with GitHub") — lebih cepat, tidak perlu password terpisah.

File project yang harus sudah Anda punya (dari OmniSeller ini):

```
omniseller/
├── index.html                     ← halaman dashboard utama
├── kasir.html                     ← halaman khusus kasir
├── style.css                      ← tampilan/desain
├── app.js                         ← seluruh logic aplikasi
├── supabase-config.js             ← kredensial koneksi Supabase (Anda isi sendiri)
├── SETUP-LENGKAP-OMNISELLER.sql   ← 1 file SQL setup database lengkap
└── README.md                      ← panduan ini
```

---

## LANGKAH 1 — Setup Database di Supabase

### 1.1 Buat project Supabase

1. Buka https://supabase.com/dashboard → login/daftar
2. Klik **New Project**
3. Isi:
   - **Name**: `omniseller` (atau nama toko Anda)
   - **Database Password**: buat password kuat, **simpan/catat** password ini
     (dibutuhkan kalau nanti perlu akses database langsung)
   - **Region**: pilih yang paling dekat (mis. `Southeast Asia (Singapore)`)
4. Klik **Create new project** → tunggu ± 1-2 menit sampai project selesai
   disiapkan (status berubah dari "Setting up" jadi siap dipakai)

### 1.2 Jalankan SQL setup database

1. Di sidebar kiri project Supabase, klik menu **SQL Editor**
2. Klik **New query**
3. Buka file `SETUP-LENGKAP-OMNISELLER.sql` yang sudah disiapkan, **copy
   seluruh isinya**
4. **Paste** ke SQL Editor di Supabase
5. Klik tombol **Run** (atau `Ctrl+Enter` / `Cmd+Enter`)
6. Tunggu sampai muncul **"Success. No rows returned"** di bagian bawah

✅ **Cek hasilnya**: buka menu **Table Editor** di sidebar kiri — harus
muncul tabel-tabel ini:

`admin_users`, `kategori`, `marketplace`, `stok`, `penjualan`, `pesanan`,
`pesanan_item`, `biaya_pengaturan`, `hpp_per_produk`, `pengaturan_toko`,
`pembelian`, `penggajian`

> Kalau ada error saat Run, baca pesan errornya baik-baik — biasanya karena
> script dijalankan dua kali dengan sedikit modifikasi manual. Solusi paling
> aman: hapus semua tabel di atas (drop), lalu jalankan ulang script dari
> awal secara utuh tanpa diedit.

### 1.3 Aktifkan Email provider & atur konfirmasi email

1. Menu **Authentication → Providers**
2. Pastikan **Email** dalam keadaan **Enabled**
3. Menu **Authentication → Settings**
4. Cari **"Confirm email"**:
   - **Matikan (off)** → supaya setelah Sign Up, akun langsung aktif tanpa
     perlu klik link di email (lebih praktis untuk tim internal kecil)
   - **Aktifkan (on)** → admin baru harus klik link konfirmasi di email
     dulu sebelum bisa login (lebih aman kalau aplikasi dipakai lebih luas)

> 💡 Untuk toko kecil dengan sedikit staf, mematikan "Confirm email" biasanya
> paling praktis. Anda bisa ubah setting ini kapan saja.

### 1.4 Ambil Project URL & anon key

1. Menu **Project Settings** (ikon ⚙️ di sidebar kiri bawah) → **API**
2. Catat 2 nilai ini (akan dipakai di Langkah 2):
   - **Project URL** — contoh: `https://xxxxxxxxxxxx.supabase.co`
   - **anon public key** — teks panjang dimulai dengan `eyJ...`

⚠️ **anon key ini AMAN untuk ditaruh di kode frontend** (bukan rahasia
seperti `service_role key` — jangan pernah pakai `service_role key` di kode
frontend). Keamanan sebenarnya diatur oleh Row Level Security (RLS) yang
sudah dibuat otomatis oleh script SQL di Langkah 1.2.

---

## LANGKAH 2 — Isi Kredensial Supabase ke Kode

1. Buka file `supabase-config.js` di editor teks (VS Code, Notepad, dll)
2. Ganti 2 baris ini dengan nilai dari Langkah 1.4:

```js
const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';   // Project URL Anda
const SUPABASE_ANON_KEY = 'eyJhbGci...';                    // anon public key Anda
```

3. **Simpan** file-nya.

> Baris-baris lain di file ini (nama-nama tabel: `TBL_KATEGORI`,
> `TBL_PESANAN`, dst.) **tidak perlu diubah** — itu harus persis sama
> dengan nama tabel yang dibuat SQL di Langkah 1.

---

## LANGKAH 3 — Upload Kode ke GitHub

### 3.1 Buat repository baru

1. Login ke https://github.com
2. Klik ikon **+** di kanan atas → **New repository**
3. Isi:
   - **Repository name**: `omniseller` (atau nama lain)
   - **Visibility**: pilih **Private** (disarankan, karena `supabase-config.js`
     berisi kredensial project Anda — walau anon key relatif aman, private
     lebih baik sebagai kebiasaan)
   - **Jangan** centang "Add a README file" (kita sudah punya sendiri)
4. Klik **Create repository**

### 3.2 Upload file — Cara A: lewat browser (paling mudah, tanpa command line)

1. Di halaman repository yang baru dibuat, klik **"uploading an existing file"**
2. Drag & drop atau pilih semua file project (`index.html`, `kasir.html`,
   `style.css`, `app.js`, `supabase-config.js`, `README.md`, dll)
3. Scroll ke bawah, isi commit message (mis. `Setup awal OmniSeller`)
4. Klik **Commit changes**

### 3.2 Upload file — Cara B: lewat terminal/command line (Git)

Kalau sudah familiar dengan Git:

```bash
cd omniseller
git init
git add .
git commit -m "Setup awal OmniSeller"
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/omniseller.git
git push -u origin main
```

Ganti `USERNAME_ANDA` dengan username GitHub Anda.

✅ **Cek hasilnya**: refresh halaman repository di GitHub — semua file
project harus sudah muncul di sana.

---

## LANGKAH 4 — Deploy ke Vercel

### 4.1 Import project dari GitHub

1. Login ke https://vercel.com (pakai akun GitHub agar terhubung otomatis)
2. Klik **Add New...** → **Project**
3. Di daftar "Import Git Repository", cari repository `omniseller` yang
   baru dibuat → klik **Import**
   - Kalau repository tidak muncul, klik **"Adjust GitHub App Permissions"**
     dan beri akses Vercel ke repository tersebut
4. Di halaman konfigurasi:
   - **Framework Preset**: pilih **Other** (karena ini HTML/CSS/JS statis,
     bukan React/Next.js/dst.)
   - **Build Command**: kosongkan / biarkan default
   - **Output Directory**: kosongkan / biarkan default
5. Klik **Deploy**
6. Tunggu ± 30-60 detik sampai muncul halaman "🎉 Congratulations"

### 4.2 Buka website Anda

1. Klik tombol **Continue to Dashboard**, atau klik domain yang diberikan
   Vercel (contoh: `omniseller-xxxx.vercel.app`)
2. Halaman login OmniSeller harus muncul

> 💡 **Domain custom (opsional)**: di halaman project Vercel → tab
> **Settings → Domains**, Anda bisa hubungkan domain sendiri (mis.
> `dashboard.tokosaya.com`) kalau punya.

### 4.3 Auto-deploy setelah ini

Setelah terhubung, **setiap kali Anda push perubahan ke branch `main` di
GitHub, Vercel otomatis re-deploy** dalam hitungan detik — tidak perlu
setup ulang.

---

## LANGKAH 5 — Daftar Akun Owner Pertama

1. Buka website Anda (domain dari Vercel)
2. Klik **"Daftar Administrator Baru"**
3. Isi nama, email, dan password Anda → Submit
4. Karena ini akun **pertama** yang mendaftar di sistem, Anda **otomatis
   langsung menjadi Owner** dan masuk ke dashboard (tanpa perlu approval)

⚠️ **Penting**: pastikan Andalah orang **pertama** yang mendaftar setelah
Langkah 1-4 selesai. Kalau ada orang lain yang keburu daftar duluan, dialah
yang akan jadi Owner otomatis. Kalau ini terjadi, perbaikannya lewat SQL
Editor Supabase:

```sql
-- Jadikan email tertentu sebagai Owner (jalankan di SQL Editor Supabase)
update admin_users set role = 'owner' where email = 'email_anda@contoh.com';
```

Selesai! Dashboard siap dipakai. Admin/staff/kasir lain yang mendaftar
setelah ini akan berstatus **"⏳ Menunggu Persetujuan"** sampai Anda
(sebagai Owner) approve lewat menu **Pengaturan → 👥 Manajemen User & Hak
Akses**.

---

## Struktur File Project

| File | Isi |
|---|---|
| `index.html` | Markup halaman dashboard lengkap (sidebar, login, semua modal) |
| `kasir.html` | Versi ringkas khusus kasir — hanya menu Dashboard Kasir, Penjualan, Stok |
| `style.css` | Seluruh styling/desain |
| `app.js` | Seluruh logic: render halaman, hitung laba, sinkronisasi ke Supabase, dll |
| `supabase-config.js` | Kredensial koneksi + daftar nama tabel Supabase |
| `SETUP-LENGKAP-OMNISELLER.sql` | Script SQL 1x-jalan: semua tabel, RLS, role, trigger |

---

## Fitur & Cara Pakai

### Menu yang tersedia (tergantung role)

| Menu | Kegunaan |
|---|---|
| Dashboard | Ringkasan omzet, laba, pesanan, stok menipis |
| Dashboard Kasir | Versi ringkas dashboard, tampil default untuk role Kasir |
| Laporan Penjualan | Daftar & input pesanan (mendukung multi-item per pesanan) |
| Stok & Gudang | Kelola stok/varian produk per SKU |
| Produk & Kategori | Kelola kategori produk & daftar marketplace |
| Laba & Biaya Admin per Produk | Atur HPP per produk, lihat laba kotor |
| Inventory | Catat pembelian barang dari supplier & penggajian karyawan |
| Laporan Keuangan | Laporan gabungan omzet, HPP, biaya, laba bersih |
| Import Data | Import data dari CSV |
| Pengaturan | Nama toko, logo, ganti password, Manajemen User |

### Menambah Marketplace baru

Menu **Produk & Kategori → Manajemen Marketplace → + Marketplace Baru** →
isi nama & warna → Simpan. Otomatis muncul di semua dropdown & laporan.

### Mengganti Logo Aplikasi

Menu **Pengaturan → Logo Aplikasi → 📷 Unggah Logo** (maks 1.5MB).

### Halaman Kasir (`kasir.html`)

Buka `https://domain-anda.vercel.app/kasir.html` di komputer/tablet kasir.
Tampilan sidebar dipangkas hanya untuk input pesanan & lihat stok — cocok
dipakai bersama tanpa risiko staf kasir mengubah data sensitif.

---

## Sistem Role / Hak Akses

| Role | Lihat data | Tambah/edit pesanan | Hapus pesanan | Ubah stok/kategori/marketplace | Ubah Biaya/HPP/Pengaturan Toko | Kelola User |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Owner** 👑 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Staff** 🛠 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Kasir** 🧾 | ✅ (terbatas) | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Viewer** 👁 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Pending** ⏳ | ❌ (tidak bisa masuk) | ❌ | ❌ | ❌ | ❌ | ❌ |

**Cara approve user baru:**
1. Login sebagai Owner → **Pengaturan → 👥 Manajemen User & Hak Akses**
2. Cari user berstatus Pending → pilih role (Staff/Kasir/Viewer) dari dropdown
3. User tersebut langsung bisa masuk di percobaan login berikutnya

**Cara cabut akses:** di kartu yang sama, klik 🗑 di sebelah nama user.

Keamanan ditegakkan di **2 lapis**: tampilan (tombol disembunyikan sesuai
role) **dan** database (Row Level Security menolak permintaan dari role
yang tidak berhak, bukan sekadar disembunyikan dari tampilan UI).

---

## Update Kode di Kemudian Hari

Karena Vercel sudah terhubung ke GitHub, cara update aplikasi:

**Lewat browser:**
1. Buka file yang ingin diubah di GitHub → klik ikon pensil (✏️ Edit)
2. Edit → **Commit changes**
3. Vercel otomatis re-deploy dalam beberapa detik

**Lewat terminal:**
```bash
git add .
git commit -m "Update fitur X"
git push
```

Kalau ada perubahan skema database (file `.sql` baru), jalankan dulu di
**Supabase SQL Editor** sebelum atau sesudah update kode — urutannya
biasanya tidak masalah kecuali disebutkan spesifik di catatan skrip
tersebut.

---

## Troubleshooting

### "supabaseClient is not defined"
Library Supabase (dimuat dari CDN) gagal diakses browser.
1. Refresh paksa: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
2. Coba mode Incognito untuk menyingkirkan cache lama
3. Cek Console browser (F12): ketik `typeof supabase` — harus `"object"`,
   kalau `"undefined"` berarti CDN gagal dimuat (bukan bug aplikasi)

### Login berhasil tapi langsung "Menunggu Persetujuan" padahal seharusnya Owner
Kemungkinan ada akun lain yang mendaftar duluan sebagai user pertama.
Perbaiki lewat SQL Editor Supabase:
```sql
update admin_users set role = 'owner' where email = 'email_anda@contoh.com';
```

### Ubah role user di menu Manajemen User tidak tersimpan / muncul peringatan RLS
Berarti Row Level Security menolak perubahan. Pastikan:
- Akun Anda memang berstatus `owner` di tabel `admin_users` (cek di Table Editor)
- Script `SETUP-LENGKAP-OMNISELLER.sql` sudah dijalankan **penuh tanpa error**

### Data tidak muncul / kosong setelah login
1. Cek tab **Network** di browser DevTools (F12) saat halaman dimuat — cari
   request ke `supabase.co` yang gagal (warna merah)
2. Pastikan `SUPABASE_URL` & `SUPABASE_ANON_KEY` di `supabase-config.js`
   sudah benar sesuai Langkah 1.4
3. Pastikan semua tabel sudah terbuat (cek Table Editor Supabase)

### Error saat menjalankan file SQL
- Pastikan Anda menjalankan **seluruh isi file** `SETUP-LENGKAP-OMNISELLER.sql`
  sekaligus, bukan sepotong-sepotong
- Kalau sempat menjalankan versi lama/lain sebelumnya dan terjadi konflik,
  paling aman: hapus semua tabel terkait lewat Table Editor, lalu jalankan
  ulang script dari awal

### Vercel deploy gagal / halaman blank
- Pastikan **Framework Preset** di setting Vercel adalah **Other**, bukan
  framework tertentu (karena ini bukan project React/Next.js)
- Pastikan `index.html` ada di **root folder** repository (bukan di dalam
  subfolder), kecuali Anda atur "Root Directory" di setting Vercel

---

## Catatan Keamanan

- Tabel database hanya bisa diakses oleh user yang sudah login
  (`authenticated`) — tidak ada akses publik/anonim ke data toko Anda.
- `anon key` di `supabase-config.js` aman ditaruh di kode frontend; jangan
  pernah menaruh `service_role key` di kode yang bisa dilihat publik.
- Sign Up terbuka untuk siapa saja yang punya link aplikasi Anda — akun baru
  otomatis berstatus Pending (tidak bisa masuk) sampai di-approve Owner.
  Kalau tidak diperlukan lagi, Anda bisa menyembunyikan link "Daftar
  Administrator Baru" dari `index.html` dan `kasir.html`.
