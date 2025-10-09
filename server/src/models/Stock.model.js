import mongoose from 'mongoose';
import ProductoModel from './Producto.model.js';
import ComercioModel from './Comercio.model.js';

const stockSchema = new mongoose.Schema({
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    cantidad: { type: Number, required: true, min: 0, default: 0 },
    comercio: { type: mongoose.Schema.Types.ObjectId, ref: 'Comercio', default: null },
}, {
    timestamps: true,
});

// Un stock por (producto, comercio). Si comercio es null, eso representa el stock propio.
stockSchema.index({ producto: 1, comercio: 1 }, { unique: true });

const StockModel = mongoose.model('Stock', stockSchema);
export default StockModel;