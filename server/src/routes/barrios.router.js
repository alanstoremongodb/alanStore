import express from "express";
import BarriosManager from "../controllers/barrio.manager.js";

export const routerBarrios = express.Router();

routerBarrios.get('/barrios', BarriosManager.obtenerBarrios);
routerBarrios.get('/barrios/:id', BarriosManager.obtenerUnBarrio);
routerBarrios.post('/barrios', BarriosManager.agregarBarrio);
routerBarrios.put('/barrios/:id', BarriosManager.modificarBarrio);
routerBarrios.delete('/barrios/:id', BarriosManager.eliminarBarrio);