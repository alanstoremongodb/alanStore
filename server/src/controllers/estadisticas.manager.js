import Movimiento from '../models/Movimientos.model.js';
import Producto from '../models/Producto.model.js';
import Comercio from '../models/Comercio.model.js';
import Barrio from '../models/Barrio.model.js';
import moment from 'moment-timezone';

const TZ = 'America/Argentina/Buenos_Aires';

// ===================== Periodo =====================
function getPeriod({ unit, year, month, quarter }) {
  const y = Number(year);
  const m = Number(month || 1);
  const q = Number(quarter || 1);

  let start, end;

  if (unit === 'año') {
    start = moment.tz({ year: y, month: 0, day: 1 }, TZ).startOf('day');
    end = moment(start).add(1, 'year');
  } else if (unit === 'trimestre') {
    const firstMonth = (q - 1) * 3;
    start = moment.tz({ year: y, month: firstMonth, day: 1 }, TZ).startOf('day');
    end = moment(start).add(3, 'months');
  } else if (unit === 'repo1') {
    start = moment.tz({ year: y, month: m - 1, day: 1 }, TZ).startOf('day');
    end = moment.tz({ year: y, month: m - 1, day: 15 }, TZ).endOf('day').add(1, 'millisecond');
  } else if (unit === 'repo2') {
    const base = moment.tz({ year: y, month: m - 1, day: 16 }, TZ).startOf('day');
    start = base;
    end = moment(base).endOf('month').add(1, 'millisecond');
  } else {
    start = moment.tz({ year: y, month: m - 1, day: 1 }, TZ).startOf('day');
    end = moment(start).add(1, 'month');
  }

  return { start, end };
}

// ===================== Agrupación =====================
function makeKey(groupBy, m, it) {
  switch (groupBy) {
    case 'producto': return it.producto?.toString() || null;
    case 'comercio': return m.comercio?._id?.toString() || (typeof m.comercio === 'string' ? m.comercio : null);
    case 'barrio':   return m.comercio?.barrio?._id?.toString() || null;
    case 'tipo':     return m.tipo || null;
    default:         return it.producto?.toString() || null;
  }
}

async function hydrateLabels(groupBy, keys) {
  const set = new Set(keys.filter(Boolean));
  if (!set.size) return {};

  if (groupBy === 'producto') {
    const docs = await Producto.find({ _id: { $in: [...set] } }).lean();
    const map = {};
    docs.forEach(d => (map[d._id.toString()] = { producto: { _id: d._id, nombre: d.nombre } }));
    return map;
  }
  if (groupBy === 'comercio') {
    const docs = await Comercio.find({ _id: { $in: [...set] } }).populate('barrio').lean();
    const map = {};
    docs.forEach(d => (map[d._id.toString()] = {
      comercio: { _id: d._id, nombre: d.nombre },
      barrio: d.barrio ? { _id: d.barrio._id, nombre: d.barrio.nombre } : undefined
    }));
    return map;
  }
  if (groupBy === 'barrio') {
    const docs = await Barrio.find({ _id: { $in: [...set] } }).lean();
    const map = {};
    docs.forEach(d => (map[d._id.toString()] = { barrio: { _id: d._id, nombre: d.nombre } }));
    return map;
  }
  return {};
}

