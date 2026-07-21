// =============================================================
// app.js — Lumina Store (Single-Vendor D2C Brand Store)
// Frontend logic: state management, product rendering, quick view,
// slide-over cart drawer, search, dan sinkronisasi Supabase/LocalStorage.
// =============================================================
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentSession,
  onAuthStateChange,
  fetchProducts,
  addToCart,
  fetchCartItems,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
} from './supabase.js';

// =============================================================
// BRAND CONFIG
// =============================================================
const BRAND_NAME = 'Lumina Store';
const WHATSAPP_NUMBER = '6281234567890'; // Ganti dengan nomor WhatsApp toko Anda
const LOCAL_CART_KEY = 'lumina_store_guest_cart';

// =============================================================
// KATALOG PRODUK (single brand, kategori fokus & terstruktur)
// Dipakai sebagai fallback jika tabel `products` di Supabase kosong.
// =============================================================
const SAMPLE_PRODUCTS = [
  { id: 'p1', name: 'Kemeja Linen Oversized Premium', price: 259000, old_price: 349000, image_url: 'https://picsum.photos/seed/linen1/600/600', gallery: ['https://picsum.photos/seed/linen1/600/600','https://picsum.photos/seed/linen1b/600/600','https://picsum.photos/seed/linen1c/600/600'], rating: 4.8, category: 'pakaian', sizes: ['S','M','L','XL'], description: 'Kemeja linen premium dengan potongan oversized yang nyaman dipakai sepanjang hari. Bahan adem dan breathable, cocok untuk gaya kasual maupun semi-formal.' },
  { id: 'p2', name: 'Celana Chino Slim Fit', price: 229000, old_price: null, image_url: 'https://picsum.photos/seed/chino1/600/600', gallery: ['https://picsum.photos/seed/chino1/600/600','https://picsum.photos/seed/chino1b/600/600'], rating: 4.7, category: 'pakaian', sizes: ['29','30','32','34'], description: 'Celana chino slim fit dengan bahan stretch yang fleksibel mengikuti gerak tubuh. Desain minimalis, mudah dipadukan.' },
  { id: 'p3', name: 'Kaos Basic Heavyweight Cotton', price: 129000, old_price: 169000, image_url: 'https://picsum.photos/seed/tee1/600/600', gallery: ['https://picsum.photos/seed/tee1/600/600','https://picsum.photos/seed/tee1b/600/600'], rating: 4.9, category: 'pakaian', sizes: ['S','M','L','XL'], description: 'Kaos basic dengan bahan heavyweight cotton 240gsm, tebal namun tetap adem. Jahitan rapi dan tahan lama.' },
  { id: 'p4', name: 'Jaket Bomber Water Resistant', price: 459000, old_price: 599000, image_url: 'https://picsum.photos/seed/bomber1/600/600', gallery: ['https://picsum.photos/seed/bomber1/600/600','https://picsum.photos/seed/bomber1b/600/600'], rating: 4.8, category: 'pakaian', sizes: ['M','L','XL'], description: 'Jaket bomber dengan lapisan water resistant, ideal untuk cuaca tak menentu. Detail ritsleting premium dan lapisan dalam yang hangat.' },
  { id: 'p5', name: 'Tas Tote Kanvas Premium', price: 189000, old_price: null, image_url: 'https://picsum.photos/seed/tote1/600/600', gallery: ['https://picsum.photos/seed/tote1/600/600','https://picsum.photos/seed/tote1b/600/600'], rating: 4.6, category: 'tas', sizes: null, description: 'Tas tote kanvas tebal dengan kapasitas besar, cocok untuk kebutuhan harian maupun kerja. Tali bahu kokoh dan nyaman digenggam.' },
  { id: 'p6', name: 'Tas Selempang Kulit Sintetis', price: 249000, old_price: 319000, image_url: 'https://picsum.photos/seed/sling1/600/600', gallery: ['https://picsum.photos/seed/sling1/600/600','https://picsum.photos/seed/sling1b/600/600'], rating: 4.7, category: 'tas', sizes: null, description: 'Tas selempang berbahan kulit sintetis premium, desain minimalis dengan banyak kompartemen untuk menyimpan barang.' },
  { id: 'p7', name: 'Sneakers Low Top Minimalist', price: 379000, old_price: 499000, image_url: 'https://picsum.photos/seed/sneaker1/600/600', gallery: ['https://picsum.photos/seed/sneaker1/600/600','https://picsum.photos/seed/sneaker1b/600/600'], rating: 4.9, category: 'sepatu', sizes: ['39','40','41','42','43','44'], description: 'Sneakers low top dengan desain minimalis serba guna. Sol empuk dengan grip yang baik untuk pemakaian harian.' },
  { id: 'p8', name: 'Sandal Slide Comfort', price: 149000, old_price: null, image_url: 'https://picsum.photos/seed/sandal1/600/600', gallery: ['https://picsum.photos/seed/sandal1/600/600','https://picsum.photos/seed/sandal1b/600/600'], rating: 4.5, category: 'sepatu', sizes: ['39','40','41','42','43','44'], description: 'Sandal slide dengan busa memori yang empuk, ringan dipakai untuk santai maupun bepergian jarak dekat.' },
  { id: 'p9', name: 'Dompet Kulit Bifold', price: 159000, old_price: 199000, image_url: 'https://picsum.photos/seed/wallet1/600/600', gallery: ['https://picsum.photos/seed/wallet1/600/600','https://picsum.photos/seed/wallet1b/600/600'], rating: 4.8, category: 'aksesoris', sizes: null, description: 'Dompet bifold berbahan kulit asli dengan slot kartu yang luas dan jahitan presisi. Ringkas dan elegan.' },
  { id: 'p10', name: 'Ikat Pinggang Kulit Asli', price: 129000, old_price: null, image_url: 'https://picsum.photos/seed/belt1/600/600', gallery: ['https://picsum.photos/seed/belt1/600/600','https://picsum.photos/seed/belt1b/600/600'], rating: 4.6, category: 'aksesoris', sizes: null, description: 'Ikat pinggang kulit asli dengan gesper metal anti karat. Cocok untuk gaya kasual maupun formal.' }
];

