# Resumen Rápido de Despliegue

## Frontend → Hostinger | Backend → Render

### 1️⃣ Backend en Render (PRIMERO)

```bash
# Sube a GitHub
git add .
git commit -m "Configuración para despliegue"
git push origin main
```

En Render:
1. Dashboard → "New +" → "Blueprint"
2. Conecta GitHub
3. **EDITA** `FRONTEND_URL` con tu dominio de Hostinger
4. "Apply"
5. **Guarda la URL** que te da Render (ej: `https://solpeds-backend-xxxx.onrender.com`)

---

### 2️⃣ Frontend en Hostinger (SEGUNDO)

**A) Crear `.env.production`**
```env
VITE_API_URL=https://solpeds-backend-xxxx.onrender.com/api
```

**B) Construir**
```bash
npm run build
```

**C) Subir a Hostinger**
- Sube TODO el contenido de `dist/` a `public_html/`

**D) Crear `.htaccess`**
- Copia el contenido de `.htaccess.example` a un nuevo `.htaccess` en Hostinger

---

### 3️⃣ Actualizar CORS en Render

En Render → Environment → Edita `FRONTEND_URL`:
```
FRONTEND_URL=https://tu-dominio-real.com
```

---

### ✅ Verificar

- Backend: `https://tu-backend.onrender.com/api/health`
- Frontend: `https://tu-dominio.com`
- Login: `admin` / `admin`

---

### 🔄 Para Actualizar

**Backend:**
```bash
git push origin main
# Render actualiza automáticamente
```

**Frontend:**
```bash
npm run build
# Sube dist/ a Hostinger
```

---

Ver guía completa en [DEPLOY.md](DEPLOY.md)
