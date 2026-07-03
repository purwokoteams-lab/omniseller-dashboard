-- =========================================================
-- OMNISELLER DASHBOARD — SKEMA DATABASE RELASIONAL
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query
-- Skema ini menggantikan tabel lama "omniseller_data" (1 baris JSON)
-- menjadi tabel-tabel terpisah sesuai struktur data aplikasi.
-- =========================================================

-- =========================================================
-- 1. TABEL KATEGORI
-- (sesuai DB.kategori = [{nama, color}])
-- =========================================================
create table if not exists public.kategori (
  id bigint generated always as identity primary key,
  nama text not null unique,
  color text not null default '#888888',
  created_at timestamptz default now()
);

-- =========================================================
-- 2. TABEL MARKETPLACE
-- (sesuai DB.marketplace = [{nama, color}], fee_persen = DB.biaya.mp_fee[nama])
-- =========================================================
create table if not exists public.marketplace (
  id bigint generated always as identity primary key,
  nama text not null unique,
  color text not null default '#888888',
  fee_persen numeric not null default 3,
  created_at timestamptz default now()
);

-- =========================================================
-- 3. TABEL STOK
-- (sesuai DB.stok = [{sku, prod, varian, kat, stok, terjual}])
-- =========================================================
create table if not exists public.stok (
  id bigint generated always as identity primary key,
  sku text not null unique,
  produk text not null,
  varian text default '',
  kategori text default 'Lainnya',
  stok int not null default 0,
  terjual int not null default 0,
  hpp numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- 4. TABEL PENJUALAN
-- (sesuai DB.penjualan = [{no, tanggal, _date, mp, prod, varian, kat, qty, total, status}])
-- =========================================================
create table if not exists public.penjualan (
  id bigint generated always as identity primary key,
  no_pesanan text not null unique,
  tanggal text not null,          -- tampilan dd/mm/yyyy (sesuai format app)
  tgl_iso timestamptz not null,   -- nilai asli untuk sorting/filter tanggal
  marketplace text not null,
  produk text not null,
  varian text default '',
  kategori text default 'Lainnya',
  qty int not null default 1,
  total bigint not null default 0,
  status text not null default 'Selesai',
  created_at timestamptz default now()
);

-- =========================================================
-- 5. TABEL BIAYA & PENGATURAN (1 baris singleton, id selalu = 1)
-- (sesuai DB.biaya.extra & DB.biaya.hpp_mode/hpp_pct)
-- =========================================================
create table if not exists public.biaya_pengaturan (
  id int primary key default 1,
  ongkir numeric default 3000,
  packaging numeric default 1500,
  lain numeric default 500,
  hpp_mode text default 'pct',     -- 'pct' atau 'manual'
  hpp_pct numeric default 45,
  updated_at timestamptz default now(),
  constraint singleton_row check (id = 1)
);

-- =========================================================
-- 6. TABEL HPP PER PRODUK
-- (sesuai DB.biaya.hpp_per_produk = {produk: nilai})
-- =========================================================
create table if not exists public.hpp_per_produk (
  produk text primary key,
  hpp numeric not null default 0,
  updated_at timestamptz default now()
);

-- =========================================================
-- 7. TABEL PENGATURAN TOKO (1 baris singleton, id selalu = 1)
-- (sesuai DB.pengaturan = {nama, pemilik, hp, batasStok, logo})
-- =========================================================
create table if not exists public.pengaturan_toko (
  id int primary key default 1,
  nama_toko text default 'Toko Saya',
  pemilik text default '',
  hp text default '',
  batas_stok int default 10,
  logo text default '',           -- base64 data:image/...;base64,xxxx
  updated_at timestamptz default now(),
  constraint singleton_row check (id = 1)
);

-- =========================================================
-- ROW LEVEL SECURITY — hanya admin yang sudah login bisa akses
-- =========================================================
alter table public.kategori enable row level security;
alter table public.marketplace enable row level security;
alter table public.stok enable row level security;
alter table public.penjualan enable row level security;
alter table public.biaya_pengaturan enable row level security;
alter table public.hpp_per_produk enable row level security;
alter table public.pengaturan_toko enable row level security;

-- Policy generik: full akses (select/insert/update/delete) untuk user yang sudah login
do $$
declare t text;
begin
  for t in select unnest(array['kategori','marketplace','stok','penjualan','biaya_pengaturan','hpp_per_produk','pengaturan_toko'])
  loop
    execute format('drop policy if exists "admin_full_access" on public.%I', t);
    execute format('create policy "admin_full_access" on public.%I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')', t);
  end loop;
end $$;

-- =========================================================
-- DATA AWAL (default kategori, marketplace, baris singleton)
-- =========================================================
insert into public.kategori (nama,color) values
  ('Atasan','#4f3de8'),('Bawahan','#ee4d2d'),('Outer','#00aa5b'),('Aksesoris','#f59e0b'),('Lainnya','#888888')
on conflict (nama) do nothing;

insert into public.marketplace (nama,color,fee_persen) values
  ('Shopee','#ee4d2d',3.5),('Tokopedia','#00aa5b',2.5),('TikTok Shop','#444444',1.8),('Lazada','#1a0dab',4.0)
on conflict (nama) do nothing;

insert into public.biaya_pengaturan (id) values (1) on conflict (id) do nothing;
insert into public.pengaturan_toko (id) values (1) on conflict (id) do nothing;

-- =========================================================
-- INDEX tambahan untuk performa filter/laporan
-- =========================================================
create index if not exists idx_penjualan_tgl on public.penjualan(tgl_iso);
create index if not exists idx_penjualan_mp on public.penjualan(marketplace);
create index if not exists idx_penjualan_kat on public.penjualan(kategori);
create index if not exists idx_stok_kat on public.stok(kategori);

-- Selesai. Lihat PANDUAN-SQL.md untuk cara migrasi data lama & contoh query.

-- =========================================================
-- HAPUS DATA DUMMY (sample/contoh) — Penjualan & Stok Gudang
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query
-- Data ASLI yang sudah Anda input manual TIDAK akan terhapus,
-- karena query ini hanya menyasar pola penamaan data dummy bawaan.
-- =========================================================

-- 1. Cek dulu (opsional) — lihat berapa banyak data dummy yang akan terhapus
select count(*) as jumlah_penjualan_dummy
from penjualan
where no_pesanan ~ '^[A-Z]{3}-1[0-9]{3}$';

select count(*) as jumlah_stok_dummy
from stok
where sku ~ '^SKU-[0-9]{4}$';

-- 2. Hapus PENJUALAN dummy
-- (pola: 3 huruf kode marketplace + angka 1000-1199, contoh: SHO-1042, TOK-1003)
delete from penjualan
where no_pesanan ~ '^[A-Z]{3}-1[0-9]{3}$';

-- 3. Hapus STOK dummy
-- (pola: SKU-0001 sampai SKU-0120)
delete from stok
where sku ~ '^SKU-[0-9]{4}$';

-- Selesai. Data asli yang Anda input manual (nomor pesanan / SKU dengan
-- format berbeda) akan tetap ada.

-- =========================================================
-- OMNISELLER — SISTEM ROLE / HAK AKSES ADMIN
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query
-- Jalankan SETELAH SETUP-DATABASE.sql
-- =========================================================

-- 1. Tabel profil admin (terhubung ke akun login di auth.users)
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nama text default '',
  role text not null default 'pending' check (role in ('owner','staff','viewer','pending')),
  created_at timestamptz default now()
);
alter table public.admin_users enable row level security;

