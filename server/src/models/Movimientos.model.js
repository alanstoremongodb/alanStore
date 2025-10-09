import mongoose from 'mongoose';

const MovimientoSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now, index: true },
  // 'carga' | 'venta' | 'reposicion' | 'faltante'
  tipo: { 
    type: String, 
    required: true, 
    enum: ['carga', 'venta', 'reposicion', 'faltante'],
  },
  productos:[{
    producto: {type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true},
    cantidad: { type: Number, required: true, min: 1 },
    costoTotal: { type: Number, default: null, min: 0 },
    costoUnitario: { type: Number, default: null, min: 0 },
    ventaTotal: { type: Number, default: null, min: 0 },
    ventaUnitaria: { type: Number, default: null, min: 0 },
  }],
  // Solo aplica para 'venta' y 'reposicion'
  comercio: {type: mongoose.Schema.Types.ObjectId, ref: 'Comercio', default: null},
  observaciones: { type: String}
}, {
    timestamps: true,
});


MovimientoSchema.index({ producto: 1, tipo: 1 });
MovimientoSchema.index({ comercio: 1, tipo: 1 });
MovimientoSchema.index({ fecha: -1 });

const MovimientoModel = mongoose.model('Movimiento', MovimientoSchema);

export default MovimientoModel;

