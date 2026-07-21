-- =============================================================
-- SCHEMA SQL - ShopeeClone E-commerce
-- Jalankan file ini di Supabase Dashboard > SQL Editor
-- =============================================================

-- Ekstensi yang dibutuhkan (biasanya sudah aktif secara default di Supabase)
create extension if not exists "uuid-ossp";

-- =============================================================
-- 1. TABEL: profiles
-- Menyimpan data profil tambahan untuk setiap user (terhubung ke auth.users)
-- =============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  phone text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Kebijakan RLS: user hanya bisa melihat & mengubah profil miliknya sendiri
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger: otomatis membuat row di `profiles` setiap kali user baru mendaftar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =============================================================
-- 2. TABEL: products
-- Menyimpan katalog produk yang ditampilkan di homepage
-- =============================================================
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  old_price numeric(12,2),
  image_url text,
  category text,
  rating numeric(2,1) default 5.0 check (rating >= 0 and rating <= 5),
  sold integer default 0,
  stock integer default 0 check (stock >= 0),
  is_flash_sale boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_flash_sale on public.products(is_flash_sale);
create index if not exists idx_products_name on public.products using gin (to_tsvector('simple', name));

alter table public.products enable row level security;

-- Produk bisa dibaca oleh siapa saja (public read), termasuk user anonim
create policy "Products are viewable by everyone"
  on public.products for select
  using (true);

-- (Opsional) Hanya admin/service role yang bisa insert/update/delete produk.
-- Sesuaikan dengan kebutuhan Anda, contoh sederhana di bawah ini membatasi
-- write hanya melalui service_role key (dipakai di backend/admin panel).
create policy "Only service role can insert products"
  on public.products for insert
  with check (auth.role() = 'service_role');

create policy "Only service role can update products"
  on public.products for update
  using (auth.role() = 'service_role');

create policy "Only service role can delete products"
  on public.products for delete
  using (auth.role() = 'service_role');


-- =============================================================
-- 3. TABEL: cart_items
-- Menyimpan item keranjang belanja milik masing-masing user
-- =============================================================
create table if not exists public.cart_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, product_id)
);

create index if not exists idx_cart_items_user on public.cart_items(user_id);

alter table public.cart_items enable row level security;

-- User hanya bisa mengelola cart miliknya sendiri
create policy "Users can view their own cart"
  on public.cart_items for select
  using (auth.uid() = user_id);

create policy "Users can insert into their own cart"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cart"
  on public.cart_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own cart items"
  on public.cart_items for delete
  using (auth.uid() = user_id);


-- =============================================================
-- 4. (OPSIONAL) TABEL: orders & order_items
-- Untuk menyimpan riwayat transaksi setelah checkout.
-- Uncomment jika ingin mengimplementasikan histori pesanan.
-- =============================================================
-- create table if not exists public.orders (
--   id uuid default uuid_generate_v4() primary key,
--   user_id uuid references auth.users(id) on delete cascade not null,
--   total_amount numeric(12,2) not null,
--   status text default 'pending', -- pending | paid | shipped | completed | cancelled
--   created_at timestamptz default now()
-- );
--
-- create table if not exists public.order_items (
--   id uuid default uuid_generate_v4() primary key,
--   order_id uuid references public.orders(id) on delete cascade not null,
--   product_id uuid references public.products(id),
--   quantity integer not null,
--   price_at_purchase numeric(12,2) not null
-- );
--
-- alter table public.orders enable row level security;
-- alter table public.order_items enable row level security;
--
-- create policy "Users can view their own orders"
--   on public.orders for select using (auth.uid() = user_id);
-- create policy "Users can create their own orders"
--   on public.orders for insert with check (auth.uid() = user_id);


-- =============================================================
-- 5. TRIGGER updated_at otomatis (opsional, untuk semua tabel)
-- =============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_cart_items_updated_at on public.cart_items;
create trigger set_cart_items_updated_at
  before update on public.cart_items
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();


-- =============================================================
-- 6. SAMPLE DATA (opsional) - Isi beberapa produk contoh untuk testing
-- =============================================================
insert into public.products (name, description, price, old_price, image_url, category, rating, sold, stock, is_flash_sale)
values
  ('Kaos Polos Cotton Combed 30s Premium Unisex', 'Bahan adem, nyaman dipakai harian.', 45000, 75000, 'https://picsum.photos/seed/tshirt1/400/400', 'fashion-pria', 4.8, 1200, 50, true),
  ('Sepatu Sneakers Sport Running Original', 'Ringan dan empuk untuk aktivitas olahraga.', 189000, 350000, 'https://picsum.photos/seed/shoe1/400/400', 'sepatu', 4.9, 850, 30, true),
  ('Tas Selempang Wanita Kulit PU Fashion', 'Desain minimalis cocok untuk gaya casual.', 75000, 150000, 'https://picsum.photos/seed/bag1/400/400', 'fashion-wanita', 4.7, 2300, 40, true),
  ('Smartwatch Fitness Tracker Waterproof', 'Pantau detak jantung dan aktivitas harianmu.', 129000, 299000, 'https://picsum.photos/seed/watch1/400/400', 'elektronik', 4.6, 670, 25, true),
  ('Case Handphone Silikon Anti Crack', 'Melindungi HP dari benturan sehari-hari.', 15000, 30000, 'https://picsum.photos/seed/case1/400/400', 'elektronik', 4.9, 5400, 100, true)
on conflict do nothing;

-- =============================================================
-- SELESAI. Setelah menjalankan script ini:
-- 1. Aktifkan Email Auth di Authentication > Providers (biasanya sudah default aktif)
-- 2. Cek tabel di Table Editor untuk memastikan data sample masuk
-- 3. Salin Project URL & anon key ke supabase.js
-- =============================================================
