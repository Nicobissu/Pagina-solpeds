# Arquitectura de Despliegue

## Separación Frontend-Backend

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIO                              │
│                  (Navegador)                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 │
        ┌────────┴─────────┐
        │                  │
        ▼                  ▼
┌──────────────┐    ┌──────────────┐
│   FRONTEND   │    │   BACKEND    │
│  (Hostinger) │◄───┤   (Render)   │
│              │    │              │
│  React App   │    │  Express API │
│  (Estático)  │    │   + SQLite   │
└──────────────┘    └──────────────┘
  tu-dominio.com    backend.onrender.com
```

---

## ¿Por Qué Esta Arquitectura?

### Ventajas

1. **Separación de Responsabilidades**
   - Frontend: Solo servir archivos estáticos (HTML, CSS, JS)
   - Backend: Lógica de negocio, base de datos, autenticación

2. **Optimización de Costos**
   - Hostinger: Hosting compartido económico, perfecto para estáticos
   - Render: Plan gratuito para API con bajo tráfico

3. **Escalabilidad Independiente**
   - Puedes escalar frontend y backend por separado
   - Cambiar uno sin afectar el otro

4. **Seguridad**
   - Base de datos no accesible directamente desde internet
   - API puede tener rate limiting y autenticación
   - Frontend no expone credenciales

### Desventajas

1. **Configuración más compleja**
   - Necesitas configurar CORS
   - Dos despliegues separados

2. **Latencia adicional**
   - Cada request del frontend hace una llamada de red al backend
   - Mitigable con caché

---

## Flujo de Datos

### 1. Usuario visita la página

```
Usuario → https://tu-dominio.com
         ↓
    Hostinger devuelve index.html + assets
         ↓
    React App se carga en el navegador
```

### 2. Usuario hace login

```
React App (navegador)
    ↓
    POST /api/auth/login
    ↓
https://backend.onrender.com/api/auth/login
    ↓
Express valida credenciales
    ↓
Devuelve JWT token
    ↓
React guarda token en localStorage
```

### 3. Usuario solicita datos

```
React App (navegador)
    ↓
    GET /api/pedidos
    + Authorization: Bearer <token>
    ↓
https://backend.onrender.com/api/pedidos
    ↓
Express valida token
    ↓
Consulta SQLite
    ↓
Devuelve datos JSON
    ↓
React renderiza en UI
```

---

## Configuración de CORS

### ¿Qué es CORS?

Cross-Origin Resource Sharing permite que tu frontend (en Hostinger) haga peticiones a tu backend (en Render), que están en diferentes dominios.

### Configuración Actual

En [backend/server.js](backend/server.js:33-45):

```javascript
const allowedOrigins = [
  'http://localhost:5173', // Desarrollo
  process.env.FRONTEND_URL // Producción (Hostinger)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

**Importante:** `FRONTEND_URL` en Render DEBE coincidir EXACTAMENTE con tu dominio de Hostinger.

---

## Variables de Entorno

### Frontend

**Desarrollo (`.env`):**
```env
VITE_API_URL=http://localhost:3001/api
```

**Producción (`.env.production`):**
```env
VITE_API_URL=https://tu-backend.onrender.com/api
```

Las variables `VITE_*` se reemplazan en tiempo de BUILD, no en runtime.

### Backend

**Desarrollo (`backend/.env`):**
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=desarrollo-secreto
DATABASE_PATH=database.sqlite
FRONTEND_URL=http://localhost:5173
```

**Producción (Render Environment Variables):**
```env
NODE_ENV=production
JWT_SECRET=<generado-por-render>
DATABASE_PATH=database.sqlite
FRONTEND_URL=https://tu-dominio.com
```

---

## Ciclo de Desarrollo → Producción

### Desarrollo Local

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Vite hace proxy de `/api` → backend
- Hot reload en ambos

### Build para Producción

```bash
# Asegúrate de tener .env.production
npm run build
# Genera dist/ con archivos estáticos
```

### Deploy

```bash
# Backend (automático)
git push origin main → Render detecta y despliega

# Frontend (manual)
npm run build → Sube dist/ a Hostinger
```

---

## Estructura de Archivos

```
Pagina-solpeds/
│
├── backend/                    # Deploy → Render
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── server.js              # Entry point
│   ├── package.json
│   └── .env                   # Git ignored
│
├── src/                       # Deploy → Hostinger (compilado)
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   ├── services/
│   │   └── api.js            # Usa VITE_API_URL
│   ├── App.jsx
│   └── main.jsx
│
├── dist/                      # Generado por build
│   ├── index.html             # ← Esto sube a Hostinger
│   └── assets/
│
├── .env                       # Frontend local (Git ignored)
├── .env.production            # Frontend producción (Git ignored)
├── .env.example               # Template
├── vite.config.js             # Build config
├── render.yaml                # Render config
├── .htaccess.example          # Para Hostinger
│
└── Documentación/
    ├── DEPLOY.md              # Guía completa
    ├── RESUMEN_DEPLOY.md      # Quick start
    ├── HOSTINGER_SETUP.md     # Específico Hostinger
    └── DEPLOYMENT_ARCHITECTURE.md  # Este archivo
```

---

## Ventajas de Esta Configuración

### ✅ Seguridad

- Base de datos no expuesta públicamente
- Autenticación centralizada en backend
- CORS protege contra peticiones no autorizadas
- HTTPS en ambos lados

### ✅ Performance

- Frontend sirve archivos estáticos (muy rápido)
- CDN puede cachear assets
- Backend solo procesa API calls

### ✅ Mantenibilidad

- Código separado por responsabilidad
- Deploy independiente
- Fácil de debuggear (logs separados)

### ✅ Escalabilidad

- Frontend puede servirse desde CDN
- Backend puede escalar verticalmente u horizontalmente
- Fácil agregar load balancer al backend

---

## Alternativas Consideradas

### ❌ Todo en Render

**Por qué no:**
- Plan gratuito tiene limitaciones de horas
- No aprovecha tu hosting de Hostinger existente
- Más complejo hacer SSR con React

### ❌ Todo en Hostinger

**Por qué no:**
- Hosting compartido no es ideal para Node.js
- Limitaciones de recursos para el backend
- Difícil configurar y mantener Node.js

### ✅ Separado (Actual)

**Por qué sí:**
- Aprovecha lo mejor de cada servicio
- Hostinger → archivos estáticos (su fortaleza)
- Render → aplicaciones Node.js (su especialidad)

---

## Próximos Pasos (Opcional)

### Mejoras Futuras

1. **CDN para Frontend**
   - Cloudflare en frente de Hostinger
   - Caché global, mejor rendimiento

2. **Base de Datos Persistente**
   - PostgreSQL en Render (gratuito)
   - Migrar de SQLite

3. **CI/CD**
   - GitHub Actions para testing
   - Deploy automático a Hostinger

4. **Monitoring**
   - Sentry para errores
   - Google Analytics para uso

5. **Backups**
   - Backup automático de base de datos
   - Versionado de archivos

---

## FAQ

**¿Por qué no usar un monorepo?**
- Está bien tenerlo separado para deploys independientes
- Pero podría unificarse si se desea

**¿El frontend puede acceder directamente a la BD?**
- No, y no debería. Seguridad básica

**¿Qué pasa si Render se duerme?**
- Primer request tarda ~30s en despertar
- Requests siguientes son normales
- Solución: Plan pago o ping regular

**¿Necesito HTTPS?**
- Sí, ambos servicios lo proveen gratis
- Necesario para cookies seguras y JWT

---

Esta arquitectura es estándar en aplicaciones modernas (JAMstack) y escala bien. 🚀