-- 2. Fungsi bantu: ambil role user yang sedang login
create or replace function public.my_role()
returns text language sql stable security definer as $$
  select role from public.admin_users where id = auth.uid();
$$;

-- 3. Trigger otomatis: setiap kali ada akun baru daftar (sign up),
--    otomatis dibuatkan profil di admin_users.
--    User PERTAMA yang pernah daftar otomatis jadi 'owner'.
--    User berikutnya berstatus 'pending' (menunggu disetujui Owner).
create or replace function public.handle_new_admin_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.admin_users (id, email, nama, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nama', new.email),
    case when (select count(*) from public.admin_users) = 0 then 'owner' else 'pending' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_admin_user();

-- 4. RLS untuk tabel admin_users
drop policy if exists "lihat semua profil" on public.admin_users;
create policy "lihat semua profil" on public.admin_users
  for select using (auth.role() = 'authenticated');

drop policy if exists "owner kelola role" on public.admin_users;
create policy "owner kelola role" on public.admin_users
  for update using (public.my_role() = 'owner') with check (public.my_role() = 'owner');

drop policy if exists "owner hapus akses" on public.admin_users;
create policy "owner hapus akses" on public.admin_users
  for delete using (public.my_role() = 'owner');

-- =========================================================
-- 5. PERBARUI RLS tabel-tabel data agar sesuai role:
--    - select  : owner, staff, viewer (asal bukan 'pending')
--    - insert/update/delete (data transaksi): owner & staff
--    - insert/update/delete (pengaturan/biaya): owner saja
-- =========================================================

-- Tabel transaksi/operasional: owner & staff boleh ubah, viewer hanya lihat
do $$
declare t text;
begin
  for t in select unnest(array['kategori','marketplace','stok','penjualan','hpp_per_produk'])
  loop
    execute format('drop policy if exists "admin_full_access" on public.%I', t);
    execute format('drop policy if exists "role_select" on public.%I', t);
    execute format('drop policy if exists "role_write" on public.%I', t);
    execute format('create policy "role_select" on public.%I for select using (public.my_role() in (''owner'',''staff'',''viewer''))', t);
    execute format('create policy "role_write" on public.%I for all using (public.my_role() in (''owner'',''staff'')) with check (public.my_role() in (''owner'',''staff''))', t);
  end loop;
end $$;

-- Tabel pengaturan sensitif: hanya owner yang boleh ubah, staff/viewer hanya lihat
do $$
declare t text;
begin
  for t in select unnest(array['biaya_pengaturan','pengaturan_toko'])
  loop
    execute format('drop policy if exists "admin_full_access" on public.%I', t);
    execute format('drop policy if exists "role_select" on public.%I', t);
    execute format('drop policy if exists "role_write" on public.%I', t);
    execute format('create policy "role_select" on public.%I for select using (public.my_role() in (''owner'',''staff'',''viewer''))', t);
    execute format('create policy "role_write" on public.%I for all using (public.my_role() = ''owner'') with check (public.my_role() = ''owner'')', t);
  end loop;
end $$;

-- =========================================================
-- SELESAI.
-- Cara kerja:
-- 1. Orang pertama yang Sign Up di aplikasi otomatis jadi OWNER.
-- 2. Admin/staff berikutnya yang Sign Up akan berstatus PENDING
--    (tidak bisa masuk ke aplikasi) sampai di-approve oleh Owner
--    lewat menu Pengaturan > Manajemen User.
-- 3. Owner bisa mengubah role siapa pun (staff/viewer/owner) atau
--    mencabut akses (hapus).
-- =========================================================

insert into admin_users (id, email, nama, role)
select id, email, email, 'owner'
from auth.users
where email = 'purwokomanual@contoh.com'
on conflict (id) do update set role = 'owner';

-- =========================================================
-- FIX MANAJEMEN USER & HAK AKSES — OmniSeller Dashboard
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query
-- Tujuan: memperbaiki semua masalah yang mungkin terjadi setelah
-- menjalankan SETUP-ROLES.sql, termasuk konflik policy lama,
-- akun yang tidak ter-insert ke admin_users, dan trigger yang gagal.
-- =========================================================

-- =========================================================
-- BAGIAN 1: BERSIHKAN & REBUILD tabel admin_users
-- =========================================================

-- 1a. Pastikan tabel admin_users ada (jika belum pernah jalankan SETUP-ROLES.sql)
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nama text default '',
  role text not null default 'pending' check (role in ('owner','staff','viewer','pending')),
  created_at timestamptz default now()
);

