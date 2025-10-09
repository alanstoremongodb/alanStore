import { Router } from 'express';
import StockManager from '../controllers/stock.manager.js';

export const routerStock = Router();

routerStock.get('/stock-propio', StockManager.stockPropio);
routerStock.get('/inventario', StockManager.inventario);
routerStock.get('/stock/resumen', StockManager.resumen);
