import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import '../styles/swal.css';

const MySwal = withReactContent(Swal);

// base mobile-first
const baseOpts = {
  buttonsStyling: false,   // usamos clases de Bootstrap
  reverseButtons: false,   // Confirm primero (izquierda/arriba)
  showClass: { popup: 'sw-anim-in' },
  hideClass: { popup: 'sw-anim-out' },
  backdrop: true,
  allowOutsideClick: true,
  customClass: {
    popup: 'sw-mobile sw-dark',
    confirmButton: 'btn btn-primary sw-btn',
    cancelButton:  'btn btn-outline-secondary sw-btn',
    title: 'sw-title',
    htmlContainer: 'sw-text'
  },
};

export function alertSuccess(text = 'Listo') {
  return MySwal.fire({
    ...baseOpts,
    icon: 'success',
    title: '¡Listo!',
    text,
    showCancelButton: false,
    confirmButtonText: 'Cerrar',
  });
}

export function alertError(text = 'Ocurrió un problema') {
  return MySwal.fire({
    ...baseOpts,
    icon: 'error',
    title: 'Ups…',
    text,
    showCancelButton: false,
    confirmButtonText: 'Cerrar',
  });
}

export function alertInfo(text = 'Mensaje') {
  return MySwal.fire({
    ...baseOpts,
    icon: 'info',
    title: 'Mensaje',
    text,
    showCancelButton: false,
    confirmButtonText: 'Cerrar',
  });
}

export async function confirmDanger(text = '¿Confirmar?') {
  const res = await MySwal.fire({
    ...baseOpts,
    icon: 'warning',
    title: '¿Estás seguro?',
    text,
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    customClass: {
      ...baseOpts.customClass,
      confirmButton: 'btn btn-danger sw-btn',
    }
  });
  return res.isConfirmed;
}

// Formulario de Barrio con SweetAlert2
export async function showBarrioForm(initial = { nombre: '', observaciones: '' }, opts = {}) {
  const { titulo = 'Crear barrio', confirmar = 'Guardar' } = opts;
  const { value } = await MySwal.fire({
    ...baseOpts,
    customClass: { ...baseOpts.customClass, popup: 'sw-mobile sw-dark sw-has-form' },
    title: titulo,
    html: `
      <div class="sw-form" style="text-align:left">
        <div class="sw-field" >
          <label class="form-label">Nombre</label>
          <input id="swal-nombre" class="form-control" placeholder="Nombre" value="${(initial.nombre||'').replace(/"/g,'&quot;')}" />
        </div>
        <div class="sw-field">
          <label class="form-label">Observaciones</label>
          <textarea id="swal-obs" class="form-control" rows="3" placeholder="Observaciones">${(initial.observaciones||'').replace(/</g,'&lt;')}</textarea>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: confirmar,
    cancelButtonText: 'Cancelar',
    focusConfirm: false,
    allowEnterKey: true,
    didOpen: () => {
      document.getElementById('swal-nombre')?.focus();
    },
    preConfirm: () => {
      const popup = MySwal.getPopup();
      const nombre = popup.querySelector('#swal-nombre')?.value.trim();
      const observaciones = popup.querySelector('#swal-obs')?.value.trim() || '';
      if (!nombre) {
        MySwal.showValidationMessage('El nombre es obligatorio');
        return false;
      }
      return { nombre, observaciones };
    },
  });
  return value || null;
}
