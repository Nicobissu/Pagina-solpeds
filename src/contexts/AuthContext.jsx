import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = (username, password) => {
    // Simulación de login - en producción esto debería llamar a una API
    if (username === 'admin' && password === 'admin') {
      const adminUser = {
        id: 1,
        name: 'Roberto Gómez',
        role: 'admin',
        username: 'admin'
      }
      setUser(adminUser)
      localStorage.setItem('user', JSON.stringify(adminUser))
      return { success: true, user: adminUser }
    } else if (username === 'juan' && password === 'juan') {
      const normalUser = {
        id: 2,
        name: 'Juan',
        role: 'user',
        username: 'juan'
      }
      setUser(normalUser)
      localStorage.setItem('user', JSON.stringify(normalUser))
      return { success: true, user: normalUser }
    }
    return { success: false, message: 'Usuario o contraseña incorrectos' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  // Intentar restaurar sesión del localStorage al cargar
  useState(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  })

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