const CATEGORIES = [
  { key: 'all', label: 'Semua' },
  { key: 'pakaian', label: 'Pakaian' },
  { key: 'tas', label: 'Tas' },
  { key: 'sepatu', label: 'Sepatu' },
  { key: 'aksesoris', label: 'Aksesoris' }
];

const TESTIMONIALS = [
  { name: 'Andra Wijaya', location: 'Jakarta', rating: 5, text: 'Kualitas bahan jauh di atas ekspektasi untuk harga segini. Pengiriman juga cepat, packaging rapi.' },
  { name: 'Salsabila R.', location: 'Bandung', rating: 5, text: 'Sudah langganan beli di sini, size chart-nya akurat dan customer service-nya responsif banget di WhatsApp.' },
  { name: 'Rizky Pratama', location: 'Surabaya', rating: 4, text: 'Desainnya simple tapi terlihat premium. Bahan kemejanya adem, cocok dipakai di cuaca panas.' }
];

// =============================================================
// STATE MANAGEMENT (terpusat & rapi)
// =============================================================
const state = {
  products: [],
  cart: [],
  activeCategory: 'all',
  searchKeyword: '',
  currentUser: null,
  quickViewProduct: null,
  quickViewSelectedSize: null,
  quickViewQty: 1,
  quickViewActiveImage: 0
};

// =============================================================
// UTILITIES
// =============================================================
function formatRupiah(number) {
  return 'Rp' + Number(number).toLocaleString('id-ID');
}

