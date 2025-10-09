import { createRoot } from 'react-dom/client';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import { darkTheme as t } from '../components/ui/theme';
import React from 'react';

function mount(component) {
  const div = document.createElement('div');
  document.body.appendChild(div);
  const root = createRoot(div);
  const unmount = () => {
    try { root.unmount(); } catch {}
    div.remove();
  };
  root.render(component(unmount));
}

export function confirmDanger(text = '¿Confirmar?', opts = {}) {
  const { title = '¿Estás seguro?', confirmLabel = 'Eliminar', cancelLabel = 'Cancelar', icon = 'warning' } = opts;
  return new Promise((resolve) => {
    mount((unmount) => (
      <ConfirmDialog
        open
        title={title}
        message={text}
        icon={icon}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        confirmClassName="pill-cta pill-cta--light"
        cancelClassName="pill-ghost pill-ghost--card"
        onConfirm={() => { unmount(); resolve(true); }}
        onCancel={() => { unmount(); resolve(false); }}
      />
    ));
  });
}

function simpleAlert(title, text, iconType = 'info') {
  return new Promise((resolve) => {
    mount((unmount) => (
      <Modal
        open
        title={title}
        titleAlign="center"
        actions={[{ key: 'ok', label: 'Cerrar', className: 'pill-cta pill-cta--light', onClick: () => { unmount(); resolve(); } }]}
      >
        <div className="vstack gap-3 align-items-center">
          {/* Ícono animado inline para alertas simples */}
          <div>
            {/* Reutilizamos AnimatedIcon sin importarlo directamente para evitar dependencia circular con Modal; lo pintamos simple con SVG según tipo */}
            {iconType === 'success' && (
              <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
                <circle cx="34" cy="34" r="28" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" strokeDasharray={2*Math.PI*28} strokeDashoffset={2*Math.PI*28}>
                  <animate attributeName="stroke-dashoffset" from={2*Math.PI*28} to="0" dur="300ms" fill="freeze" />
                  <animateTransform attributeName="transform" type="scale" from="0.9 0.9" to="1 1" dur="200ms" additive="sum" />
                </circle>
                <path d="M 19 34 L 30 42 L 49 25" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray="60" strokeDashoffset="60">
                  <animate attributeName="stroke-dashoffset" from="60" to="0" dur="300ms" begin="120ms" fill="freeze" />
                </path>
              </svg>
            )}
            {iconType === 'error' && (
              <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
                <circle cx="34" cy="34" r="28" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" strokeDasharray={2*Math.PI*28} strokeDashoffset={2*Math.PI*28}>
                  <animate attributeName="stroke-dashoffset" from={2*Math.PI*28} to="0" dur="300ms" fill="freeze" />
                  <animateTransform attributeName="transform" type="scale" from="0.9 0.9" to="1 1" dur="200ms" additive="sum" />
                </circle>
                <path d="M 22 22 L 46 46" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="60">
                  <animate attributeName="stroke-dashoffset" from="60" to="0" dur="280ms" begin="120ms" fill="freeze" />
                </path>
                <path d="M 46 22 L 22 46" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="60">
                  <animate attributeName="stroke-dashoffset" from="60" to="0" dur="280ms" begin="160ms" fill="freeze" />
                </path>
              </svg>
            )}
            {iconType === 'warning' && (
              <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
                <polygon points="34 6 62 62 6 62" stroke="#f59e0b" strokeWidth="6" strokeLinejoin="round" fill="none" strokeDasharray="300" strokeDashoffset="300">
                  <animate attributeName="stroke-dashoffset" from="300" to="0" dur="320ms" fill="freeze" />
                  <animateTransform attributeName="transform" type="scale" from="0.9 0.9" to="1 1" dur="200ms" additive="sum" />
                </polygon>
                <line x1="34" y1="26" x2="34" y2="41" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" strokeDasharray="40" strokeDashoffset="40">
                  <animate attributeName="stroke-dashoffset" from="40" to="0" dur="260ms" begin="120ms" fill="freeze" />
                </line>
                <circle cx="34" cy="51" r="3" fill="#f59e0b" opacity="0">
                  <animate attributeName="opacity" from="0" to="1" dur="180ms" begin="220ms" fill="freeze" />
                </circle>
              </svg>
            )}
            {iconType === 'info' && (
              <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
                <circle cx="34" cy="34" r="28" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" strokeDasharray={2*Math.PI*28} strokeDashoffset={2*Math.PI*28}>
                  <animate attributeName="stroke-dashoffset" from={2*Math.PI*28} to="0" dur="300ms" fill="freeze" />
                  <animateTransform attributeName="transform" type="scale" from="0.9 0.9" to="1 1" dur="200ms" additive="sum" />
                </circle>
                <line x1="34" y1="28" x2="34" y2="42" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" strokeDasharray="40" strokeDashoffset="40">
                  <animate attributeName="stroke-dashoffset" from="40" to="0" dur="260ms" begin="120ms" fill="freeze" />
                </line>
                <circle cx="34" cy="22" r="3" fill="#3b82f6" opacity="0">
                  <animate attributeName="opacity" from="0" to="1" dur="180ms" begin="220ms" fill="freeze" />
                </circle>
              </svg>
            )}
          </div>
          <p className="mb-0 text-center" style={{ color: t.text900 }}>{text}</p>
        </div>
      </Modal>
    ));
  });
}

export function alertSuccess(text = 'Listo') {
  return simpleAlert('¡Listo!', text, 'success');
}

export function alertError(text = 'Ocurrió un problema') {
  return simpleAlert('Ups…', text, 'error');
}
