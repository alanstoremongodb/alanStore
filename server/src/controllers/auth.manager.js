import jwt from 'jsonwebtoken';
import UsuarioModel from '../models/Usuario.model.js'; // 👈 crea este archivo con tu schema pegado

const isProd = process.env.NODE_ENV === 'production';

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_TTL || '15m'
  });
}
function signRefresh(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_TTL || '7d'
  });
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/auth/refresh' // la cookie solo viaja a este endpoint
  });
}

export default class AuthManager {
  // crea un usuario bootstrap si no existe
  static async bootstrapAdmin() {
    try {
      const usuario = process.env.ADMIN_USUARIO;
      const password = process.env.ADMIN_PASSWORD;
      const nombre = process.env.ADMIN_NOMBRE || 'Admin';

      if (!usuario || !password) return;

      const exists = await UsuarioModel.findOne({ usuario });
      if (!exists) {
        await UsuarioModel.create({ usuario, password, nombre });
        console.log(`✅ Usuario bootstrap creado: ${usuario}`);
      }
    } catch (e) {
      console.error('❌ Error en bootstrap admin:', e.message);
    }
  }

  static async register(req, res) {
    try {
      const { usuario, password, nombre } = req.body;
      if (!usuario || !password) return res.status(400).json({ error: 'Usuario y password son obligatorios' });

      const dup = await UsuarioModel.findOne({ usuario: String(usuario).toLowerCase().trim() });
      if (dup) return res.status(409).json({ error: 'El usuario ya existe' });

      const user = await UsuarioModel.create({ usuario, password, nombre });
      return res.status(201).json({ user: user.toJSON() });
    } catch (e) {
      return res.status(500).json({ error: 'No se pudo registrar' });
    }
  }

  static async login(req, res) {
    try {
      const { usuario, password } = req.body;
      if (!usuario || !password) return res.status(400).json({ error: 'Usuario y password son obligatorios' });

      const user = await UsuarioModel.findOne({ usuario: String(usuario).toLowerCase().trim() });
      if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

      const ok = await user.comparePassword(password);
      if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

      const payload = { sub: String(user._id), usuario: user.usuario, nombre: user.nombre };
      const accessToken = signAccess(payload);
      const refreshToken = signRefresh({ sub: payload.sub });

      setRefreshCookie(res, refreshToken);

      return res.status(200).json({ accessToken, user: user.toJSON() });
    } catch (e) {
      return res.status(500).json({ error: 'No se pudo iniciar sesión' });
    }
  }

  static async refresh(req, res) {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) return res.status(401).json({ error: 'No hay refresh token' });

      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await UsuarioModel.findById(decoded.sub);
      if (!user) return res.status(401).json({ error: 'Usuario inválido' });

      const accessToken = signAccess({ sub: String(user._id), usuario: user.usuario, nombre: user.nombre });

      // rotación simple de refresh
      const newRefresh = signRefresh({ sub: String(user._id) });
      setRefreshCookie(res, newRefresh);

      return res.status(200).json({ accessToken });
    } catch (e) {
      return res.status(401).json({ error: 'Refresh inválido o expirado' });
    }
  }

  static async logout(_req, res) {
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    return res.status(200).json({ success: true });
  }

  static async me(req, res) {
    const user = await UsuarioModel.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.status(200).json({ user: user.toJSON() });
  }
}
