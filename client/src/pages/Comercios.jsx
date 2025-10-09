import { useEffect, useState } from 'react';
import api from '../lib/api';
import { alertSuccess, alertError } from '../lib/dialog';
import { FiSearch, FiPlus, FiMapPin } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from '../components/ui/SearchBar';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import FabButton from '../components/ui/FabButton';
import FormDialog from '../components/ui/FormDialog';
import ActionButton from '../components/ui/ActionButton';
import { darkTheme as t } from '../components/ui/theme';
import { GiShop } from 'react-icons/gi';

const EMPTY = {
  nombre: '', calle: '', altura: '', piso: '', departamento: '', barrio: '',
  responsable: '', telefono: '', whatsapp: '', inicioContrato: '', contratoFirmado: false,
  deuda: '', observaciones: '',
};

const onlyDigits = (s = '') => String(s).replace(/\D/g, '');
const isTenDigits = (s) => onlyDigits(s).length === 10;
function fmtDateInput(d) { if (!d) return ''; try { return new Date(d).toISOString().slice(0, 10); } catch { return ''; } }

export default function Comercios() {
  const [rows, setRows] = useState([]);
  const [barrios, setBarrios] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [q, setQ] = useState('');
  const [mOpen, setMOpen] = useState(false);
  const [mInitial, setMInitial] = useState(EMPTY);
  const [mTitle, setMTitle] = useState('');
  const [mConfirmLabel, setMConfirmLabel] = useState('Guardar');

  const nav = useNavigate();
  const loc = useLocation();

  const load = async () => {
    try {
      const [cs, bs] = await Promise.all([api.get('/comercios'), api.get('/barrios')]);
      setRows(cs.data.comercios || []);
      setBarrios(bs.data.barrios || []);
    } catch (e) {
      await alertError(e?.response?.data?.error || 'No se pudo cargar comercios');
    }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const editId = params.get('edit');
    if (!editId || !rows.length) return;
    const c = rows.find(x => x._id === editId);
    if (c) goEdit(c);
    // eslint-disable-next-line
  }, [loc.search, rows]);

  const goCreate = () => {
    setEditingId(null);
    setMInitial(EMPTY);
    setMTitle('Crear comercio');
    setMConfirmLabel('Crear');
    setMOpen(true);
  };
  const goEdit = (c) => {
    setEditingId(c._id);
    setMInitial({
      nombre: c.nombre || '', calle: c.calle || '', altura: c.altura ?? '',
      piso: c.piso || '', departamento: c.departamento || '', barrio: c.barrio?._id || '',
      responsable: c.responsable || '', telefono: c.telefono || '', whatsapp: c.whatsapp || '',
      inicioContrato: fmtDateInput(c.inicioContrato), contratoFirmado: !!c.contratoFirmado,
      deuda: c.deuda != null ? Number(c.deuda) : '', observaciones: c.observaciones || '',
    });
    setMTitle('Editar comercio');
    setMConfirmLabel('Guardar');
    setMOpen(true);
  };

  const filtered = q.trim()
    ? rows.filter((c) => (c.nombre || '').toLowerCase().includes(q.toLowerCase()) || (c.barrio?.nombre || '').toLowerCase().includes(q.toLowerCase()))
    : rows;

  const themeParam = new URLSearchParams(loc.search).get('theme') || new URLSearchParams(loc.search).get('ios');
  const isIosDark = typeof themeParam === 'string' && ['1','true','yes','ios','ios-dark','dark'].includes(themeParam.toLowerCase());

  return (
    <div
      className={`comercios ${isIosDark ? 'ios-dark' : ''}`}
      style={{
        background: t.bg, color: t.text900, padding: '0 .75rem 16px', boxSizing: 'border-box',
        marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', overflowX: 'hidden', position: 'relative'
      }}
    >
      <div aria-hidden style={{ position: 'fixed', inset: 0, background: t.bg, zIndex: -1 }} />

      <div className="row mb-2">
        <div className="col-12 col-md-6 col-lg-4">
          <h1 className="m-0 fw-semibold text-center" style={{ letterSpacing: '.2px', color: t.text900 }}>Comercios</h1>
        </div>
      </div>

      <div className="row mb-2">
        <div className="col-12 col-md-6 col-lg-4 mt-2 mb-4">
          <SearchBar
            value={q}
            onChange={setQ}
            onClear={() => setQ('')}
            placeholder="Buscar comercio..."
            icon={<FiSearch size={18} aria-hidden className="search-icon" />}
          />
        </div>
      </div>

      <div className="row g-3">
        {filtered.map((c) => {
          return (
            <div key={c._id} className="col-12 col-md-6 col-lg-4">
              <Card>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3 me-2 flex-grow-1" style={{ minWidth: 0 }}>
                    <Avatar>
                      <GiShop size={18} />
                    </Avatar>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <h6 className="m-0 fw-semibold text-truncate" style={{ letterSpacing: '0.2px', color: t.text900 }} title={c.nombre}>
                        {c.nombre}
                      </h6>
                      <div className="small mt-1" style={{ color: t.text900 }}>
                        {c.barrio?.nombre || 'Sin barrio'}
                      </div>
                      {c.observaciones && (
                        <p className="small mb-0 mt-1 text-truncate" style={{ color: t.text600 }} title={c.observaciones}>
                          {c.observaciones}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <ActionButton title="Ver" ariaLabel="Ver comercio" onClick={() => nav(`/comercios/${c._id}`)}>
                      <FiSearch size={22} />
                    </ActionButton>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}

        {!rows.length && (
          <div className="col-12">
            <Card className="text-center" style={{ borderRadius: 16 }} bodyClassName="card-body py-5">
              <div aria-hidden className="empty-icon"><GiShop size={28} /></div>
              <p className="mb-0" style={{ color: t.text600 }}>Sin comercios cargados</p>
            </Card>
          </div>
        )}

        {rows.length > 0 && !filtered.length && (
          <div className="col-12">
            <p className="text-center my-3" style={{ color: t.text600 }}>Sin resultados para “{q}”.</p>
          </div>
        )}
      </div>

      <FabButton ariaLabel="Crear comercio" title="Crear comercio" onClick={goCreate}>
        <FiPlus size={24} />
      </FabButton>

      <FormDialog
        open={mOpen}
        title={mTitle}
        initialValues={mInitial}
        confirmLabel={mConfirmLabel}
        icon={!editingId ? 'plus' : 'edit'}
        fields={[
          { name: 'nombre', label: 'Nombre', required: true, autoFocus: true },
          { name: 'calle', label: 'Calle', required: true },
          { name: 'altura', label: 'Altura', required: true },
          { name: 'piso', label: 'Piso' },
          { name: 'departamento', label: 'Departamento' },
          { name: 'barrio', label: 'Barrio', type: 'select', required: true, options: barrios.map(b => ({ label: b.nombre, value: b._id })) },
          { name: 'responsable', label: 'Responsable' },
          { name: 'telefono', label: 'Teléfono' },
          { name: 'whatsapp', label: 'WhatsApp' },
          { name: 'inicioContrato', label: 'Inicio de contrato', type: 'date', required: true },
          { name: 'contratoFirmado', label: 'Contrato firmado', type: 'checkbox' },
          { name: 'deuda', label: 'Deuda', type: 'number', step: 0.01, min: 0 },
          { name: 'observaciones', label: 'Observaciones', type: 'textarea', rows: 3 },
        ]}
        validate={(values) => {
          const errs = {};
          const req = ['nombre','calle','altura','barrio','inicioContrato'];
          req.forEach(f => { if (!String(values[f] ?? '').trim()) errs[f] = 'Requerido'; });
          if (values.telefono && !isTenDigits(values.telefono)) errs.telefono = 'Debe tener 10 dígitos';
          if (values.whatsapp && !isTenDigits(values.whatsapp)) errs.whatsapp = 'Debe tener 10 dígitos';
          if (values.inicioContrato) {
            const d = new Date(values.inicioContrato); const today = new Date(); today.setHours(0,0,0,0);
            if (isNaN(d.getTime()) || d > today) errs.inicioContrato = 'Fecha inválida o futura';
          }
          return errs;
        }}
        onCancel={() => {
          setMOpen(false);
          const back = new URLSearchParams(loc.search).get('back');
          if (editingId && back) nav(back, { replace: true });
        }}
        onConfirm={async (values) => {
          try {
            const clean = (obj) => {
              const out = {};
              Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v != null) out[k] = v; });
              return out;
            };
            const payloadRaw = {
              nombre: (values.nombre || '').trim(),
              calle: (values.calle || '').trim(),
              altura: /^\d+$/.test(String(values.altura).trim()) ? Number(values.altura) : String(values.altura).trim(),
              piso: (values.piso || '').trim(),
              departamento: (values.departamento || '').trim(),
              barrio: values.barrio,
              responsable: (values.responsable || '').trim(),
              telefono: onlyDigits(values.telefono),
              whatsapp: onlyDigits(values.whatsapp),
              inicioContrato: values.inicioContrato,
              contratoFirmado: !!values.contratoFirmado,
              deuda: values.deuda === '' || values.deuda == null ? undefined : Number(values.deuda),
              observaciones: (values.observaciones || '').trim(),
            };
            const payload = clean(payloadRaw);
            if (editingId) {
              await api.put(`/comercios/${editingId}`, payload);
              await alertSuccess('Comercio actualizado');
              const back = new URLSearchParams(loc.search).get('back');
              if (back) { setEditingId(null); setMOpen(false); nav(back, { replace: true }); return; }
            } else {
              await api.post('/comercios', payload);
              await alertSuccess('Comercio creado');
            }
            setEditingId(null);
            setMOpen(false);
            await load();
          } catch (e2) {
            const status = e2?.response?.status;
            const text = e2?.response?.data
              ? (typeof e2.response.data === 'string' ? e2.response.data
                : e2.response.data.error || e2.response.data.message || JSON.stringify(e2.response.data))
              : 'Error de red o CORS';
            await alertError(`(${status || '500'}) ${text}`);
          }
        }}
      />

    </div>
  );
}