function el(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
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

function renderStars(rating) {
  const rounded = Math.round(rating);
  return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
}

// =============================================================
// LOCAL CART (fallback untuk guest / belum login)
// =============================================================
function getLocalCart() {
  try { return JSON.parse(localStorage.getItem(LOCAL_CART_KEY)) || []; }
  catch { return []; }
}
function saveLocalCart(cart) {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
}
function addToLocalCart(product, quantity, variant) {
  const cart = getLocalCart();
  const existing = cart.find(i => i.product_id === product.id && i.variant === variant);
  if (existing) existing.quantity += quantity;
  else cart.push({ product_id: product.id, quantity, variant: variant || null, product });
  saveLocalCart(cart);
}
function updateLocalCartQuantity(productId, variant, quantity) {
  let cart = getLocalCart();
  if (quantity < 1) {
    cart = cart.filter(i => !(i.product_id === productId && i.variant === variant));
  } else {
    const item = cart.find(i => i.product_id === productId && i.variant === variant);
    if (item) item.quantity = quantity;
  }
  saveLocalCart(cart);
}
function removeFromLocalCart(productId, variant) {
  saveLocalCart(getLocalCart().filter(i => !(i.product_id === productId && i.variant === variant)));
}

// =============================================================
// CART TERPADU (Supabase jika login, LocalStorage jika guest)
// Sinkron tanpa reload halaman.
// =============================================================
async function handleAddToCart(product, quantity = 1, variant = null) {
  if (state.currentUser) {
    const result = await addToCart(state.currentUser.id, product.id, quantity);
    if (!result.success) {
      showToast('Gagal menambah ke keranjang: ' + result.message);
      return;
    }
  } else {
    addToLocalCart(product, quantity, variant);
  }
  await refreshCartState();
  updateCartUI();
  openCartDrawer();
}

async function refreshCartState() {
  if (state.currentUser) {
    const result = await fetchCartItems(state.currentUser.id);
    if (result.success) {
      state.cart = result.data.map(item => ({
        cart_item_id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        variant: null,
        product: item.products
      }));
    }
  } else {
    state.cart = getLocalCart().map(item => ({
      cart_item_id: null,
      product_id: item.product_id,
      quantity: item.quantity,
      variant: item.variant,
      product: item.product
    }));
  }
}

async function changeCartQuantity(item, newQty) {
  if (state.currentUser && item.cart_item_id) {
    if (newQty < 1) await removeCartItem(item.cart_item_id);
    else await updateCartItemQuantity(item.cart_item_id, newQty);
  } else {
    if (newQty < 1) removeFromLocalCart(item.product_id, item.variant);
    else updateLocalCartQuantity(item.product_id, item.variant, newQty);
  }
  await refreshCartState();
  updateCartUI();
}

function updateCartUI() {
  updateCartBadge();
  renderCartDrawer();
  renderCheckoutCart(); // no-op jika bukan di halaman checkout
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const totalQty = state.cart.reduce((sum, i) => sum + i.quantity, 0);
  badge.textContent = totalQty > 99 ? '99+' : totalQty;
  badge.classList.toggle('hidden', totalQty === 0);
}

function cartSubtotal() {
  return state.cart.reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0);
}

// =============================================================
// PRODUCT RENDERING
// =============================================================
function renderProductCard(product) {
  const card = el(`
    <div class="product-card" data-id="${product.id}">
      <div class="product-image">
        <button class="wishlist-btn" type="button" aria-label="Wishlist">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
        </button>
        <img src="${product.image_url}" alt="${escapeHtml(product.name)}" loading="lazy" />
        <div class="quickview-trigger">Lihat Detail</div>
      </div>
      <div class="product-info">
        <div class="product-title">${escapeHtml(product.name)}</div>
        <div class="product-rating"><span class="stars">${renderStars(product.rating ?? 5)}</span> ${product.rating ?? '5.0'}</div>
        <div class="product-price-row">
          <span class="product-price">${formatRupiah(product.price)}</span>
          ${product.old_price ? `<span class="product-price-old">${formatRupiah(product.old_price)}</span>` : ''}
        </div>
      </div>
      <button class="add-cart-btn" type="button">Tambah ke Keranjang</button>
    </div>
  `);

  card.addEventListener('click', () => openQuickView(product));

  card.querySelector('.wishlist-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    e.currentTarget.classList.toggle('active');
  });

  card.querySelector('.add-cart-btn').addEventListener('click', async (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    btn.disabled = true;
    await handleAddToCart(product, 1, product.sizes ? product.sizes[0] : null);
    btn.classList.add('added');
    btn.textContent = '✓ Ditambahkan';
    setTimeout(() => {
      btn.classList.remove('added');
      btn.textContent = 'Tambah ke Keranjang';
      btn.disabled = false;
    }, 1000);
  });

  return card;
}