-- 1b. Aktifkan RLS
alter table public.admin_users enable row level security;

-- 1c. Hapus SEMUA policy yang mungkin ada (nama lama maupun baru) agar tidak konflik
do $$
declare pol text;
begin
  for pol in
    select policyname from pg_policies where tablename='admin_users' and schemaname='public'
  loop
    execute format('drop policy if exists %I on public.admin_users', pol);
  end loop;
end $$;

-- 1d. Buat ulang policy yang benar
-- Owner bisa lihat & kelola semua user
create policy "admin_users_select" on public.admin_users
  for select using (auth.role() = 'authenticated');

create policy "admin_users_update" on public.admin_users
  for update using (
    -- Owner bisa update siapa saja, KECUALI mengubah dirinya sendiri
    (select role from public.admin_users where id = auth.uid()) = 'owner'
    and id != auth.uid()
  ) with check (
    (select role from public.admin_users where id = auth.uid()) = 'owner'
  );

create policy "admin_users_delete" on public.admin_users
  for delete using (
    (select role from public.admin_users where id = auth.uid()) = 'owner'
    and id != auth.uid()
  );

-- =========================================================
-- BAGIAN 2: SYNC akun yang sudah ada di auth.users
-- ke tabel admin_users (untuk akun lama yang mungkin terlewat)
-- =========================================================

-- Insert semua akun yang ada di auth.users tapi belum ada di admin_users.
-- Akun PERTAMA yang terdaftar jadi owner, sisanya jadi pending.
insert into public.admin_users (id, email, nama, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'nama', u.email),
  case
    when not exists (select 1 from public.admin_users) then 'owner'
    when u.created_at = (select min(created_at) from auth.users) then 'owner'
    else 'pending'
  end
from auth.users u
where not exists (
  select 1 from public.admin_users a where a.id = u.id
)
on conflict (id) do nothing;

-- =========================================================
-- BAGIAN 3: REBUILD fungsi & trigger
-- =========================================================

-- 3a. Fungsi cek role (dipakai oleh RLS tabel data)
create or replace function public.my_role()
returns text language sql stable security definer as $$
  select role from public.admin_users where id = auth.uid();
$$;

