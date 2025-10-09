import api from '../lib/api';

// Obtiene resumen general de stock (propio + por comercio + distribuciones)
export async function fetchStockResumen() {
  const r = await api.get('/stock/resumen');
  return r.data;
}

export default { fetchStockResumen };