function getFilteredProducts() {
  return state.products.filter(p => {
    const matchCategory = state.activeCategory === 'all' || p.category === state.activeCategory;
    const matchSearch = !state.searchKeyword || p.name.toLowerCase().includes(state.searchKeyword.toLowerCase());
    return matchCategory && matchSearch;
  });
}

function renderProductGrid() {
  const container = document.getElementById('productGrid');
  if (!container) return;
  const products = getFilteredProducts();
  container.innerHTML = '';
  if (products.length === 0) {
    container.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-gray);padding:40px 0;">Produk tidak ditemukan.</p>`;
    return;
  }
  const fragment = document.createDocumentFragment();
  products.forEach(p => fragment.appendChild(renderProductCard(p)));
  container.appendChild(fragment);
}

function renderCategoryPills() {
  const container = document.getElementById('categoryPills');
  if (!container) return;
  container.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const pill = el(`<button type="button" class="category-pill ${cat.key === state.activeCategory ? 'active' : ''}">${cat.label}</button>`);
    pill.addEventListener('click', () => {
      state.activeCategory = cat.key;
      renderCategoryPills();
      renderProductGrid();
    });
    container.appendChild(pill);
  });
}

function renderTestimonials() {
  const container = document.getElementById('testimonialGrid');
  if (!container) return;
  container.innerHTML = '';
  TESTIMONIALS.forEach(t => {
    const initials = t.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    container.appendChild(el(`
      <div class="testimonial-card">
        <div class="testimonial-stars">${renderStars(t.rating)}</div>
        <p class="testimonial-text">"${escapeHtml(t.text)}"</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">${initials}</div>
          <div>
            <div class="testimonial-name">${escapeHtml(t.name)}</div>
            <div class="testimonial-loc">${escapeHtml(t.location)}</div>
          </div>
        </div>
      </div>
    `));
  });
}

// =============================================================
// SEARCH
// =============================================================
function initSearch() {
  document.querySelectorAll('[data-search-form]').forEach(form => {
    const input = form.querySelector('input');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      state.searchKeyword = input.value.trim();
      renderProductGrid();
      document.getElementById('productGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.searchKeyword = input.value.trim();
        renderProductGrid();
      }, 300);
    });
  });
}

// =============================================================
// MOBILE NAV TOGGLE
// =============================================================
function initMobileNav() {
  const hamburger = document.getElementById('hamburgerBtn');
  const panel = document.getElementById('mobileNavPanel');
  hamburger?.addEventListener('click', () => panel?.classList.toggle('open'));
}

// =============================================================
// QUICK VIEW MODAL
// =============================================================
function openQuickView(product) {
  state.quickViewProduct = product;
  state.quickViewSelectedSize = product.sizes ? product.sizes[0] : null;
  state.quickViewQty = 1;
  state.quickViewActiveImage = 0;
  renderQuickView();
  document.getElementById('quickViewOverlay')?.classList.remove('hidden');
}

function closeQuickView() {
  document.getElementById('quickViewOverlay')?.classList.add('hidden');
}

