# Sistema de Gestión de Pedidos y Compras

Una aplicación web moderna para gestionar solicitudes de pedidos y compras, diseñada para talleres y equipos de trabajo.

## Características

### Para Usuarios
- **Dashboard principal** con resumen de actividad reciente
- **Crear pedidos** de materiales y refacciones
- **Registrar compras** con tickets y facturas
- **Seguimiento de pedidos** con estados en tiempo real
- **Gestión de compras** por obra y período
- **Sistema de notificaciones** para mantener al tanto de los movimientos

### Para Administradores
- **Panel de administración** completo
- **Bandeja de entrada** unificada de pedidos y compras
- **Filtros avanzados** (nuevos, urgentes, incompletos, revisados, cerrados)
- **Búsqueda** por obra, solicitante o ID
- **Gestión centralizada** de todos los usuarios

## Tecnologías Utilizadas

- **React 18** - Framework de UI
- **Vite** - Build tool y dev server
- **React Router** - Navegación
- **CSS Modules** - Estilos

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

3. Abrir el navegador en `http://localhost:5173`

## Usuarios de Prueba

### Usuario Normal
- **Usuario:** `juan`
- **Contraseña:** `juan`
- Acceso a: Dashboard, Mis Pedidos, Mis Compras, Notificaciones

### Administrador
- **Usuario:** `admin`
- **Contraseña:** `admin`
- Acceso a: Panel de Administración con vista completa de todos los pedidos y compras

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Layout.jsx      # Layout principal con sidebar
│   └── Modal.jsx       # Componente modal
├── contexts/           # Contextos de React
│   └── AuthContext.jsx # Autenticación y usuario
├── data/              # Datos de prueba
│   └── mockData.js    # Pedidos, compras y notificaciones
├── pages/             # Páginas de la aplicación
│   ├── Login.jsx      # Página de inicio de sesión
│   ├── Dashboard.jsx  # Dashboard principal
│   ├── MisPedidos.jsx # Vista de pedidos del usuario
│   ├── MisCompras.jsx # Vista de compras del usuario
│   ├── Notificaciones.jsx # Centro de notificaciones
│   └── AdminPanel.jsx # Panel de administración
├── App.jsx           # Componente principal
├── main.jsx         # Punto de entrada
└── index.css        # Estilos globales
```

## Funcionalidades Detalladas

### Dashboard
- Tarjetas de acción para crear pedidos y registrar compras
- Estadísticas en tiempo real (pedidos sin fotos, compras urgentes, etc.)
- Tablas con los últimos 3 pedidos y compras
- Modales para creación rápida de pedidos y compras

### Mis Pedidos
- Lista completa de pedidos del usuario
- Filtros: Todos, Solo Urgentes, Incompletos
- Estados: Registrado, En Proceso, Revisión Pendiente, Revisado, Completado, Cerrado
- Indicadores visuales para pedidos urgentes e incompletos
- Comentarios y observaciones de administración

### Mis Compras
- Vista en cuadrícula de compras
- Filtros por obra y período
- Opción para ver solo compras sin ticket
- Estados: Pendiente, Subido
- Información detallada: obra, monto, proveedor

### Notificaciones
- Separación en nuevas y anteriores
- Filtros: Todas, No leídas, Archivadas
- Tipos de notificaciones: advertencias, información, éxitos
- Contador de notificaciones no leídas

### Panel de Administración
- Vista unificada de todos los pedidos y compras
- Tabs: Nuevos, Urgentes, Incompletos, Revisados, Cerrados
- Búsqueda avanzada
- Tabla completa con información detallada
- Paginación de resultados

## Próximas Mejoras

- Integración con backend real
- Sistema de archivos para tickets y facturas
- Notificaciones en tiempo real con WebSockets
- Reportes y estadísticas avanzadas
- Sistema de aprobaciones y workflows
- Exportación de datos a Excel/PDF
- Modo oscuro

## Licencia

MIT