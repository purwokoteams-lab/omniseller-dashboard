// =============================================================
// app.js
// Frontend Logic, Router-lite, UI Interactions
// Menghubungkan supabase.js ke UI, plus fallback LocalStorage cart
// =============================================================
import {
  supabase,
  fetchProducts,
  loginUser,
  registerUser,
  logoutUser,
  getCurrentSession,
  onAuthStateChange,
  addToCart,
  fetchCartItems,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
} from './supabase.js';

// =============================================================
// SAMPLE / FALLBACK PRODUCTS
// Digunakan jika tabel `products` di Supabase kosong / belum diisi,
// supaya UI tetap bisa didemokan tanpa data live.
// =============================================================
const SAMPLE_PRODUCTS = [
  { id: 'p1', name: 'Kaos Polos Cotton Combed 30s Premium Unisex', price: 45000, old_price: 75000, image_url: 'https://picsum.photos/seed/tshirt1/400/400', rating: 4.8, sold: 1200, category: 'fashion-pria', is_flash_sale: true, stock: 50 },
  { id: 'p2', name: 'Sepatu Sneakers Sport Running Original', price: 189000, old_price: 350000, image_url: 'https://picsum.photos/seed/shoe1/400/400', rating: 4.9, sold: 850, category: 'sepatu', is_flash_sale: true, stock: 30 },
  { id: 'p3', name: 'Tas Selempang Wanita Kulit PU Fashion', price: 75000, old_price: 150000, image_url: 'https://picsum.photos/seed/bag1/400/400', rating: 4.7, sold: 2300, category: 'fashion-wanita', is_flash_sale: true, stock: 40 },
  { id: 'p4', name: 'Smartwatch Fitness Tracker Waterproof', price: 129000, old_price: 299000, image_url: 'https://picsum.photos/seed/watch1/400/400', rating: 4.6, sold: 670, category: 'elektronik', is_flash_sale: true, stock: 25 },
  { id: 'p5', name: 'Case Handphone Silikon Anti Crack', price: 15000, old_price: 30000, image_url: 'https://picsum.photos/seed/case1/400/400', rating: 4.9, sold: 5400, category: 'elektronik', is_flash_sale: true, stock: 100 },
  { id: 'p6', name: 'Headset Bluetooth TWS Wireless Earphone', price: 85000, old_price: 200000, image_url: 'https://picsum.photos/seed/headset1/400/400', rating: 4.5, sold: 3100, category: 'elektronik', is_flash_sale: false, stock: 60 },
  { id: 'p7', name: 'Blender Portable Mini USB Rechargeable', price: 65000, old_price: null, image_url: 'https://picsum.photos/seed/blender1/400/400', rating: 4.4, sold: 420, category: 'rumah-tangga', is_flash_sale: false, stock: 35 },
  { id: 'p8', name: 'Kemeja Flanel Pria Lengan Panjang Kotak', price: 55000, old_price: 110000, image_url: 'https://picsum.photos/seed/shirt1/400/400', rating: 4.6, sold: 980, category: 'fashion-pria', is_flash_sale: false, stock: 45 },
  { id: 'p9', name: 'Skincare Set Wajah Glowing Paket Lengkap', price: 99000, old_price: 180000, image_url: 'https://picsum.photos/seed/skincare1/400/400', rating: 4.8, sold: 2100, category: 'kecantikan', is_flash_sale: false, stock: 55 },
  { id: 'p10', name: 'Mainan Edukasi Anak Puzzle Kayu', price: 35000, old_price: 60000, image_url: 'https://picsum.photos/seed/toy1/400/400', rating: 4.7, sold: 340, category: 'mainan', is_flash_sale: false, stock: 70 },
  { id: 'p11', name: 'Power Bank 20000mAh Fast Charging', price: 145000, old_price: 250000, image_url: 'https://picsum.photos/seed/powerbank1/400/400', rating: 4.7, sold: 1560, category: 'elektronik', is_flash_sale: false, stock: 40 },
  { id: 'p12', name: 'Sandal Jepit Pria Wanita Anti Slip', price: 25000, old_price: 45000, image_url: 'https://picsum.photos/seed/sandal1/400/400', rating: 4.5, sold: 890, category: 'sepatu', is_flash_sale: false, stock: 90 },
  { id: 'p13', name: 'Rak Buku Minimalis Kayu 3 Susun', price: 175000, old_price: 300000, image_url: 'https://picsum.photos/seed/rack1/400/400', rating: 4.6, sold: 210, category: 'rumah-tangga', is_flash_sale: false, stock: 20 },
  { id: 'p14', name: 'Tumbler Botol Minum Stainless Steel 500ml', price: 45000, old_price: 80000, image_url: 'https://picsum.photos/seed/bottle1/400/400', rating: 4.8, sold: 1780, category: 'rumah-tangga', is_flash_sale: false, stock: 65 },
  { id: 'p15', name: 'Jaket Hoodie Unisex Bahan Fleece Tebal', price: 89000, old_price: 160000, image_url: 'https://picsum.photos/seed/hoodie1/400/400', rating: 4.9, sold: 1340, category: 'fashion-pria', is_flash_sale: false, stock: 38 }
];

