// ============================================================
// CLIENTES
// ============================================================
let clientesQ = '';

const DEPARTAMENTOS_UY = [
  'Artigas','Canelones','Cerro Largo','Colonia','Durazno','Flores','Florida',
  'Lavalleja','Maldonado','Montevideo','Paysandú','Río Negro','Rivera','Rocha',
  'Salto','San José','Soriano','Tacuarembó','Treinta y Tres'
];

function renderClientes() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">Cartera</div>
        <h1 class="page-title">Clientes</h1>
      </div>
      <div class="page-actions">
        <button class="btn" id="nuevo-cliente-btn">+ Nuevo cliente</button>
      </div>
    </div>
    <div class="filter-bar">
      <input type="text" class="search-input" id="clientes-q" placeholder="Buscar cliente…" value="${escapeHtml(clientesQ)}">
    </div>
    <div class="card" style="padding:0;">
      <div class="table-wrap" id="clientes-table-wrap"></div>
    </div>
  `;
  document.getElementById('nuevo-cliente-btn').addEventListener('click', () => openClienteModal());
  document.getElementById('clientes-q').addEventListener('input', (e) => { clientesQ = e.target.value; renderClientesTable(); });
  renderClientesTable();
}

function renderClientesTable() {
  const wrap = document.getElementById('clientes-table-wrap');
  const clientes = state.clientes.filter(c => !clientesQ || c.nombre.toLowerCase().includes(clientesQ.toLowerCase()));

  if (clientes.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><div class="big">—</div>No hay clientes que coincidan.</div>`;
    return;
  }

  const totalPorCliente = {};
  state.ventas.forEach(v => {
    if (v.cliente_id) totalPorCliente[v.cliente_id] = (totalPorCliente[v.cliente_id] || 0) + Number(v.total);
  });

  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nombre</th><th>Contacto</th><th>Ubicación</th><th>Vendedor habitual</th><th class="text-right">Total comprado</th><th></th>
        </tr>
      </thead>
      <tbody>
        ${clientes.map(c => {
          const ubicacion = [c.ciudad, c.departamento].filter(Boolean).join(', ') || '—';
          return `
          <tr>
            <td style="font-weight:500;">${escapeHtml(c.nombre)}</td>
            <td class="muted">${escapeHtml(c.telefono || c.email || '—')}</td>
            <td class="muted">${escapeHtml(ubicacion)}</td>
            <td>${escapeHtml(c.vendedores?.nombre || '—')}</td>
            <td class="text-right mono">${fmtMoney(totalPorCliente[c.id] || 0)}</td>
            <td class="text-right">
              <button class="icon-btn" data-edit="${c.id}">Editar</button>
              <button class="icon-btn" data-del="${c.id}">Borrar</button>
            </td>
          </tr>
        `}).join('')}
      </tbody>
    </table>
  `;
  wrap.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openClienteModal(b.dataset.edit)));
  wrap.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteCliente(b.dataset.del)));
}

function openClienteModal(id) {
  const c = id ? state.clientes.find(x => x.id === id) : null;
  openModal(`
    <div class="modal-header">
      <h3>${c ? 'Editar cliente' : 'Nuevo cliente'}</h3>
      <button class="modal-close" id="modal-close-btn">&times;</button>
    </div>
    <form id="cliente-form">
      <div class="field"><label>Nombre</label><input type="text" id="c-nombre" value="${c ? escapeHtml(c.nombre) : ''}" required></div>
      <div class="grid grid-2">
        <div class="field"><label>Teléfono</label><input type="text" id="c-telefono" value="${c ? escapeHtml(c.telefono || '') : ''}"></div>
        <div class="field"><label>Email</label><input type="email" id="c-email" value="${c ? escapeHtml(c.email || '') : ''}"></div>
      </div>
      <div class="grid grid-2">
        <div class="field">
          <label>Departamento</label>
          <select id="c-departamento">
            <option value="">— Seleccionar —</option>
            ${DEPARTAMENTOS_UY.map(d => `<option value="${d}" ${c?.departamento === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Ciudad</label><input type="text" id="c-ciudad" value="${c ? escapeHtml(c.ciudad || '') : ''}"></div>
      </div>
      <div class="field"><label>Dirección</label><input type="text" id="c-direccion" value="${c ? escapeHtml(c.direccion || '') : ''}"></div>
      <div class="field">
        <label>Vendedor habitual (opcional)</label>
        <select id="c-vendedor">
          <option value="">— Ninguno —</option>
          ${state.vendedores.map(v => `<option value="${v.id}" ${c?.vendedor_id === v.id ? 'selected' : ''}>${escapeHtml(v.nombre)}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>Notas</label><textarea id="c-notas" rows="2">${c ? escapeHtml(c.notas || '') : ''}</textarea></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" id="modal-cancel-btn">Cancelar</button>
        <button type="submit" class="btn">Guardar</button>
      </div>
    </form>
  `);
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('cliente-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      nombre: document.getElementById('c-nombre').value.trim(),
      telefono: document.getElementById('c-telefono').value.trim() || null,
      email: document.getElementById('c-email').value.trim() || null,
      departamento: document.getElementById('c-departamento').value || null,
      ciudad: document.getElementById('c-ciudad').value.trim() || null,
      direccion: document.getElementById('c-direccion').value.trim() || null,
      vendedor_id: document.getElementById('c-vendedor').value || null,
      notas: document.getElementById('c-notas').value.trim() || null,
    };
    const { error } = c
      ? await sb.from('clientes').update(payload).eq('id', c.id)
      : await sb.from('clientes').insert(payload);
    if (error) { showToast('Error: ' + error.message, true); return; }
    showToast('Cliente guardado');
    closeModal();
    await refreshAndRender();
  });
}

async function deleteCliente(id) {
  if (!confirm('¿Borrar este cliente?')) return;
  const { error } = await sb.from('clientes').delete().eq('id', id);
  if (error) { showToast('Error: ' + error.message, true); return; }
  showToast('Cliente eliminado');
  await refreshAndRender();
}