function renderQuickView() {
  const product = state.quickViewProduct;
  const container = document.getElementById('quickViewContent');
  if (!product || !container) return;

  const gallery = product.gallery && product.gallery.length ? product.gallery : [product.image_url];

  container.innerHTML = `
    <div class="quickview-grid">
      <div class="quickview-gallery">
        <div class="quickview-main-image">
          <img id="qvMainImage" src="${gallery[state.quickViewActiveImage]}" alt="${escapeHtml(product.name)}" />
        </div>
        <div class="quickview-thumbs" id="qvThumbs">
          ${gallery.map((src, i) => `<button type="button" data-index="${i}" class="${i === state.quickViewActiveImage ? 'active' : ''}"><img src="${src}" alt="thumb ${i+1}" /></button>`).join('')}
        </div>
      </div>
      <div class="quickview-details">
        <h2>${escapeHtml(product.name)}</h2>
        <div class="product-rating"><span class="stars">${renderStars(product.rating ?? 5)}</span> ${product.rating ?? '5.0'}</div>
        <div class="quickview-price-row">
          <span class="quickview-price">${formatRupiah(product.price)}</span>
          ${product.old_price ? `<span class="product-price-old">${formatRupiah(product.old_price)}</span>` : ''}
        </div>
        <p class="quickview-desc">${escapeHtml(product.description || '')}</p>

        ${product.sizes ? `
        <div class="option-group">
          <label class="option-label">Pilih Ukuran</label>
          <div class="size-options" id="qvSizeOptions">
            ${product.sizes.map(sz => `<button type="button" class="size-chip ${sz === state.quickViewSelectedSize ? 'active' : ''}" data-size="${sz}">${sz}</button>`).join('')}
          </div>
        </div>` : ''}

        <div class="option-group">
          <label class="option-label">Jumlah</label>
          <div class="qty-stepper">
            <button type="button" id="qvQtyMinus">−</button>
            <input type="text" id="qvQtyInput" value="${state.quickViewQty}" readonly />
            <button type="button" id="qvQtyPlus">+</button>
          </div>
        </div>

        <div class="quickview-actions">
          <button class="btn btn-primary" id="qvAddToCart" type="button">Tambah ke Keranjang</button>
          <a class="btn btn-whatsapp" id="qvBuyWhatsapp" href="#" target="_blank" rel="noopener">Beli via WhatsApp</a>
        </div>
      </div>
    </div>
  `;

  // Thumbnail switch
  container.querySelectorAll('#qvThumbs button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.quickViewActiveImage = Number(btn.dataset.index);
      renderQuickView();
    });
  });

  // Size select
  container.querySelectorAll('#qvSizeOptions .size-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      state.quickViewSelectedSize = btn.dataset.size;
      renderQuickView();
    });
  });

  // Qty stepper
  document.getElementById('qvQtyMinus')?.addEventListener('click', () => {
    state.quickViewQty = Math.max(1, state.quickViewQty - 1);
    renderQuickView();
  });
  document.getElementById('qvQtyPlus')?.addEventListener('click', () => {
    state.quickViewQty += 1;
    renderQuickView();
  });

  // Add to cart
  document.getElementById('qvAddToCart')?.addEventListener('click', async () => {
    await handleAddToCart(product, state.quickViewQty, state.quickViewSelectedSize);
    closeQuickView();
  });

  // Buy via WhatsApp (langsung, tanpa keranjang)
  const waLink = document.getElementById('qvBuyWhatsapp');
  if (waLink) {
    const variantText = state.quickViewSelectedSize ? ` (Ukuran: ${state.quickViewSelectedSize})` : '';
    const message = `Halo ${BRAND_NAME}, saya ingin memesan:\n\n${product.name}${variantText}\nJumlah: ${state.quickViewQty}\nHarga: ${formatRupiah(product.price)}\n\nMohon info ketersediaan & cara pembayarannya. Terima kasih!`;
    waLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }
}

function initQuickViewModal() {
  document.getElementById('quickViewClose')?.addEventListener('click', closeQuickView);
  document.getElementById('quickViewOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'quickViewOverlay') closeQuickView();
  });
}

// =============================================================
// CART DRAWER (SLIDE-OVER)
// =============================================================
function openCartDrawer() {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('drawerOverlay')?.classList.add('open');
}
function closeCartDrawer() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('drawerOverlay')?.classList.remove('open');
}

function initCartDrawer() {
  document.getElementById('cartTriggerBtn')?.addEventListener('click', openCartDrawer);
  document.getElementById('drawerCloseBtn')?.addEventListener('click', closeCartDrawer);
  document.getElementById('drawerOverlay')?.addEventListener('click', closeCartDrawer);
}

