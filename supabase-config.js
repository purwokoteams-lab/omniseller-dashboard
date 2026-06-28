// ===== KONFIGURASI SUPABASE =====
// Project URL & Anon Key OmniSeller
const SUPABASE_URL = 'https://kjfqyirzqoetbbrnnkbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZnF5aXJ6cW9ldGJicm5ua2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjczMzIsImV4cCI6MjA5ODE0MzMzMn0.i6pmZKxwaegdM9wAGn8z8C9Pj98GAgEmq81l5esHcSY

';

// Inisialisasi client Supabase (tersedia secara global sebagai `supabaseClient`)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Nama-nama tabel relasional (lihat SETUP-DATABASE.sql)
const TBL_KATEGORI='kategori';
const TBL_MARKETPLACE='marketplace';
const TBL_STOK='stok';
const TBL_PENJUALAN='penjualan';
const TBL_BIAYA='biaya_pengaturan';
const TBL_HPP_PRODUK='hpp_per_produk';
const TBL_PENGATURAN='pengaturan_toko';
