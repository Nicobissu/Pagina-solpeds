# Guía de Despliegue - Frontend (Hostinger) + Backend (Render)

## Arquitectura del Despliegue

Este proyecto está configurado para desplegarse de forma separada:
- **Frontend (React)** → Hostinger (archivos estáticos)
- **Backend (Express API)** → Render (servicio web)

---

## 1. Despliegue del Backend en Render

### Paso 1: Preparar el Repositorio

Primero, sube los cambios a GitHub:

```bash
git add .
git commit -m "Configuración para despliegue separado"
git push origin main
```

### Paso 2: Crear el Servicio en Render

**Opción A: Usando Blueprint (Automático - Recomendado)**

1. Ve a https://dashboard.render.com/
2. Click en "New +" → "Blueprint"
3. Conecta tu repositorio de GitHub
4. Render detectará el archivo `render.yaml`
5. **IMPORTANTE:** Antes de hacer "Apply", edita la variable de entorno:
   - Cambia `FRONTEND_URL` de `https://tu-dominio-en-hostinger.com` a tu dominio real
6. Click en "Apply"

**Opción B: Manual**

1. Ve a https://dashboard.render.com/
2. Click en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name:** `solpeds-backend`
   - **Region:** Oregon (Free)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

5. **Variables de Entorno:**
   ```
   NODE_ENV=production
   JWT_SECRET=genera-un-secreto-muy-seguro-aqui
   DATABASE_PATH=database.sqlite
   FRONTEND_URL=https://tu-dominio-en-hostinger.com
   ```

6. Click en "Create Web Service"

### Paso 3: Obtener la URL del Backend

Una vez desplegado, Render te dará una URL como:
```
https://solpeds-backend-xxxx.onrender.com
```

**Guarda esta URL**, la necesitarás para el frontend.

---

## 2. Despliegue del Frontend en Hostinger

### Paso 1: Configurar Variables de Entorno

Crea un archivo `.env.production` en la raíz del proyecto:

```env
VITE_API_URL=https://solpeds-backend-xxxx.onrender.com/api
```

Reemplaza `solpeds-backend-xxxx.onrender.com` con la URL real de tu backend en Render.

### Paso 2: Construir el Frontend

Desde la raíz del proyecto, ejecuta:

```bash
npm run build
```

Esto generará una carpeta `dist/` con los archivos compilados.

### Paso 3: Subir a Hostinger

**Opción A: Via FTP/SFTP**

1. Conéctate a tu servidor Hostinger via FTP (usa FileZilla, WinSCP, o similar)
2. Navega a la carpeta `public_html` o la carpeta de tu dominio
3. Sube TODO el contenido de la carpeta `dist/`:
   ```
   dist/
   ├── index.html
   ├── assets/
   │   ├── index-xxxx.js
   │   ├── index-xxxx.css
   │   └── ...
   └── ...
   ```
4. Asegúrate de que `index.html` esté en la raíz de tu dominio

**Opción B: Via File Manager de Hostinger**

1. Inicia sesión en hPanel de Hostinger
2. Ve a "Archivos" → "Administrador de Archivos"
3. Navega a `public_html` o la carpeta de tu dominio
4. Sube todos los archivos de la carpeta `dist/`

### Paso 4: Configurar .htaccess (Importante para SPA)

Crea o edita el archivo `.htaccess` en la raíz de tu dominio con este contenido:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Configuración de caché
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

Este archivo asegura que:
- Las rutas de React Router funcionen correctamente (SPA routing)
- Los archivos estáticos se cacheen apropiadamente

---

## 3. Actualizar CORS en Render

Después de obtener tu dominio final en Hostinger, actualiza la variable de entorno en Render:

1. Ve a tu servicio en Render
2. Click en "Environment"
3. Edita `FRONTEND_URL` con tu dominio real:
   ```
   FRONTEND_URL=https://tu-dominio.com
   ```
4. El servicio se reiniciará automáticamente

---

## 4. Verificación

### Backend (Render)
Visita: `https://tu-backend.onrender.com/api/health`

Deberías ver:
```json
{
  "status": "ok",
  "message": "Servidor funcionando correctamente",
  "env": "production"
}
```

### Frontend (Hostinger)
1. Visita tu dominio: `https://tu-dominio.com`
2. Deberías ver la página de login
3. Abre las DevTools del navegador (F12) → Console
4. No debería haber errores de CORS
5. Intenta hacer login con `admin` / `admin`

---

## Desarrollo Local

### Backend
```bash
cd backend
npm run dev
```
Corre en: http://localhost:3001

### Frontend
```bash
npm run dev
```
Corre en: http://localhost:5173

