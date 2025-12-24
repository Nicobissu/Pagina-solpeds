# 🗄️ Sistema de Base de Datos - Guía Completa

## 📋 Descripción

Este proyecto ahora incluye un **backend completo** con base de datos SQLite, API REST y autenticación JWT.

### Tecnologías Implementadas

**Backend:**
- Node.js + Express
- SQLite (base de datos)
- JWT (autenticación)
- bcryptjs (encriptación de contraseñas)
- better-sqlite3 (driver de base de datos)

**Frontend:**
- React 18
- Vite
- React Router
- Integración completa con API REST

---

## 🚀 Instalación y Configuración

### Opción 1: Instalación Automática (Recomendada)

```bash
# Instalar todas las dependencias y configurar la base de datos
npm run setup
```

Este comando hará:
1. Instalar dependencias del frontend
2. Instalar dependencias del backend
3. Crear y poblar la base de datos con datos de prueba

### Opción 2: Instalación Manual

```bash
# 1. Instalar dependencias del frontend
npm install

# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Inicializar la base de datos
npm run init-db

# 4. Volver a la raíz
cd ..
```

---

## ▶️ Ejecutar el Proyecto

### Opción 1: Ejecutar Todo Junto (Recomendada)

```bash
# Ejecuta frontend y backend simultáneamente
npm run start:all
```

Esto iniciará:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001

### Opción 2: Ejecutar por Separado

