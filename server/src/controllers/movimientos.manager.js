// src/controllers/movimientos.manager.js
import MovimientoModel from "../models/Movimientos.model.js";
import ProductoModel from "../models/Producto.model.js";
import ComercioModel from "../models/Comercio.model.js";
import moment from 'moment-timezone';
import StockManager from "./stock.manager.js";


const FORMATO_FECHAS = 'YYYY-MM-DD';

class MovimientosManager {
  static async obtenerMovimientos(req, res) {
    try {
      const movimientos = await MovimientoModel.find({})
        // ✅ Soporta shape nuevo (array)…
        .populate({ path: 'productos.producto' })
        // ✅ …y shape viejo (campo plano). No falla si no existe.
        .populate({ path: 'producto', strictPopulate: false })
        // ✅ Comercio + barrio
        .populate({ path: 'comercio', populate: { path: 'barrio' }, strictPopulate: false })
        .sort({ fecha: -1 })
        .lean();

      return res.status(200).json({ movimientos });
    } catch (error) {
      return res.status(500).json({ error: 'Error buscando movimientos' });
    }
  }

  static async obtenerUnMovimiento(req, res) {
    const { id } = req.params
    try {
      const movimiento = await MovimientoModel.findOne({ _id: id });
      if (!movimiento) {
        return res.status(404).json({ error: `El movimiento no existe` });
      }
      return res.status(200).json({ movimiento });
    } catch (error) {
      return res.status(500).json({ error: 'Error buscando en movimientos' });
    }
  }
  static async crearMovimiento(req, res) {
    const { fecha, tipo, productos, comercio, observaciones } = req.body;

    if (!tipo || !productos || productos.length === 0) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    if (fecha) {
      const fechaDate = moment.tz(fecha, FORMATO_FECHAS, true, 'America/Argentina/Buenos_Aires');
      if (!fechaDate.isValid()) {
        return res.status(400).json({ error: 'Formato de fecha inválida' });
      }
      if (fechaDate > Date.now()) {
        return res.status(400).json({ error: 'La fecha del movimiento no puede ser futura' });
      }
    }

    if (!['carga', 'venta', 'reposicion', 'faltante'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de movimiento inválido' });
    }

    for (const item of productos) {
      const { producto, cantidad, costoTotal, ventaTotal } = item;

      if (!producto || !cantidad) {
        return res.status(400).json({ error: 'Producto y cantidad son obligatorios para cada ítem' });
      }

      if (cantidad < 1) {
        return res.status(400).json({ error: 'La cantidad debe ser al menos 1' });
      }

      const prod = await ProductoModel.findById(producto);
      if (!prod) return res.status(400).json({ error: 'Producto no encontrado' });

      // Verificación de stock según el tipo de movimiento
      if (tipo === 'reposicion' || tipo === 'faltante') {
        const stockPropio = await StockManager._stockPropioActual(producto);
        if (stockPropio < cantidad) {
          return res.status(400).json({
            error: `Stock propio insuficiente: disponible ${stockPropio}, intentás mover ${cantidad}`
          });
        }
      }

      if (tipo === 'venta') {
        if (!comercio) {
          return res.status(400).json({ error: 'Comercio es obligatorio para venta' });
        }
        const stockComercio = await StockManager._stockEnComercioActual(producto, comercio);
        if (stockComercio < cantidad) {
          return res.status(400).json({
            error: `Stock en el comercio insuficiente: disponible ${stockComercio}, intentás vender ${cantidad}`
          });
        }
      }

      // Cálculo de costos y ventas
      let costoUnitario = null;
      let ventaUnitaria = null;

      switch (tipo) {
        case 'carga':
          if (!costoTotal) {
            return res.status(400).json({ error: 'En carga, el costo total es obligatorio' });
          }
          if (costoTotal < 0) {
            return res.status(400).json({ error: 'El costo de compra no puede ser negativo' });
          }
          costoUnitario = Number((costoTotal / cantidad).toFixed(2));
          break;
        case 'venta':
          if (!ventaTotal) {
            return res.status(400).json({ error: 'En venta, el total de venta es obligatorio' });
          }
          if (ventaTotal < 0) {
            return res.status(400).json({ error: 'El total de venta no puede ser negativo' });
          }
          ventaUnitaria = Number((ventaTotal / cantidad).toFixed(2));
          break;
        case 'reposicion':
          if (!comercio) {
            return res.status(400).json({ error: 'Comercio es obligatorio para reposición' });
          }
          break;
        case 'faltante':
          // No se requieren validaciones adicionales
          break;
        default:
          return res.status(400).json({ error: 'Tipo de movimiento inválido' });
      }

      // Asignación de valores calculados
      item.costoUnitario = costoUnitario;
      item.ventaUnitaria = ventaUnitaria;
    }

    try {
      const nuevoMovimiento = new MovimientoModel({
        fecha: fecha ? moment.tz(fecha, FORMATO_FECHAS, 'America/Argentina/Buenos_Aires').toDate() : moment.tz(Date.now(), FORMATO_FECHAS, 'America/Argentina/Buenos_Aires').toDate(),
        tipo,
        productos,
        comercio: comercio || null,
        observaciones: observaciones || ''
      });

      await nuevoMovimiento.save();
      return res.status(201).json({ success: 'Movimiento creado exitosamente', movimiento: nuevoMovimiento });
    } catch (error) {
      return res.status(500).json({ error: 'Error creando movimiento' });
    }
  }

  static async modificarMovimiento(req, res) {
    const { id } = req.params;
    const { fecha, tipo, productos, comercio, observaciones } = req.body;

    if (!tipo || !productos || productos.length === 0) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    if (!['carga', 'venta', 'reposicion', 'faltante'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de movimiento inválido' });
    }

    if (fecha) {
      const fechaDate = moment.tz(fecha, FORMATO_FECHAS, true, 'America/Argentina/Buenos_Aires');
      if (!fechaDate.isValid()) {
        return res.status(400).json({ error: 'Formato de fecha inválida' });
      }
      if (fechaDate > Date.now()) {
        return res.status(400).json({ error: 'La fecha del movimiento no puede ser futura' });
      }
    }

    try {
      const movimiento = await MovimientoModel.findById(id);
      if (!movimiento) {
        return res.status(404).json({ error: 'Movimiento no encontrado' });
      }

      if (tipo !== movimiento.tipo) {
        return res.status(400).json({ error: 'No se puede modificar el tipo de movimiento' });
      }

      for (const item of productos) {
        const { producto, cantidad, costoTotal, ventaTotal } = item;

        if (!producto || !cantidad) {
          return res.status(400).json({ error: 'Producto y cantidad son obligatorios para cada ítem' });
        }

        if (cantidad < 1) {
          return res.status(400).json({ error: 'La cantidad debe ser al menos 1' });
        }

        const prod = await ProductoModel.findById(producto);
        if (!prod) {
          return res.status(400).json({ error: `Producto no encontrado (${producto})` });
        }

        // Verificación de stock si se aumenta la cantidad respecto a antes
        const movimientoOriginalItem = movimiento.productos.find(p => p.producto.toString() === producto);
        const cantidadAnterior = movimientoOriginalItem?.cantidad || 0;
        const delta = cantidad - cantidadAnterior;

        if (delta > 0) {
          if (tipo === 'reposicion' || tipo === 'faltante') {
            const stockPropio = await StockManager._stockPropioActual(producto);
            if (stockPropio < delta) {
              return res.status(400).json({
                error: `Stock propio insuficiente para aumentar ${delta} unidades (disponible ${stockPropio}) del producto ${producto}`
              });
            }
          }

          if (tipo === 'venta') {
            if (!comercio) {
              return res.status(400).json({ error: 'Comercio es obligatorio para venta' });
            }
            const stockComercio = await StockManager._stockEnComercioActual(producto, comercio);
            if (stockComercio < delta) {
              return res.status(400).json({
                error: `Stock en el comercio insuficiente para aumentar ${delta} unidades (disponible ${stockComercio}) del producto ${producto}`
              });
            }
          }
        }

        // Cálculo de costos y ventas
        let costoUnitario = null;
        let ventaUnitaria = null;

        switch (tipo) {
          case 'carga':
            if (costoTotal == null) {
              return res.status(400).json({ error: 'En carga, el costo total es obligatorio' });
            }
            if (costoTotal < 0) {
              return res.status(400).json({ error: 'El costo de compra no puede ser negativo' });
            }
            costoUnitario = Number((costoTotal / cantidad).toFixed(2));
            break;

          case 'venta':
            if (ventaTotal == null) {
              return res.status(400).json({ error: 'En venta, el total de venta es obligatorio' });
            }
            if (ventaTotal < 0) {
              return res.status(400).json({ error: 'El total de venta no puede ser negativo' });
            }
            ventaUnitaria = Number((ventaTotal / cantidad).toFixed(2));
            break;

          case 'reposicion':
            if (!comercio) {
              return res.status(400).json({ error: 'Comercio es obligatorio para reposición' });
            }
            break;

          case 'faltante':
            // No se requieren validaciones adicionales
            break;
        }

        // Agrega los valores calculados al item
        item.costoUnitario = costoUnitario;
        item.ventaUnitaria = ventaUnitaria;
      }

      const movimientoActualizado = await MovimientoModel.findByIdAndUpdate(
        id,
        {
          fecha: fecha
            ? moment.tz(fecha, FORMATO_FECHAS, 'America/Argentina/Buenos_Aires').toDate()
            : movimiento.fecha,
          tipo,
          productos,
          comercio: comercio || null,
          observaciones: observaciones || ''
        },
        { new: true, runValidators: true }
      );

      return res.status(200).json({ success: 'Movimiento actualizado correctamente', movimiento: movimientoActualizado });
    } catch (error) {
      return res.status(500).json({ error: 'Error modificando movimiento' });
    }
  }

  static async eliminarMovimiento(req, res) {
    try {
      const { id } = req.params;
      const eliminado = await MovimientoModel.findByIdAndDelete(id);
      if (!eliminado) return res.status(404).json({ error: 'Movimiento no encontrado' });
      return res.status(200).json({ success: 'Movimiento eliminado' });
    } catch (error) {
      return res.status(500).json({ error: 'Error eliminando movimiento' });
    }
  }
}

export default MovimientosManager;

