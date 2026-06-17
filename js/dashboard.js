// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const content = document.getElementById('page-content');

  const now = new Date();
  const monthStart = now.toISOString().slice(0, 7); // YYYY-MM
  const ventasMes = state.ventas.filter(v => v.fecha.startsWith(monthStart));
  const facturadoOficial = ventasMes.filter(v => v.tipo_factura === 'oficial').reduce((s, v) => s + Number(v.total), 0);
  const facturadoOtras = ventasMes.filter(v => v.tipo_factura === 'otras').reduce((s, v) => s + Number(v.total), 0);
  const facturadoTotal = facturadoOficial + facturadoOtras;
  const dgiMes = facturadoOficial * 0.033;

  // mes anterior para comparación
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStart = prevDate.toISOString().slice(0, 7);
  const ventasMesAnt = state.ventas.filter(v => v.fecha.startsWith(prevMonthStart));
  const totalMesAnt = ventasMesAnt.reduce((s, v) => s + Number(v.total), 0);
  const variacion = totalMesAnt > 0 ? ((facturadoTotal - totalMesAnt) / totalMesAnt * 100) : null;

  const stockBajo = state.variantes.filter(v => v.stock <= 3);
  const totalUnidadesStock = state.variantes.reduce((s, v) => s + v.stock, 0);

  const comisionesMes = {};
  ventasMes.forEach(v => {
    if (v.vendedor_id) {
      const nombre = v.vendedores?.nombre || '—';
      const vend = state.vendedores.find(x => x.id === v.vendedor_id);
      const pct = vend ? Number(vend.comision_pct) : 10;
      comisionesMes[nombre] = (comisionesMes[nombre] || 0) + Number(v.total) * pct / 100;
    }
  });
  const totalComisiones = Object.values(comisionesMes).reduce((a, b) => a + b, 0);

  const ultimasVentas = state.ventas.slice(0, 6);

  content.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">${now.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' })}</div>
        <h1 class="page-title">Resumen</h1>
      </div>
      <div class="page-actions">
        <button class="btn" id="dash-nueva-venta">+ Nueva venta</button>
      </div>
    </div>

    <div class="grid grid-4" style="margin-bottom:18px;">
      <div class="stat-card">
        <div class="stat-label">Facturado del mes</div>
        <div class="stat-value">${fmtMoney(facturadoTotal)}</div>
        ${variacion !== null ? `<div class="stat-sub ${variacion >= 0 ? 'good' : 'bad'}">${variacion >= 0 ? '↑' : '↓'} ${Math.abs(variacion).toFixed(1)}% vs mes anterior</div>` : '<div class="stat-sub">Sin datos del mes anterior</div>'}
      </div>
      <div class="stat-card">
        <div class="stat-label">Facturado oficial</div>
        <div class="stat-value">${fmtMoney(facturadoOficial)}</div>
        <div class="stat-sub">Otras: ${fmtMoney(facturadoOtras)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">DGI a pagar (3,3%)</div>
        <div class="stat-value">${fmtMoney(dgiMes)}</div>
        <div class="stat-sub">Sobre facturación oficial</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Comisiones del mes</div>
        <div class="stat-value">${fmtMoney(totalComisiones)}</div>
        <div class="stat-sub">${Object.keys(comisionesMes).length} vendedor(es)</div>
      </div>
    </div>

    <div class="grid grid-2" style="margin-bottom:18px;align-items:start;">
      <div class="card">
        <div class="section-title">
          <span>Últimas ventas</span>
          <a href="#" class="muted" style="font-size:12px;" id="ver-todas-ventas">Ver todas →</a>
        </div>
        ${ultimasVentas.length === 0 ? `<div class="empty-state"><div class="big">—</div>Todavía no hay ventas registradas.</div>` : `
        <div class="table-wrap">
        <table>
          <thead><tr><th>Fecha</th><th>Cliente</th><th>Tipo</th><th class="text-right">Total</th></tr></thead>
          <tbody>
            ${ultimasVentas.map(v => `
              <tr>
                <td>${fmtDate(v.fecha)}</td>
                <td>${escapeHtml(v.clientes?.nombre || '—')}</td>
                <td><span class="badge badge-${v.tipo_factura}">${v.tipo_factura}</span></td>
                <td class="text-right mono">${fmtMoney(v.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>`}
      </div>

      <div class="card">
        <div class="section-title">
          <span>Stock bajo</span>
          <a href="#" class="muted" style="font-size:12px;" id="ver-stock">Ver stock →</a>
        </div>
        ${stockBajo.length === 0 ? `<div class="empty-state"><div class="big">✓</div>Todo el stock está en niveles saludables.</div>` : `
        <div class="table-wrap">
        <table>
          <thead><tr><th>Artículo</th><th>Talle</th><th>Color</th><th class="text-right">Stock</th></tr></thead>
          <tbody>
            ${stockBajo.slice(0, 6).map(v => `
              <tr>
                <td>${escapeHtml(v.productos?.articulo || '')} — ${escapeHtml(v.productos?.nombre || '')}</td>
                <td>${escapeHtml(v.talle)}</td>
                <td>${escapeHtml(v.color)}</td>
                <td class="text-right"><span class="badge badge-low">${v.stock}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
        <div class="muted" style="font-size:12px;margin-top:8px;">${totalUnidadesStock} unidades en stock total.</div>`}
      </div>
    </div>
  `;

  document.getElementById('dash-nueva-venta').addEventListener('click', () => openVentaModal());
  document.getElementById('ver-todas-ventas').addEventListener('click', (e) => { e.preventDefault(); goToPage('ventas'); });
  document.getElementById('ver-stock').addEventListener('click', (e) => { e.preventDefault(); goToPage('stock'); });
}

function goToPage(page) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.page === page));
  state.page = page;
  renderPage(page);
}