const CATEGORIES = [
  { key: 'fashion-pria', label: 'Fashion Pria', icon: '👔' },
  { key: 'fashion-wanita', label: 'Fashion Wanita', icon: '👗' },
  { key: 'elektronik', label: 'Elektronik', icon: '📱' },
  { key: 'sepatu', label: 'Sepatu', icon: '👟' },
  { key: 'kecantikan', label: 'Kecantikan', icon: '💄' },
  { key: 'rumah-tangga', label: 'Rumah Tangga', icon: '🏠' },
  { key: 'mainan', label: 'Mainan & Hobi', icon: '🧸' },
  { key: 'olahraga', label: 'Olahraga', icon: '⚽' }
];

// =============================================================
// STATE
// =============================================================
const state = {
  products: [],
  currentUser: null,
  cart: [] // { product_id, quantity, product: {...} } — unified shape utk login & guest
};

const LOCAL_CART_KEY = 'shopee_clone_guest_cart';

// =============================================================
// UTILITIES
// =============================================================
function formatRupiah(number) {
  return 'Rp' + Number(number).toLocaleString('id-ID');
}

function formatSold(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'rb';
  return String(n);
}

function showToast(message, duration = 2200) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

function el(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

// =============================================================
// LOCAL CART (Guest fallback, dipakai jika user belum login)
// =============================================================
function getLocalCart() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLocalCart(cart) {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
}

function addToLocalCart(product, quantity = 1) {
  const cart = getLocalCart();
  const existing = cart.find(item => item.product_id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ product_id: product.id, quantity, product });
  }
  saveLocalCart(cart);
  return cart;
}

function updateLocalCartQuantity(productId, quantity) {
  let cart = getLocalCart();
  if (quantity < 1) {
    cart = cart.filter(item => item.product_id !== productId);
  } else {
    const item = cart.find(i => i.product_id === productId);
    if (item) item.quantity = quantity;
  }
  saveLocalCart(cart);
  return cart;
}

function removeFromLocalCart(productId) {
  const cart = getLocalCart().filter(item => item.product_id !== productId);
  saveLocalCart(cart);
  return cart;
}

// =============================================================
// CART: fungsi terpadu (otomatis pilih Supabase / LocalStorage)
// =============================================================
async function handleAddToCart(product, quantity = 1) {
  if (state.currentUser) {
    const result = await addToCart(state.currentUser.id, product.id, quantity);
    if (!result.success) {
      showToast('Gagal menambah ke keranjang: ' + result.message);
      return;
    }
  } else {
    addToLocalCart(product, quantity);
  }
  await refreshCartState();
  showToast('✅ Produk ditambahkan ke keranjang');
  updateCartBadge();
}

