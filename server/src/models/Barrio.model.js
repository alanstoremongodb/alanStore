import mongoose from 'mongoose';

const barrioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true, unique: true, index: true },
  observaciones: { type: String }
}, {
    timestamps: true,
});


const BarrioModel = mongoose.model('Barrio', barrioSchema);

export default BarrioModel;
