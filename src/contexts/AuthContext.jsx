import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password)

      if (response.success) {
        setUser(response.user)
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        return { success: true, user: response.user }
      }

      return { success: false, message: 'Error al iniciar sesión' }
    } catch (error) {
      console.error('Error en login:', error)
      return { success: false, message: error.message || 'Usuario o contraseña incorrectos' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // Intentar restaurar sesión del localStorage al cargar
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (token && savedUser) {
        try {
          // Verificar que el token aún es válido
          const response = await authAPI.verifyToken()
          if (response.success) {
            setUser(response.user)
          } else {
            // Token inválido, limpiar
            logout()
          }
        } catch (error) {
          console.error('Error verificando token:', error)
          logout()
        }
      }

      setLoading(false)
    }

    verifySession()
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}
