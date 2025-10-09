import mongoose from 'mongoose';


const comercioSchema = new mongoose.Schema({
  nombre: {type: String, required: true, trim: true},
  calle: {type: String, required: true, trim: true},
  altura: {type: String, required: true, trim: true},
  piso: {type: String, trim: true},
  departamento: {type: String, trim: true},
  barrio: {type: mongoose.Schema.Types.ObjectId, ref: 'Barrio', required: true},
  responsable: {type: String, trim: true},
  telefono: {type: String, trim: true},
  whatsapp: {type: String, trim: true},
  inicioContrato: {type: Date, required: true},
  contratoFirmado: {type: Boolean, default: false},
  deuda: {type: Number, default: 0},
  observaciones: { type: String }
}, {
    timestamps: true,
});


const ComercioModel = mongoose.model('Comercio', comercioSchema);

export default ComercioModel;
