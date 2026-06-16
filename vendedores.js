// ============================================================
// VENDEDORES
// ============================================================
function renderVendedores() {
  const content = document.getElementById('page-content');
  const now = new Date();
  const monthStart = now.toISOString().slice(0, 7);

  content.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">Equipo de ventas</div>
        <h1 class="page-title">Vendedores</h1>
      </div>
      <div class="page-actions">
        <button class="btn" id="nuevo-vendedor-btn">+ Nuevo vendedor</button>
      </div>
    </div>
    <div id="vendedores-list"></div>
  `;
  document.getElementById('nuevo-vendedor-btn').addEventListener('click', () => openVendedorModal());
  renderVendedoresList(monthStart);
}

function renderVendedoresList(monthStart) {
  const wrap = document.getElementById('vendedores-list');
  if (state.vendedores.length === 0) {
    wrap.innerHTML = `<div class="card"><div class="empty-state"><div class="big">—</div>No hay vendedores registrados.</div></div>`;
    return;
  }

  wrap.innerHTML = `<div class="grid grid-3">` + state.vendedores.map(v => {
    const ventasVendedor = state.ventas.filter(x => x.vendedor_id === v.id);
    const ventasMes = ventasVendedor.filter(x => x.fecha.startsWith(monthStart));
    const facturadoMes = ventasMes.reduce((s, x) => s + Number(x.total), 0);
    const comisionMes = facturadoMes * Number(v.comision_pct) / 100;
    const facturadoTotal = ventasVendedor.reduce((s, x) => s + Number(x.total), 0);

    return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-weight:600;font-size:15px;">${escapeHtml(v.nombre)}</div>
          <div class="muted" style="font-size:12px;">Comisión: ${v.comision_pct}%</div>
        </div>
        <div class="row-flex">
          <button class="icon-btn" data-edit="${v.id}">Editar</button>
          <button class="icon-btn" data-del="${v.id}">Borrar</button>
        </div>
      </div>
      <div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--line-soft);">
        <div class="stat-label">Facturado este mes</div>
        <div class="stat-value" style="font-size:20px;">${fmtMoney(facturadoMes)}</div>
        <div class="stat-sub">Comisión a pagar: <strong style="color:var(--ink)">${fmtMoney(comisionMes)}</strong></div>
        <div class="muted" style="font-size:11px;margin-top:8px;">Histórico total: ${fmtMoney(facturadoTotal)}</div>
      </div>
    </div>
  `}).join('') + `</div>`;

  wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openVendedorModal(b.dataset.edit)));
  wrap.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteVendedor(b.dataset.del)));
}

function openVendedorModal(id) {
  const v = id ? state.vendedores.find(x => x.id === id) : null;
  openModal(`
    <div class="modal-header">
      <h3>${v ? 'Editar vendedor' : 'Nuevo vendedor'}</h3>
      <button class="modal-close" id="modal-close-btn">&times;</button>
    </div>
    <form id="vendedor-form">
      <div class="field"><label>Nombre</label><input type="text" id="ve-nombre" value="${v ? escapeHtml(v.nombre) : ''}" required></div>
      <div class="field"><label>% Comisión</label><input type="number" id="ve-comision" min="0" max="100" step="0.1" value="${v ? v.comision_pct : 10}" required></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" id="modal-cancel-btn">Cancelar</button>
        <button type="submit" class="btn">Guardar</button>
      </div>
    </form>
  `);
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('vendedor-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      nombre: document.getElementById('ve-nombre').value.trim(),
      comision_pct: Number(document.getElementById('ve-comision').value),
    };
    const { error } = v
      ? await sb.from('vendedores').update(payload).eq('id', v.id)
      : await sb.from('vendedores').insert(payload);
    if (error) { showToast('Error: ' + error.message, true); return; }
    showToast('Vendedor guardado');
    closeModal();
    await refreshAndRender();
  });
}

async function deleteVendedor(id) {
  if (!confirm('¿Borrar este vendedor? Las ventas asociadas quedarán sin vendedor.')) return;
  const { error } = await sb.from('vendedores').delete().eq('id', id);
  if (error) { showToast('Error: ' + error.message, true); return; }
  showToast('Vendedor eliminado');
  await refreshAndRender();
}
