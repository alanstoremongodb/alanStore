import mongoose from 'mongoose';
import MovimientoModel from '../models/Movimientos.model.js';   // 👈 mismo nombre que usás en movimientos.manager
import ProductoModel from '../models/Producto.model.js';
import ComercioModel from '../models/Comercio.model.js';
import StockModel from '../models/Stock.model.js'; // si en el futuro migramos a colección stock directa

const oid = (v) => new mongoose.Types.ObjectId(String(v));

export default class StockManager {
  /**
   * Stock propio actual (por producto)
   * + carga        -> +cantidad
   * + reposicion   -> -cantidad
   * + venta        ->  0
   * + faltante     ->  0
   */
  static async stockPropio(req, res) {
    try {
      const agg = await MovimientoModel.aggregate([
        { $unwind: '$productos' },
        {
          $group: {
            _id: '$productos.producto',
            cantidad: {
              $sum: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$tipo', 'carga'] },      then: '$productos.cantidad' },
                    { case: { $eq: ['$tipo', 'reposicion'] }, then: { $multiply: ['$productos.cantidad', -1] } },
                  ],
                  default: 0
                }
              }
            }
          }
        },
        // opcional: ocultar ceros
        { $match: { cantidad: { $ne: 0 } } },
        // lookups
        { $lookup: { from: 'productos', localField: '_id', foreignField: '_id', as: 'producto' } },
        { $unwind: '$producto' },
        {
          $project: {
            _id: 0,
            producto: 1,
            cantidadCalc: '$cantidad'
          }
        },
        { $sort: { 'producto.nombre': 1 } }
      ]);

      return res.status(200).json({ stock: agg });
    } catch (e) {
      return res.status(500).json({ error: 'Error calculando stock propio' });
    }
  }

  /**
   * Inventario en comercios (por producto+comercio)
   * + reposicion   -> +cantidad
   * + venta        -> -cantidad
   * + faltante     -> -cantidad
   * (carga no aplica porque no tiene comercio)
   */
  static async inventario(req, res) {
    try {
      const agg = await MovimientoModel.aggregate([
        { $match: { tipo: { $in: ['reposicion', 'venta', 'faltante'] } } },
        { $unwind: '$productos' },
        {
          $group: {
            _id: { producto: '$productos.producto', comercio: '$comercio' },
            cantidad: {
              $sum: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$tipo', 'reposicion'] }, then: '$productos.cantidad' },
                    { case: { $in: ['$tipo', ['venta', 'faltante']] }, then: { $multiply: ['$productos.cantidad', -1] } },
                  ],
                  default: 0
                }
              }
            }
          }
        },
        // sin ceros / sin nulos (por si quedó algún movimiento raro sin comercio)
        { $match: { 'cantidad': { $ne: 0 }, '_id.comercio': { $ne: null } } },
        // lookups
        { $lookup: { from: 'productos', localField: '_id.producto', foreignField: '_id', as: 'producto' } },
        { $unwind: '$producto' },
        { $lookup: { from: 'comercios', localField: '_id.comercio', foreignField: '_id', as: 'comercio' } },
        { $unwind: '$comercio' },
        { $lookup: { from: 'barrios', localField: 'comercio.barrio', foreignField: '_id', as: 'barrio' } },
        { $unwind: { path: '$barrio', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            'comercio.barrio': '$barrio'
          }
        },
        {
          $project: {
            _id: 0,
            producto: 1,
            comercio: 1,
            cantidad: '$cantidad'
          }
        },
        { $sort: { 'comercio.nombre': 1, 'producto.nombre': 1 } }
      ]);

      return res.status(200).json({ inventario: agg });
    } catch (e) {
      return res.status(500).json({ error: 'Error calculando inventario' });
    }
  }

  /**
   * Resumen combinado (propio + por comercio) usando colección Stock si existiera
   * o derivándolo de movimientos (por ahora aprovechamos los métodos existentes)
   */
  static async resumen(req, res) {
    try {
      // Intentamos leer colección Stock (si está poblada). Caso contrario, derivamos.
      let stocks = [];
      try {
        stocks = await StockModel.find({}).lean();
      } catch { /* ignore */ }

      if (!stocks.length) {
        // Derivar de movimientos: reutilizo las agregaciones de stockPropio + inventario
        // stockPropio
        const propioAgg = await MovimientoModel.aggregate([
          { $unwind: '$productos' },
          {
            $group: {
              _id: '$productos.producto',
              cantidad: {
                $sum: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$tipo', 'carga'] }, then: '$productos.cantidad' },
                      { case: { $eq: ['$tipo', 'reposicion'] }, then: { $multiply: ['$productos.cantidad', -1] } },
                    ],
                    default: 0
                  }
                }
              }
            }
          },
          { $match: { cantidad: { $ne: 0 } } },
        ]);

        // inventario en comercios
        const invAgg = await MovimientoModel.aggregate([
          { $match: { tipo: { $in: ['reposicion', 'venta', 'faltante'] } } },
          { $unwind: '$productos' },
          {
            $group: {
              _id: { producto: '$productos.producto', comercio: '$comercio' },
              cantidad: {
                $sum: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$tipo', 'reposicion'] }, then: '$productos.cantidad' },
                      { case: { $in: ['$tipo', ['venta', 'faltante']] }, then: { $multiply: ['$productos.cantidad', -1] } },
                    ],
                    default: 0
                  }
                }
              }
            }
          },
          { $match: { 'cantidad': { $ne: 0 }, '_id.comercio': { $ne: null } } }
        ]);

        // Normalizo al mismo formato que StockModel tendría
        stocks = [
          ...propioAgg.map(r => ({ producto: r._id, comercio: null, cantidad: r.cantidad })),
          ...invAgg.map(r => ({ producto: r._id.producto, comercio: r._id.comercio, cantidad: r.cantidad }))
        ];
      }

      const [productos, comercios] = await Promise.all([
        ProductoModel.find({}, { nombre: 1 }).sort({ nombre: 1 }).lean(),
        ComercioModel.find({}, { nombre: 1 }).sort({ nombre: 1 }).lean(),
      ]);

      const prodMap = new Map(productos.map(p => [String(p._id), p]));
      const comMap = new Map(comercios.map(c => [String(c._id), c]));

      const matriz = stocks.map(st => ({
        producto: String(st.producto),
        comercio: st.comercio ? String(st.comercio) : null,
        cantidad: st.cantidad || 0
      }));

      // resumen por producto
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

      // resumen por comercio
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
        if (!a.comercio) return -1;
        if (!b.comercio) return 1;
        return a.comercio.nombre.localeCompare(b.comercio.nombre);
      });

      return res.json({ productos, comercios, matriz, resumenPorProducto, resumenPorComercio });
    } catch (e) {
      console.error('Error resumen stock', e);
      return res.status(500).json({ error: 'Error obteniendo resumen de stock' });
    }
  }

  // ===== Helpers reutilizables =====

  /** stock propio actual para un producto (número) */
  static async _stockPropioActual(productoId) {
    const r = await MovimientoModel.aggregate([
      { $unwind: '$productos' },
      { $match: { 'productos.producto': oid(productoId) } },
      {
        $group: {
          _id: null,
          cantidad: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$tipo', 'carga'] },      then: '$productos.cantidad' },
                  { case: { $eq: ['$tipo', 'reposicion'] }, then: { $multiply: ['$productos.cantidad', -1] } },
                ],
                default: 0
              }
            }
          }
        }
      }
    ]);
    return Number(r?.[0]?.cantidad || 0);
  }

  /** stock actual en un comercio para un producto (número) */
  static async _stockEnComercioActual(productoId, comercioId) {
    const r = await MovimientoModel.aggregate([
      { $match: { tipo: { $in: ['reposicion', 'venta', 'faltante'] }, comercio: oid(comercioId) } },
      { $unwind: '$productos' },
      { $match: { 'productos.producto': oid(productoId) } },
      {
        $group: {
          _id: null,
          cantidad: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$tipo', 'reposicion'] }, then: '$productos.cantidad' },
                  { case: { $in: ['$tipo', ['venta', 'faltante']] }, then: { $multiply: ['$productos.cantidad', -1] } },
                ],
                default: 0
              }
            }
          }
        }
      }
    ]);
    return Number(r?.[0]?.cantidad || 0);
  }
  
}
