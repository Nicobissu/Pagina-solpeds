const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper para manejar respuestas
async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    // Si el error es 403 (Token inválido o expirado), hacer logout
    if (response.status === 403 || response.status === 401) {
      const errorMsg = data.error || 'Sesión expirada';
      // Limpiar el localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Solo redirigir si NO estamos ya en la página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error(errorMsg);
    }
    throw new Error(data.error || 'Error en la petición');
  }

  return data;
}

// Helper para obtener headers con autenticación
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

// API de autenticación
export const authAPI = {
  login: async (username, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(response);
  },

  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  verifyToken: async () => {
    const response = await fetch(`${API_URL}/auth/verify`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// API de pedidos
export const pedidosAPI = {
  getAll: async (userId, isAdmin) => {
    const params = new URLSearchParams({
      userId,
      isAdmin: isAdmin ? 'true' : 'false'
    });
    const response = await fetch(`${API_URL}/pedidos?${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/pedidos/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (pedidoData) => {
    const response = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(pedidoData)
    });
    return handleResponse(response);
  },

  createWithImages: async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
        // NO incluir Content-Type, el navegador lo establece automáticamente con FormData
      },
      body: formData
    });
    return handleResponse(response);
  },

  update: async (id, updates) => {
    const response = await fetch(`${API_URL}/pedidos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse(response);
  },

  updateUsuario: async (id, formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/pedidos/${id}/editar-usuario`, {
      method: 'PUT',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
        // NO incluir Content-Type, el navegador lo establece automáticamente con FormData
      },
      body: formData
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/pedidos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  addComentario: async (id, comentario) => {
    const response = await fetch(`${API_URL}/pedidos/${id}/comentarios`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ comentario })
    });
    return handleResponse(response);
  },

  cancelar: async (id, motivo) => {
    const response = await fetch(`${API_URL}/pedidos/${id}/cancelar`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ motivo })
    });
    return handleResponse(response);
  },

  getCancelados: async (userId, isAdmin) => {
    const params = new URLSearchParams({
      userId,
      isAdmin: isAdmin ? 'true' : 'false'
    });
    const response = await fetch(`${API_URL}/pedidos/cancelados/lista?${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  validar: async (id, accion, motivo = '', nuevoEstado = 'En Proceso') => {
    const response = await fetch(`${API_URL}/pedidos/${id}/validar`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ accion, motivo, nuevoEstado })
    });
    return handleResponse(response);
  }
};

// API de compras
export const comprasAPI = {
  getAll: async (userId, isAdmin) => {
    const params = new URLSearchParams({
      userId,
      isAdmin: isAdmin ? 'true' : 'false'
    });
    const response = await fetch(`${API_URL}/compras?${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/compras/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (compraData) => {
    const response = await fetch(`${API_URL}/compras`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(compraData)
    });
    return handleResponse(response);
  },

  update: async (id, updates) => {
    const response = await fetch(`${API_URL}/compras/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/compras/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  cancelar: async (id, motivo) => {
    const response = await fetch(`${API_URL}/compras/${id}/cancelar`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ motivo })
    });
    return handleResponse(response);
  },

  getCanceladas: async (userId, isAdmin) => {
    const params = new URLSearchParams({
      userId,
      isAdmin: isAdmin ? 'true' : 'false'
    });
    const response = await fetch(`${API_URL}/compras/canceladas/lista?${params}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// API de notificaciones
export const notificacionesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/notificaciones`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  create: async (notifData) => {
    const response = await fetch(`${API_URL}/notificaciones`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(notifData)
    });
    return handleResponse(response);
  },

  marcarLeida: async (id) => {
    const response = await fetch(`${API_URL}/notificaciones/${id}/leida`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  marcarTodasLeidas: async () => {
    const response = await fetch(`${API_URL}/notificaciones/marcar-todas-leidas`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/notificaciones/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// API de centros de costo
export const centrosCostoAPI = {
  // Clientes
  getAllClientes: async () => {
    const response = await fetch(`${API_URL}/centros-costo/clientes`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  createCliente: async (nombre) => {
    const response = await fetch(`${API_URL}/centros-costo/clientes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ nombre })
    });
    return handleResponse(response);
  },

  updateCliente: async (id, data) => {
    const response = await fetch(`${API_URL}/centros-costo/clientes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  deleteCliente: async (id) => {
    const response = await fetch(`${API_URL}/centros-costo/clientes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Obras
  getAllObras: async () => {
    const response = await fetch(`${API_URL}/centros-costo/obras`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getObrasByCliente: async (clienteId) => {
    const response = await fetch(`${API_URL}/centros-costo/obras/cliente/${clienteId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  createObra: async (clienteId, nombre) => {
    const response = await fetch(`${API_URL}/centros-costo/obras`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ clienteId, nombre })
    });
    return handleResponse(response);
  },

  updateObra: async (id, data) => {
    const response = await fetch(`${API_URL}/centros-costo/obras/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  deleteObra: async (id) => {
    const response = await fetch(`${API_URL}/centros-costo/obras/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Siguiente número
  getSiguienteNumero: async (clienteId, obraId) => {
    const response = await fetch(`${API_URL}/centros-costo/siguiente-numero/${clienteId}/${obraId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};
