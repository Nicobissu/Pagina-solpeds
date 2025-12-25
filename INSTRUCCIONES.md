# Sistema de Gestión de Pedidos y Compras

## Inicio Rápido

### Iniciar el Sistema (Backend + Frontend)

Para arrancar tanto el servidor backend como el frontend simultáneamente, ejecuta:

```bash
npm start
```

Este comando iniciará:
- **Backend** en `http://localhost:3001` (servidor API)
- **Frontend** en `http://localhost:5173` (interfaz web)

### Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia backend y frontend simultáneamente |
| `npm run dev` | Inicia solo el frontend (Vite) |
| `npm run backend:start` | Inicia solo el backend |
| `npm run backend:install` | Instala dependencias del backend |
| `npm run install:all` | Instala todas las dependencias (root + backend) |

## Usuarios de Prueba

El sistema crea automáticamente los siguientes usuarios:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin` | Administrador |
| `juan` | `juan` | Usuario |
| `luis` | `luis` | Usuario |
| `carlos` | `carlos` | Usuario |
| `ana` | `ana` | Usuario |
| `sofia` | `sofia` | Usuario |

## Características

### Para Usuarios Normales:
- Crear pedidos y compras
- Ver sus propios pedidos y compras
- Agregar comentarios a pedidos
- Marcar pedidos como urgentes

### Para Administradores:
- Ver todos los pedidos y compras de todos los usuarios
- Actualizar estados de pedidos
- Revisar y aprobar solicitudes
- Gestionar toda la información del sistema

## Registro de Nuevas Cuentas

1. En la pantalla de login, haz clic en **"¿No tienes cuenta? Regístrate"**
2. Completa el formulario con:
   - Nombre completo
   - Usuario (nombre de usuario único)
   - Contraseña (mínimo 3 caracteres)
3. Haz clic en **"Registrarse"**
4. Inicia sesión con tu nueva cuenta

## Tecnologías

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Base de Datos**: SQLite (sql.js)
- **Autenticación**: JWT (JSON Web Tokens)

## Estructura del Proyecto

```
Pagina-solpeds/
├── backend/               # Servidor API
│   ├── config/           # Configuración de BD
│   ├── controllers/      # Lógica de negocio
│   ├── routes/           # Rutas de la API
│   ├── middleware/       # Middleware de autenticación
│   └── server.js         # Punto de entrada del backend
├── src/                  # Código del frontend
│   ├── components/       # Componentes React
│   ├── pages/           # Páginas de la aplicación
│   ├── contexts/        # Context API (autenticación)
│   └── services/        # Llamadas a la API
└── package.json         # Configuración del proyecto
```

## Solución de Problemas

### El backend no inicia
- Verifica que el puerto 3001 no esté en uso
- Revisa que las dependencias estén instaladas: `npm run backend:install`

### El frontend no inicia
- Verifica que el puerto 5173 no esté en uso
- Revisa que las dependencias estén instaladas: `npm install`

### No puedo crear pedidos/compras
- Asegúrate de estar autenticado (logged in)
- Verifica que el backend esté corriendo
- Revisa la consola del navegador para errores

## Notas Importantes

- La base de datos se guarda en `backend/database.sqlite`
- Los tokens JWT expiran después de 24 horas
- Todos los datos se guardan localmente en tu máquina
