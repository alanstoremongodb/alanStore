import express from "express";
import ComerciosManager from "../controllers/comercio.manager.js";

export const routerComercios = express.Router();

routerComercios.get('/comercios', ComerciosManager.obtenerComercios);
routerComercios.get('/comercios/:id', ComerciosManager.obtenerUnComercio);
routerComercios.post('/comercios', ComerciosManager.agregarComercio);
routerComercios.put('/comercios/:id', ComerciosManager.modificarComercio);
routerComercios.delete('/comercios/:id', ComerciosManager.eliminarComercio);