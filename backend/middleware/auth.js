import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    req.user = user;
    next();
  });
}

export function isAdmin(req, res, next) {
  if (req.user.rol !== 'admin' && req.user.rol !== 'supervisor') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
  }
  next();
}

export function isValidador(req, res, next) {
  if (req.user.rol !== 'validador' && req.user.rol !== 'admin' && req.user.rol !== 'supervisor') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de validador' });
  }
  next();
}

export function isAdminOrValidador(req, res, next) {
  if (req.user.rol !== 'admin' && req.user.rol !== 'validador' && req.user.rol !== 'supervisor') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de admin o validador' });
  }
  next();
}
