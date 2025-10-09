import { Router } from 'express';
import MovimientosManager from '../controllers/movimientos.manager.js';

export const routerMovimientos = Router();

routerMovimientos.get('/movimientos', MovimientosManager.obtenerMovimientos);
routerMovimientos.get('/movimientos/:id', MovimientosManager.obtenerUnMovimiento);
routerMovimientos.post('/movimientos', MovimientosManager.crearMovimiento);
routerMovimientos.put('/movimientos/:id', MovimientosManager.modificarMovimiento);
routerMovimientos.delete('/movimientos/:id', MovimientosManager.eliminarMovimiento);