### Ambos simultáneamente
```bash
npm start
```

---

## Estructura de Archivos

```
Pagina-solpeds/
├── backend/                 # Backend (se despliega en Render)
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── server.js
│   ├── .env                # Variables locales
│   └── package.json
├── src/                    # Frontend (se construye para Hostinger)
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── ...
├── dist/                   # Build del frontend (subir a Hostinger)
├── .env                    # Variables frontend (local)
├── .env.production         # Variables frontend (producción) - CREAR ESTE
├── render.yaml             # Config de Render
├── vite.config.js
└── package.json
```

---

## Variables de Entorno

### Backend (.env en Render)
```env
NODE_ENV=production
JWT_SECRET=tu-secreto-muy-seguro
DATABASE_PATH=database.sqlite
FRONTEND_URL=https://tu-dominio-en-hostinger.com
```

### Frontend (.env.production - local, antes de build)
```env
VITE_API_URL=https://tu-backend.onrender.com/api
```

---

## Actualizar la Aplicación

### Actualizar Backend
1. Haz cambios en el código
2. Commit y push a GitHub:
   ```bash
   git add .
   git commit -m "Actualización del backend"
   git push origin main
   ```
3. Render desplegará automáticamente

### Actualizar Frontend
1. Haz cambios en el código
2. Actualiza `.env.production` si es necesario
3. Construye nuevamente:
   ```bash
   npm run build
   ```
4. Sube la carpeta `dist/` a Hostinger (reemplaza los archivos anteriores)

---

## Troubleshooting

### Error de CORS
**Síntoma:** En el navegador ves errores como "CORS policy: No 'Access-Control-Allow-Origin'"

**Solución:**
1. Verifica que `FRONTEND_URL` en Render coincida EXACTAMENTE con tu dominio
2. Incluye `https://` o `http://` según corresponda
3. NO incluyas barra final (`/`) al final de la URL

### El frontend muestra página en blanco
**Solución:**
1. Abre DevTools (F12) → Console
2. Busca errores de red o JavaScript
3. Verifica que `VITE_API_URL` en `.env.production` sea correcto
4. Asegúrate de haber creado el archivo `.htaccess`

### Las rutas del frontend no funcionan (404)
**Solución:**
1. Verifica que el archivo `.htaccess` esté en la raíz de tu dominio
2. Asegúrate de que el servidor Apache tenga `mod_rewrite` habilitado (Hostinger lo tiene por defecto)

### El backend no responde
**Solución:**
1. Revisa los logs en Render Dashboard
2. Verifica que el servicio esté "Running"
3. El plan gratuito puede tardar hasta 1 minuto en "despertar" si no se usa

### Base de datos se reinicia
**Nota:** El plan gratuito de Render NO persiste archivos. Los datos se pierden al reiniciar.

**Opciones:**
- Plan Starter de Render ($7/mes): Incluye disco persistente
- Migrar a PostgreSQL (Render ofrece PostgreSQL gratis)

---

## Comandos Útiles

```bash
# Desarrollo local completo
npm start

# Solo backend en desarrollo
npm run backend:dev

# Solo frontend en desarrollo
npm run dev

# Construir frontend para producción
npm run build

# Preview local del build de producción
npm run preview

# Inicializar base de datos (backend)
npm run backend:init
```

---

## Costos

- **Render (Backend):** Gratis (con limitaciones)
- **Hostinger (Frontend):** Según tu plan de hosting actual

### Limitaciones del Plan Gratuito de Render:
- 750 horas de servicio por mes
- El servicio se "duerme" después de 15 minutos de inactividad
- Primer request después de dormir tarda ~30 segundos
- No hay persistencia de archivos (base de datos se reinicia)

---

## Seguridad

Antes de ir a producción:

1. ✅ Cambia `JWT_SECRET` a un valor seguro y aleatorio
2. ✅ Verifica que `FRONTEND_URL` esté correctamente configurado
3. ⚠️ Los archivos `.env` NO deben subirse a Git (ya están en `.gitignore`)
4. ⚠️ Considera usar variables de entorno de Hostinger si están disponibles

---

## Próximos Pasos Recomendados

1. **SSL/HTTPS:** Ambos servicios (Render y Hostinger) deberían ofrecer HTTPS automático
2. **Dominio Personalizado:** Configura tu dominio en Hostinger
3. **Monitoreo:** Configura notificaciones en Render para saber si el servicio falla
4. **Backups:** Considera exportar la base de datos periódicamente (plan gratuito)

---

¡Listo! Tu aplicación debería estar funcionando con frontend en Hostinger y backend en Render. 🚀
