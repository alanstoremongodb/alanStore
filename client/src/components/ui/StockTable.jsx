import { darkTheme as t } from './theme';

export default function StockTable({
  rows = [],
  getName,
  getQty,
  className = '',
  style,
}) {
  const nameFn = getName || ((r) => r?.producto?.nombre ?? r?.productName ?? r?.nombre ?? '');
  const qtyFn = getQty || ((r) => r?.cantidad ?? r?.qty ?? r?.quantity ?? 0);

  return (
    <div className="table-responsive" style={{ borderRadius: 10, overflow: 'hidden', ...style }}>
      <table
        className={`table table-sm align-middle ${className}`}
        style={{
          color: t.text900,
          background: 'transparent',
          '--bs-table-color': t.text900,
          '--bs-table-striped-color': t.text900,
          '--bs-table-hover-color': t.text900,
          '--bs-table-bg': 'transparent',
          '--bs-table-striped-bg': 'transparent',
          '--bs-table-hover-bg': 'rgba(255,255,255,.04)'
        }}
      >
        <thead>
          <tr>
            <th style={{ color: t.text600, borderColor: 'rgba(255,255,255,.08)', background: 'transparent' }}>Producto</th>
            <th className="text-end" style={{ color: t.text600, borderColor: 'rgba(255,255,255,.08)', background: 'transparent' }}>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const name = nameFn(r);
            const qty = qtyFn(r);
            const key = r?.producto?._id || r?.id || `${name}-${i}`;
            return (
              <tr key={key}>
                <td style={{ borderColor: 'rgba(255,255,255,.04)', background: 'transparent', color: t.text900 }}>{name}</td>
                <td className="text-end" style={{ borderColor: 'rgba(255,255,255,.04)', background: 'transparent', color: t.text900 }}>{qty}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
