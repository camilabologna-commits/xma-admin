// ============================================================
// STOCK
// ============================================================
let stockFiltro = { categoria: '', linea: '', q: '' };

function renderStock() {
  const content = document.getElementById('page-content');

  content.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">Inventario</div>
        <h1 class="page-title">Stock</h1>
      </div>
      <div class="page-actions">
        <button class="btn btn-ghost" id="nuevo-producto-btn">+ Nuevo artículo</button>
      </div>
    </div>

    <div class="filter-bar">
      <input type="text" class="search-input" id="stock-q" placeholder="Buscar artículo o nombre…" value="${escapeHtml(stockFiltro.q)}">
      <select id="stock-categoria" class="search-input" style="min-width:140px;">
        <option value="">Todas las categorías</option>
        ${['Niña','Niño','Dama','Hombre','Accesorios'].map(c => `<option value="${c}" ${stockFiltro.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
      <select id="stock-linea" class="search-input" style="min-width:140px;">
        <option value="">Todas las líneas</option>
        <option value="Poliamida" ${stockFiltro.linea === 'Poliamida' ? 'selected' : ''}>Poliamida</option>
        <option value="Poliester" ${stockFiltro.linea === 'Poliester' ? 'selected' : ''}>Poliéster</option>
      </select>
    </div>

    <div id="productos-list"></div>
  `;

  document.getElementById('nuevo-producto-btn').addEventListener('click', () => openProductoModal());
  document.getElementById('stock-q').addEventListener('input', (e) => { stockFiltro.q = e.target.value; renderProductosList(); });
  document.getElementById('stock-categoria').addEventListener('change', (e) => { stockFiltro.categoria = e.target.value; renderProductosList(); });
  document.getElementById('stock-linea').addEventListener('change', (e) => { stockFiltro.linea = e.target.value; renderProductosList(); });

  renderProductosList();
}

function renderProductosList() {
  const wrap = document.getElementById('productos-list');
  let productos = state.productos.filter(p => {
    if (stockFiltro.categoria && p.categoria !== stockFiltro.categoria) return false;
    if (stockFiltro.linea && p.linea !== stockFiltro.linea) return false;
    if (stockFiltro.q) {
      const q = stockFiltro.q.toLowerCase();
      if (!p.articulo.toLowerCase().includes(q) && !p.nombre.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (productos.length === 0) {
    wrap.innerHTML = `<div class="card"><div class="empty-state"><div class="big">—</div>No hay artículos que coincidan.</div></div>`;
    return;
  }

  wrap.innerHTML = productos.map(p => {
    const variantes = state.variantes.filter(v => v.producto_id === p.id);
    const totalStock = variantes.reduce((s, v) => s + v.stock, 0);
    return `
    <div class="card" style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
        <div>
          <div class="eyebrow" style="margin-bottom:4px;">Artículo ${escapeHtml(p.articulo)} · ${p.linea} · ${p.categoria}</div>
          <div style="font-weight:600;font-size:15px;">${escapeHtml(p.nombre)}</div>
          <div class="muted" style="font-size:12px;margin-top:2px;">${totalStock} unidades en stock · Precio base ${fmtMoney(p.precio_base)}</div>
        </div>
        <div class="row-flex">
          <button class="icon-btn" data-edit-prod="${p.id}">Editar</button>
          <button class="icon-btn" data-add-variante="${p.id}">+ Variante</button>
          <button class="icon-btn" data-del-prod="${p.id}">Borrar</button>
        </div>
      </div>
      ${variantes.length > 0 ? `
      <div class="table-wrap" style="margin-top:16px;">
        <table>
          <thead><tr><th>Talle</th><th>Color</th><th class="text-right">Precio</th><th class="text-right">Stock</th><th></th></tr></thead>
          <tbody>
            ${variantes.map(v => `
              <tr>
                <td>${escapeHtml(v.talle)}</td>
                <td>${escapeHtml(v.color)}</td>
                <td class="text-right mono">${fmtMoney(v.precio || p.precio_base)}</td>
                <td class="text-right"><span class="badge ${v.stock <= 3 ? 'badge-low' : 'badge-ok'}">${v.stock}</span></td>
                <td class="text-right">
                  <button class="icon-btn" data-edit-var="${v.id}">Editar</button>
                  <button class="icon-btn" data-del-var="${v.id}">Borrar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>` : `<div class="muted" style="font-size:12px;margin-top:14px;">Sin variantes cargadas. Agregá talle/color/stock.</div>`}
    </div>
  `}).join('');

  wrap.querySelectorAll('[data-edit-prod]').forEach(b => b.addEventListener('click', () => openProductoModal(b.dataset.editProd)));
  wrap.querySelectorAll('[data-del-prod]').forEach(b => b.addEventListener('click', () => deleteProducto(b.dataset.delProd)));
  wrap.querySelectorAll('[data-add-variante]').forEach(b => b.addEventListener('click', () => openVarianteModal(null, b.dataset.addVariante)));
  wrap.querySelectorAll('[data-edit-var]').forEach(b => b.addEventListener('click', () => openVarianteModal(b.dataset.editVar)));
  wrap.querySelectorAll('[data-del-var]').forEach(b => b.addEventListener('click', () => deleteVariante(b.dataset.delVar)));
}

function openProductoModal(id) {
  const p = id ? state.productos.find(x => x.id === id) : null;
  openModal(`
    <div class="modal-header">
      <h3>${p ? 'Editar artículo' : 'Nuevo artículo'}</h3>
      <button class="modal-close" id="modal-close-btn">&times;</button>
    </div>
    <form id="producto-form">
      <div class="grid grid-2">
        <div class="field"><label>N° de artículo</label><input type="text" id="p-articulo" value="${p ? escapeHtml(p.articulo) : ''}" required></div>
        <div class="field"><label>Precio base</label><input type="number" id="p-precio" min="0" step="0.01" value="${p ? p.precio_base : ''}" required></div>
      </div>
      <div class="field"><label>Nombre / descripción</label><input type="text" id="p-nombre" value="${p ? escapeHtml(p.nombre) : ''}" required></div>
      <div class="grid grid-2">
        <div class="field">
          <label>Línea</label>
          <select id="p-linea" required>
            <option value="Poliamida" ${p?.linea === 'Poliamida' ? 'selected' : ''}>Poliamida</option>
            <option value="Poliester" ${p?.linea === 'Poliester' ? 'selected' : ''}>Poliéster</option>
          </select>
        </div>
        <div class="field">
          <label>Categoría</label>
          <select id="p-categoria" required>
            ${['Niña','Niño','Dama','Hombre','Accesorios'].map(c => `<option value="${c}" ${p?.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" id="modal-cancel-btn">Cancelar</button>
        <button type="submit" class="btn">Guardar</button>
      </div>
    </form>
  `);
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('producto-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      articulo: document.getElementById('p-articulo').value.trim(),
      nombre: document.getElementById('p-nombre').value.trim(),
      linea: document.getElementById('p-linea').value,
      categoria: document.getElementById('p-categoria').value,
      precio_base: Number(document.getElementById('p-precio').value),
    };
    const { error } = p
      ? await sb.from('productos').update(payload).eq('id', p.id)
      : await sb.from('productos').insert(payload);
    if (error) { showToast('Error: ' + error.message, true); return; }
    showToast('Artículo guardado');
    closeModal();
    await refreshAndRender();
  });
}

async function deleteProducto(id) {
  if (!confirm('¿Borrar este artículo y todas sus variantes? Esta acción no se puede deshacer.')) return;
  const { error } = await sb.from('productos').delete().eq('id', id);
  if (error) { showToast('Error: ' + error.message, true); return; }
  showToast('Artículo eliminado');
  await refreshAndRender();
}

function openVarianteModal(varianteId, productoId) {
  const v = varianteId ? state.variantes.find(x => x.id === varianteId) : null;
  const prodId = v ? v.producto_id : productoId;
  const producto = state.productos.find(p => p.id === prodId);

  openModal(`
    <div class="modal-header">
      <h3>${v ? 'Editar variante' : 'Nueva variante'}</h3>
      <button class="modal-close" id="modal-close-btn">&times;</button>
    </div>
    <div class="muted" style="font-size:13px;margin-bottom:18px;">Artículo ${escapeHtml(producto?.articulo || '')} — ${escapeHtml(producto?.nombre || '')}</div>
    <form id="variante-form">
      <div class="grid grid-2">
        <div class="field"><label>Talle</label><input type="text" id="va-talle" value="${v ? escapeHtml(v.talle) : ''}" placeholder="ej. 42, S, 4-16" required></div>
        <div class="field"><label>Color</label><input type="text" id="va-color" value="${v ? escapeHtml(v.color) : ''}" required></div>
      </div>
      <div class="grid grid-2">
        <div class="field"><label>Stock</label><input type="number" id="va-stock" min="0" value="${v ? v.stock : 0}" required></div>
        <div class="field"><label>Precio (vacío = usar precio base)</label><input type="number" id="va-precio" min="0" step="0.01" value="${v && v.precio ? v.precio : ''}"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" id="modal-cancel-btn">Cancelar</button>
        <button type="submit" class="btn">Guardar</button>
      </div>
    </form>
  `);
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('variante-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const precioVal = document.getElementById('va-precio').value;
    const payload = {
      producto_id: prodId,
      talle: document.getElementById('va-talle').value.trim(),
      color: document.getElementById('va-color').value.trim(),
      stock: Number(document.getElementById('va-stock').value),
      precio: precioVal ? Number(precioVal) : null,
    };
    const { error } = v
      ? await sb.from('variantes').update(payload).eq('id', v.id)
      : await sb.from('variantes').insert(payload);
    if (error) { showToast('Error: ' + error.message, true); return; }
    showToast('Variante guardada');
    closeModal();
    await refreshAndRender();
  });
}

async function deleteVariante(id) {
  if (!confirm('¿Borrar esta variante?')) return;
  const { error } = await sb.from('variantes').delete().eq('id', id);
  if (error) { showToast('Error: ' + error.message, true); return; }
  showToast('Variante eliminada');
  await refreshAndRender();
}
