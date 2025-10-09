import express from "express";
import ProductosManager from "../controllers/producto.manager.js";

export const routerProductos = express.Router();

routerProductos.get('/productos', ProductosManager.obtenerProductos);
routerProductos.get('/productos/:id', ProductosManager.obtenerUnProducto);
routerProductos.post('/productos', ProductosManager.agregarProducto);
routerProductos.put('/productos/:id', ProductosManager.modificarProducto);
routerProductos.delete('/productos/:id', ProductosManager.eliminarProducto);
