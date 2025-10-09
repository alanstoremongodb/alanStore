import ProductoModel from '../models/Producto.model.js';
// import { requireAuth } from '../middleware/auth.js';


class ProductosManager {
    static async obtenerProductos(req, res) {
        try {
            const productos = await ProductoModel.find({}).lean();
            return res.status(200).json({ productos });
        } catch (error) {
            return res.status(500).json({ error: 'Error buscando en productos' });
        }
    }
    static async obtenerUnProducto(req, res) {
        const { id } = req.params
        try {
            const producto = await ProductoModel.findOne({ _id: id });
            if (!producto) {
                return res.status(400).json({ error: `El producto no existe` });
            }
            return res.status(200).json({ producto });
        } catch (error) {
            return res.status(500).json({ error: 'Error buscando en productos' });
        }
    }
    static async agregarProducto(req, res) {
        const { nombre, precioLista, descripcion } = req.body;
        if (!nombre) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }
        try {
            const productoExistente = await ProductoModel.findOne({ nombre: nombre });
            if (productoExistente) {
                return res.status(400).json({ error: 'El producto ya existe' });
            }
            const nuevoProducto = new ProductoModel({
                nombre,
                precioLista,
                descripcion
            });
            await nuevoProducto.save();
            return res.status(201).json({ success: 'Producto agregado exitosamente', producto: nuevoProducto });
        } catch (error) {
            return res.status(500).json({ error: 'Error agregando producto' });
        }
    }

    static async modificarProducto(req, res) {
        const { id } = req.params
        const { nombre, precioLista, descripcion } = req.body;
        try {
            const productoBuscado = await ProductoModel.findById(id);
            if (!productoBuscado) {
                return res.status(404).json({ error: `El producto no existe` });
            }
            if (nombre) {
                const productoConMismoNombre = await ProductoModel.findOne({ nombre, _id: { $ne: id } });
                if (productoConMismoNombre) {
                    return res.status(400).json({ error: 'El nombre del producto ya está en uso por otro producto' });
                }
            }
            await ProductoModel.findByIdAndUpdate(id, {
                nombre,
                precioLista,
                descripcion
            }, { new: true, runValidators: true });
            return res.status(200).json({ success: 'Producto actualizado correctamente' });
        } catch (error) {
            return res.status(500).json({ error: 'Error actualizando producto' });
        }
    }

    static async eliminarProducto(req, res) {
        const { id } = req.params;
        try {
            const productoEliminado = await ProductoModel.findByIdAndDelete(id);
            if (!productoEliminado) {
                return res.status(404).json({ error: `El producto no existe` });
            }
            return res.status(200).json({ message: "Producto eliminado exitosamente" });
        } catch (error) {
            return res.status(500).json({ error: 'Error eliminando producto' });
        }
    }
}

export default ProductosManager;