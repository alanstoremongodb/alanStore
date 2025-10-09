import mongoose from 'mongoose';
// required: [true, 'La calle es obligatoria'],
const productoSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true, unique: true, index: true },
    precioLista: { type: Number, min: 0, default: 0 },
    descripcion: {type: String, trim: true}
}, {
    timestamps: true,
});

const ProductoModel = mongoose.model('Producto', productoSchema);
export default ProductoModel;

