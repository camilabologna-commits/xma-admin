// ============================================================
// VENTAS
// ============================================================
let ventasFiltro = { tab: 'todas', vendedor: '', mes: '', q: '' };

function renderVentas() {
  const content = document.getElementById('page-content');

  // Totales para el resumen
  const todas   = state.ventas;
  const oficial = todas.filter(v => v.tipo_factura === 'oficial');
  const otras   = todas.filter(v => v.tipo_factura === 'otras');
  const totalOficial = oficial.reduce((s, v) => s + Number(v.total), 0);
  const totalOtras   = otras.reduce((s, v) => s + Number(v.total), 0);
  const totalGeneral = totalOficial + totalOtras;

  content.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">Ventas</div>
        <h1 class="page-title">Registro de ventas</h1>
      </div>
      <div class="page-actions">
        <button class="btn" id="nueva-venta-btn">+ Nueva venta</button>
      </div>
    </div>

    <!-- Resumen general -->
    <div class="grid grid-3" style="margin-bottom:20px;">
      <div class="stat-card">
        <div class="stat-label">Total oficial</div>
        <div class="stat-value">${fmtMoney(totalOficial)}</div>
        <div class="stat-sub">${oficial.length} venta(s)</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total otras</div>
        <div class="stat-value">${fmtMoney(totalOtras)}</div>
        <div class="stat-sub">${otras.length} venta(s)</div>
      </div>
      <div class="stat-card" style="border-color:var(--ink);">
        <div class="stat-label">Total general</div>
        <div class="stat-value">${fmtMoney(totalGeneral)}</div>
        <div class="stat-sub">${todas.length} venta(s) en total</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <div class="tab ${ventasFiltro.tab === 'todas'   ? 'active' : ''}" data-tab="todas">Todas</div>
      <div class="tab ${ventasFiltro.tab === 'oficial' ? 'active' : ''}" data-tab="oficial">Oficial</div>
      <div class="tab ${ventasFiltro.tab === 'otras'   ? 'active' : ''}" data-tab="otras">Otras</div>
    </div>

    <!-- Filtros -->
    <div class="filter-bar">
      <input type="text" class="search-input" id="filtro-q" placeholder="Buscar cliente…" value="${escapeHtml(ventasFiltro.q)}">
      <select id="filtro-vendedor" class="search-input" style="min-width:160px;">
        <option value="">Todos los vendedores</option>
        <option value="__none__" ${ventasFiltro.vendedor === '__none__' ? 'selected' : ''}>Sin vendedor</option>
        ${state.vendedores.map(v => `<option value="${v.id}" ${ventasFiltro.vendedor === v.id ? 'selected' : ''}>${escapeHtml(v.nombre)}</option>`).join('')}
      </select>
      <input type="month" id="filtro-mes" class="search-input" style="min-width:140px;" value="${ventasFiltro.mes}">
    </div>

    <div class="card" style="padding:0;">
      <div class="table-wrap" id="ventas-table-wrap"></div>
    </div>
  `;

  document.getElementById('nueva-venta-btn').addEventListener('click', () => openVentaModal());
  document.getElementById('filtro-q').addEventListener('input', (e) => { ventasFiltro.q = e.target.value; renderVentasTable(); });
  document.getElementById('filtro-vendedor').addEventListener('change', (e) => { ventasFiltro.vendedor = e.target.value; renderVentasTable(); });
  document.getElementById('filtro-mes').addEventListener('change', (e) => { ventasFiltro.mes = e.target.value; renderVentasTable(); });

  document.querySelectorAll('.tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      ventasFiltro.tab = tab.dataset.tab;
      document.querySelectorAll('.tab[data-tab]').forEach(t => t.classList.toggle('active', t.dataset.tab === ventasFiltro.tab));
      renderVentasTable();
    });
  });

  renderVentasTable();
}

function getVentasFiltradas() {
  return state.ventas.filter(v => {
    if (ventasFiltro.tab !== 'todas' && v.tipo_factura !== ventasFiltro.tab) return false;
    if (ventasFiltro.vendedor === '__none__' && v.vendedor_id) return false;
    if (ventasFiltro.vendedor && ventasFiltro.vendedor !== '__none__' && v.vendedor_id !== ventasFiltro.vendedor) return false;
    if (ventasFiltro.mes && !v.fecha.startsWith(ventasFiltro.mes)) return false;
    if (ventasFiltro.q && !(v.clientes?.nombre || '').toLowerCase().includes(ventasFiltro.q.toLowerCase())) return false;
    return true;
  });
}

function renderVentasTable() {
  const wrap = document.getElementById('ventas-table-wrap');
  const ventas = getVentasFiltradas();
  const totalFiltrado = ventas.reduce((s, v) => s + Number(v.total), 0);

  if (ventas.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><div class="big">—</div>No hay ventas que coincidan con el filtro.</div>`;
    return;
  }

  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Fecha</th><th>Cliente</th><th>Vendedor</th><th>Tipo</th><th>Items</th><th class="text-right">Total</th><th></th>
        </tr>
      </thead>
      <tbody>
        ${ventas.map(v => `
          <tr>
            <td>${fmtDate(v.fecha)}</td>
            <td>${escapeHtml(v.clientes?.nombre || '—')}</td>
            <td>${escapeHtml(v.vendedores?.nombre || '—')}</td>
            <td><span class="badge badge-${v.tipo_factura}">${v.tipo_factura}</span></td>
            <td class="muted">${v.venta_items?.length || 0} ítem(s)</td>
            <td class="text-right mono">${fmtMoney(v.total)}</td>
            <td>
              <button class="icon-btn" data-view="${v.id}">Ver</button>
              <button class="icon-btn" data-del="${v.id}">Borrar</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="5" style="text-align:right;font-weight:600;">Total</td>
          <td class="text-right mono" style="font-weight:600;">${fmtMoney(totalFiltrado)}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  `;

  wrap.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => viewVenta(btn.dataset.view));
  });
  wrap.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => deleteVenta(btn.dataset.del));
  });
}

