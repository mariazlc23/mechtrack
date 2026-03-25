# 🔧 MechTrack

Sistema de gestión y seguimiento para talleres mecánicos. Conecta con Google Sheets como base de datos.

## ✨ Funcionalidades

- **Dashboard** — Panel principal con KPIs en tiempo real
- **Órdenes de Trabajo** — CRUD completo con filtros y búsqueda
- **Gestión de Equipos** — Inventario con alertas de mantenimiento
- **Registro de Tiempo** — Clock In / Clock Out por mecánico y orden
- **Reportes** — Gráficas de horas, estado de órdenes, top equipos
- **Responsive** — Funciona en móvil y escritorio
- **Modo Demo** — Datos de ejemplo sin configuración previa

---

## 🚀 Instalación rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Arrancar en modo demo (sin Google Sheets)
npm start
```

La app abre en http://localhost:3000 con datos de ejemplo.

---

## 🔗 Conectar con Google Sheets

### Paso 1 — Crear el Spreadsheet

Crea un Google Sheet con **4 pestañas** (tabs) con exactamente estos nombres:

| Tab | Columnas requeridas |
|-----|---------------------|
| `Mechanics` | id, name, role, phone, active |
| `Equipment` | id, name, type, serial, status, lastService, nextService |
| `WorkOrders` | id, equipmentId, equipmentName, title, status, priority, mechanicId, mechanicName, createdAt, completedAt |
| `TimeEntries` | id, workOrderId, mechanicId, mechanicName, clockIn, clockOut, hours, notes, billable |

### Paso 2 — Google Cloud Console

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto nuevo (o usa uno existente)
3. Activa la **Google Sheets API**
4. En "Credenciales" crea:
   - **API Key** → cópiala como `REACT_APP_GOOGLE_API_KEY`
   - **OAuth 2.0 Client ID** (tipo: Web) → cópialo como `REACT_APP_GOOGLE_CLIENT_ID`
     - Agrega `http://localhost:3000` en "Orígenes autorizados"

### Paso 3 — Configurar .env

```env
REACT_APP_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
REACT_APP_GOOGLE_API_KEY=AIzaSy...
REACT_APP_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

### Paso 4 — Reiniciar

```bash
npm start
```

Al iniciar la app pedirá autorización de Google para escribir en tu Sheet.

---

## 🌐 Deploy gratuito en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Agregar variables de entorno en vercel.com → tu proyecto → Settings → Env Variables
```

---

## 🗂️ Estructura del proyecto

```
mechtrack/
├── src/
│   ├── lib/
│   │   ├── sheets.js        # Integración Google Sheets API
│   │   ├── DataContext.js   # Estado global + acciones
│   │   └── demoData.js      # Datos de ejemplo
│   ├── pages/
│   │   ├── Dashboard.js
│   │   ├── WorkOrders.js
│   │   ├── Equipment.js
│   │   ├── TimeTracking.js
│   │   └── Reports.js
│   ├── App.js               # Shell, navegación, rutas
│   └── index.css            # Design system industrial
├── public/
│   └── index.html
├── .env.example
└── package.json
```

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|------------|-----|
| React 18 | UI framework |
| React Router 6 | Navegación |
| Recharts | Gráficas |
| date-fns | Manejo de fechas |
| Lucide React | Iconos |
| Google Sheets API v4 | Base de datos |
| Google Identity Services | Auth OAuth2 |

---

## 📝 Licencia

MIT — Úsalo libremente para tu taller.
