// ============================================================
// ESTADÍSTICAS Y PROYECCIONES
// ============================================================
let chartInstances = {};

function destroyCharts() {
  Object.values(chartInstances).forEach(c => c && c.destroy());
  chartInstances = {};
}

function renderEstadisticas() {
  const content = document.getElementById('page-content');
  destroyCharts();

  // Agrupar ventas por mes (últimos 12 meses con datos)
  const porMes = {};
  state.ventas.forEach(v => {
    const mes = v.fecha.slice(0, 7);
    if (!porMes[mes]) porMes[mes] = { oficial: 0, otras: 0, total: 0 };
    porMes[mes][v.tipo_factura] += Number(v.total);
    porMes[mes].total += Number(v.total);
  });
  const mesesOrdenados = Object.keys(porMes).sort();
  const ultimosMeses = mesesOrdenados.slice(-12);

  // Proyección simple: promedio móvil de los últimos 3 meses con datos
  const last3 = ultimosMeses.slice(-3).map(m => porMes[m].total);
  const promedioMovil = last3.length > 0 ? last3.reduce((a, b) => a + b, 0) / last3.length : 0;

  // tendencia (regresión lineal simple sobre los últimos meses)
  let proyeccionTendencia = promedioMovil;
  if (ultimosMeses.length >= 2) {
    const ys = ultimosMeses.map(m => porMes[m].total);
    const n = ys.length;
    const xs = ys.map((_, i) => i);
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
    const sumX2 = xs.reduce((s, x) => s + x * x, 0);
    const denom = (n * sumX2 - sumX * sumX);
    const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / n;
    proyeccionTendencia = Math.max(0, slope * n + intercept);
  }

  // Productos más vendidos (por cantidad)
  const productoQty = {};
  state.ventas.forEach(v => {
    (v.venta_items || []).forEach(it => {
      productoQty[it.descripcion] = (productoQty[it.descripcion] || 0) + it.cantidad;
    });
  });
  const topProductos = Object.entries(productoQty).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Ventas por categoría
  const categoriaTotal = {};
  state.ventas.forEach(v => {
    (v.venta_items || []).forEach(it => {
      const variante = state.variantes.find(va => va.id === it.variante_id);
      const cat = variante?.productos?.categoria || 'Otro';
      categoriaTotal[cat] = (categoriaTotal[cat] || 0) + Number(it.subtotal);
    });
  });

  content.innerHTML = `
    <div class="page-header">
      <div>
        <div class="eyebrow">Análisis</div>
        <h1 class="page-title">Estadísticas y proyecciones</h1>
      </div>
    </div>

    <div class="grid grid-3" style="margin-bottom:18px;">
      <div class="stat-card">
        <div class="stat-label">Promedio móvil (3 meses)</div>
        <div class="stat-value">${fmtMoney(promedioMovil)}</div>
        <div class="stat-sub">Base para proyección simple</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Proyección próximo mes</div>
        <div class="stat-value">${fmtMoney(proyeccionTendencia)}</div>
        <div class="stat-sub">Según tendencia reciente</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">DGI proyectado próximo mes</div>
        <div class="stat-value">${fmtMoney(proyeccionTendencia * 0.033)}</div>
        <div class="stat-sub">Estimado, asumiendo % oficial actual</div>
      </div>
    </div>

    <div class="chart-card" style="margin-bottom:18px;">
      <div class="section-title">Facturación mensual — Oficial vs. Otras</div>
      <div class="chart-wrap"><canvas id="chart-mensual"></canvas></div>
    </div>

    <div class="grid grid-2">
      <div class="chart-card">
        <div class="section-title">Productos más vendidos (unidades)</div>
        <div class="chart-wrap"><canvas id="chart-productos"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="section-title">Facturación por categoría</div>
        <div class="chart-wrap"><canvas id="chart-categoria"></canvas></div>
      </div>
    </div>
  `;

  if (ultimosMeses.length === 0) {
    document.querySelector('.chart-card').innerHTML = `<div class="section-title">Facturación mensual</div><div class="empty-state"><div class="big">—</div>Todavía no hay suficientes ventas para mostrar estadísticas.</div>`;
    return;
  }

  // Chart 1: facturación mensual
  const ctx1 = document.getElementById('chart-mensual');
  chartInstances.mensual = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: ultimosMeses.map(m => monthLabel(m + '-01')),
      datasets: [
        { label: 'Oficial', data: ultimosMeses.map(m => porMes[m].oficial), backgroundColor: '#181715' },
        { label: 'Otras', data: ultimosMeses.map(m => porMes[m].otras), backgroundColor: '#D9D6D0' },
      ]
    },
    options: chartBaseOptions(true)
  });

  // Chart 2: productos top
  const ctx2 = document.getElementById('chart-productos');
  chartInstances.productos = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: topProductos.map(p => p[0].length > 28 ? p[0].slice(0, 28) + '…' : p[0]),
      datasets: [{ label: 'Unidades', data: topProductos.map(p => p[1]), backgroundColor: '#181715' }]
    },
    options: { ...chartBaseOptions(false), indexAxis: 'y' }
  });

  // Chart 3: categoría
  const ctx3 = document.getElementById('chart-categoria');
  const catLabels = Object.keys(categoriaTotal);
  chartInstances.categoria = new Chart(ctx3, {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets: [{
        data: catLabels.map(c => categoriaTotal[c]),
        backgroundColor: ['#181715', '#5C5A54', '#9A9690', '#D9D6D0', '#ECEAE6'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { family: 'Archivo' }, color: '#5C5A54' } } }
    }
  });
}

function chartBaseOptions(stacked) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: stacked, grid: { display: false }, ticks: { font: { family: 'Archivo' }, color: '#5C5A54' } },
      y: { stacked: stacked, grid: { color: '#E6E3DD' }, ticks: { font: { family: 'Archivo' }, color: '#5C5A54' } },
    },
    plugins: {
      legend: { display: stacked, position: 'bottom', labels: { font: { family: 'Archivo' }, color: '#5C5A54' } }
    }
  };
}
