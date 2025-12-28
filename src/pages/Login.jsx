import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import './Login.css'

function Login() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const result = await login(username, password)
    if (result.success) {
      if (result.user.role === 'admin') {
        navigate('/admin')
      } else if (result.user.role === 'validador') {
        navigate('/validador')
      } else {
        navigate('/')
      }
    } else {
      setError(result.message)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const result = await authAPI.register({
        username,
        password,
        nombre,
        rol: 'user'
      })

      if (result.success) {
        setSuccess('Usuario creado exitosamente. Ya puedes iniciar sesión.')
        setUsername('')
        setPassword('')
        setNombre('')
        setTimeout(() => {
          setIsRegistering(false)
          setSuccess('')
        }, 2000)
      }
    } catch (error) {
      setError(error.message || 'Error al crear el usuario')
    }
  }

  const toggleMode = () => {
    setIsRegistering(!isRegistering)
    setError('')
    setSuccess('')
    setUsername('')
    setPassword('')
    setNombre('')
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-icon">📦</div>
          <h1>Sistema de Gestión</h1>
          <p>Pedidos y Compras</p>
        </div>

        {!isRegistering ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Usuario</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-login">
              Iniciar Sesión
            </button>

            <div className="toggle-mode">
              <button type="button" onClick={toggleMode} className="btn-toggle">
                ¿No tienes cuenta? Regístrate
              </button>
            </div>

            <div className="login-info">
              <p>Usuarios de prueba:</p>
              <ul>
                <li>Usuario: <strong>juan</strong> / Contraseña: <strong>juan</strong> (Usuario normal)</li>
                <li>Usuario: <strong>admin</strong> / Contraseña: <strong>admin</strong> (Administrador)</li>
                <li>Usuario: <strong>validador</strong> / Contraseña: <strong>validador</strong> (Validador)</li>
              </ul>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="nombre">Nombre Completo</label>
              <input
                type="text"
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ingresa tu nombre completo"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Usuario</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Elige un nombre de usuario"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Elige una contraseña"
                required
                minLength="3"
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" className="btn-login">
              Registrarse
            </button>

            <div className="toggle-mode">
              <button type="button" onClick={toggleMode} className="btn-toggle">
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login