async function refreshCartState() {
  if (state.currentUser) {
    const result = await fetchCartItems(state.currentUser.id);
    if (result.success) {
      state.cart = result.data.map(item => ({
        cart_item_id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.products
      }));
    }
  } else {
    state.cart = getLocalCart().map(item => ({
      cart_item_id: null,
      product_id: item.product_id,
      quantity: item.quantity,
      product: item.product
    }));
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const totalQty = state.cart.reduce((sum, i) => sum + i.quantity, 0);
  badge.textContent = totalQty > 99 ? '99+' : totalQty;
  badge.classList.toggle('hidden', totalQty === 0);
}

// =============================================================
// PRODUCT RENDERING
// =============================================================
function renderProductCard(product) {
  const discount = product.old_price
    ? Math.round(100 - (product.price / product.old_price) * 100)
    : null;

  const card = el(`
    <div class="product-card" data-id="${product.id}">
      <div class="product-image">
        <button class="wishlist-btn" type="button" aria-label="Tambah ke wishlist">♥</button>
        <img src="${product.image_url}" alt="${escapeHtml(product.name)}" loading="lazy" />
        ${discount ? `<span class="discount-badge">-${discount}%</span>` : ''}
      </div>
      <div class="product-info">
        ${(product.rating ?? 5) >= 4.8 ? '<span class="badge-official">✓ Toko Resmi</span>' : ''}
        <div class="product-title">${escapeHtml(product.name)}</div>
        <div class="product-price">
          ${formatRupiah(product.price)}
          ${product.old_price ? `<span class="product-price-old">${formatRupiah(product.old_price)}</span>` : ''}
        </div>
        <div class="product-meta">
          <span class="product-rating">★ ${product.rating ?? '5.0'}</span>
          <span>Terjual ${formatSold(product.sold ?? 0)}</span>
        </div>
      </div>
      <button class="add-cart-btn" type="button">
        🛒 Tambah ke Keranjang
      </button>
    </div>
  `);

  card.querySelector('.wishlist-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    btn.classList.toggle('active');
    btn.style.background = btn.classList.contains('active') ? 'var(--secondary)' : '';
    btn.style.color = btn.classList.contains('active') ? '#fff' : '';
  });

  card.querySelector('.add-cart-btn').addEventListener('click', async (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    btn.disabled = true;
    await handleAddToCart(product, 1);
    btn.classList.add('added');
    btn.textContent = '✓ Ditambahkan';
    setTimeout(() => {
      btn.classList.remove('added');
      btn.innerHTML = '🛒 Tambah ke Keranjang';
      btn.disabled = false;
    }, 1200);
  });

  return card;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderProductGrid(containerId, products) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (products.length === 0) {
    container.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-gray);padding:30px 0;">Produk tidak ditemukan.</p>`;
    return;
  }
  const fragment = document.createDocumentFragment();
  products.forEach(p => fragment.appendChild(renderProductCard(p)));
  container.appendChild(fragment);
}

function renderCategoryGrid() {
  const container = document.getElementById('categoryGrid');
  if (!container) return;
  container.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const item = el(`
      <a class="category-item" href="#" data-category="${cat.key}">
        <div class="category-icon">${cat.icon}</div>
        <span>${cat.label}</span>
      </a>
    `);
    item.addEventListener('click', (e) => {
      e.preventDefault();
      filterByCategory(cat.key);
    });
    container.appendChild(item);
  });
}

function filterByCategory(categoryKey) {
  const filtered = state.products.filter(p => p.category === categoryKey);
  renderProductGrid('productGrid', filtered);
  document.getElementById('productGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =============================================================
// SEARCH
// =============================================================
function initSearch() {
  const form = document.getElementById('searchForm');
  const input = document.getElementById('searchInput');
  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const keyword = input.value.trim().toLowerCase();
    if (!keyword) {
      renderProductGrid('productGrid', state.products);
      return;
    }
    const filtered = state.products.filter(p =>
      p.name.toLowerCase().includes(keyword)
    );
    renderProductGrid('productGrid', filtered);
    document.getElementById('productGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Live search saat mengetik (debounced)
  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const keyword = input.value.trim().toLowerCase();
      const filtered = keyword
        ? state.products.filter(p => p.name.toLowerCase().includes(keyword))
        : state.products;
      renderProductGrid('productGrid', filtered);
    }, 300);
  });
}

// =============================================================
// CAROUSEL / BANNER SLIDER
// =============================================================
function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const dotsWrap = document.getElementById('carouselDots');
  if (!track || !dotsWrap) return;

  const slides = track.children.length;
  let current = 0;
  let autoTimer;

  dotsWrap.innerHTML = '';
  for (let i = 0; i < slides; i++) {
    const dot = el(`<span data-index="${i}"></span>`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  }

  function updateDots() {
    [...dotsWrap.children].forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
    });
  }

  function goTo(index) {
    current = (index + slides) % slides;
    track.style.transform = `translateX(-${current * 100}%)`;
    updateDots();
    resetAutoPlay();
  }

  function resetAutoPlay() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 4000);
  }

  document.getElementById('carouselPrev')?.addEventListener('click', () => goTo(current - 1));
  document.getElementById('carouselNext')?.addEventListener('click', () => goTo(current + 1));

  updateDots();
  resetAutoPlay();
}

