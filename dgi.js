// ============================================================
// DGI — Cálculo mensual del 3,3% sobre facturación oficial
// ============================================================
function renderDGI() {
  const content = document.getElementById('page-content');

  const porMes = {};
  state.ventas.forEach(v => {
    const mes = v.fecha.slice(0, 7);
    if (!porMes[mes]) porMes[mes] = { oficial: 0, otras: 0 };
    porMes[mes][v.tipo_factura] += Number(v.total);
  });
  const meses = Object.keys(porMes).sort().reverse();

  const now = new Date();
  const monthStart = now.toISOString().slice(0, 7);
  const mesActual = porMes[monthStart] || { oficial: 0, otras: 0 };
  const dgiMesActual = mesActual.oficial * 0.033;

  content.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">Impuestos</div>
        <h1 class="page-title">DGI mensual</h1>
      </div>
    </div>

    <div class="grid grid-3" style="margin-bottom:24px;">
      <div class="stat-card">
        <div class="stat-label">Facturado oficial — este mes</div>
        <div class="stat-value">${fmtMoney(mesActual.oficial)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">A pagar este mes (3,3%)</div>
        <div class="stat-value">${fmtMoney(dgiMesActual)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Acumulado del año</div>
        <div class="stat-value">${fmtMoney(meses.filter(m => m.startsWith(String(now.getFullYear()))).reduce((s, m) => s + porMes[m].oficial * 0.033, 0))}</div>
      </div>
    </div>

    <div class="card" style="padding:0;">
      <div style="padding:20px 24px 0;">
        <div class="section-title">Detalle por mes</div>
      </div>
      <div class="table-wrap">
        ${meses.length === 0 ? `<div class="empty-state"><div class="big">—</div>Todavía no hay ventas registradas.</div>` : `
        <table>
          <thead>
            <tr>
              <th>Mes</th>
              <th class="text-right">Facturado oficial</th>
              <th class="text-right">Facturado otras</th>
              <th class="text-right">Total</th>
              <th class="text-right">DGI a pagar (3,3%)</th>
            </tr>
          </thead>
          <tbody>
            ${meses.map(m => `
              <tr>
                <td style="text-transform:capitalize;">${monthLabel(m + '-01')}</td>
                <td class="text-right mono">${fmtMoney(porMes[m].oficial)}</td>
                <td class="text-right mono muted">${fmtMoney(porMes[m].otras)}</td>
                <td class="text-right mono">${fmtMoney(porMes[m].oficial + porMes[m].otras)}</td>
                <td class="text-right mono" style="font-weight:600;">${fmtMoney(porMes[m].oficial * 0.033)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`}
      </div>
    </div>
    <div class="muted" style="font-size:12px;margin-top:14px;">
      El cálculo del DGI se aplica únicamente sobre las ventas marcadas como factura "oficial". Las ventas de tipo "otras" no se incluyen en esta base.
    </div>
  `;
}
