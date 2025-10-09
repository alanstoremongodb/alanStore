import StockModel from '../models/Stock.model.js';
import ProductoModel from '../models/Producto.model.js';
import ComercioModel from '../models/Comercio.model.js';

// Devuelve estructura:
// {
//   productos: [ { _id, nombre } ],
//   comercios: [ { _id, nombre } ],
//   matriz: [ { producto: idProducto, comercio: idComercio|null, cantidad } ],
//   resumenPorProducto: [ { producto: {_id,nombre}, total, detalle: [ { comercio: {_id,nombre}|null, cantidad } ] } ],
//   resumenPorComercio: [ { comercio: {_id,nombre}|null, total } ]
// }
export async function obtenerResumenStock(req, res) {
  try {
    // Traigo todos los productos y comercios activos
    const [productos, comercios, stocks] = await Promise.all([
      ProductoModel.find({}, { nombre: 1 }).sort({ nombre: 1 }).lean(),
      ComercioModel.find({}, { nombre: 1 }).sort({ nombre: 1 }).lean(),
      StockModel.find({}).lean()
    ]);

    // Construyo mapa rápido
    const prodMap = new Map(productos.map(p => [String(p._id), p]));
    const comMap = new Map(comercios.map(c => [String(c._id), c]));

    // Matriz base
    const matriz = stocks.map(st => ({
      producto: String(st.producto),
      comercio: st.comercio ? String(st.comercio) : null,
      cantidad: st.cantidad || 0
    }));

    // Resumen por producto
    const resumenProdMap = new Map();
    for (const row of matriz) {
      if (!resumenProdMap.has(row.producto)) {
        resumenProdMap.set(row.producto, { producto: prodMap.get(row.producto), total: 0, detalle: [] });
      }
      const bucket = resumenProdMap.get(row.producto);
      bucket.total += row.cantidad;
      bucket.detalle.push({ comercio: row.comercio ? comMap.get(row.comercio) : null, cantidad: row.cantidad });
    }
    const resumenPorProducto = Array.from(resumenProdMap.values()).sort((a,b)=> a.producto.nombre.localeCompare(b.producto.nombre));

    // Resumen por comercio (incluye propio = null)
    const resumenComMap = new Map();
    for (const row of matriz) {
      const key = row.comercio || 'PROPIO';
      if (!resumenComMap.has(key)) {
        resumenComMap.set(key, { comercio: row.comercio ? comMap.get(row.comercio) : null, total: 0 });
      }
      resumenComMap.get(key).total += row.cantidad;
    }
    const resumenPorComercio = Array.from(resumenComMap.values()).sort((a,b)=> {
      if (!a.comercio && !b.comercio) return 0;
      if (!a.comercio) return -1; // propio primero
      if (!b.comercio) return 1;
      return a.comercio.nombre.localeCompare(b.comercio.nombre);
    });

    res.json({
      productos,
      comercios,
      matriz,
      resumenPorProducto,
      resumenPorComercio
    });
  } catch (e) {
    console.error('Error obteniendo resumen stock', e);
    res.status(500).json({ error: 'Error obteniendo resumen de stock' });
  }
}

export default { obtenerResumenStock };