// =============================================================
// FLASH SALE COUNTDOWN
// =============================================================
function initFlashSaleCountdown() {
  const hoursEl = document.getElementById('cdHours');
  const minsEl = document.getElementById('cdMinutes');
  const secsEl = document.getElementById('cdSeconds');
  if (!hoursEl || !minsEl || !secsEl) return;

  // Target: akhir hari ini (contoh sederhana untuk demo flash sale)
  function getTarget() {
    const target = new Date();
    target.setHours(23, 59, 59, 999);
    return target;
  }

  let targetTime = getTarget();

  function tick() {
    const now = new Date();
    let diff = Math.max(0, targetTime - now);

    if (diff <= 0) {
      targetTime = getTarget();
      targetTime.setDate(targetTime.getDate() + 1);
      diff = targetTime - now;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    hoursEl.textContent = String(h).padStart(2, '0');
    minsEl.textContent = String(m).padStart(2, '0');
    secsEl.textContent = String(s).padStart(2, '0');
  }

  tick();
  setInterval(tick, 1000);
}

// =============================================================
// AUTH MODAL (Login / Register)
// =============================================================
function initAuthModal() {
  const overlay = document.getElementById('authModalOverlay');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const closeBtn = document.getElementById('authModalClose');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const switchToRegister = document.getElementById('switchToRegister');
  const switchToLogin = document.getElementById('switchToLogin');
  const modalTitle = document.getElementById('authModalTitle');
  const msgBox = document.getElementById('authModalMsg');

  function openModal(mode = 'login') {
    overlay.classList.remove('hidden');
    setMode(mode);
    msgBox.textContent = '';
    msgBox.className = 'modal-msg';
  }
  function closeModal() {
    overlay.classList.add('hidden');
  }
  const loginSwitchText = document.getElementById('loginSwitchText');
  const registerSwitchText = document.getElementById('registerSwitchText');

  function setMode(mode) {
    if (mode === 'login') {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      loginSwitchText?.classList.remove('hidden');
      registerSwitchText?.classList.add('hidden');
      modalTitle.textContent = 'Masuk ke ShopeeClone';
    } else {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      loginSwitchText?.classList.add('hidden');
      registerSwitchText?.classList.remove('hidden');
      modalTitle.textContent = 'Daftar Akun Baru';
    }
  }

  loginBtn?.addEventListener('click', () => openModal('login'));
  registerBtn?.addEventListener('click', () => openModal('register'));
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  switchToRegister?.addEventListener('click', () => setMode('register'));
  switchToLogin?.addEventListener('click', () => setMode('login'));

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    msgBox.textContent = 'Memproses...';
    msgBox.className = 'modal-msg';

    const result = await loginUser(email, password);
    if (!result.success) {
      msgBox.textContent = result.message;
      msgBox.className = 'modal-msg error';
      return;
    }
    msgBox.textContent = 'Login berhasil!';
    msgBox.className = 'modal-msg success';
    setTimeout(() => { closeModal(); location.reload(); }, 700);
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    msgBox.textContent = 'Memproses...';
    msgBox.className = 'modal-msg';

    const result = await registerUser(email, password, name);
    if (!result.success) {
      msgBox.textContent = result.message;
      msgBox.className = 'modal-msg error';
      return;
    }
    msgBox.textContent = 'Registrasi berhasil! Silakan cek email untuk verifikasi (jika diaktifkan).';
    msgBox.className = 'modal-msg success';
    setTimeout(() => setMode('login'), 1500);
  });
}

// =============================================================
// AUTH STATE / HEADER USER CHIP
// =============================================================
async function initAuthState() {
  const session = await getCurrentSession();
  state.currentUser = session?.user ?? null;
  renderAuthUI();

  onAuthStateChange((_event, session) => {
    state.currentUser = session?.user ?? null;
    renderAuthUI();
    refreshCartState().then(updateCartBadge);
  });
}

function renderAuthUI() {
  const authLinks = document.getElementById('authLinks');
  const userChip = document.getElementById('userChip');
  const userEmailLabel = document.getElementById('userEmailLabel');
  if (!authLinks || !userChip) return;

  if (state.currentUser) {
    authLinks.classList.add('hidden');
    userChip.classList.remove('hidden');
    userEmailLabel.textContent = state.currentUser.email?.split('@')[0] ?? 'Akun';
  } else {
    authLinks.classList.remove('hidden');
    userChip.classList.add('hidden');
  }
}

function initLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await logoutUser();
    location.reload();
  });
}

// =============================================================
// LOAD PRODUCTS (Supabase → fallback ke SAMPLE_PRODUCTS)
// =============================================================
async function loadProducts() {
  const result = await fetchProducts();
  if (result.success && result.data.length > 0) {
    state.products = result.data;
  } else {
    state.products = SAMPLE_PRODUCTS;
    console.info('Menggunakan data produk contoh (SAMPLE_PRODUCTS) karena tabel Supabase kosong / belum terhubung.');
  }

  renderProductGrid('productGrid', state.products);

  const flashSaleProducts = state.products.filter(p => p.is_flash_sale);
  renderProductGrid('flashSaleGrid', flashSaleProducts.length ? flashSaleProducts : state.products.slice(0, 5));
}

