import jwt from 'jsonwebtoken';
import UsuarioModel from '../models/Usuario.model.js';

// Función simple para emitir token - sin complicaciones
function emitirToken(user) {
  const payload = { 
    sub: user._id.toString(), 
    usuario: user.usuario
  };
  const opts = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' };
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, opts);
}

function emitirRefreshToken(user) {
  const payload = { 
    sub: user._id.toString(), 
    tipo: 'refresh' 
  };
  const opts = { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' };
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, opts);
}

function setRefreshCookie(res, refreshToken) {
  const isProd = (process.env.NODE_ENV || 'development') === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 días
  });
}

class AuthManager {
  // Registro simple
  static async register(req, res) {
    try {
      const { usuario, password } = req.body;
      if (!usuario || !password) {
        return res.status(400).json({ error: 'usuario y password son obligatorios' });
      }

      if (password.length < 4) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
      }

      const existe = await UsuarioModel.findOne({ usuario });
      if (existe) return res.status(400).json({ error: 'El usuario ya está registrado' });

      const user = await UsuarioModel.create({ usuario, password });
      const accessToken = emitirToken(user);
      const refreshToken = emitirRefreshToken(user);
      setRefreshCookie(res, refreshToken);
      return res.status(201).json({
        user: { id: user._id, usuario: user.usuario },
        accessToken,
      });
    } catch (err) {
      if (err.name === 'ValidationError') {
        const errores = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ error: errores.join(', ') });
      }
      return res.status(500).json({ error: 'Error registrando usuario' });
    }
  }

  // Login simple
  static async login(req, res) {
    try {
      const { usuario, password } = req.body;
      if (!usuario || !password) {
        return res.status(400).json({ error: 'usuario y password son obligatorios' });
      }

  const user = await UsuarioModel.findOne({ usuario });
  if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });

      const ok = await user.comparePassword(password);
      if (!ok) return res.status(400).json({ error: 'Credenciales inválidas' });

      const accessToken = emitirToken(user);
      const refreshToken = emitirRefreshToken(user);
      setRefreshCookie(res, refreshToken);
      return res.status(200).json({
        user: { id: user._id, usuario: user.usuario },
        accessToken,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Error en login' });
    }
  }

  // Refresh token simple
  static async refreshToken(req, res) {
    try {
      const fromCookie = req.cookies?.refreshToken;
      const fromBody = req.body?.refreshToken;
      const incoming = fromCookie || fromBody;
      if (!incoming) return res.status(400).json({ error: 'Refresh token requerido' });

      const payload = jwt.verify(incoming, process.env.JWT_REFRESH_SECRET);
      const user = await UsuarioModel.findById(payload.sub);

      if (!user) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }

      const accessToken = emitirToken(user);
      const newRefreshToken = emitirRefreshToken(user);
      setRefreshCookie(res, newRefreshToken);
      return res.status(200).json({ accessToken });
    } catch (err) {
      return res.status(401).json({ error: 'Refresh token inválido o expirado' });
    }
  }

  // Logout simple
  static async logout(req, res) {
    try {
      const isProd = (process.env.NODE_ENV || 'development') === 'production';
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
      });
      return res.status(200).json({ message: 'Logout exitoso' });
    } catch (err) {
      return res.status(500).json({ error: 'Error en logout' });
    }
  }

  // Obtener info del usuario
  static async me(req, res) {
    try {
      const user = await UsuarioModel.findById(req.user.sub).select('-password');
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      return res.status(200).json({
        user: {
          id: user._id,
          usuario: user.usuario
        }
      });
    } catch (err) {
      return res.status(500).json({ error: 'Error obteniendo información del usuario' });
    }
  }

  // Cambiar contraseña
  static async cambiarPassword(req, res) {
    try {
      const { passwordActual, passwordNueva } = req.body;
      
      if (!passwordActual || !passwordNueva) {
        return res.status(400).json({ error: 'Contraseña actual y nueva son obligatorias' });
      }

      if (passwordNueva.length < 4) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
      }

      const user = await UsuarioModel.findById(req.user.sub);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const ok = await user.comparePassword(passwordActual);
      if (!ok) {
        return res.status(400).json({ error: 'Contraseña actual incorrecta' });
      }

      user.password = passwordNueva;
      await user.save();

      return res.status(200).json({ message: 'Contraseña cambiada exitosamente' });
    } catch (err) {
      return res.status(500).json({ error: 'Error cambiando contraseña' });
    }
  }
}

// Utilidad: crear admin si no existe (usada desde app.js)
AuthManager.bootstrapAdmin = async function bootstrapAdmin() {
  try {
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin1234';
    const exists = await UsuarioModel.findOne({ usuario: adminUser });
    if (!exists) {
      await UsuarioModel.create({ usuario: adminUser, password: adminPass, nombre: 'Administrador' });
      // eslint-disable-next-line no-console
      console.log('✅ Usuario admin creado');
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('No se pudo crear admin por bootstrap:', e.message);
  }
};

export default AuthManager;