function viewVenta(id) {
  const v = state.ventas.find(x => x.id === id);
  if (!v) return;
  openModal(`
    <div class="modal-header">
      <h3>Venta del ${fmtDate(v.fecha)}</h3>
      <button class="modal-close" id="modal-close-btn">&times;</button>
    </div>
    <div style="margin-bottom:18px;font-size:13px;" class="muted">
      Cliente: <strong style="color:var(--ink)">${escapeHtml(v.clientes?.nombre || '—')}</strong> ·
      Vendedor: <strong style="color:var(--ink)">${escapeHtml(v.vendedores?.nombre || '—')}</strong> ·
      Tipo: <span class="badge badge-${v.tipo_factura}">${v.tipo_factura}</span>
    </div>
    <table>
      <thead><tr><th>Producto</th><th class="text-right">Cant.</th><th class="text-right">Precio</th><th class="text-right">Subtotal</th></tr></thead>
      <tbody>
        ${(v.venta_items || []).map(it => `
          <tr>
            <td>${escapeHtml(it.descripcion)}</td>
            <td class="text-right">${it.cantidad}</td>
            <td class="text-right mono">${fmtMoney(it.precio_unitario)}</td>
            <td class="text-right mono">${fmtMoney(it.subtotal)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr><td colspan="3" style="text-align:right;font-weight:600;">Total</td><td class="text-right mono" style="font-weight:600;">${fmtMoney(v.total)}</td></tr>
      </tfoot>
    </table>
    ${v.notas ? `<div style="margin-top:16px;font-size:13px;" class="muted">Notas: ${escapeHtml(v.notas)}</div>` : ''}
    <div class="modal-footer">
      <button class="btn btn-ghost" id="modal-close-btn2">Cerrar</button>
    </div>
  `);
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-close-btn2').addEventListener('click', closeModal);
}

async function deleteVenta(id) {
  if (!confirm('¿Borrar esta venta? Esto repondrá el stock de los productos vendidos.')) return;
  const { error } = await sb.from('ventas').delete().eq('id', id);
  if (error) { showToast('Error al borrar: ' + error.message, true); return; }
  showToast('Venta eliminada');
  await refreshAndRender();
}

// ---------- Formulario nueva venta ----------
let ventaItemsDraft = [];

function openVentaModal() {
  ventaItemsDraft = [];

  openModal(`
    <div class="modal-header">
      <h3>Nueva venta</h3>
      <button class="modal-close" id="modal-close-btn">&times;</button>
    </div>
    <form id="venta-form">
      <div class="grid grid-2">
        <div class="field">
          <label>Fecha</label>
          <input type="date" id="v-fecha" value="${todayISO()}" required>
        </div>
        <div class="field">
          <label>Tipo de factura</label>
          <select id="v-tipo" required>
            <option value="oficial">Oficial</option>
            <option value="otras">Otras</option>
          </select>
        </div>
      </div>
      <div class="grid grid-2">
        <div class="field">
          <label>Cliente</label>
          <select id="v-cliente">
            <option value="">— Sin cliente —</option>
            ${state.clientes.map(c => `<option value="${c.id}" data-vendedor="${c.vendedor_id || ''}">${escapeHtml(c.nombre)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Vendedor (para comisión)</label>
          <select id="v-vendedor">
            <option value="">— Sin vendedor / sin comisión —</option>
            ${state.vendedores.map(v => `<option value="${v.id}">${escapeHtml(v.nombre)} (${v.comision_pct}%)</option>`).join('')}
          </select>
        </div>
      </div>

      <label style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-soft);margin-bottom:7px;font-weight:600;">Productos</label>
      <div class="line-items" id="line-items-wrap"></div>
      <button type="button" class="btn btn-ghost btn-sm" id="add-line-btn" style="margin-bottom:18px;">+ Agregar producto</button>

      <div class="field">
        <label>Notas (opcional)</label>
        <textarea id="v-notas" rows="2"></textarea>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid var(--line);margin-top:8px;">
        <span class="eyebrow">Total</span>
        <span class="mono" style="font-size:20px;font-weight:600;" id="venta-total-display">$U 0</span>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" id="modal-cancel-btn">Cancelar</button>
        <button type="submit" class="btn" id="venta-save-btn">Guardar venta</button>
      </div>
    </form>
  `);

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('add-line-btn').addEventListener('click', () => addVentaLine());

  document.getElementById('v-cliente').addEventListener('change', (e) => {
    const opt = e.target.selectedOptions[0];
    const vendedorId = opt?.dataset.vendedor;
    if (vendedorId) document.getElementById('v-vendedor').value = vendedorId;
  });

  addVentaLine();
  document.getElementById('venta-form').addEventListener('submit', submitVenta);
}

function addVentaLine() {
  const lineId = uid();
  ventaItemsDraft.push({ lineId, varianteId: '', cantidad: 1, precio: 0 });
  renderVentaLines();
}

function renderVentaLines() {
  const wrap = document.getElementById('line-items-wrap');
  wrap.innerHTML = ventaItemsDraft.map(line => `
    <div class="line-item-row" data-line="${line.lineId}">
      <select class="variante-select">
        <option value="">— Elegir producto —</option>
        ${state.variantes.filter(v => v.stock > 0 || v.id === line.varianteId).map(v => `
          <option value="${v.id}" data-precio="${v.precio || v.productos?.precio_base || 0}" ${v.id === line.varianteId ? 'selected' : ''}>
            ${escapeHtml(v.productos?.articulo || '')} · ${escapeHtml(v.productos?.nombre || '')} — ${escapeHtml(v.talle)}/${escapeHtml(v.color)} (stock: ${v.stock})
          </option>
        `).join('')}
      </select>
      <input type="number" class="cantidad-input" min="1" value="${line.cantidad}" placeholder="Cant.">
      <input type="number" class="precio-input" min="0" step="0.01" value="${line.precio}" placeholder="Precio">
      <button type="button" class="remove-line" title="Quitar">&times;</button>
    </div>
  `).join('');

  wrap.querySelectorAll('.line-item-row').forEach(row => {
    const lineId = row.dataset.line;
    const line = ventaItemsDraft.find(l => l.lineId === lineId);

    row.querySelector('.variante-select').addEventListener('change', (e) => {
      line.varianteId = e.target.value;
      const precioDefault = Number(e.target.selectedOptions[0]?.dataset.precio || 0);
      line.precio = precioDefault;
      renderVentaLines();
      updateVentaTotal();
    });
    row.querySelector('.cantidad-input').addEventListener('input', (e) => {
      line.cantidad = Number(e.target.value) || 1;
      updateVentaTotal();
    });
    row.querySelector('.precio-input').addEventListener('input', (e) => {
      line.precio = Number(e.target.value) || 0;
      updateVentaTotal();
    });
    row.querySelector('.remove-line').addEventListener('click', () => {
      ventaItemsDraft = ventaItemsDraft.filter(l => l.lineId !== lineId);
      if (ventaItemsDraft.length === 0) addVentaLine();
      else { renderVentaLines(); updateVentaTotal(); }
    });
  });

  updateVentaTotal();
}

function updateVentaTotal() {
  const total = ventaItemsDraft.reduce((s, l) => s + (l.cantidad * l.precio), 0);
  const el = document.getElementById('venta-total-display');
  if (el) el.textContent = fmtMoney(total);
}

async function submitVenta(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('venta-save-btn');

  const validLines = ventaItemsDraft.filter(l => l.varianteId && l.cantidad > 0);
  if (validLines.length === 0) {
    showToast('Agregá al menos un producto válido.', true);
    return;
  }

  for (const line of validLines) {
    const variante = state.variantes.find(v => v.id === line.varianteId);
    if (variante && line.cantidad > variante.stock) {
      if (!confirm(`El stock de "${variante.productos?.nombre} ${variante.talle}/${variante.color}" es ${variante.stock} y estás vendiendo ${line.cantidad}. ¿Continuar igual?`)) {
        return;
      }
    }
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Guardando…';

  const fecha = document.getElementById('v-fecha').value;
  const tipo = document.getElementById('v-tipo').value;
  const clienteId = document.getElementById('v-cliente').value || null;
  const vendedorId = document.getElementById('v-vendedor').value || null;
  const notas = document.getElementById('v-notas').value.trim() || null;

  const { data: ventaData, error: ventaError } = await sb.from('ventas').insert({
    fecha, tipo_factura: tipo, cliente_id: clienteId, vendedor_id: vendedorId, notas, total: 0
  }).select().single();

  if (ventaError) {
    showToast('Error al crear venta: ' + ventaError.message, true);
    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar venta';
    return;
  }

  const itemsToInsert = validLines.map(line => {
    const variante = state.variantes.find(v => v.id === line.varianteId);
    const desc = variante ? `${variante.productos?.articulo} · ${variante.productos?.nombre} — ${variante.talle}/${variante.color}` : 'Producto';
    return {
      venta_id: ventaData.id,
      variante_id: line.varianteId,
      descripcion: desc,
      cantidad: line.cantidad,
      precio_unitario: line.precio,
      subtotal: line.cantidad * line.precio,
    };
  });

  const { error: itemsError } = await sb.from('venta_items').insert(itemsToInsert);

  if (itemsError) {
    showToast('Error al guardar productos de la venta: ' + itemsError.message, true);
    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar venta';
    return;
  }

  showToast('Venta registrada correctamente');
  closeModal();
  await refreshAndRender();
}
