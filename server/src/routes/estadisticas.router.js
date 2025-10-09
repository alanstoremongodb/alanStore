import { Router } from 'express';
import { getEstadisticas, getOverview } from '../controllers/estadisticas.manager.js';

export const routerEstadisticas = Router();

routerEstadisticas.get('/estadisticas', getEstadisticas);
routerEstadisticas.get('/estadisticas/overview', getOverview);
