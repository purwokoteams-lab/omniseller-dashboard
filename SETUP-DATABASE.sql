-- =========================================================
-- SETUP DATABASE SUPABASE — OmniSeller Dashboard
-- Jalankan script ini di: Supabase Dashboard > SQL Editor > New Query
-- =========================================================

-- 1. Buat tabel penyimpanan data (1 baris = 1 toko, berisi seluruh data JSON)
create table if not exists public.omniseller_data (
  id bigint primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- 2. Aktifkan Row Level Security
alter table public.omniseller_data enable row level security;

-- 3. Hapus policy lama (jika sebelumnya pernah menjalankan versi awal script ini)
drop policy if exists "Izinkan baca untuk semua" on public.omniseller_data;
drop policy if exists "Izinkan tulis untuk semua" on public.omniseller_data;
drop policy if exists "Izinkan update untuk semua" on public.omniseller_data;

-- 4. Sekarang aplikasi sudah punya login Administrator (Supabase Auth),
--    jadi data HANYA bisa diakses oleh user yang sudah login (authenticated).
--    Pengguna anonim (belum login) tidak bisa baca/tulis data sama sekali.
create policy "Hanya admin login - baca" on public.omniseller_data
  for select using (auth.role() = 'authenticated');

create policy "Hanya admin login - tulis" on public.omniseller_data
  for insert with check (auth.role() = 'authenticated');

create policy "Hanya admin login - update" on public.omniseller_data
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 5. (Opsional) baris awal kosong agar tidak error saat aplikasi pertama kali load
insert into public.omniseller_data (id, data, updated_at)
values (1, '{}'::jsonb, now())
on conflict (id) do nothing;

-- =========================================================
-- SETELAH MENJALANKAN SQL DI ATAS, BUAT AKUN ADMIN:
-- 1. Buka menu Authentication > Users di Supabase Dashboard
-- 2. Klik "Add user" > "Create new user"
-- 3. Isi Email & Password admin Anda, lalu pastikan
--    "Auto Confirm User" dicentang (supaya bisa langsung login)
-- 4. Klik Create user
-- 5. Pastikan provider "Email" aktif di Authentication > Providers
-- Setelah itu, gunakan email & password tersebut untuk login
-- di halaman OmniSeller.
-- =========================================================