// ===================== Cálculo núcleo =====================
// Revalorización (resultado de actualización) se reconoce en la COMPRA.
// Ganancia genuina se reconoce en la VENTA, con costo corriente vigente.
// Descuentos: en venta se aplican a ventas netas (prorrateo por ítem); en compra
// se aplican al costo total del lote y afectan el costo unitario nuevo.
async function computeStats({ unit, year, month, quarter, top, filterProducto, filterComercio, filterBarrio }) {
  const { start, end } = getPeriod({ unit, year, month, quarter });

  const movs = await Movimiento.find({
    fecha: { $lt: end.toDate() }
  })
    .populate({ path: 'comercio', populate: { path: 'barrio' } })
    .lean()
    .sort({ fecha: 1, _id: 1 });

  const state = new Map(); // pid -> { stock, cost }
  const inPeriod = (d) => moment(d).isSameOrAfter(start) && moment(d).isBefore(end);
  const filters = {
    producto: filterProducto ? String(filterProducto) : null,
    comercio: filterComercio ? String(filterComercio) : null,
    barrio: filterBarrio ? String(filterBarrio) : null,
  };
  const passesFilter = (m, it) => {
    const pid = (it?.producto && it.producto._id) ? String(it.producto._id)
      : (typeof it?.producto === 'string' ? it.producto : null);
    const cid = (m?.comercio && m.comercio._id) ? String(m.comercio._id)
      : (typeof m?.comercio === 'string' ? m.comercio : null);
    const bid = (m?.comercio && m.comercio.barrio && m.comercio.barrio._id) ? String(m.comercio.barrio._id) : null;
    if (filters.producto && pid !== filters.producto) return false;
    if (filters.comercio && cid !== filters.comercio) return false;
    if (filters.barrio && bid !== filters.barrio) return false;
    return true;
  };

  const agg = new Map();
  const bump = (groupBy, key, delta) => {
    if (key == null) return;
    const mapKey = `${groupBy}::${key}`;
    const row = agg.get(mapKey) || {
      _id: key,
      groupBy,
      unidadesFisicas: 0,
      ventas: 0,
      costo: 0,
      ganancias: 0,
      gananciaGenuina: 0,
      resultadoActualizacion: 0
    };
    Object.keys(delta).forEach(k => (row[k] = (row[k] || 0) + (delta[k] || 0)));
    agg.set(mapKey, row);
  };

  for (const m of movs) {
    const items = Array.isArray(m.productos) ? m.productos : (Array.isArray(m.items) ? m.items : []);

    // ---------- CARGA (compra) ----------
  if (m.tipo === 'carga') {
      // Nuevo: además de registrar por producto, agregaremos un row agregado por tipo ("carga")
      // 1) totales del movimiento para aplicar descuento a costo unitario
      let totalQty = 0;
      let totalCostoBruto = 0;
      for (const it of items) {
        totalQty += Number(it.cantidad || 0);
        totalCostoBruto += Number(it.costoTotal || 0);
      }
      const desc = Number(m.descuentoTotal || 0);
      const costoTotalNeto = Math.max(0, totalCostoBruto - desc);
      const newCost = totalQty > 0 ? (costoTotalNeto / totalQty) : null;

      // 2) revalorización al momento de la compra (si había stock previo con costo anterior)
      //    la computamos una sola vez POR PRODUCTO considerando el stock previo.
      const touched = new Set();
      let revalTotal = 0; // acumulado para reflejar en la fila de tipo
      for (const it of items) {
        const pid = (it.producto && it.producto._id) ? it.producto._id.toString()
          : (typeof it.producto === 'string' ? it.producto : null);
        if (!pid || touched.has(pid)) continue;
        touched.add(pid);

        const st = state.get(pid) || { stock: 0, cost: null };
        if (newCost != null && st.cost != null && st.stock > 0) {
          const reval = (newCost - st.cost) * st.stock;
          // Reval solo aplica al filtro de producto (no atribuimos a comercio/barrio)
          const allow = !filters.comercio && !filters.barrio && (!filters.producto || filters.producto === pid);
          if (inPeriod(m.fecha) && allow) {
            // registramos por producto (lo más claro contablemente)
            bump('producto', makeKey('producto', m, { producto: pid }), {
              resultadoActualizacion: reval,
              ganancias: reval
            });
            revalTotal += reval;
          }
        }
      }

      // 3) actualizar estado y (opcional) reportar costo del período por producto prorrateado
      for (const it of items) {
        const pid = (it.producto && it.producto._id) ? it.producto._id.toString()
          : (typeof it.producto === 'string' ? it.producto : null);
        if (!pid) continue;
        const qty = Number(it.cantidad || 0);

        const st = state.get(pid) || { stock: 0, cost: null };
        if (newCost != null) st.cost = newCost;
        st.stock += qty;
        state.set(pid, st);
      }

      // (opcional) reflejar el costo neto del período prorrateado por cantidad
      if (inPeriod(m.fecha) && totalQty > 0) {
        for (const it of items) {
          const pid = (it.producto && it.producto._id) ? it.producto._id.toString()
            : (typeof it.producto === 'string' ? it.producto : null);
          if (!pid) continue;
          // solo atribuimos costo prorrateado si el filtro deja pasar este producto
          if (!passesFilter(m, { producto: pid })) continue;
          const qty = Number(it.cantidad || 0);
          const pr = qty / totalQty;
          bump('producto', makeKey('producto', m, { producto: pid }), { costo: costoTotalNeto * pr });
        }
      }

      // Reflejar totales por tipo (carga) en el período: unidades y costo; incluir reval si existió
      if (inPeriod(m.fecha)) {
        bump('tipo', m.tipo, {
          unidadesFisicas: totalQty,
          costo: costoTotalNeto,
          resultadoActualizacion: revalTotal,
          ganancias: revalTotal // la revalorización suma a ganancias netas
        });
      }

      continue;
    }

    // ---------- VENTA ----------
  if (m.tipo === 'venta') {
      // 1) venta bruta total y descuento del movimiento
      let totalVentaBruta = 0;
      for (const it of items) totalVentaBruta += Number(it.ventaTotal || 0);
      const desc = Number(m.descuentoTotal || 0);
      const ventaNetaTotal = Math.max(0, totalVentaBruta - desc);

      // 2) procesar ítems con prorrateo de descuento por peso de vBruta
      for (const it of items) {
        const pid = (it.producto && it.producto._id) ? it.producto._id.toString()
          : (typeof it.producto === 'string' ? it.producto : null);
        if (!pid) continue;
        const qty = Number(it.cantidad || 0);
        const vBruta = Number(it.ventaTotal || 0);

        const st = state.get(pid) || { stock: 0, cost: null };
        if (st.cost == null || st.stock < qty) {
          const fechaStr = moment(m.fecha).tz(TZ).format('YYYY-MM-DD');
          const err = new Error(`Venta inválida: producto=${pid}, fecha=${fechaStr}. No hay costo vigente o stock suficiente.`);
          err.status = 400;
          throw err;
        }

        const pr = totalVentaBruta > 0 ? (vBruta / totalVentaBruta) : 0;
        const vNetaItem = ventaNetaTotal * pr;

        const costoCorr = st.cost * qty;
        const ganGenuina = vNetaItem - costoCorr;

        if (inPeriod(m.fecha) && passesFilter(m, it)) {
          // por producto
          bump('producto', makeKey('producto', m, { producto: pid }), {
            unidadesFisicas: qty,
            ventas: vNetaItem,
            costo: costoCorr,
            gananciaGenuina: ganGenuina,
            ganancias: ganGenuina
          });
          // por comercio
          bump('comercio', makeKey('comercio', m, it), {
            unidadesFisicas: qty,
            ventas: vNetaItem,
            costo: costoCorr,
            gananciaGenuina: ganGenuina,
            ganancias: ganGenuina
          });
          // por barrio
          bump('barrio', makeKey('barrio', m, it), {
            unidadesFisicas: qty,
            ventas: vNetaItem,
            costo: costoCorr,
            gananciaGenuina: ganGenuina,
            ganancias: ganGenuina
          });
          // por tipo
          bump('tipo', makeKey('tipo', m, it), {
            unidadesFisicas: qty,
            ventas: vNetaItem,
            costo: costoCorr,
            gananciaGenuina: ganGenuina,
            ganancias: ganGenuina
          });
        }

        // actualizar stock
        st.stock -= qty;
        state.set(pid, st);
      }
      continue;
    }

    // ---------- REPOSICIÓN / FALTANTE ----------
  if (m.tipo === 'reposicion' || m.tipo === 'faltante') {
      // Nuevos requerimientos:
      // reposicion: registrar unidades y valor (costo) tanto por tipo como por comercio destino
      // faltante: registrar unidades y valor (costo) por tipo (stock propio). Se considera pérdida => ganancia negativa.
      let totalQty = 0;
      let totalCosto = 0;
      for (const it of items) {
        const pid = (it.producto && it.producto._id) ? it.producto._id.toString()
          : (typeof it.producto === 'string' ? it.producto : null);
        if (!pid) continue;
        const qty = Number(it.cantidad || 0);
        const st = state.get(pid) || { stock: 0, cost: null };
        // Validación de costo / stock suficiente (similar a venta) para reflejar valor
        if (st.cost == null || (m.tipo !== 'carga' && st.stock < qty)) {
          // Para reposicion y faltante exigimos stock suficiente
          const fechaStr = moment(m.fecha).tz(TZ).format('YYYY-MM-DD');
            const err = new Error(`${m.tipo} inválida: producto=${pid}, fecha=${fechaStr}. No hay costo vigente o stock suficiente.`);
            err.status = 400;
            throw err;
        }
        const costCorr = (st.cost || 0) * qty;
        totalQty += qty;
        totalCosto += costCorr;
        // Ajuste de stock real
        if (m.tipo === 'faltante' || m.tipo === 'reposicion') {
          st.stock -= qty; // reposición mueve fuera de stock propio hacia comercio
        }
        state.set(pid, st);

        if (inPeriod(m.fecha) && passesFilter(m, it)) {
          // Por tipo
          if (m.tipo === 'reposicion') {
            bump('tipo', m.tipo, { unidadesFisicas: qty, costo: costCorr });
            // Por comercio (como ventas, pero sin ventas ni ganancias)
            bump('comercio', makeKey('comercio', m, it), { unidadesFisicas: qty, costo: costCorr });
          } else if (m.tipo === 'faltante') {
            // faltante: pérdida => ganancia negativa equivalente al costo
            bump('tipo', m.tipo, { unidadesFisicas: qty, costo: costCorr, gananciaGenuina: -costCorr, ganancias: -costCorr });
            // atribuimos a producto para permitir análisis por producto
            bump('producto', makeKey('producto', m, it), { unidadesFisicas: qty, costo: costCorr, gananciaGenuina: -costCorr, ganancias: -costCorr });
          }
        }
      }
      continue;
    }
  }

  // Salida base: todas las agrupaciones juntas
  let rows = [...agg.values()];

  if (top && Number(top) > 0) {
    rows.sort((a, b) => (b.ventas || 0) - (a.ventas || 0));
    rows = rows.slice(0, Number(top));
  }

  return { rows };
}