function renderCartDrawer() {
  const body = document.getElementById('drawerBody');
  const footer = document.getElementById('drawerFooter');
  if (!body) return;

  body.innerHTML = '';

  if (state.cart.length === 0) {
    body.innerHTML = `
      <div class="drawer-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        <p>Keranjang belanja masih kosong.</p>
      </div>`;
    footer?.classList.add('hidden');
    return;
  }

  footer?.classList.remove('hidden');

  state.cart.forEach(item => {
    const product = item.product;
    if (!product) return;
    const row = el(`
      <div class="drawer-item" data-product-id="${item.product_id}">
        <img src="${product.image_url}" alt="${escapeHtml(product.name)}" />
        <div class="drawer-item-info">
          <div class="drawer-item-name">${escapeHtml(product.name)}</div>
          ${item.variant ? `<div class="drawer-item-variant">Ukuran: ${item.variant}</div>` : ''}
          <div class="drawer-item-bottom">
            <div class="drawer-qty">
              <button type="button" class="qty-minus">−</button>
              <span>${item.quantity}</span>
              <button type="button" class="qty-plus">+</button>
            </div>
            <span class="drawer-item-price">${formatRupiah(product.price * item.quantity)}</span>
          </div>
        </div>
        <button type="button" class="drawer-remove" title="Hapus">✕</button>
      </div>
    `);
    row.querySelector('.qty-plus').addEventListener('click', () => changeCartQuantity(item, item.quantity + 1));
    row.querySelector('.qty-minus').addEventListener('click', () => changeCartQuantity(item, item.quantity - 1));
    row.querySelector('.drawer-remove').addEventListener('click', () => changeCartQuantity(item, 0));
    body.appendChild(row);
  });

  const subtotalEl = document.getElementById('drawerSubtotal');
  if (subtotalEl) subtotalEl.textContent = formatRupiah(cartSubtotal());

  const waBtn = document.getElementById('drawerWhatsappBtn');
  if (waBtn) {
    const lines = state.cart.map(i => `- ${i.product.name}${i.variant ? ` (${i.variant})` : ''} x${i.quantity} = ${formatRupiah(i.product.price * i.quantity)}`).join('\n');
    const message = `Halo ${BRAND_NAME}, saya ingin memesan:\n\n${lines}\n\nTotal: ${formatRupiah(cartSubtotal())}\n\nMohon info cara pembayaran & pengirimannya. Terima kasih!`;
    waBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }
}

// =============================================================
// AUTH MODAL (Login / Register) — sinkron tanpa reload
// =============================================================
function initAuthModal() {
  const overlay = document.getElementById('authModalOverlay');
  const loginBtn = document.getElementById('loginBtn');
  const closeBtn = document.getElementById('authModalClose');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const switchToRegister = document.getElementById('switchToRegister');
  const switchToLogin = document.getElementById('switchToLogin');
  const modalTitle = document.getElementById('authModalTitle');
  const msgBox = document.getElementById('authModalMsg');
  const loginSwitchText = document.getElementById('loginSwitchText');
  const registerSwitchText = document.getElementById('registerSwitchText');

  function openModal(mode = 'login') {
    overlay.classList.remove('hidden');
    setMode(mode);
    msgBox.textContent = '';
    msgBox.className = 'modal-msg';
  }
  function closeModal() { overlay.classList.add('hidden'); }
  function setMode(mode) {
    const isLogin = mode === 'login';
    loginForm.classList.toggle('hidden', !isLogin);
    registerForm.classList.toggle('hidden', isLogin);
    loginSwitchText?.classList.toggle('hidden', !isLogin);
    registerSwitchText?.classList.toggle('hidden', isLogin);
    modalTitle.textContent = isLogin ? `Masuk ke ${BRAND_NAME}` : 'Daftar Akun Baru';
  }

  loginBtn?.addEventListener('click', () => openModal('login'));
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
    setTimeout(closeModal, 600);
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
    msgBox.textContent = 'Registrasi berhasil!';
    msgBox.className = 'modal-msg success';
    setTimeout(() => setMode('login'), 1200);
  });
}

async function initAuthState() {
  const session = await getCurrentSession();
  state.currentUser = session?.user ?? null;
  renderAuthUI();

  onAuthStateChange(async (_event, session) => {
    state.currentUser = session?.user ?? null;
    renderAuthUI();
    await refreshCartState();
    updateCartUI();
  });
}

function renderAuthUI() {
  const authLinks = document.getElementById('authLinks');
  const userChip = document.getElementById('userChip');
  const userLabel = document.getElementById('userEmailLabel');
  if (!authLinks || !userChip) return;
  if (state.currentUser) {
    authLinks.classList.add('hidden');
    userChip.classList.remove('hidden');
    userLabel.textContent = state.currentUser.email?.split('@')[0] ?? 'Akun';
  } else {
    authLinks.classList.remove('hidden');
    userChip.classList.add('hidden');
  }
}

function initLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await logoutUser();
    state.currentUser = null;
    renderAuthUI();
    await refreshCartState();
    updateCartUI();
    showToast('Berhasil keluar');
  });
}

// =============================================================
// LOAD PRODUCTS
// =============================================================
async function loadProducts() {
  const result = await fetchProducts();
  if (result.success && result.data.length > 0) {
    state.products = result.data;
  } else {
    state.products = SAMPLE_PRODUCTS;
    console.info('Menggunakan katalog contoh (SAMPLE_PRODUCTS) karena tabel Supabase kosong / belum terhubung.');
  }
  renderProductGrid();
}

// =============================================================
// INIT: HOMEPAGE
// =============================================================
async function initHomepage() {
  renderCategoryPills();
  renderTestimonials();
  initSearch();
  initMobileNav();
  initAuthModal();
  initLogout();
  initQuickViewModal();
  initCartDrawer();

  await initAuthState();
  await loadProducts();
  await refreshCartState();
  updateCartUI();
}

if (document.getElementById('productGrid')) {
  initHomepage();
}

// =============================================================
// CHECKOUT PAGE
// =============================================================
function renderCheckoutCart() {
  const listEl = document.getElementById('checkoutItemsList');
  if (!listEl) return; // bukan halaman checkout

  const emptyEl = document.getElementById('emptyCartState');
  const layoutEl = document.getElementById('checkoutLayout');
  listEl.innerHTML = '';

  if (state.cart.length === 0) {
    emptyEl?.classList.remove('hidden');
    layoutEl?.classList.add('hidden');
    return;
  }
  emptyEl?.classList.add('hidden');
  layoutEl?.classList.remove('hidden');

  state.cart.forEach(item => {
    const product = item.product;
    if (!product) return;
    listEl.appendChild(el(`
      <div class="checkout-item-row">
        <img src="${product.image_url}" alt="${escapeHtml(product.name)}" />
        <div class="checkout-item-info">
          <div class="checkout-item-name">${escapeHtml(product.name)}</div>
          <div class="checkout-item-meta">${item.variant ? `Ukuran: ${item.variant} · ` : ''}Qty: ${item.quantity}</div>
        </div>
        <div class="checkout-item-price">${formatRupiah(product.price * item.quantity)}</div>
      </div>
    `));
  });

  const subtotal = cartSubtotal();
  const subtotalEl = document.getElementById('checkoutSubtotal');
  const totalEl = document.getElementById('checkoutTotal');
  if (subtotalEl) subtotalEl.textContent = formatRupiah(subtotal);
  if (totalEl) totalEl.textContent = formatRupiah(subtotal);
}

function initPaymentOptions() {
  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      opt.querySelector('input').checked = true;
    });
  });
}

function initPlaceOrderButton() {
  document.getElementById('placeOrderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.cart.length === 0) return;

    const name = document.getElementById('shipName').value.trim();
    const phone = document.getElementById('shipPhone').value.trim();
    const address = document.getElementById('shipAddress').value.trim();

    const lines = state.cart.map(i => `- ${i.product.name}${i.variant ? ` (${i.variant})` : ''} x${i.quantity} = ${formatRupiah(i.product.price * i.quantity)}`).join('\n');
    const message = `Halo ${BRAND_NAME}, saya ingin melakukan pemesanan:\n\nNama: ${name}\nNo. HP: ${phone}\nAlamat: ${address}\n\nPesanan:\n${lines}\n\nTotal: ${formatRupiah(cartSubtotal())}\n\nMohon konfirmasinya. Terima kasih!`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');

    if (state.currentUser) await clearCart(state.currentUser.id);
    else localStorage.removeItem(LOCAL_CART_KEY);

    await refreshCartState();
    updateCartUI();
    showToast('🎉 Pesanan dikirim! Silakan lanjutkan konfirmasi via WhatsApp.');
  });
}

async function initCheckoutPage() {
  initMobileNav();
  initAuthModal();
  initLogout();
  initCartDrawer();
  initPaymentOptions();
  initPlaceOrderButton();

  await initAuthState();
  await refreshCartState();
  updateCartUI();
}

if (document.getElementById('checkoutItemsList')) {
  initCheckoutPage();
}
