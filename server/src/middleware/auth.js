import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No autenticado' });

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = payload; // { sub, usuario, nombre, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
