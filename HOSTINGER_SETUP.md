# Configuración Específica para Hostinger

## Pasos para Subir el Frontend a Hostinger

### Método 1: File Manager (Navegador)

1. **Inicia sesión en hPanel**
   - Ve a https://hpanel.hostinger.com/

2. **Abre File Manager**
   - Menú lateral → "Archivos" → "Administrador de Archivos"
   - O busca "File Manager"

3. **Navega a la carpeta correcta**
   - Si es el dominio principal: `public_html/`
   - Si es un subdominio: `public_html/subdominio/`
   - Si es un addon domain: `public_html/tu-dominio.com/`

4. **Limpia la carpeta (opcional)**
   - Elimina archivos por defecto como `index.html` de Hostinger
   - **NO elimines** `.htaccess` si ya existe (edítalo)

5. **Sube los archivos**
   - Click en "Upload Files"
   - Arrastra TODOS los archivos de tu carpeta `dist/` LOCAL
   - O usa "Select Files" para seleccionarlos
   - Espera a que termine la carga

6. **Crea/Edita .htaccess**
   - Click en "New File"
   - Nombre: `.htaccess`
   - Copia el contenido de `.htaccess.example`
   - Guarda

7. **Verifica la estructura**
   Tu carpeta en Hostinger debe verse así:
   ```
   public_html/
   ├── index.html          ← del dist/
   ├── .htaccess           ← que creaste
   ├── assets/
   │   ├── index-xxxx.js
   │   ├── index-xxxx.css
   │   └── ...
   └── vite.svg (opcional)
   ```

---

### Método 2: FTP/SFTP (FileZilla)

1. **Obtén las credenciales FTP**
   - hPanel → "Archivos" → "Cuentas FTP"
   - O crea una nueva cuenta FTP

2. **Configura FileZilla**
   - Host: `ftp.tu-dominio.com` o IP del servidor
   - Usuario: tu usuario FTP
   - Contraseña: tu contraseña FTP
   - Puerto: 21 (FTP) o 22 (SFTP)

3. **Conecta**
   - Click en "Quickconnect"

4. **Navega**
   - Panel derecho (servidor): ve a `public_html/`
   - Panel izquierdo (local): ve a tu carpeta `dist/`

5. **Sube archivos**
   - Selecciona TODO en `dist/` (Ctrl+A)
   - Arrastra al panel derecho
   - Espera a que termine

6. **Sube .htaccess**
   - Crea un archivo `.htaccess` localmente con el contenido de `.htaccess.example`
   - Súbelo a `public_html/`

---

### Método 3: Git Deploy (Avanzado)

Si Hostinger lo soporta en tu plan:

1. **En hPanel**
   - Busca "Git" o "Git Deploy"

2. **Conecta tu repositorio**
   - URL: tu repositorio de GitHub
   - Branch: `main`
   - Path: `/public_html/`

3. **Configura Build Command**
   - `npm install && npm run build`

4. **Configura Deploy Command**
   - `cp -r dist/* ./`

**Nota:** No todos los planes de Hostinger incluyen Git Deploy.

---

## Variables de Entorno en Hostinger

### Opción 1: Archivo .env.production (Recomendado para Vite)

**ANTES de hacer `npm run build`**, crea localmente:

`.env.production`
```env
VITE_API_URL=https://tu-backend.onrender.com/api
```

Luego haz el build:
```bash
npm run build
```

Las variables se "queman" en el código compilado.

### Opción 2: Variables de entorno del servidor (si disponible)

Algunos planes de Hostinger permiten configurar variables de entorno:

1. hPanel → busca "Variables de Entorno" o "Environment Variables"
2. Agrega:
   - `VITE_API_URL` = `https://tu-backend.onrender.com/api`

**Nota:** Esto es menos común en planes de hosting compartido.

---

## Configuración de Dominio/Subdominio

### Si usas el dominio principal
- Sube los archivos a `public_html/`
- Listo

### Si usas un subdominio
1. **Crear subdominio**
   - hPanel → "Dominios" → "Subdominios"
   - Click "Crear Subdominio"
   - Nombre: `app` (resultará en `app.tu-dominio.com`)
   - Document Root: `/public_html/app/`

2. **Subir archivos**
   - Sube el contenido de `dist/` a `public_html/app/`

### Si usas un addon domain
1. **Agregar dominio**
   - hPanel → "Dominios" → "Agregar Dominio"
   - Ingresa tu dominio
   - Document Root: se creará automáticamente

2. **Subir archivos**
   - Sube a la carpeta del dominio creado

---

## SSL/HTTPS

Hostinger generalmente incluye SSL gratis (Let's Encrypt):

1. **Verificar SSL**
   - hPanel → "Seguridad" → "Certificados SSL"
   - Debería aparecer tu dominio con SSL activo

2. **Forzar HTTPS**
   - Ya está incluido en `.htaccess.example`
   - Si quieres agregarlo manualmente:
   ```apache
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

---

## Caché y Optimización

### Limpiar caché de navegador
Si haces cambios y no se ven:
1. Ctrl + Shift + R (Windows/Linux)
2. Cmd + Shift + R (Mac)
3. O modo incógnito

### Caché del servidor
El `.htaccess.example` incluye configuración de caché óptima.

### Compresión GZIP
Ya está en `.htaccess.example` si el servidor lo soporta.

---

## Troubleshooting en Hostinger

### "403 Forbidden"
- Verifica permisos: archivos `644`, carpetas `755`
- Asegúrate de que `index.html` existe en la raíz

### "500 Internal Server Error"
- Revisa el `.htaccess` - puede tener un error de sintaxis
- Prueba comentando líneas para encontrar el problema

### Rutas de React no funcionan (404)
- Asegúrate de que `.htaccess` existe y tiene las reglas de rewrite
- Verifica que `mod_rewrite` esté habilitado (generalmente sí en Hostinger)

### El sitio muestra página en blanco
1. F12 → Console → busca errores
2. Verifica que `VITE_API_URL` sea correcto
3. Verifica que todos los archivos se hayan subido

### CORS errors
- El problema está en el backend (Render)
- Verifica que `FRONTEND_URL` en Render coincida con tu dominio de Hostinger

---

## Checklist Final

Antes de considerar el deploy exitoso:

- [ ] Todos los archivos de `dist/` están en Hostinger
- [ ] `.htaccess` existe y tiene el contenido correcto
- [ ] SSL está activo (candado verde en el navegador)
- [ ] La página carga sin errores (F12 → Console)
- [ ] Puedes navegar entre rutas (`/login`, `/admin`, etc.)
- [ ] Puedes hacer login (probar con `admin` / `admin`)
- [ ] Las llamadas a la API funcionan (Network tab en F12)
- [ ] No hay errores de CORS

---

## Contacto con Soporte de Hostinger

Si tienes problemas:

1. **Live Chat:** Disponible 24/7 en hPanel
2. **Tickets:** Desde hPanel → "Ayuda"
3. **Knowledge Base:** https://support.hostinger.com/

Información útil para dar a soporte:
- Tu dominio
- Mensaje de error exacto
- Captura de pantalla de la consola (F12)

---

## Siguiente Actualización

Cada vez que hagas cambios:

```bash
# 1. Actualiza .env.production si cambió la API
# 2. Construye
npm run build

# 3. Sube dist/ a Hostinger (reemplaza archivos)
# 4. Limpia caché del navegador (Ctrl+Shift+R)
```

---

¡Listo! Con esto deberías tener tu frontend corriendo en Hostinger. 🚀
