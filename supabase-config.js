// ===== KONFIGURASI SUPABASE =====
// Project URL & Anon Key OmniSeller
const SUPABASE_URL = 'https://lbwmmppaunqikpollvhg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxid21tcHBhdW5xaWtwb2xsdmhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NTk3NzAsImV4cCI6MjA5ODAzNTc3MH0.O-tEKALTaAwAgVRnC3CKfDxAFuqq8-f43Mlmr7X6F3s';

// Inisialisasi client Supabase (tersedia secara global sebagai `supabaseClient`)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Nama tabel tempat seluruh data aplikasi (penjualan, stok, kategori, biaya, pengaturan)
// disimpan sebagai satu baris JSON. Lihat file SETUP-DATABASE.sql untuk skema tabelnya.
const SUPA_TABLE = 'omniseller_data';
const SUPA_ROW_ID = 1; // id baris tunggal yang dipakai untuk menyimpan seluruh data toko
