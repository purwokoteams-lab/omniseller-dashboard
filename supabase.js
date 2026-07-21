// =============================================================
// supabase.js
// Konfigurasi Supabase Client & Database Helper Functions
// =============================================================
// Import Supabase client dari CDN (ESM build)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// -------------------------------------------------------------
// 1. KONFIGURASI - Ganti dengan URL & ANON KEY project Supabase Anda
//    Bisa didapatkan di: Supabase Dashboard > Project Settings > API
// -------------------------------------------------------------
const SUPABASE_URL = 'https://kjfqyirzqoetbbrnnkbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZnF5aXJ6cW9ldGJicm5ua2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjczMzIsImV4cCI6MjA5ODE0MzMzMn0.i6pmZKxwaegdM9wAGn8z8C9Pj98GAgEmq81l5esHcSY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================================
// AUTH HELPERS
// =============================================================

/**
 * Registrasi user baru menggunakan email & password.
 * Setelah registrasi berhasil, Supabase Auth akan otomatis
 * membuat row baru (jika trigger `handle_new_user` sudah dibuat
 * sesuai schema.sql) pada tabel `profiles`.
 */
export async function registerUser(email, password, fullName = '') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });

  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true, user: data.user, session: data.session };
}

/**
 * Login user dengan email & password.
 */
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true, user: data.user, session: data.session };
}

/**
 * Logout user yang sedang aktif.
 */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  return { success: !error, message: error?.message };
}

/**
 * Ambil sesi user yang sedang login (jika ada).
 * Berguna untuk cek status login saat halaman pertama kali dimuat.
 */
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

/**
 * Listener realtime untuk perubahan status auth (login/logout).
 * callback akan dipanggil setiap kali status auth berubah.
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// =============================================================
// PRODUCT HELPERS
// =============================================================

/**
 * Mengambil daftar produk dari tabel `products`.
 * @param {Object} options - filter opsional
 * @param {string} options.category - filter berdasarkan kategori
 * @param {string} options.search - pencarian berdasarkan nama produk
 * @param {boolean} options.flashSaleOnly - hanya produk flash sale
 * @param {number} options.limit - batas jumlah data
 */
export async function fetchProducts(options = {}) {
  let query = supabase.from('products').select('*');

  if (options.category) {
    query = query.eq('category', options.category);
  }
  if (options.search) {
    query = query.ilike('name', `%${options.search}%`);
  }
  if (options.flashSaleOnly) {
    query = query.eq('is_flash_sale', true);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('fetchProducts error:', error.message);
    return { success: false, data: [], message: error.message };
  }
  return { success: true, data };
}

/**
 * Mengambil satu produk berdasarkan ID.
 */
export async function fetchProductById(productId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true, data };
}

// =============================================================
// CART HELPERS
// =============================================================

/**
 * Menambahkan / memperbarui item di tabel `cart_items`.
 * Jika kombinasi user_id + product_id sudah ada, quantity akan ditambah (upsert).
 */
export async function addToCart(userId, productId, quantity = 1) {
  // Cek apakah item sudah ada di cart user
  const { data: existing, error: fetchErr } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (fetchErr) {
    return { success: false, message: fetchErr.message };
  }

  if (existing) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    return { success: true, data };
  } else {
    const { data, error } = await supabase
      .from('cart_items')
      .insert({ user_id: userId, product_id: productId, quantity })
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    return { success: true, data };
  }
}

/**
 * Mengambil semua item keranjang milik user, lengkap dengan detail produk (join).
 */
export async function fetchCartItems(userId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      product_id,
      products:product_id (
        id, name, price, image_url, stock
      )
    `)
    .eq('user_id', userId);

  if (error) {
    return { success: false, data: [], message: error.message };
  }
  return { success: true, data };
}

/**
 * Update quantity item cart tertentu.
 */
export async function updateCartItemQuantity(cartItemId, quantity) {
  if (quantity < 1) return removeCartItem(cartItemId);

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)
    .select()
    .single();

  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

/**
 * Hapus item dari cart.
 */
export async function removeCartItem(cartItemId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

/**
 * Kosongkan seluruh cart milik user (dipanggil setelah checkout selesai).
 */
export async function clearCart(userId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

// =============================================================
// REALTIME (opsional) - subscribe perubahan produk secara live
// =============================================================
export function subscribeToProducts(onChange) {
  const channel = supabase
    .channel('public:products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
      onChange(payload);
    })
    .subscribe();

  return channel;
}
