# XMA Admin — Guía del proyecto

## Qué es este proyecto

Panel de administración interno para **XMA**, una marca uruguaya de indumentaria.
Permite gestionar ventas, stock, clientes, vendedores y reportes de DGI.

## Stack

- **Frontend:** HTML + CSS + JS vanilla (sin frameworks, sin bundler)
- **Backend / DB:** [Supabase](https://supabase.com) (PostgreSQL + Auth)
- **Gráficos:** Chart.js 4.x (CDN)
- **Fuentes:** Montserrat + Archivo (Google Fonts)
- **Contexto local:** Uruguay — moneda $U, impuestos DGI (3.3% sobre facturación oficial)

## Estructura de archivos

```
xma-admin/
├── index.html          # Shell HTML + login + nav
├── css/
│   └── styles.css      # Todos los estilos (design tokens, componentes, responsive)
└── js/
    ├── app.js          # Config Supabase, estado global, auth, navegación, helpers
    ├── dashboard.js    # Resumen del mes: facturación, stock bajo, comisiones
    ├── ventas.js       # ABM de ventas, ítems por venta, filtros
    ├── stock.js        # ABM de productos y variantes (talle/color)
    ├── clientes.js     # ABM de clientes
    ├── vendedores.js   # ABM de vendedores con % de comisión
    ├── estadisticas.js # Gráficos históricos con Chart.js
    └── dgi.js          # Reporte DGI: 3.3% sobre ventas con factura oficial
```

## Base de datos (Supabase)

Tablas principales:

| Tabla | Descripción |
|---|---|
| `productos` | Artículo, nombre, línea, categoría, precio base |
| `variantes` | Talle, color, stock, precio (hereda de producto) |
| `clientes` | Nombre, datos de contacto, vendedor habitual |
| `vendedores` | Nombre, porcentaje de comisión |
| `ventas` | Fecha, cliente, vendedor, tipo de factura (oficial/otras), total, notas |
| `venta_items` | Ítems de cada venta: variante, cantidad, precio unitario, subtotal |

## Estado global (`state` en app.js)

Todos los datos se cargan una sola vez al login con `loadAllData()` y se guardan en el objeto `state`:

```js
state.productos   // []
state.variantes   // [] — incluye join con productos
state.clientes    // [] — incluye join con vendedores
state.vendedores  // []
state.ventas      // [] — incluye join con clientes, vendedores y venta_items
```

Para refrescar después de un cambio: `await refreshAndRender()`.

## Helpers globales (app.js)

| Función | Uso |
|---|---|
| `fmtMoney(n)` | Formatea como `$U 1.234` |
| `fmtMoneyDec(n)` | Formatea con 2 decimales |
| `fmtDate(d)` | Formatea fecha ISO a `dd/mm/yyyy` |
| `todayISO()` | Fecha de hoy como `YYYY-MM-DD` |
| `showToast(msg, isError)` | Muestra notificación flotante |
| `escapeHtml(str)` | Escapa HTML para evitar XSS |
| `openModal(html)` | Abre modal con contenido dinámico |
| `closeModal()` | Cierra el modal activo |

## Convenciones

- **No usar frameworks.** Todo el JS es vanilla.
- **No hay bundler.** Los archivos se sirven directamente (o via GitHub Pages / Netlify).
- **Cada módulo `.js` exporta una función `render<Nombre>()`** que escribe en `#page-content`.
- **El CSS vive íntegramente en `css/styles.css`** — no agregar estilos inline salvo casos puntuales de layout dinámico.
- **Los modales se construyen con `openModal(htmlString)`** — no crear overlays propios.
- **Siempre escapar contenido de usuario con `escapeHtml()`** antes de insertar en el DOM.

## Cómo correr el proyecto localmente

No requiere build. Alcanza con un servidor estático:

```bash
npx serve .
# o
python3 -m http.server 8080
```

Abrir `http://localhost:8080`.

> No abrir `index.html` directamente como `file://` — los módulos JS pueden fallar por CORS.

## Credenciales de desarrollo

Las credenciales de Supabase están hardcodeadas en `js/app.js` (publishable key — es pública por diseño de Supabase). No hay variables de entorno.