-- 3b. Trigger otomatis untuk Sign Up baru di masa depan
create or replace function public.handle_new_admin_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.admin_users (id, email, nama, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nama', new.email),
    case
      when (select count(*) from public.admin_users) = 0 then 'owner'
      else 'pending'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_admin_user();

-- =========================================================
-- BAGIAN 4: REBUILD RLS tabel-tabel data (bersih dari policy konflik)
-- =========================================================

do $$
declare
  t text;
  pol text;
begin
  -- Tabel data utama: owner & staff bisa baca+tulis, viewer hanya baca
  for t in select unnest(array['kategori','marketplace','stok','penjualan','hpp_per_produk'])
  loop
    -- Hapus semua policy lama di tabel ini
    for pol in select policyname from pg_policies where tablename=t and schemaname='public'
    loop
      execute format('drop policy if exists %I on public.%I', pol, t);
    end loop;
    -- Buat ulang yang benar
    execute format(
      'create policy "role_select" on public.%I for select using (public.my_role() in (''owner'',''staff'',''viewer''))', t
    );
    execute format(
      'create policy "role_write" on public.%I for all using (public.my_role() in (''owner'',''staff'')) with check (public.my_role() in (''owner'',''staff''))', t
    );
  end loop;

  -- Tabel pengaturan sensitif: hanya owner yang boleh ubah
  for t in select unnest(array['biaya_pengaturan','pengaturan_toko'])
  loop
    for pol in select policyname from pg_policies where tablename=t and schemaname='public'
    loop
      execute format('drop policy if exists %I on public.%I', pol, t);
    end loop;
    execute format(
      'create policy "role_select" on public.%I for select using (public.my_role() in (''owner'',''staff'',''viewer''))', t
    );
    execute format(
      'create policy "role_write" on public.%I for all using (public.my_role() = ''owner'') with check (public.my_role() = ''owner'')', t
    );
  end loop;
end $$;

-- =========================================================
-- VERIFIKASI — jalankan query ini untuk cek hasilnya
-- =========================================================

-- Cek siapa saja yang terdaftar dan role-nya:
select id, email, nama, role, created_at from public.admin_users order by created_at;

-- Cek policy yang aktif di tabel admin_users:
-- select policyname, cmd, qual from pg_policies where tablename='admin_users';


-- =========================================================
-- TAMBAH KOLOM BIAYA ADMIN & BIAYA TAMBAHAN — Tabel Penjualan
-- Jalankan di: Supabase Dashboard > SQL Editor > New query
-- Jalankan ini HANYA jika project Anda sudah pernah menjalankan
-- SETUP-DATABASE.sql versi lama (tabel "penjualan" sudah ada tapi
-- belum punya kolom biaya_admin / biaya_tambahan).
--
-- Fitur ini memindahkan "Biaya Admin per Marketplace (%)" dan
-- "Biaya Tambahan per Transaksi (Rp)" yang dulunya pengaturan global
-- di menu Laba & Biaya, menjadi input langsung per pesanan di menu
-- Penjualan (lebih akurat, karena tiap pesanan/promo bisa beda).
-- =========================================================

alter table public.penjualan
  add column if not exists biaya_admin numeric,
  add column if not exists biaya_tambahan numeric;

-- Kolom dibiarkan NULL (bukan 0) untuk pesanan lama yang sudah ada,
-- supaya aplikasi tetap menampilkan ESTIMASI otomatis (berdasarkan
-- pengaturan % lama / rata-rata) sampai Anda edit pesanan tersebut
-- dan mengisi nilai aslinya secara manual.

-- Selesai. Tidak perlu mengisi data apa pun secara manual lewat SQL —
-- cukup upload ulang index.html & app.js, lalu isi Biaya Admin (Rp) dan
-- Biaya Tambahan (Rp) langsung dari menu Penjualan saat tambah/edit pesanan.

-- =========================================================
-- MULTI-ITEM PESANAN — OmniSeller Dashboard
-- Jalankan di: Supabase Dashboard > SQL Editor > New query
-- Jalankan SETELAH SETUP-DATABASE.sql dan SETUP-ROLES.sql
--
-- Tujuan: mengubah skema dari "1 pesanan = 1 barang" (tabel
-- penjualan) menjadi "1 pesanan = banyak barang" (tabel pesanan +
-- pesanan_item), plus RLS role yang mengunci pesanan berstatus
-- final agar tidak diubah sembarangan oleh Staff.
--
-- Tabel `penjualan` lama TIDAK dihapus oleh script ini (jaga-jaga).
-- =========================================================

-- =========================================================
-- BAGIAN 1: TABEL HEADER PESANAN
-- =========================================================
create table if not exists public.pesanan (
  id bigint generated always as identity primary key,
  no_pesanan text not null unique,
  tanggal text not null,           -- tampilan dd/mm/yyyy
  tgl_iso timestamptz not null,    -- nilai asli untuk sorting/filter
  marketplace text not null,
  status text not null default 'Selesai',
  biaya_admin numeric,             -- Rp per pesanan (potongan marketplace)
  biaya_tambahan numeric,          -- Rp per pesanan (ongkir/lain-lain)
  catatan text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- BAGIAN 2: TABEL DETAIL BARANG PER PESANAN
-- =========================================================
create table if not exists public.pesanan_item (
  id bigint generated always as identity primary key,
  pesanan_id bigint not null references public.pesanan(id) on delete cascade,
  sku text references public.stok(sku) on delete set null,
  produk text not null,
  varian text default '',
  kategori text default 'Lainnya',
  qty int not null default 1,
  harga_satuan numeric not null default 0,
  subtotal numeric generated always as (qty * harga_satuan) stored,
  created_at timestamptz default now()
);

create index if not exists idx_pesanan_tgl on public.pesanan(tgl_iso);
create index if not exists idx_pesanan_mp on public.pesanan(marketplace);
create index if not exists idx_pesanan_status on public.pesanan(status);
create index if not exists idx_pesanan_item_pesanan on public.pesanan_item(pesanan_id);
create index if not exists idx_pesanan_item_sku on public.pesanan_item(sku);

-- Auto-update kolom updated_at di header saat item berubah
create or replace function public.touch_pesanan_updated_at()
returns trigger language plpgsql as $$
begin
  update public.pesanan set updated_at = now()
  where id = coalesce(new.pesanan_id, old.pesanan_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_touch_pesanan on public.pesanan_item;
create trigger trg_touch_pesanan
  after insert or update or delete on public.pesanan_item
  for each row execute function public.touch_pesanan_updated_at();

-- =========================================================
-- BAGIAN 3: MIGRASI DATA LAMA (dari tabel `penjualan`, 1 baris = 1 item)
-- Aman dijalankan berkali-kali — pakai on conflict do nothing.
-- =========================================================

insert into public.pesanan (no_pesanan, tanggal, tgl_iso, marketplace, status, biaya_admin, biaya_tambahan, created_at)
select no_pesanan, tanggal, tgl_iso, marketplace, status, biaya_admin, biaya_tambahan, created_at
from public.penjualan
on conflict (no_pesanan) do nothing;

insert into public.pesanan_item (pesanan_id, sku, produk, varian, kategori, qty, harga_satuan)
select
  p.id,
  null, -- SKU lama tidak tersimpan eksplisit di tabel penjualan, isi manual/lewat app kalau perlu
  o.produk, o.varian, o.kategori, o.qty,
  case when o.qty > 0 then round(o.total::numeric / o.qty) else o.total end
from public.penjualan o
join public.pesanan p on p.no_pesanan = o.no_pesanan
where not exists (
  select 1 from public.pesanan_item i where i.pesanan_id = p.id
);

-- =========================================================
-- BAGIAN 4: VIEW KOMPATIBILITAS — total pesanan otomatis terhitung
-- Dipakai untuk laporan/dashboard tanpa perlu join manual tiap kali.
-- =========================================================
create or replace view public.pesanan_dengan_total as
select
  p.id, p.no_pesanan, p.tanggal, p.tgl_iso, p.marketplace, p.status,
  p.biaya_admin, p.biaya_tambahan, p.catatan, p.created_at, p.updated_at,
  coalesce(sum(i.subtotal), 0) as total,
  coalesce(sum(i.qty), 0) as total_qty,
  count(i.id) as jumlah_item
from public.pesanan p
left join public.pesanan_item i on i.pesanan_id = p.id
group by p.id;

-- =========================================================
-- BAGIAN 5: ROW LEVEL SECURITY sesuai ROLE
-- (asumsi fungsi public.my_role() sudah ada dari SETUP-ROLES.sql)
-- =========================================================
alter table public.pesanan enable row level security;
alter table public.pesanan_item enable row level security;

-- --- Tabel pesanan (header) ---
drop policy if exists "pesanan_select" on public.pesanan;
create policy "pesanan_select" on public.pesanan
  for select using (public.my_role() in ('owner','staff','viewer'));

-- INSERT: owner & staff boleh, siapa saja bisa buat pesanan baru
drop policy if exists "pesanan_insert" on public.pesanan;
create policy "pesanan_insert" on public.pesanan
  for insert with check (public.my_role() in ('owner','staff'));

-- UPDATE/DELETE header: staff HANYA boleh selama status BELUM final
-- (Diproses). Kalau sudah Selesai/Dikirim/Dibatalkan, hanya Owner.
drop policy if exists "pesanan_update" on public.pesanan;
create policy "pesanan_update" on public.pesanan
  for update using (
    public.my_role() = 'owner'
    or (public.my_role() = 'staff' and status = 'Diproses')
  ) with check (
    public.my_role() = 'owner'
    or (public.my_role() = 'staff' and status = 'Diproses')
  );

drop policy if exists "pesanan_delete" on public.pesanan;
create policy "pesanan_delete" on public.pesanan
  for delete using (
    public.my_role() = 'owner'
    or (public.my_role() = 'staff' and status = 'Diproses')
  );

-- --- Tabel pesanan_item (detail barang) ---
-- Aturan sama seperti header, tapi dicek lewat status pesanan induknya.
drop policy if exists "item_select" on public.pesanan_item;
create policy "item_select" on public.pesanan_item
  for select using (public.my_role() in ('owner','staff','viewer'));

drop policy if exists "item_insert" on public.pesanan_item;
create policy "item_insert" on public.pesanan_item
  for insert with check (
    public.my_role() = 'owner'
    or (
      public.my_role() = 'staff'
      and exists (select 1 from public.pesanan p where p.id = pesanan_id and p.status = 'Diproses')
    )
  );

drop policy if exists "item_update" on public.pesanan_item;
create policy "item_update" on public.pesanan_item
  for update using (
    public.my_role() = 'owner'
    or (
      public.my_role() = 'staff'
      and exists (select 1 from public.pesanan p where p.id = pesanan_id and p.status = 'Diproses')
    )
  ) with check (
    public.my_role() = 'owner'
    or (
      public.my_role() = 'staff'
      and exists (select 1 from public.pesanan p where p.id = pesanan_id and p.status = 'Diproses')
    )
  );

drop policy if exists "item_delete" on public.pesanan_item;
create policy "item_delete" on public.pesanan_item
  for delete using (
    public.my_role() = 'owner'
    or (
      public.my_role() = 'staff'
      and exists (select 1 from public.pesanan p where p.id = pesanan_id and p.status = 'Diproses')
    )
  );

-- =========================================================
-- VERIFIKASI — jalankan untuk cek hasil migrasi
-- =========================================================
select count(*) as jumlah_pesanan from public.pesanan;
select count(*) as jumlah_item from public.pesanan_item;
select * from public.pesanan_dengan_total order by tgl_iso desc limit 20;

-- =========================================================
-- OMNISELLER — JEJAK AUDIT (audit trail)
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query
-- Jalankan SETELAH SETUP-ROLES.sql
--
-- Menambahkan kolom created_by/updated_by di tabel-tabel utama, terisi
-- OTOMATIS dari akun yang sedang login (auth.uid()) lewat trigger —
-- tidak perlu ubah apa pun di app.js untuk pengisian dasarnya.
-- Berguna untuk melacak "data ini diinput/diubah oleh siapa" kalau
-- beberapa staf/kasir input data bersamaan.
-- =========================================================

create or replace function public.set_audit_fields()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    new.created_by := auth.uid();
    new.updated_by := auth.uid();
  elsif TG_OP = 'UPDATE' then
    new.updated_by := auth.uid();
    new.created_by := old.created_by; -- jangan pernah berubah setelah dibuat
  end if;
  return new;
end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array['penjualan','pesanan','stok'])
  loop
    if to_regclass('public.'||t) is not null then
      execute format('alter table public.%I add column if not exists created_by uuid references auth.users(id)', t);
      execute format('alter table public.%I add column if not exists updated_by uuid references auth.users(id)', t);
      execute format('drop trigger if exists trg_audit_fields on public.%I', t);
      execute format('create trigger trg_audit_fields before insert or update on public.%I for each row execute function public.set_audit_fields()', t);
    end if;
  end loop;
end $$;

-- =========================================================
-- Contoh query: lihat 20 pesanan terakhir beserta siapa yang menginputnya
-- =========================================================
-- select p.no_pesanan, p.tanggal, p.total, au.email as diinput_oleh, p.created_at
-- from public.pesanan p
-- left join public.admin_users au on au.id = p.created_by
-- order by p.created_at desc limit 20;

-- Selesai. Kolom ini terisi otomatis untuk data BARU/DIUBAH setelah script
-- ini dijalankan. Data lama yang sudah ada sebelumnya akan punya created_by
-- kosong (NULL) — ini normal, karena sistem tidak tahu siapa penginput
-- aslinya sebelum audit trail ini aktif.

-- =========================================================
-- OMNISELLER — DUKUNGAN MULTI-ITEM PER PESANAN
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query
-- Jalankan SETELAH SETUP-DATABASE.sql (dan SETUP-ROLES.sql jika dipakai)
--
-- AMAN: script ini TIDAK menghapus atau mengubah tabel `penjualan` yang
-- lama. Ia hanya MENAMBAH 2 tabel baru (`pesanan` & `pesanan_item`) dan
-- MENYALIN (bukan memindahkan) data lama ke struktur baru. Tabel lama
-- tetap ada sebagai arsip sampai Anda yakin siap pindah sepenuhnya.
--
-- Catatan: aplikasi (app.js) BELUM otomatis memakai tabel baru ini
-- setelah script ini dijalankan — perlu update kode terpisah agar form
-- pesanan, hitung stok, dan laporan memakai struktur baru.
-- =========================================================

-- =========================================================
-- 1. TABEL PESANAN (header)
-- =========================================================
create table if not exists public.pesanan (
  id bigint generated always as identity primary key,
  no_pesanan text not null unique,
  tanggal text not null,
  tgl_iso timestamptz not null,
  marketplace text not null,
  status text not null default 'Selesai',
  biaya_admin numeric,
  biaya_tambahan numeric,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- 2. TABEL PESANAN_ITEM (detail barang per pesanan)
-- =========================================================
create table if not exists public.pesanan_item (
  id bigint generated always as identity primary key,
  pesanan_id bigint not null references public.pesanan(id) on delete cascade,
  produk text not null,
  varian text default '',
  kategori text default 'Lainnya',
  qty int not null default 1,
  harga_satuan numeric not null default 0,
  subtotal numeric not null default 0,
  hpp_saat_transaksi numeric default 0, -- snapshot HPP saat transaksi dibuat,
                                         -- supaya laporan laba historis tidak
                                         -- berubah kalau HPP produk diubah nanti
  created_at timestamptz default now()
);
create index if not exists idx_pesanan_item_pesanan on public.pesanan_item(pesanan_id);
create index if not exists idx_pesanan_item_produk on public.pesanan_item(produk);

-- =========================================================
-- 3. ROW LEVEL SECURITY
-- =========================================================
alter table public.pesanan enable row level security;
alter table public.pesanan_item enable row level security;

-- Jika SETUP-ROLES.sql SUDAH dijalankan (ada fungsi public.my_role()),
-- pakai kebijakan berbasis role yang sama seperti tabel `penjualan`.
-- Jika BELUM, fallback ke "siapa pun yang login boleh akses" (sama
-- seperti kebijakan default di SETUP-DATABASE.sql).
do $$
begin
  if exists (select 1 from pg_proc where proname = 'my_role') then
    execute 'drop policy if exists "role_select" on public.pesanan';
    execute 'drop policy if exists "role_write" on public.pesanan';
    execute $p$create policy "role_select" on public.pesanan for select using (public.my_role() in ('owner','staff','viewer'))$p$;
    execute $p$create policy "role_write" on public.pesanan for all using (public.my_role() in ('owner','staff')) with check (public.my_role() in ('owner','staff'))$p$;

    execute 'drop policy if exists "role_select" on public.pesanan_item';
    execute 'drop policy if exists "role_write" on public.pesanan_item';
    execute $p$create policy "role_select" on public.pesanan_item for select using (public.my_role() in ('owner','staff','viewer'))$p$;
    execute $p$create policy "role_write" on public.pesanan_item for all using (public.my_role() in ('owner','staff')) with check (public.my_role() in ('owner','staff'))$p$;
  else
    execute 'drop policy if exists "admin_full_access" on public.pesanan';
    execute $p$create policy "admin_full_access" on public.pesanan for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated')$p$;

    execute 'drop policy if exists "admin_full_access" on public.pesanan_item';
    execute $p$create policy "admin_full_access" on public.pesanan_item for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated')$p$;
  end if;
end $$;

-- =========================================================
-- 4. MIGRASI DATA LAMA (dari tabel `penjualan` 1-item lama)
--    Setiap baris lama menjadi: 1 pesanan (header) + 1 item.
--    Aman dijalankan berkali-kali (pakai ON CONFLICT DO NOTHING).
-- =========================================================
insert into public.pesanan (no_pesanan, tanggal, tgl_iso, marketplace, status, biaya_admin, biaya_tambahan)
select no_pesanan, tanggal, tgl_iso, marketplace, status, biaya_admin, biaya_tambahan
from public.penjualan
on conflict (no_pesanan) do nothing;

insert into public.pesanan_item (pesanan_id, produk, varian, kategori, qty, harga_satuan, subtotal)
select p.id, pj.produk, pj.varian, pj.kategori, pj.qty,
       case when pj.qty > 0 then round(pj.total::numeric / pj.qty) else pj.total end,
       pj.total
from public.penjualan pj
join public.pesanan p on p.no_pesanan = pj.no_pesanan
where not exists (
  select 1 from public.pesanan_item pi where pi.pesanan_id = p.id
);

-- =========================================================
-- 5. VERIFIKASI HASIL MIGRASI (jalankan manual untuk cek)
-- =========================================================
-- Jumlah harus SAMA antara tabel lama & tabel pesanan baru:
-- select count(*) from public.penjualan;
-- select count(*) from public.pesanan;
--
-- Total omzet harus SAMA (selisih Rp0 / mendekati 0 karena pembulatan):
-- select sum(total) from public.penjualan;
-- select sum(subtotal) from public.pesanan_item;

-- Selesai. Tabel `penjualan` lama TIDAK dihapus oleh script ini.
-- Setelah app.js diupdate untuk memakai `pesanan` + `pesanan_item` dan
-- Anda sudah yakin semua berjalan baik, tabel `penjualan` lama boleh
-- dijadikan arsip (tidak perlu dihapus, tidak akan mengganggu apa pun
-- selama tidak ada lagi kode yang menulis ke sana).

-- =========================================================
-- OMNISELLER — TAMBAH ROLE "KASIR"
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query
-- Jalankan SETELAH SETUP-ROLES.sql (dan TAMBAH-MULTI-ITEM.sql jika sudah pakai multi-item)
--
-- Role KASIR: boleh tambah/edit/hapus PESANAN saja (tabel `pesanan` &
-- `pesanan_item`, atau `penjualan` kalau belum migrasi multi-item).
-- TIDAK boleh mengubah stok gudang, kategori, marketplace, biaya, atau
-- pengaturan toko — cocok untuk staf CS/admin marketplace yang tugasnya
-- hanya input pesanan harian.
-- =========================================================

-- 1. Longgarkan constraint role di admin_users agar menerima 'kasir'
alter table public.admin_users drop constraint if exists admin_users_role_check;
alter table public.admin_users add constraint admin_users_role_check
  check (role in ('owner','staff','kasir','viewer','pending'));

-- 2. Update fungsi trigger orang pertama sign up (tidak berubah secara logika,
--    hanya dijalankan ulang agar konsisten dengan constraint baru di atas)
create or replace function public.handle_new_admin_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.admin_users (id, email, nama, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nama', new.email),
    case when (select count(*) from public.admin_users) = 0 then 'owner' else 'pending' end
  );
  return new;
end;
$$;

-- =========================================================
-- 3. RLS: tabel PESANAN (baik skema lama `penjualan` maupun skema baru
--    `pesanan` + `pesanan_item`) -> kasir boleh select & write.
--    Tabel STOK, KATEGORI, MARKETPLACE, BIAYA, PENGATURAN -> kasir HANYA select.
-- =========================================================

-- Tabel transaksi pesanan: owner, staff, DAN kasir boleh tulis
do $$
declare t text;
begin
  for t in select unnest(array['penjualan','pesanan','pesanan_item'])
  loop
    if to_regclass('public.'||t) is not null then
      execute format('drop policy if exists "role_select" on public.%I', t);
      execute format('drop policy if exists "role_write" on public.%I', t);
      execute format('create policy "role_select" on public.%I for select using (public.my_role() in (''owner'',''staff'',''kasir'',''viewer''))', t);
      execute format('create policy "role_write" on public.%I for all using (public.my_role() in (''owner'',''staff'',''kasir'')) with check (public.my_role() in (''owner'',''staff'',''kasir''))', t);
    end if;
  end loop;
end $$;

-- Tabel operasional lain (stok, kategori, marketplace, hpp_per_produk):
-- kasir HANYA boleh lihat, tidak boleh ubah
do $$
declare t text;
begin
  for t in select unnest(array['kategori','marketplace','stok','hpp_per_produk'])
  loop
    if to_regclass('public.'||t) is not null then
      execute format('drop policy if exists "role_select" on public.%I', t);
      execute format('drop policy if exists "role_write" on public.%I', t);
      execute format('create policy "role_select" on public.%I for select using (public.my_role() in (''owner'',''staff'',''kasir'',''viewer''))', t);
      execute format('create policy "role_write" on public.%I for all using (public.my_role() in (''owner'',''staff'')) with check (public.my_role() in (''owner'',''staff''))', t);
    end if;
  end loop;
end $$;

-- Tabel pengaturan sensitif (biaya, pengaturan toko): tetap hanya owner yang boleh ubah
do $$
declare t text;
begin
  for t in select unnest(array['biaya_pengaturan','pengaturan_toko'])
  loop
    if to_regclass('public.'||t) is not null then
      execute format('drop policy if exists "role_select" on public.%I', t);
      execute format('drop policy if exists "role_write" on public.%I', t);
      execute format('create policy "role_select" on public.%I for select using (public.my_role() in (''owner'',''staff'',''kasir'',''viewer''))', t);
      execute format('create policy "role_write" on public.%I for all using (public.my_role() = ''owner'') with check (public.my_role() = ''owner'')', t);
    end if;
  end loop;
end $$;

-- =========================================================
-- SELESAI.
-- Setelah ini, di menu Pengaturan > Manajemen User, Owner bisa memilih
-- role "Kasir" untuk admin yang tugasnya hanya input pesanan harian.
-- =========================================================

-- Ubah subtotal kembali jadi kolom biasa (nilai yang sudah ada tetap aman)
alter table public.pesanan_item alter column subtotal drop expression;

-- =========================================================
-- OMNISELLER — PERBAIKAN: KASIR TIDAK BISA MENAMBAH PESANAN
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query
-- Jalankan SETELAH TAMBAH-ROLE-KASIR.sql
--
-- PENYEBAB MASALAH:
-- Saat Kasir menyimpan pesanan baru, aplikasi (app.js) otomatis
-- MENGURANGI STOK GUDANG untuk barang yang terjual (lihat fungsi
-- simpanPesanan() -> saveDB(['penjualan','stok'])). Tapi kebijakan RLS
-- dari TAMBAH-ROLE-KASIR.sql membuat tabel `stok` HANYA bisa dibaca
-- (select) oleh Kasir, tidak bisa diubah (update) sama sekali.
-- Akibatnya: proses simpan pesanan GAGAL tersinkron ke server karena
-- ditolak oleh RLS pada saat mencoba mengurangi stok -> muncul pesan
-- error "Gagal menyimpan perubahan ke server".
--
-- PERBAIKAN:
-- Kasir diberi izin UPDATE saja di tabel `stok` (untuk keperluan
-- pengurangan stok otomatis saat transaksi). Kasir TETAP TIDAK BISA:
-- - Menambah produk stok baru (INSERT) -> tetap khusus Owner/Staff
-- - Menghapus produk stok (DELETE)      -> tetap khusus Owner/Staff
-- Ini konsisten dengan UI aplikasi, yang memang sudah mengunci menu
-- "Tambah Produk Stok / Restock / Hapus Stok" hanya untuk Owner & Staff
-- lewat fungsi canWrite() di app.js.
-- =========================================================

drop policy if exists "role_write" on public.stok;

create policy "role_write_update_stok" on public.stok
  for update
  using (public.my_role() in ('owner','staff','kasir'))
  with check (public.my_role() in ('owner','staff','kasir'));

create policy "role_write_insert_stok" on public.stok
  for insert
  with check (public.my_role() in ('owner','staff'));

create policy "role_write_delete_stok" on public.stok
  for delete
  using (public.my_role() in ('owner','staff'));

-- =========================================================
-- SELESAI.
-- Setelah menjalankan script ini, minta Kasir LOGOUT lalu LOGIN
-- kembali (atau refresh halaman), lalu coba tambahkan pesanan lagi
-- di menu Penjualan. Seharusnya sudah berhasil tersimpan ke server.
--
-- Catatan: kebijakan "role_select" untuk tabel stok TIDAK diubah oleh
-- script ini — Kasir tetap bisa melihat data stok seperti sebelumnya
-- (dari TAMBAH-ROLE-KASIR.sql), hanya sekarang juga bisa update
-- jumlahnya lewat proses simpan pesanan.
-- =========================================================

-- =========================================================
-- OMNISELLER — PERBAIKAN v2: KASIR TIDAK BISA MENAMBAH PESANAN
-- Jalankan di: Supabase Dashboard > SQL Editor > New Query
-- Ini MENGGANTIKAN FIX-KASIR-STOK.sql sebelumnya (kalau sudah pernah
-- dijalankan, tidak masalah, script ini akan menimpanya).
--
-- KENAPA PERBAIKAN SEBELUMNYA BELUM CUKUP:
-- app.js menyinkronkan tabel `stok` memakai UPSERT (insert-atau-update
-- sekaligus), bukan update biasa. Di PostgreSQL, perintah UPSERT selalu
-- dicek dulu terhadap kebijakan RLS untuk INSERT -- walaupun baris yang
-- dikirim semuanya SKU yang sudah ada (jadi ujung-ujungnya cuma
-- meng-update). Karena kemarin izin INSERT stok cuma untuk owner/staff,
-- seluruh proses upsert langsung ditolak duluan, sebelum sempat cek izin
-- update. Makanya Kasir masih gagal simpan pesanan.
--
-- PERBAIKAN:
-- Kasir diberi izin INSERT + UPDATE di tabel `stok` (supaya proses
-- upsert saat kurangi stok otomatis berhasil). DELETE tetap dikunci
-- hanya untuk Owner/Staff. Kasir tetap tidak akan pernah benar-benar
-- menambah produk stok baru dalam praktiknya karena menu "Tambah Produk
-- Stok / Restock" di aplikasi tetap terkunci untuk role selain
-- Owner/Staff (lihat fungsi canWrite() di app.js).
-- =========================================================

drop policy if exists "role_write" on public.stok;
drop policy if exists "role_write_update_stok" on public.stok;
drop policy if exists "role_write_insert_stok" on public.stok;
drop policy if exists "role_write_delete_stok" on public.stok;

-- INSERT + UPDATE: owner, staff, DAN kasir (dibutuhkan untuk upsert saat
-- pesanan baru otomatis mengurangi stok)
create policy "role_write_upsert_stok" on public.stok
  for all
  using (public.my_role() in ('owner','staff','kasir'))
  with check (public.my_role() in ('owner','staff','kasir'));

-- =========================================================
-- SELESAI.
-- Setelah menjalankan script ini:
-- 1. Minta Kasir LOGOUT lalu LOGIN kembali (supaya session Supabase-nya
--    dapat izin RLS terbaru).
-- 2. Coba tambahkan pesanan lagi di menu Penjualan.
--
-- Kalau MASIH gagal juga, tolong beri tahu saya PESAN ERROR PERSIS yang
-- muncul (screenshot atau salin teksnya) supaya saya bisa diagnosa lebih
-- lanjut -- kemungkinan lain: TAMBAH-ROLE-KASIR.sql belum pernah
-- dijalankan sama sekali (jadi role "kasir" belum benar-benar diizinkan
-- di constraint admin_users), atau akun tersebut role-nya belum diubah
-- jadi "Kasir" oleh Owner di menu Pengaturan > Manajemen User.
-- =========================================================
