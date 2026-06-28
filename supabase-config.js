// ===== KONFIGURASI SUPABASE =====
// Project URL & Anon Key OmniSeller
const SUPABASE_URL = 'https://kjfqyirzqoetbbrnnkbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZnF5aXJ6cW9ldGJicm5ua2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjczMzIsImV4cCI6MjA5ODE0MzMzMn0.i6pmZKxwaegdM9wAGn8z8C9Pj98GAgEmq81l5esHcSY';

// Inisialisasi client Supabase (tersedia secara global sebagai `supabaseClient`)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Nama tabel tempat seluruh data aplikasi (penjualan, stok, kategori, biaya, pengaturan)
// disimpan sebagai satu baris JSON. Lihat file SETUP-DATABASE.sql untuk skema tabelnya.
const SUPA_TABLE = 'omniseller_data';
const SUPA_ROW_ID = 1; // id baris tunggal yang dipakai untuk menyimpan seluruh data toko
