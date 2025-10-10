import express from 'express';
import connectDB from './connectDB.js';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import __dirname from './utils.js'; // ✅ Importás tu dirname
import { engine } from 'express-handlebars'; // 👈 NUEVO
import cookieParser from 'cookie-parser';

import AuthManager from './controllers/auth.manager.js';

// import { routerAuth } from './routes/auth.router.js';
import { routerBarrios } from './routes/barrios.router.js';
import { routerComercios } from './routes/comercios.router.js';
import { routerProductos } from './routes/productos.router.js';
import { routerMovimientos } from './routes/movimientos.router.js';
import { routerStock } from './routes/stock.router.js';
import { routerEstadisticas } from './routes/estadisticas.router.js';
import { routerAuth } from './routes/auth.router.js';
import { requireAuth } from './middleware/auth.js';


// 🔧 Cargar variables de entorno según el entorno (desarrollo o producción)
const env = process.env.NODE_ENV || 'development';
dotenv.config({
  path: path.resolve(__dirname, `../.env.${env}`)
});
console.log(`✅ Usando archivo: .env.${env}`);

const app = express();

// 🔧 Motor de vistas Handlebars
app.engine('hbs', engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// CORS: permitir múltiples orígenes separados por coma en CORS_ORIGIN
const rawOrigins = process.env.CORS_ORIGIN || '';
const allowedOrigins = rawOrigins
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsConfig = {
  origin: (origin, callback) => {
    // permitir herramientas server-to-server (sin origin) o coincidencias explícitas
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
};

app.use(cors(corsConfig));
app.options('*', cors(corsConfig));
app.use(cookieParser());
app.use(express.json());

const PORT = process.env.PORT || 4000;


// 👉 Ruta del “mini-Postman”
app.get('/tester', (_req, res) => {
  res.render('tester', {
    layout: false,                // no usamos layout para simplificar
    defaultUrl: '/productos',     // podés cambiar el placeholder
  });
});

connectDB();

// crear admin si no existe
AuthManager.bootstrapAdmin();

app.get('/ping', (req, res) => {
  res.send('Servidor accesible desde el celular 🚀');
});


// Rutas públicas (auth)
app.use('/', routerAuth);

// 🔒 A partir de acá, todo protegido
app.use(requireAuth);

app.use('/', routerBarrios);
app.use('/', routerComercios);
app.use('/', routerProductos);
app.use('/', routerMovimientos);
app.use('/', routerStock);
app.use('/', routerEstadisticas);


// Middleware para capturar errores no manejados
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});



