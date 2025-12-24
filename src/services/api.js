const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper para manejar respuestas
async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
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

  update: async (id, updates) => {
    const response = await fetch(`${API_URL}/pedidos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
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
