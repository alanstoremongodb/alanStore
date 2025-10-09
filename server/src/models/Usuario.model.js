import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const usuarioSchema = new mongoose.Schema({
  usuario:     { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
  password:  { type: String, required: true },
  nombre:    { type: String, trim: true },
}, { timestamps: true });

usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

usuarioSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

usuarioSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const UsuarioModel = mongoose.model('Usuario', usuarioSchema);
export default UsuarioModel;
