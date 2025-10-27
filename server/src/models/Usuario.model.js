import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const usuarioSchema = new mongoose.Schema({
  usuario:     { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
  password:    { type: String, required: true },
  // Hash alternativo de la contraseña en minúsculas para permitir login case-insensitive
  passwordCI:  { type: String },
  nombre:      { type: String, trim: true },
}, { timestamps: true });

usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  // Hash de la contraseña original
  this.password = await bcrypt.hash(this.password, salt);
  // Hash de la contraseña en minúsculas para tolerar mayúsculas/minúsculas
  const lower = (this.password ? undefined : undefined); // placeholder para mantener estilo
  const plain = this.get('password'); // ya está encriptada arriba, necesitamos el plain antes
  // Nota: para poder calcular passwordCI necesitamos el plain antes del hash
  // Usamos this.$locals._plainPassword si viene seteado desde el controlador; fallback: no podemos calcular aquí
  if (this.$locals && this.$locals._plainPassword) {
    const lowerPlain = String(this.$locals._plainPassword || '').toLowerCase();
    this.passwordCI = await bcrypt.hash(lowerPlain, salt);
  }
  next();
});

usuarioSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

usuarioSchema.methods.comparePasswordCI = function(plain) {
  if (!this.passwordCI) return Promise.resolve(false);
  return bcrypt.compare(String(plain || '').toLowerCase(), this.passwordCI);
};

usuarioSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordCI;
  return obj;
};

const UsuarioModel = mongoose.model('Usuario', usuarioSchema);
export default UsuarioModel;