// =============================================================
// INIT (Homepage)
// =============================================================
async function initHomepage() {
  renderCategoryGrid();
  initCarousel();
  initFlashSaleCountdown();
  initSearch();
  initAuthModal();
  initLogout();

  await initAuthState();
  await loadProducts();
  await refreshCartState();
  updateCartBadge();
}

// Jalankan hanya jika berada di index.html (ada elemen productGrid)
if (document.getElementById('productGrid')) {
  initHomepage();
}

// =============================================================
// CHECKOUT PAGE LOGIC
// =============================================================
async function initCheckoutPage() {
  initAuthModal();
  initLogout();
  await initAuthState();
  await refreshCartState();
  updateCartBadge();
  renderCheckoutCart();
}

function renderCheckoutCart() {
  const listEl = document.getElementById('cartItemsList');
  const emptyEl = document.getElementById('emptyCartState');
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryTotal = document.getElementById('summaryTotal');
  const summaryCount = document.getElementById('summaryCount');
  if (!listEl) return;

  listEl.innerHTML = '';

  if (state.cart.length === 0) {
    emptyEl?.classList.remove('hidden');
    document.getElementById('cartTableWrap')?.classList.add('hidden');
    document.getElementById('checkoutSummaryBox')?.classList.add('hidden');
    return;
  }

  emptyEl?.classList.add('hidden');
  document.getElementById('cartTableWrap')?.classList.remove('hidden');
  document.getElementById('checkoutSummaryBox')?.classList.remove('hidden');

  let subtotal = 0;
  let totalQty = 0;

  state.cart.forEach(item => {
    const product = item.product;
    if (!product) return;
    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;
    totalQty += item.quantity;

    const row = el(`
      <div class="cart-item-row" data-product-id="${item.product_id}">
        <div class="cart-item-product">
          <img src="${product.image_url}" alt="${escapeHtml(product.name)}" />
          <div class="cart-item-name">${escapeHtml(product.name)}</div>
        </div>
        <div class="cart-price">${formatRupiah(product.price)}</div>
        <div class="qty-control">
          <button type="button" class="qty-minus">−</button>
          <input type="text" value="${item.quantity}" readonly />
          <button type="button" class="qty-plus">+</button>
        </div>
        <div class="cart-price line-total">${formatRupiah(lineTotal)}</div>
        <button type="button" class="remove-item-btn" title="Hapus">✕</button>
      </div>
    `);

    row.querySelector('.qty-plus').addEventListener('click', () => changeQuantity(item, item.quantity + 1));
    row.querySelector('.qty-minus').addEventListener('click', () => changeQuantity(item, item.quantity - 1));
    row.querySelector('.remove-item-btn').addEventListener('click', () => changeQuantity(item, 0));

    listEl.appendChild(row);
  });

  if (summarySubtotal) summarySubtotal.textContent = formatRupiah(subtotal);
  if (summaryTotal) summaryTotal.textContent = formatRupiah(subtotal);
  if (summaryCount) summaryCount.textContent = totalQty;
}

async function changeQuantity(item, newQty) {
  if (state.currentUser && item.cart_item_id) {
    if (newQty < 1) {
      await removeCartItem(item.cart_item_id);
    } else {
      await updateCartItemQuantity(item.cart_item_id, newQty);
    }
  } else {
    if (newQty < 1) {
      removeFromLocalCart(item.product_id);
    } else {
      updateLocalCartQuantity(item.product_id, newQty);
    }
  }
  await refreshCartState();
  updateCartBadge();
  renderCheckoutCart();
}

function initCheckoutButton() {
  document.getElementById('checkoutBtn')?.addEventListener('click', async () => {
    if (!state.currentUser) {
      showToast('Silakan login terlebih dahulu untuk checkout.');
      document.getElementById('loginBtn')?.click();
      return;
    }
    if (state.cart.length === 0) return;

    // Simulasi proses checkout (bisa dihubungkan ke tabel `orders` jika diperlukan)
    showToast('🎉 Pesanan berhasil dibuat! Terima kasih telah berbelanja.');
    await clearCart(state.currentUser.id);
    await refreshCartState();
    updateCartBadge();
    renderCheckoutCart();
  });
}

// Jalankan hanya jika berada di checkout.html
if (document.getElementById('cartItemsList')) {
  initCheckoutPage().then(initCheckoutButton);
}