// ===================== Handlers =====================
export async function getEstadisticas(req, res) {
  try {
    const { unit = 'mes', year, month, quarter, groupBy = 'tipo', top, filterProducto, filterComercio, filterBarrio } = req.query;
    if (!year) return res.status(400).json({ error: 'Parámetro "year" es obligatorio' });

    const { start, end } = getPeriod({ unit, year, month, quarter });
    const { rows } = await computeStats({ unit, year, month, quarter, top, filterProducto, filterComercio, filterBarrio });

    // filtramos a la agrupación pedida
    const filtered = rows.filter(r => r.groupBy === groupBy);

    // enriquecer etiquetas
    const map = await hydrateLabels(groupBy, filtered.map(r => r._id));
    const enriched = filtered.map(r => ({ ...r, ...(map[r._id] || {}) }));

    return res.json({
      period: { start: start.toISOString(), end: end.toISOString(), unit },
      resultados: enriched
    });
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message || 'No se pudo calcular estadísticas' });
  }
}

export async function getOverview(req, res) {
  try {
    const { unit = 'mes', year, month, quarter } = req.query;
    if (!year) return res.status(400).json({ error: 'Parámetro "year" es obligatorio' });

    const { start, end } = getPeriod({ unit, year, month, quarter });
    const { rows } = await computeStats({ unit, year, month, quarter, top: 0 });

    // sumatorio global del periodo (sobre TODAS las agrupaciones)
    const tot = rows.reduce((acc, r) => {
      acc.unidadesFisicas += r.unidadesFisicas || 0;
      acc.ventas += r.ventas || 0;
      acc.costo += r.costo || 0;
      acc.ganancias += r.ganancias || 0;
      acc.gananciaGenuina += r.gananciaGenuina || 0;
      acc.resultadoActualizacion += r.resultadoActualizacion || 0;
      return acc;
    }, { unidadesFisicas: 0, ventas: 0, costo: 0, ganancias: 0, gananciaGenuina: 0, resultadoActualizacion: 0 });

    return res.json({ period: { start: start.toISOString(), end: end.toISOString(), unit }, ...tot });
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message || 'No se pudo calcular overview' });
  }
}