**Terminal 1 - Backend:**
```bash
npm run backend:dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

---

## 👥 Usuarios de Prueba

La base de datos viene con estos usuarios pre-configurados:

| Usuario | Contraseña | Rol           |
|---------|------------|---------------|
| admin   | admin      | Administrador |
| juan    | juan       | Usuario       |
| luis    | luis       | Usuario       |
| carlos  | carlos     | Usuario       |
| ana     | ana        | Usuario       |
| sofia   | sofia      | Usuario       |

---

## 📡 API Endpoints

### Autenticación

```
POST   /api/auth/login          - Iniciar sesión
POST   /api/auth/register       - Registrar nuevo usuario
GET    /api/auth/verify         - Verificar token
```

### Pedidos

```
GET    /api/pedidos             - Obtener todos los pedidos
GET    /api/pedidos/:id         - Obtener pedido por ID
POST   /api/pedidos             - Crear nuevo pedido
PUT    /api/pedidos/:id         - Actualizar pedido
DELETE /api/pedidos/:id         - Eliminar pedido
POST   /api/pedidos/:id/comentarios - Agregar comentario
```

### Compras

```
GET    /api/compras             - Obtener todas las compras
GET    /api/compras/:id         - Obtener compra por ID
POST   /api/compras             - Crear nueva compra
PUT    /api/compras/:id         - Actualizar compra
DELETE /api/compras/:id         - Eliminar compra
```

### Notificaciones

```
GET    /api/notificaciones      - Obtener notificaciones del usuario
POST   /api/notificaciones      - Crear notificación
PUT    /api/notificaciones/:id/leida - Marcar como leída
PUT    /api/notificaciones/marcar-todas-leidas - Marcar todas como leídas
DELETE /api/notificaciones/:id  - Eliminar notificación
```

---

## 🗃️ Estructura de la Base de Datos

### Tabla: usuarios
```sql
- id (INTEGER, PK, AUTOINCREMENT)
- username (TEXT, UNIQUE)
- password (TEXT, hash bcrypt)
- nombre (TEXT)
- rol (TEXT: 'admin' | 'user')
- avatar (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### Tabla: pedidos
```sql
- id (INTEGER, PK, AUTOINCREMENT)
- cliente (TEXT)
- estado (TEXT)
- fecha (DATE)
- obra (TEXT)
- descripcion (TEXT)
- monto (DECIMAL)
- solicitante_id (INTEGER, FK -> usuarios)
- fotos (INTEGER)
- urgente (BOOLEAN)
- incompleto (BOOLEAN)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### Tabla: pedido_comentarios
```sql
- id (INTEGER, PK, AUTOINCREMENT)
- pedido_id (INTEGER, FK -> pedidos)
- comentario (TEXT)
- created_at (DATETIME)
```

### Tabla: compras
```sql
- id (INTEGER, PK, AUTOINCREMENT)
- proveedor (TEXT)
- monto (DECIMAL)
- ticket (TEXT, nullable)
- fecha (DATE)
- obra (TEXT)
- descripcion (TEXT)
- estado (TEXT: 'Pendiente' | 'Subido')
- solicitante_id (INTEGER, FK -> usuarios)
- urgente (BOOLEAN)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### Tabla: notificaciones
```sql
- id (INTEGER, PK, AUTOINCREMENT)
- usuario_id (INTEGER, FK -> usuarios)
- tipo (TEXT: 'info' | 'warning' | 'success' | 'locked')
- titulo (TEXT)
- mensaje (TEXT)
- fecha (DATETIME)
- leida (BOOLEAN)
- icono (TEXT)
```

---

## 🔧 Comandos Útiles

```bash
# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
npm run backend:install

# Reinicializar base de datos (borra y crea datos de prueba)
npm run backend:init

# Ejecutar solo el backend
npm run backend:dev

# Ejecutar solo el frontend
npm run dev

# Ejecutar ambos simultáneamente
npm run start:all

# Build de producción del frontend
npm run build
```

---

## 🔐 Autenticación JWT

El sistema usa **JSON Web Tokens (JWT)** para autenticación:

1. Al hacer login, el servidor devuelve un token
2. El token se guarda en `localStorage`
3. Todas las peticiones a la API incluyen el token en el header:
   ```
   Authorization: Bearer <token>
   ```
4. El token expira en **24 horas**

---

## 📂 Estructura del Proyecto

```
Pagina-solpeds/
├── backend/                    # Backend Node.js
│   ├── config/
│   │   └── database.js        # Configuración de SQLite
│   ├── controllers/           # Lógica de negocio
│   │   ├── authController.js
│   │   ├── pedidosController.js
│   │   ├── comprasController.js
│   │   └── notificacionesController.js
│   ├── middleware/
│   │   └── auth.js           # Middleware de autenticación
│   ├── routes/               # Rutas de la API
│   │   ├── auth.js
│   │   ├── pedidos.js
│   │   ├── compras.js
│   │   └── notificaciones.js
│   ├── utils/
│   │   └── initDatabase.js   # Script de inicialización
│   ├── .env                  # Variables de entorno
│   ├── server.js             # Servidor Express
│   └── package.json
│
├── src/                       # Frontend React
│   ├── components/
│   ├── contexts/
│   │   └── AuthContext.jsx   # Contexto de autenticación (actualizado)
│   ├── services/
│   │   └── api.js            # Cliente API (nuevo)
│   ├── pages/
│   └── ...
│
├── .env                       # Variables de entorno del frontend
├── package.json              # Configuración principal
└── DATABASE_README.md        # Esta guía
```

---

## 🔄 Migrar Datos

Si quieres modificar los datos iniciales, edita el archivo:
```
backend/utils/initDatabase.js
```

Luego ejecuta:
```bash
npm run backend:init
```

---

## ⚙️ Variables de Entorno

### Backend (.env en /backend)
```env
PORT=3001
JWT_SECRET=tu_secreto_super_seguro_cambialo_en_produccion
NODE_ENV=development
DATABASE_PATH=./database.sqlite
```

### Frontend (.env en raíz)
```env
VITE_API_URL=http://localhost:3001/api
```

---

## 🐛 Solución de Problemas

### Error: "EADDRINUSE, puerto 3001 ya en uso"
```bash
# Encuentra el proceso usando el puerto
lsof -i :3001

# Mata el proceso
kill -9 <PID>
```

### Error: "Cannot find module 'better-sqlite3'"
```bash
# Instala las dependencias del backend
npm run backend:install
```

### Error: "Token inválido o expirado"
- Cierra sesión y vuelve a iniciar sesión
- El token expira en 24 horas

### La base de datos está corrupta
```bash
# Reinicia la base de datos
rm backend/database.sqlite
npm run backend:init
```

---

## 🚀 Próximos Pasos

Para pasar a producción:

1. **Cambiar a PostgreSQL/MySQL:**
   - Reemplaza `better-sqlite3` con `pg` o `mysql2`
   - Actualiza `config/database.js`

2. **Seguridad:**
   - Cambia `JWT_SECRET` a un valor aleatorio seguro
   - Implementa rate limiting
   - Configura CORS apropiadamente

3. **Deploy:**
   - Backend: Railway, Render, Heroku
   - Frontend: Vercel, Netlify
   - Base de datos: PostgreSQL en Supabase, Railway, etc.

4. **Funcionalidades adicionales:**
   - Upload de archivos (tickets, fotos)
   - WebSockets para notificaciones en tiempo real
   - Exportación a PDF/Excel
   - Sistema de roles y permisos más granular

---

## 📝 Notas Importantes

- La base de datos SQLite se guarda en: `backend/database.sqlite`
- Las contraseñas están encriptadas con bcrypt
- Los tokens JWT expiran en 24 horas
- SQLite es perfecto para desarrollo, pero considera PostgreSQL para producción
- El archivo `.env` no se sube a Git (está en `.gitignore`)

---

## 📞 Soporte

Si encuentras algún problema, verifica:
1. Que ambos servidores estén corriendo
2. Que las dependencias estén instaladas
3. Que la base de datos esté inicializada
4. Los logs en la consola del backend

---

¡Listo! Ahora tienes un sistema completo de gestión de pedidos y compras con base de datos real. 🎉
