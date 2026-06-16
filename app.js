// ============================================================
// XMA ADMIN — app.js
// ============================================================

const SUPABASE_URL = "https://ftwzfhyihslsfzghvmyu.supabase.co";
const SUPABASE_KEY = "sb_publishable_vvaumbJqrmsNgsqvE6slLw_avH8HymV";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- Estado global ----------
const state = {
  page: 'dashboard',
  productos: [],
  variantes: [],
  clientes: [],
  vendedores: [],
  ventas: [],
};

// ---------- Helpers ----------
function fmtMoney(n) {
  n = Number(n) || 0;
  return '$U ' + n.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtMoneyDec(n) {
  n = Number(n) || 0;
  return '$U ' + n.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function monthLabel(dateStr) {
  const dt = new Date(dateStr + 'T00:00:00');
  return dt.toLocaleDateString('es-UY', { month: 'short', year: 'numeric' });
}
function showToast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => { t.className = 'toast'; }, 3200);
}
function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function uid() {
  return 'id-' + Math.random().toString(36).slice(2, 10);
}

// ---------- Modal helper ----------
function openModal(innerHtml) {
  let overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }
  overlay.innerHTML = `<div class="modal">${innerHtml}</div>`;
  overlay.classList.add('open');
}
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('open');
}

// ============================================================
// AUTH
// ============================================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Ingresando...';

  const { error } = await sb.auth.signInWithPassword({ email, password });

  btn.disabled = false;
  btn.textContent = 'Ingresar';

  if (error) {
    errEl.textContent = 'Email o contraseña incorrectos.';
    return;
  }
  await onLoginSuccess();
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await sb.auth.signOut();
  location.reload();
});

async function onLoginSuccess() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  await loadAllData();
  renderPage('dashboard');
}

async function checkSession() {
  const { data } = await sb.auth.getSession();
  if (data.session) {
    await onLoginSuccess();
  }
}
checkSession();

// ============================================================
// NAVEGACIÓN
// ============================================================
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    state.page = item.dataset.page;
    closeSidebar();
    renderPage(state.page);
  });
});

const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('sidebar-backdrop');
document.getElementById('mobile-menu-btn').addEventListener('click', () => {
  sidebar.classList.add('open');
  backdrop.classList.add('open');
});
backdrop.addEventListener('click', closeSidebar);
function closeSidebar() {
  sidebar.classList.remove('open');
  backdrop.classList.remove('open');
}

function renderPage(page) {
  const content = document.getElementById('page-content');
  content.innerHTML = '<div class="loading-screen"><span class="spinner"></span> Cargando…</div>';
  const renderers = {
    dashboard: renderDashboard,
    ventas: renderVentas,
    stock: renderStock,
    clientes: renderClientes,
    vendedores: renderVendedores,
    estadisticas: renderEstadisticas,
    dgi: renderDGI,
  };
  setTimeout(() => {
    (renderers[page] || renderDashboard)();
  }, 50);
}

// ============================================================
// CARGA DE DATOS
// ============================================================
async function loadAllData() {
  const [productosRes, variantesRes, clientesRes, vendedoresRes, ventasRes] = await Promise.all([
    sb.from('productos').select('*').order('articulo'),
    sb.from('variantes').select('*, productos(articulo, nombre, linea, categoria, precio_base)'),
    sb.from('clientes').select('*, vendedores(nombre)').order('nombre'),
    sb.from('vendedores').select('*').order('nombre'),
    sb.from('ventas').select('*, clientes(nombre), vendedores(nombre), venta_items(*)').order('fecha', { ascending: false }),
  ]);

  state.productos = productosRes.data || [];
  state.variantes = variantesRes.data || [];
  state.clientes = clientesRes.data || [];
  state.vendedores = vendedoresRes.data || [];
  state.ventas = ventasRes.data || [];

  if (productosRes.error) console.error(productosRes.error);
  if (variantesRes.error) console.error(variantesRes.error);
}

async function refreshAndRender() {
  await loadAllData();
  renderPage(state.page);
}
