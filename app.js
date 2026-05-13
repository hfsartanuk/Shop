// ── GLOBAL STATE ──────────────────────────────────────────────
let products = [];
let cart = JSON.parse(localStorage.getItem('lo_cart') || '[]');

const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID'; // Replace with your PayPal Client ID
const FREE_SHIPPING_THRESHOLD = 50;
const STANDARD_SHIPPING_COST = 2.99;
const PRIORITY_SHIPPING_COST = 15.00;

// ── LOAD PRODUCTS ──────────────────────────────────────────────
async function loadProducts() {
  try {
    // Try admin-saved products first, then fallback to JSON file
    const saved = localStorage.getItem('lo_products');
    if (saved) { products = JSON.parse(saved); return; }
    const res = await fetch('../data/products.json');
    products = await res.json();
  } catch(e) {
    try {
      const res = await fetch('data/products.json');
      products = await res.json();
    } catch(e2) { products = []; }
  }
}

// ── CART ──────────────────────────────────────────────────────
function saveCart() { localStorage.setItem('lo_cart', JSON.stringify(cart)); updateCartCount(); }

function addToCart(productId, size, color, qty = 1) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  const key = `${productId}-${size}-${color}`;
  const existing = cart.find(i => i.key === key);
  if (existing) { existing.qty += qty; }
  else { cart.push({ key, productId, size, color, qty, name: p.name, price: p.price, image: p.images[0] }); }
  saveCart();
  showToast(`✓ ${p.name} added to cart`, 'success');
}

function removeFromCart(key) { cart = cart.filter(i => i.key !== key); saveCart(); }

function updateQty(key, delta) {
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
}

function getCartTotal() { return cart.reduce((s, i) => s + (i.price * i.qty), 0); }
function getCartCount() { return cart.reduce((s, i) => s + i.qty, 0); }

function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (el) { const c = getCartCount(); el.textContent = c; el.style.display = c > 0 ? 'flex' : 'none'; }
}

// ── SHIPPING ──────────────────────────────────────────────────
function calcShipping(subtotal, method = 'standard') {
  if (method === 'priority') return PRIORITY_SHIPPING_COST;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
}

function getShippingLabel(method, subtotal) {
  if (method === 'priority') return '£15.00 — UPS Priority';
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 'FREE — PTT Turkish Cargo';
  return '£2.99 — PTT Turkish Cargo';
}

// ── TOAST ──────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ── PRODUCT CARD ──────────────────────────────────────────────
function renderProductCard(p) {
  return `
  <div class="product-card" onclick="window.location='product.html?id=${p.id}'">
    <img src="${p.images[0]}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400?text=No+Image'">
    <div class="product-card-body">
      <div class="product-category">${p.category}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">£${p.price.toFixed(2)}</div>
    </div>
    <div class="product-card-footer">
      <span style="font-size:.75rem;color:var(--text-muted);">${p.colors.length} colours · ${p.sizes.length} sizes</span>
      <button class="quick-add" onclick="event.stopPropagation(); quickAdd('${p.id}')">+ Add</button>
    </div>
  </div>`;
}

function quickAdd(productId) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  addToCart(productId, p.sizes[0], p.colors[0]);
}

// ── COLOR MAP ──────────────────────────────────────────────────
const colorMap = {
  white: '#f0f0f0', black: '#111', navy: '#001f5b', grey: '#888', gray: '#888',
  red: '#cc0000', blue: '#1a4fd8', green: '#16a34a', beige: '#d4b896',
  khaki: '#c3b091', olive: '#6b7c3b', brown: '#7c4a1e', cream: '#fef3c7',
  charcoal: '#374151', burgundy: '#7f1d1d', 'light blue': '#93c5fd',
  'dark blue': '#1e3a5f', multicolor: 'linear-gradient(135deg,#f00,#ff0,#0f0,#00f)',
};
function getColor(name) { return colorMap[name.toLowerCase()] || '#888'; }

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  updateCartCount();
  if (typeof initPage === 'function') initPage();
});
